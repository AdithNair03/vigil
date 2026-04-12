"""User Context — gRPC Service Implementation."""

import sys
import logging
import time
from pathlib import Path
from typing import Any

import grpc

# Ensure proto generated stubs are in sys.path
PROTO_DIR = Path(__file__).resolve().parent.parent.parent / "proto" / "generated"
if str(PROTO_DIR) not in sys.path:
    sys.path.insert(0, str(PROTO_DIR))

try:
    import vigil_pb2
    import vigil_pb2_grpc
except ImportError:
    # If protos are not generated locally, these will fail. Create a dummy structure to allow module load.
    vigil_pb2 = Any
    vigil_pb2_grpc = Any
    logging.warning("Protobuf stubs not found. Run scripts/generate_protos.ps1")

from redis_client import get_user_context, save_user_context
from models import UserContextData, FrictionEvent

logger = logging.getLogger("vigil.user-context.grpc")

class UserContextServicer:
    """Implement UserContextService from vigil.proto."""
    
    # We dynamically subclass standard grpc servicer if it is loaded
    if hasattr(vigil_pb2_grpc, "UserContextServiceServicer"):
        __bases__ = (vigil_pb2_grpc.UserContextServiceServicer,)

    async def GetUserContext(self, request, context: grpc.aio.ServicerContext):
        """Get the current rolling state for a user in < 5ms."""
        start = time.perf_counter()
        data = await get_user_context(request.tenant_id, request.user_id)
        
        lookup_time = (time.perf_counter() - start) * 1000
        
        if not data:
            return vigil_pb2.GetUserContextResponse(
                found=False,
                lookup_time_ms=lookup_time
            )
            
        proto_context = vigil_pb2.UserContextData(
             tenant_id=data.get("tenant_id", request.tenant_id),
             user_id=data.get("user_id", request.user_id),
             event_count_30d=data.get("event_count_30d", 0),
             avg_value_gap_score=data.get("avg_value_gap_score", 0.0),
             friction_event_count_7d=data.get("friction_event_count_7d", 0),
             intervention_count_7d=data.get("intervention_count_7d", 0),
             intervention_success_rate=data.get("intervention_success_rate", 0.0),
             subscription_tier=data.get("subscription_tier", "free"),
             days_since_signup=data.get("days_since_signup", 0),
             churn_risk_segment=data.get("churn_risk_segment", "low")
        )
        
        # Load recent events
        for evt in data.get("recent_events", []):
             p_evt = proto_context.recent_events.add()
             p_evt.event_id = evt.get("event_id", "")
             p_evt.tenant_id = evt.get("tenant_id", "")
             p_evt.user_id = evt.get("user_id", "")
             p_evt.session_id = evt.get("session_id", "")
             p_evt.event_type = evt.get("event_type", "")
        
        return vigil_pb2.GetUserContextResponse(
            context=proto_context,
            found=True,
            lookup_time_ms=lookup_time
        )

    async def UpdateUserContext(self, request, context: grpc.aio.ServicerContext):
        """Update context with a new incoming friction event."""
        existing = await get_user_context(request.tenant_id, request.user_id) or {
             "tenant_id": request.tenant_id,
             "user_id": request.user_id,
             "event_count_30d": 0,
             "recent_events": []
        }
        
        # Merge new event
        evt_dict = {
            "event_id": request.event.event_id,
            "tenant_id": request.event.tenant_id,
            "user_id": request.event.user_id,
            "session_id": request.event.session_id,
            "event_type": request.event.event_type,
        }
        
        existing["event_count_30d"] += 1
        existing["recent_events"].append(evt_dict)
        
        success = await save_user_context(request.tenant_id, request.user_id, existing)
        
        proto_context = vigil_pb2.UserContextData(
             tenant_id=existing.get("tenant_id"),
             user_id=existing.get("user_id"),
             event_count_30d=existing.get("event_count_30d", 0)
        )
        
        return vigil_pb2.UpdateUserContextResponse(
            success=success,
            updated_context=proto_context
        )

async def start_grpc_server(port: int):
    """Boot the gRPC server."""
    if not hasattr(vigil_pb2_grpc, "add_UserContextServiceServicer_to_server"):
        logger.warning("gRPC stubs missin. Skipping gRPC server start.")
        return None
        
    server = grpc.aio.server()
    vigil_pb2_grpc.add_UserContextServiceServicer_to_server(UserContextServicer(), server)
    server.add_insecure_port(f"[::]:{port}")
    await server.start()
    logger.info(f"User Context gRPC server running on port {port}")
    return server
