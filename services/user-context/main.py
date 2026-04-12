"""User Context — Entry point combining gRPC server and FastAPI (HTTP REST wrapper for testing/health)."""

import asyncio
import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse

from config import settings
from grpc_server import start_grpc_server
from models import UserContextData, FrictionEvent
from redis_client import close_redis, init_redis, is_redis_available, get_user_context, save_user_context

# ============================================================
# Logging
# ============================================================

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s | %(name)s | %(levelname)s | %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger("vigil.user-context")

_start_time: float = time.time()
_grpc_server_target = None


# ============================================================
# Lifespan
# ============================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize resources like Redis and gRPC server."""
    global _start_time, _grpc_server_target
    _start_time = time.time()

    redis_ok = await init_redis()
    if not redis_ok:
        logger.warning("Redis not available, operating in fallback dict mode.")
        
    _grpc_server_target = await start_grpc_server(settings.grpc_port)

    yield

    if _grpc_server_target:
         await _grpc_server_target.stop(0)
    await close_redis()


# ============================================================
# Application
# ============================================================

app = FastAPI(
    title="Vigil User Context",
    version="0.1.0",
    lifespan=lifespan,
)


@app.get("/health", tags=["System"])
async def health_check():
    """Service health endpoint."""
    return {
        "status": "ok",
        "service": "user-context",
        "redis_connected": is_redis_available(),
        "uptime_seconds": round(time.time() - _start_time, 2),
    }

@app.get("/", tags=["System"])
async def root():
    """Service root endpoint."""
    return {
        "service": "user-context",
        "version": "0.1.0"
    }


# ============================================================
# REST endpoints wrapping logic (For Local/Test use)
# ============================================================

@app.get("/users/{tenant_id}/{user_id}/context", response_model=UserContextData, tags=["Context"])
async def rest_get_user_context(tenant_id: str, user_id: str):
    """REST proxy for the get_user_context logic."""
    data = await get_user_context(tenant_id, user_id)
    if not data:
        raise HTTPException(status_code=404, detail="User context not found")
    return UserContextData(**data)


@app.post("/users/{tenant_id}/{user_id}/context", response_model=UserContextData, tags=["Context"])
async def rest_update_user_context(tenant_id: str, user_id: str, event: FrictionEvent):
    """REST proxy to update user context with an incoming test event."""
    existing = await get_user_context(tenant_id, user_id) or {
         "tenant_id": tenant_id, "user_id": user_id,
         "event_count_30d": 0, "recent_events": []
    }
    
    existing["event_count_30d"] += 1
    recent = existing.setdefault("recent_events", [])
    recent.append(event.model_dump(mode="json"))
    
    success = await save_user_context(tenant_id, user_id, existing)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to persist user context")
        
    return UserContextData(**existing)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.http_port)
