"""Intervention Engine — GRPC Server Interface."""

import sys
import time
import logging
from pathlib import Path
import grpc
from typing import Any

from config import settings
from ml_engine import get_bandit, determine_holdout
from models import SelectedInterventionBase
from kafka_producer import emit_intervention

PROTO_DIR = Path(__file__).resolve().parent.parent.parent / "proto" / "generated"
if str(PROTO_DIR) not in sys.path:
    sys.path.insert(0, str(PROTO_DIR))

try:
    import vigil_pb2
    import vigil_pb2_grpc
except ImportError:
    vigil_pb2 = Any
    vigil_pb2_grpc = Any

logger = logging.getLogger("vigil.intervention.grpc")

# Memory Cache tying intervention bounds back onto contextual learning bounds when rewards are received
# Key: intervention_id -> Dict
_intervention_memory_cache = {}

class InterventionEngineServicer:
    if hasattr(vigil_pb2_grpc, "InterventionEngineServiceServicer"):
        __bases__ = (vigil_pb2_grpc.InterventionEngineServiceServicer,)

    async def SelectIntervention(self, request, context: grpc.aio.ServicerContext):
        start = time.perf_counter()
        
        bandit = get_bandit(request.tenant_id)
        
        # Flatten features 
        f_dict = {"value_score": request.score.value_gap_score}
        for k, v in request.user_context.feature_vector.items():
            f_dict[k] = v
            
        action, prob = bandit.select_intervention(f_dict)
        
        is_holdout = determine_holdout(request.score.user_id)
        if is_holdout:
             action = "NO_ACTION"
             prob = 1.0
             
        out_model = SelectedInterventionBase(
             event_id=request.score.event_id,
             tenant_id=request.tenant_id,
             user_id=request.score.user_id,
             intervention_type=action,
             is_holdout=is_holdout,
             confidence_score=prob
        )
        
        # Cache for learning phase later
        if not is_holdout and action != "NO_ACTION":
            _intervention_memory_cache[out_model.intervention_id] = {
                "features": f_dict,
                "action": action,
                "prob": prob,
                "tenant_id": request.tenant_id
            }
        
        # Output payload mapping Kafka push
        await emit_intervention(out_model.model_dump())
        
        rpc_out = vigil_pb2.SelectedIntervention(
            intervention_id=out_model.intervention_id,
            event_id=out_model.event_id,
            tenant_id=out_model.tenant_id,
            user_id=out_model.user_id,
            intervention_type=out_model.intervention_type,
            is_holdout=out_model.is_holdout,
            confidence_score=out_model.confidence_score
        )
        
        return vigil_pb2.SelectInterventionResponse(
            intervention=rpc_out,
            selection_time_ms=(time.perf_counter() - start) * 1000
        )

    async def RecordOutcome(self, request, context: grpc.aio.ServicerContext):
        # The Outcome tracker sends this
        cached = _intervention_memory_cache.get(request.intervention_id)
        if cached:
            if cached["tenant_id"] == request.tenant_id:
                bandit = get_bandit(request.tenant_id)
                bandit.learn(cached["features"], cached["action"], cached["prob"], request.reward)
                return vigil_pb2.RecordOutcomeResponse(success=True)
            
        return vigil_pb2.RecordOutcomeResponse(success=False)


async def start_grpc_server(port: int):
    # Isolated fallback if stubs are miscompiled locally
    if not hasattr(vigil_pb2_grpc, "add_InterventionEngineServiceServicer_to_server"):
        return None
        
    s = grpc.aio.server()
    vigil_pb2_grpc.add_InterventionEngineServiceServicer_to_server(InterventionEngineServicer(), s)
    s.add_insecure_port(f"[::]:{port}")
    await s.start()
    return s
