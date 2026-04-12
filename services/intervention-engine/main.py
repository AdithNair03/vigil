"""Intervention Engine Main Wrapper."""

from contextlib import asynccontextmanager
from fastapi import FastAPI
import time

from config import settings
from grpc_server import start_grpc_server, _intervention_memory_cache
from kafka_producer import init_kafka, close_kafka, emit_intervention
from ml_engine import get_bandit, determine_holdout
from models import SelectRequest, SelectedInterventionBase, RecordOutcomeRequest, RecordOutcomeResponse

_start_time = time.time()
_grpc = None

@asynccontextmanager
async def lifespan(app: FastAPI):
     await init_kafka()
     global _grpc
     _grpc = await start_grpc_server(settings.grpc_port)
     yield
     if _grpc:
        await _grpc.stop(0)
     await close_kafka()


app = FastAPI(title="Intervention Engine", version="0.1.0", lifespan=lifespan)

@app.get("/health")
async def health():
    return {"status": "ok", "service": "intervention-engine", "uptime_seconds": round(time.time() - _start_time, 2)}
    
@app.get("/")
async def root():
    return {"service": "intervention-engine", "version": "0.1.0"}

# REST Testing API
@app.post("/select", response_model=SelectedInterventionBase)
async def rest_select(req: SelectRequest):
    bandit = get_bandit(req.context.tenant_id)
    features = {"value_gap": req.context.value_gap_score, **req.context.features}
    
    action, prob = bandit.select_intervention(features)
    is_holdout = determine_holdout(req.context.user_id)
    if is_holdout:
        action = "NO_ACTION"
        prob = 1.0
        
    res = SelectedInterventionBase(
        event_id=req.event_id,
        tenant_id=req.context.tenant_id,
        user_id=req.context.user_id,
        intervention_type=action,
        is_holdout=is_holdout,
        confidence_score=prob
    )
    
    if action != "NO_ACTION" and not is_holdout:
         _intervention_memory_cache[res.intervention_id] = {
             "features": features, "action": action, "prob": prob, "tenant_id": req.context.tenant_id
         }
         
    await emit_intervention(res.model_dump())
    return res

@app.post("/record_outcome", response_model=RecordOutcomeResponse)
async def rest_record(req: RecordOutcomeRequest):
    cached = _intervention_memory_cache.get(req.intervention_id)
    if cached and cached["tenant_id"] == req.tenant_id:
         bandit = get_bandit(req.tenant_id)
         bandit.learn(cached["features"], cached["action"], cached["prob"], req.reward)
         return {"status": "learned"}
    return {"status": "not_found"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.http_port)
