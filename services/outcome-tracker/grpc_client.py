import sys
from pathlib import Path
import grpc
import logging

from config import settings

PROTO_DIR = Path(__file__).resolve().parent.parent.parent / "proto" / "generated"
if str(PROTO_DIR) not in sys.path:
    sys.path.insert(0, str(PROTO_DIR))

try:
    import vigil_pb2
    import vigil_pb2_grpc
except ImportError:
    vigil_pb2 = None
    vigil_pb2_grpc = None

logger = logging.getLogger("vigil.outcome.grpc")

async def send_reward_to_engine(intervention_id: str, tenant_id: str, user_id: str, reward: float):
    if vigil_pb2 is None:
         logger.debug(f"[MOCK GRPC] Sent reward {reward} to {intervention_id}")
         return True
         
    try:
         async with grpc.aio.insecure_channel(settings.intervention_grpc_url) as channel:
             stub = vigil_pb2_grpc.InterventionEngineServiceStub(channel)
             outcome_pb = vigil_pb2.Outcome(
                  intervention_id=intervention_id,
                  tenant_id=tenant_id,
                  user_id=user_id,
                  reward=reward
             )
             req = vigil_pb2.RecordOutcomeRequest(
                  outcome=outcome_pb
             )
             resp = await stub.RecordOutcome(req, timeout=2.0)
             return resp.success
    except grpc.RpcError as e:
         logger.warning(f"gRPC failed to push reward: {e}")
         return False
