"""Friction Classifier — Kafka Output Output Wrapper."""

import json
import logging
from datetime import datetime

from config import settings

logger = logging.getLogger("vigil.friction-classifier.kafka")

_producer = None
_kafka_available = False

try:
    from aiokafka import AIOKafkaProducer
except ImportError:
    AIOKafkaProducer = None


def _serialize(obj):
    def default_serializer(o):
        if isinstance(o, datetime):
            return o.isoformat()
        raise TypeError(f"Type {type(o)} not serializable")
    return json.dumps(obj, default=default_serializer).encode("utf-8")


async def init_kafka_producer():
    global _producer, _kafka_available
    if AIOKafkaProducer is None:
        logger.warning("aiokafka missing. Graceful local mock enabled.")
        return False

    try:
        _producer = AIOKafkaProducer(
            bootstrap_servers=settings.kafka_bootstrap_servers,
            value_serializer=_serialize,
            key_serializer=lambda k: k.encode("utf-8") if k else b"",
            request_timeout_ms=5000,
            retry_backoff_ms=100
        )
        await _producer.start()
        _kafka_available = True
        return True
    except Exception as e:
        logger.warning(f"Kafka unavailable at {settings.kafka_bootstrap_servers}. Scored outputs will be logged locally only.")
        _producer = None
        _kafka_available = False
        return False


async def close_kafka_producer():
    global _producer, _kafka_available
    if _producer:
        await _producer.stop()
        _producer = None
    _kafka_available = False


async def produce_scored_event(score_manifest: dict):
    if not _kafka_available or not _producer:
        logger.debug(f"[MOCK] Emitted Score: {score_manifest.get('value_gap_score')} for user {score_manifest.get('user_id')}")
        return True
    
    tenant_id = score_manifest.get("tenant_id")
    topic = f"vigil.{tenant_id}.events.scored"
    key = score_manifest.get("user_id", "")
    
    try:
        await _producer.send_and_wait(topic, value=score_manifest, key=key)
        return True
    except Exception as e:
        logger.error(f"Failed Kafka push to {topic}: {e}")
        return False
