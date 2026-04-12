from fastapi import FastAPI
import time

from models import OutcomeEvent, InterventionStatOut
from reward_computer import compute_reward, record_mock_outcome, get_stats
from grpc_client import send_reward_to_engine

_start_time = time.time()
app = FastAPI(title="Outcome Tracker", version="0.1.0")

@app.get("/health")
async def health():
    return {"status": "ok", "service": "outcome-tracker", "uptime": round(time.time() - _start_time, 2)}
    
@app.get("/")
async def root():
    return {"service": "outcome-tracker", "version": "0.1.0"}

@app.post("/test/record", response_model=dict)
async def record_outcome(evt: OutcomeEvent):
    # Compute reward
    rwd = compute_reward(evt.event_type)
    
    # Store locally
    record_mock_outcome(evt.tenant_id, evt.user_id, evt.intervention_id, evt.event_type)
    
    # Push back to engine via gRPC natively decoupling
    await send_reward_to_engine(evt.intervention_id, evt.tenant_id, evt.user_id, rwd)
    
    return {"status": "recorded", "reward": rwd}

@app.get("/stats", response_model=InterventionStatOut)
async def stats():
    s = get_stats()
    return InterventionStatOut(
         intervention_type="aggregate",
         total_group=s["total"],
         converted=s["converted"],
         conversion_rate=s["conversion_rate"]
    )
    
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8007)
