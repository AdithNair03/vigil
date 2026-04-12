"""Event Ingestion — Entry point for Bootstrapping Kafka and local testing Server."""

import asyncio
import logging
from contextlib import asynccontextmanager
from typing import Dict, Any

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse

from config import settings
from kafka_worker import init_kafka, stop_kafka, consume_loop, process_raw_event, _kafka_available

# ============================================================
# Logging
# ============================================================

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s | %(name)s | %(levelname)s | %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger("vigil.event-ingestion")


# ============================================================
# Lifespan
# ============================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan — initialize Kafka routines."""
    kafka_up = await init_kafka()
    if not kafka_up:
        logger.warning("Event Ingestion started WITHOUT Kafka. Operating in manual REST mode.")
    
    # Detach consumer loop to run infinitely
    loop_task = asyncio.create_task(consume_loop())

    yield

    await stop_kafka()
    try:
         loop_task.cancel()
    except Exception:
         pass
    logger.info("Service shutdown complete.")


# ============================================================
# FastAPI Application
# ============================================================

app = FastAPI(
    title="Vigil Event Ingestion",
    version="0.1.0",
    lifespan=lifespan,
)


@app.get("/health", tags=["System"])
async def health_check():
    """Service health endpoint."""
    return {
        "status": "ok",
        "service": "event-ingestion",
        "kafka_connected": _kafka_available
    }

@app.get("/", tags=["System"])
async def root():
    """Service root endpoint."""
    return {
        "service": "event-ingestion",
        "version": "0.1.0"
    }


@app.post("/test/ingest", tags=["Testing"])
async def manual_ingest(payload: Dict[str, Any]):
    """Manually test ingestion logic bypassing the Kafka wildcard consumer."""
    outcome = await process_raw_event(payload)
    if outcome == "dlq":
        return JSONResponse(status_code=422, content={"status": "rejected", "queue": "dlq"})
    
    return {"status": "validated", "queue": "validated"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.http_port)
