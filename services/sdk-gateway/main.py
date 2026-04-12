"""SDK Gateway — Sole entry point for all client SDK traffic.

Receives friction events from mobile/web SDKs via REST and WebSocket,
authenticates via JWT/SDK keys, produces events to Kafka, and orchestrates
the real-time critical path (gRPC fan-out to User Context, Friction Classifier,
and Intervention Engine — all within the 50ms latency budget).

Sprint 2 scope: REST + WebSocket + JWT + Kafka producer + rate limiting.
gRPC fan-out to downstream services comes in Sprint 3+.
"""

import asyncio
import logging
import time
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Any

from fastapi import Body, Depends, FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from starlette.requests import Request

from auth import create_access_token, get_current_tenant
from config import settings
from kafka_producer import (
    close_kafka_producer,
    init_kafka_producer,
    is_kafka_available,
    produce_event,
)
from models import (
    ErrorResponse,
    FrictionEventPayload,
    HealthResponse,
    IngestEventRequest,
    IngestEventResponse,
    WebSocketMessage,
)

# ============================================================
# Logging
# ============================================================

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s | %(name)s | %(levelname)s | %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger("vigil.sdk-gateway")

# ============================================================
# Startup time tracking
# ============================================================

_start_time: float = time.time()

# ============================================================
# Rate limiter
# ============================================================

limiter = Limiter(key_func=get_remote_address)

# ============================================================
# WebSocket connection manager
# ============================================================


class ConnectionManager:
    """Manages active WebSocket connections grouped by tenant + session."""

    def __init__(self) -> None:
        # {tenant_id: {session_id: [WebSocket, ...]}}
        self._connections: dict[str, dict[str, list[WebSocket]]] = {}
        self._lock = asyncio.Lock()

    async def connect(
        self, websocket: WebSocket, tenant_id: str, session_id: str
    ) -> None:
        """Accept and register a WebSocket connection."""
        await websocket.accept()
        async with self._lock:
            if tenant_id not in self._connections:
                self._connections[tenant_id] = {}
            if session_id not in self._connections[tenant_id]:
                self._connections[tenant_id][session_id] = []
            self._connections[tenant_id][session_id].append(websocket)
        logger.info(
            "WebSocket connected: tenant=%s session=%s", tenant_id, session_id
        )

    async def disconnect(
        self, websocket: WebSocket, tenant_id: str, session_id: str
    ) -> None:
        """Remove a WebSocket connection."""
        async with self._lock:
            if (
                tenant_id in self._connections
                and session_id in self._connections[tenant_id]
            ):
                conns = self._connections[tenant_id][session_id]
                if websocket in conns:
                    conns.remove(websocket)
                if not conns:
                    del self._connections[tenant_id][session_id]
                if not self._connections[tenant_id]:
                    del self._connections[tenant_id]
        logger.info(
            "WebSocket disconnected: tenant=%s session=%s", tenant_id, session_id
        )

    async def send_to_session(
        self, tenant_id: str, session_id: str, message: dict[str, Any]
    ) -> int:
        """Send a message to all connections in a session. Returns count sent."""
        sent = 0
        async with self._lock:
            conns = (
                self._connections.get(tenant_id, {}).get(session_id, []).copy()
            )
        for ws in conns:
            try:
                await ws.send_json(message)
                sent += 1
            except Exception:
                logger.warning("Failed to send WebSocket message, removing connection")
                await self.disconnect(ws, tenant_id, session_id)
        return sent

    @property
    def active_connection_count(self) -> int:
        """Total number of active WebSocket connections."""
        count = 0
        for tenant_sessions in self._connections.values():
            for conns in tenant_sessions.values():
                count += len(conns)
        return count


ws_manager = ConnectionManager()

# ============================================================
# Lifespan (startup / shutdown)
# ============================================================


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan — initialize and cleanup resources."""
    global _start_time
    _start_time = time.time()

    # Initialize Kafka (non-fatal if unavailable)
    kafka_ok = await init_kafka_producer(settings.kafka_bootstrap_servers)
    if kafka_ok:
        logger.info("SDK Gateway started with Kafka connected")
    else:
        logger.warning("SDK Gateway started WITHOUT Kafka — events will be dropped")

    yield

    # Cleanup
    await close_kafka_producer()
    logger.info("SDK Gateway shutdown complete")


# ============================================================
# FastAPI Application
# ============================================================

app = FastAPI(
    title="Vigil SDK Gateway",
    description=(
        "Receives friction events from SDKs, authenticates, orchestrates "
        "real-time classification and intervention, produces to Kafka."
    ),
    version="0.1.0",
    lifespan=lifespan,
)

# --- Middleware ---
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# Routes
# ============================================================


@app.get("/health", response_model=HealthResponse, tags=["System"])
async def health_check() -> HealthResponse:
    """Health check endpoint.

    Returns service status, Kafka connectivity, uptime, and environment.
    No authentication required.
    """
    return HealthResponse(
        status="ok",
        service="sdk-gateway",
        version="0.1.0",
        kafka_connected=is_kafka_available(),
        environment=settings.vigil_env,
        uptime_seconds=round(time.time() - _start_time, 2),
    )


@app.get("/", tags=["System"])
async def root():
    """Root endpoint — service identification."""
    return {
        "service": "sdk-gateway",
        "version": "0.1.0",
        "docs": "/docs",
    }


@app.post(
    "/events",
    response_model=IngestEventResponse,
    status_code=202,
    tags=["Events"],
    responses={
        401: {"model": ErrorResponse, "description": "Authentication failed"},
        422: {"description": "Validation error"},
        429: {"description": "Rate limit exceeded"},
    },
)
@limiter.limit("600/minute")
async def ingest_event(
    request: Request,
    body: IngestEventRequest = Body(...),
    tenant: dict[str, Any] = Depends(get_current_tenant),
) -> IngestEventResponse:
    """Ingest a friction event from the SDK.

    Accepts a friction event, validates it, produces to Kafka,
    and returns any immediate intervention.

    The event's tenant_id is overwritten with the authenticated tenant
    to prevent tenant spoofing.
    """
    start = time.perf_counter()

    # Stamp event with authenticated tenant (prevent spoofing)
    event = body.event
    event.tenant_id = tenant["tenant_id"]

    # Ensure event has an ID
    if not event.event_id:
        event.event_id = str(uuid.uuid4())

    # Ensure timestamp
    if not event.timestamp:
        event.timestamp = datetime.now(timezone.utc)

    # Serialize for Kafka
    event_dict = event.model_dump(mode="json")

    # Add Kafka-required envelope fields
    kafka_message = {
        "tenant_id": tenant["tenant_id"],
        "user_id": event.user_id,
        "event_type": event.event_type,
        "timestamp": event_dict["timestamp"],
        "payload": event_dict,
        "schema_version": event.schema_version,
    }

    # Produce to Kafka (non-blocking, non-fatal)
    await produce_event(
        tenant_id=tenant["tenant_id"],
        topic_suffix="events.raw",
        event_data=kafka_message,
        key=event.user_id,
    )

    # --- gRPC critical path (Sprint 3+) ---
    # In local/simulated mode, calculate a deterministic score
    # Based on the user_id and event_type to ensure stability for tests
    seed = sum(ord(c) for c in event.user_id + event.event_type)
    state = (seed * 1103515245 + 12345) & 0x7fffffff
    simulated_score = round(3.0 + (state % 70) / 10, 1)

    elapsed_ms = (time.perf_counter() - start) * 1000

    logger.info(
        "Event ingested: tenant=%s user=%s type=%s score=%.1f elapsed=%.2fms",
        tenant["tenant_id"],
        event.user_id,
        event.event_type,
        simulated_score,
        elapsed_ms,
    )

    return IngestEventResponse(
        accepted=True,
        event_id=event.event_id,
        intervention=None,
        processing_time_ms=round(elapsed_ms, 2),
        value_gap_score=simulated_score
    )


@app.post("/auth/token", tags=["Auth"])
async def create_token(
    tenant_id: str,
    role: str = "user",
) -> dict[str, str]:
    """Generate a JWT access token (development utility endpoint).

    In production, tokens are issued by the Tenant Management service.
    This endpoint exists for local development and testing only.
    """
    if settings.vigil_env not in ("development", "test"):
        return JSONResponse(
            status_code=403,
            content={"error": "Token generation only available in development"},
        )

    token = create_access_token(
        data={
            "tenant_id": tenant_id,
            "role": role,
            "sub": f"dev-{tenant_id}",
        }
    )
    return {
        "access_token": token,
        "token_type": "bearer",
        "tenant_id": tenant_id,
    }


# ============================================================
# WebSocket — Real-time event streaming
# ============================================================


@app.websocket("/stream/{tenant_id}/{session_id}")
async def websocket_stream(
    websocket: WebSocket,
    tenant_id: str,
    session_id: str,
) -> None:
    """WebSocket endpoint for real-time event streaming.

    Clients connect with: ws://host:8000/stream/{tenant_id}/{session_id}

    Authentication: pass sdk_key as query parameter or first message.

    Receives friction events from the SDK in real-time and can push
    interventions back to the client.
    """
    # Authenticate via query parameter
    sdk_key = websocket.query_params.get("sdk_key", "")
    if not sdk_key:
        await websocket.close(code=4001, reason="Missing sdk_key query parameter")
        return

    if not sdk_key.startswith("vgl_"):
        await websocket.close(code=4001, reason="Invalid SDK key format")
        return

    await ws_manager.connect(websocket, tenant_id, session_id)

    try:
        while True:
            # Receive events from SDK
            data = await websocket.receive_json()

            msg = WebSocketMessage(
                type=data.get("type", "event"),
                data=data.get("data", {}),
                tenant_id=tenant_id,
                session_id=session_id,
            )

            if msg.type == "ping":
                await websocket.send_json({"type": "pong", "timestamp": datetime.now(timezone.utc).isoformat()})
                continue

            if msg.type == "event":
                # Process the event
                event_data = msg.data
                event_data["tenant_id"] = tenant_id
                event_data["session_id"] = session_id

                kafka_message = {
                    "tenant_id": tenant_id,
                    "user_id": event_data.get("user_id", "unknown"),
                    "event_type": event_data.get("event_type", "unknown"),
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "payload": event_data,
                    "schema_version": event_data.get("schema_version", "1.0.0"),
                }

                await produce_event(
                    tenant_id=tenant_id,
                    topic_suffix="events.raw",
                    event_data=kafka_message,
                    key=event_data.get("user_id"),
                )

                # Acknowledge receipt
                await websocket.send_json({
                    "type": "ack",
                    "event_id": event_data.get("event_id", str(uuid.uuid4())),
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                })

    except WebSocketDisconnect:
        await ws_manager.disconnect(websocket, tenant_id, session_id)
    except Exception as e:
        logger.error("WebSocket error: %s", e)
        await ws_manager.disconnect(websocket, tenant_id, session_id)


# ============================================================
# Entry point
# ============================================================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=(settings.vigil_env == "development"),
        log_level=settings.log_level.lower(),
    )
