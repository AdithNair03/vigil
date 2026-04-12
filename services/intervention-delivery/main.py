import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
import time

from config import settings
from delivery_manager import init_redis, close_redis, deliver_intervention, _redis_available
from models import InterventionJob, DeliveryResult

_start_time = time.time()

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_redis()
    yield
    await close_redis()

app = FastAPI(title="Intervention Delivery", lifespan=lifespan)

@app.get("/health")
async def health():
    return {"status": "ok", "service": "intervention-delivery", "redis": _redis_available}

@app.get("/")
async def root():
    return {"service": "intervention-delivery", "version": "0.1.0"}

@app.post("/test/deliver", response_model=DeliveryResult)
async def manual_delivery(job: dict):
    success, detail = await deliver_intervention(job)
    return DeliveryResult(
        intervention_id=job.get("intervention_id", "none"),
        status="success" if success else "failed",
        detail=detail
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.http_port)
