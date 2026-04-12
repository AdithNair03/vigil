"""Intervention Engine — Kafka Producer."""

import json
import logging
from config import settings

logger = logging.getLogger("vigil.intervention.kafka")

_producer = None
_available = False

try:
    from aiokafka import AIOKafkaProducer
except ImportError:
    AIOKafkaProducer = None


async def init_kafka():
    global _producer, _available
    if AIOKafkaProducer is None:
        logger.warning("Kafka missing. Local dev proxy activated.")
        return False
        
    try:
        _producer = AIOKafkaProducer(
            bootstrap_servers=settings.kafka_bootstrap_servers,
            value_serializer=lambda v: json.dumps(v).encode("utf-8"),
            key_serializer=lambda k: k.encode("utf-8") if k else b""
        )
        await _producer.start()
        _available = True
        return True
    except Exception as e:
        logger.error(f"Kafka error: {e}")
        return False

async def close_kafka():
    if _producer:
        await _producer.stop()

async def emit_intervention(payload: dict):
    if not _available or not _producer:
        logger.debug(f"[MOCK] Emit Intervention: {payload}")
        return True
        
    topic = f"vigil.{payload.get('tenant_id', 'unknown')}.interventions.selected"
    try:
         await _producer.send_and_wait(topic, value=payload, key=payload.get('user_id', ''))
         return True
    except Exception as e:
         logger.error(f"Emitter failed: {e}")
         return False
