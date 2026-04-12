"""Event Ingestion — Async Kafka Consumer and Validation Routines."""

import asyncio
import json
import logging
from datetime import datetime
from typing import Any, Dict

from pydantic import ValidationError

from config import settings
from models import FrictionEvent

logger = logging.getLogger("vigil.event-ingestion.kafka")

_consumer = None
_producer = None
_kafka_available = False
_running = False

try:
    from aiokafka import AIOKafkaConsumer, AIOKafkaProducer
except ImportError:
    AIOKafkaConsumer = None
    AIOKafkaProducer = None


def _serialize(obj: Any) -> bytes:
    """Helper to dump JSON to bytes."""
    def default_serializer(o):
        if isinstance(o, datetime):
            return o.isoformat()
        raise TypeError(f"Object {type(o)} not serializable")
        
    return json.dumps(obj, default=default_serializer).encode("utf-8")


async def init_kafka() -> bool:
    """Initialize Kafka with graceful fallback."""
    global _consumer, _producer, _kafka_available
    
    if AIOKafkaConsumer is None:
        logger.warning("aiokafka not installed, mocking Kafka.")
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

        _consumer = AIOKafkaConsumer(
            bootstrap_servers=settings.kafka_bootstrap_servers,
            group_id=settings.kafka_consumer_group,
            value_deserializer=lambda v: json.loads(v.decode("utf-8")),
            key_deserializer=lambda k: k.decode("utf-8") if k else None,
            auto_offset_reset="latest"
        )
        # Subscribe natively using regex wildcard
        _consumer.subscribe(pattern=settings.kafka_raw_topic_pattern)
        await _consumer.start()

        _kafka_available = True
        logger.info(f"Kafka connected. Group: {settings.kafka_consumer_group}")
        return True
    except Exception as e:
        logger.warning(f"Kafka unavailable at {settings.kafka_bootstrap_servers}: {e}")
        _consumer = None
        if _producer:
            await _producer.stop()
        _producer = None
        _kafka_available = False
        return False


async def stop_kafka():
    """Graceful halt."""
    global _running, _consumer, _producer
    _running = False
    
    if _consumer:
        await _consumer.stop()
    if _producer:
        await _producer.stop()
    logger.info("Kafka consumer/producer stopped.")


async def produce_validated(event_obj: FrictionEvent) -> bool:
    """Publish to the validated topic dynamically matching the tenant_id."""
    if not _kafka_available or not _producer:
        logger.debug(f"[MOCK] Producing VALIDATED event: {event_obj.event_id}")
        return True
    
    topic = f"vigil.{event_obj.tenant_id}.events.validated"
    payload = event_obj.model_dump(mode="json")
    payload["_validation_status"] = "passed"
    payload["_ingestion_timestamp"] = datetime.utcnow().isoformat()
    
    try:
        await _producer.send_and_wait(topic, value=payload, key=event_obj.user_id)
        return True
    except Exception as e:
        logger.error(f"Failed to produce to {topic}: {e}")
        return False


async def produce_dlq(raw_payload: Dict[str, Any], error_msg: str) -> bool:
    """Publish to the Dead Letter Queue for later root-cause audits."""
    if not _kafka_available or not _producer:
        logger.debug(f"[MOCK] Producing DLQ event: {error_msg}")
        return True

    payload = {
        "raw_data": raw_payload,
        "error": error_msg,
        "_ingestion_timestamp": datetime.utcnow().isoformat()
    }
    
    try:
        await _producer.send_and_wait(
            settings.kafka_dlq_topic,
            value=payload,
            key=raw_payload.get("user_id", "unknown-user")
        )
        return True
    except Exception as e:
        logger.error(f"Failed to produce to {settings.kafka_dlq_topic}: {e}")
        return False


async def process_raw_event(raw_payload: Dict[str, Any]) -> str:
    """Core logic to process incoming pure dictionaries. Returns 'validated' or 'dlq'."""
    try:
        validated_event = FrictionEvent(**raw_payload)
        await produce_validated(validated_event)
        return "validated"
    except ValidationError as e:
        error_extract = str(e)
        logger.warning(f"Event validation failed: {error_extract}")
        await produce_dlq(raw_payload, error_extract)
        return "dlq"


async def consume_loop():
    """Run continuously when Kafka is available pulling wildcard topics."""
    global _running
    _running = True
    
    if not _kafka_available or not _consumer:
        logger.info("Kafka missing. Consumer loop exiting.")
        return

    logger.info("Starting raw event consumption loop...")
    while _running:
        try:
            msg = await asyncio.wait_for(_consumer.getone(), timeout=1.0)
            await process_raw_event(msg.value)
        except asyncio.TimeoutError:
            continue  # Check _running flags
        except Exception as e:
            logger.error(f"Error consuming message: {e}")
            await asyncio.sleep(1)  # Prevent spam
