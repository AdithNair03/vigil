"""Friction Classifier — Bootstrapping Script."""

import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI
from config import settings
from models import ClassifyRequest, ClassifyResponse
from ml_engine import classify_event
from kafka_producer import init_kafka_producer, close_kafka_producer, produce_scored_event
from grpc_server import start_grpc_server

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s | %(name)s | %(levelname)s | %(message)s"
)
logger = logging.getLogger("vigil.friction-classifier")

_start_time: float = time.time()
_grpc_server = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    kafka_up = await init_kafka_producer()
    if not kafka_up:
         logger.warning("No Kafka detected. Events dropped natively.")
         
    global _grpc_server
    _grpc_server = await start_grpc_server(settings.grpc_port)

    yield

    if _grpc_server:
        await _grpc_server.stop(0)
    await close_kafka_producer()
    

app = FastAPI(title="Vigil Friction Classifier", version="0.1.0", lifespan=lifespan)


@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "ok",
        "service": "friction-classifier",
        "uptime_seconds": round(time.time() - _start_time, 2)
    }

@app.get("/", tags=["System"])
async def root():
    return {
        "service": "friction-classifier",
        "version": "0.1.0"
    }

@app.post("/classify", response_model=ClassifyResponse, tags=["Testing"])
async def manual_classify(req: ClassifyRequest):
    """Bypasses gRPC natively to directly post payloads enforcing value loop checks via REST proxying."""
    event_dict = req.event.model_dump()
    ctx_dict = req.user_context.model_dump()
    
    score, needs_intervention = classify_event(event_dict, ctx_dict)
    
    # Broadcast to Kafka asynchronously but do not hang REST flow responses!
    await produce_scored_event(score)
    
    return ClassifyResponse(score=score, requires_intervention=needs_intervention)


@app.get("/metrics/evaluation", tags=["System"])
async def get_evaluation_metrics():
    """Returns the generated model metrics from the last evaluation run."""
    try:
        import os
        metrics_path = os.path.join(os.path.dirname(__file__), "model_metrics.json")
        with open(metrics_path, "r") as f:
            return json.load(f)
    except FileNotFoundError:
        return {"error": "Evaluation metrics not found. Run evaluate_model.py first."}
    except Exception as e:
        return {"error": f"Failed to load metrics: {str(e)}"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.http_port)
