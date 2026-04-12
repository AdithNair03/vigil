"""Friction Classifier — gRPC Router Interface."""

import sys
import logging
import time
from pathlib import Path
from typing import Any

import grpc

# Point to external generalized grpc protocol stubs
PROTO_DIR = Path(__file__).resolve().parent.parent.parent / "proto" / "generated"
if str(PROTO_DIR) not in sys.path:
    sys.path.insert(0, str(PROTO_DIR))

try:
    import vigil_pb2
    import vigil_pb2_grpc
except ImportError:
    vigil_pb2 = Any
    vigil_pb2_grpc = Any
    logging.warning("Protobuf files not compiled.")

from ml_engine import classify_event
from kafka_producer import produce_scored_event

logger = logging.getLogger("vigil.friction-classifier.grpc")

class FrictionClassifierServicer:
    if hasattr(vigil_pb2_grpc, "FrictionClassifierServiceServicer"):
        __bases__ = (vigil_pb2_grpc.FrictionClassifierServiceServicer,)

    async def ClassifyEvent(self, request, context: grpc.aio.ServicerContext):
        start = time.perf_counter()

        # Unpack Protobuf to dict
        evt = {
            "event_id": request.event.event_id,
            "tenant_id": request.event.tenant_id,
            "user_id": request.event.user_id,
            "session_id": request.event.session_id,
            "event_type": request.event.event_type,
            "industry": request.event.industry,
        }
        
        ctx = {
            "tenant_id": request.user_context.tenant_id,
            "user_id": request.user_context.user_id,
            "event_count_30d": request.user_context.event_count_30d,
            "days_since_signup": request.user_context.days_since_signup,
            "recent_events": [
                {"session_id": r.session_id, "event_type": r.event_type}
                for r in request.user_context.recent_events
            ]
        }
        
        # Inference
        score_manifest, demands_intervention = classify_event(evt, ctx)
        
        # Emit pipeline to next step
        await produce_scored_event(score_manifest)
        
        run_time = (time.perf_counter() - start) * 1000
        
        # Build Protobuf Reponse natively inside python bindings
        score_pb = vigil_pb2.FrictionScore(
            event_id=score_manifest["event_id"],
            tenant_id=score_manifest["tenant_id"],
            user_id=score_manifest["user_id"],
            value_gap_score=score_manifest["value_gap_score"],
            severity=score_manifest["severity"],
            churn_probability=score_manifest["churn_probability"],
            friction_category=score_manifest["friction_category"],
            confidence=score_manifest["confidence"]
        )
        
        for k, v in score_manifest["feature_importance"].items():
            score_pb.feature_importance[k] = v
            
        return vigil_pb2.ClassifyEventResponse(
            score=score_pb,
            requires_intervention=demands_intervention,
            classification_time_ms=run_time
        )

    async def BatchClassify(self, request, context: grpc.aio.ServicerContext):
        start = time.perf_counter()
        results = []
        for req in request.events:
            # Reusing isolated invocation wrapper internally avoids rewriting conversion matrix lines!
            res = await self.ClassifyEvent(req, context)
            results.append(res)
            
        return vigil_pb2.BatchClassifyResponse(
            results=results,
            total_time_ms=(time.perf_counter() - start) * 1000
        )


async def start_grpc_server(port: int):
    if not hasattr(vigil_pb2_grpc, "add_FrictionClassifierServiceServicer_to_server"):
        logger.warning("gRPC stubs missing. Rejecting initialization hooks for gRPC locally.")
        return None
        
    server = grpc.aio.server()
    vigil_pb2_grpc.add_FrictionClassifierServiceServicer_to_server(FrictionClassifierServicer(), server)
    server.add_insecure_port(f"[::]:{port}")
    await server.start()
    logger.info(f"Friction Classifier gRPC server launched on {port}")
    return server
