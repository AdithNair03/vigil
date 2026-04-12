"""SDK Gateway — Async Kafka producer with graceful fallback.

If Kafka is unreachable, logs a warning and continues. Events are dropped
(not queued locally) in this case — acceptable for Sprint 2. Production
will add dead letter queue and local WAL in later sprints.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import Any

logger = logging.getLogger("vigil.sdk-gateway.kafka")

# Global producer instance — initialized lazily
_producer: Any | None = None
_producer_initialized: bool = False
_kafka_available: bool = False


async def init_kafka_producer(bootstrap_servers: str) -> bool:
    """Initialize the Kafka producer.

    Returns True if connected successfully, False if Kafka is unreachable.
    Non-fatal — the service continues without Kafka.
    """
    global _producer, _producer_initialized, _kafka_available

    if _producer_initialized:
        return _kafka_available

    try:
        from aiokafka import AIOKafkaProducer

        _producer = AIOKafkaProducer(
            bootstrap_servers=bootstrap_servers,
            value_serializer=lambda v: json.dumps(v, default=_json_serializer).encode(
                "utf-8"
            ),
            key_serializer=lambda k: k.encode("utf-8") if k else None,
            request_timeout_ms=5000,
            retry_backoff_ms=100,
            max_batch_size=16384,
            linger_ms=10,
            acks="all",
        )
        await _producer.start()
        _kafka_available = True
        _producer_initialized = True
        logger.info("Kafka producer connected to %s", bootstrap_servers)
        return True
    except Exception as e:
        _producer = None
        _kafka_available = False
        _producer_initialized = True
        logger.warning(
            "Kafka unavailable at %s — events will be dropped. Error: %s",
            bootstrap_servers,
            e,
        )
        return False


async def close_kafka_producer() -> None:
    """Gracefully close the Kafka producer."""
    global _producer, _producer_initialized, _kafka_available

    if _producer is not None:
        try:
            await _producer.stop()
            logger.info("Kafka producer closed")
        except Exception as e:
            logger.warning("Error closing Kafka producer: %s", e)
    _producer = None
    _producer_initialized = False
    _kafka_available = False


async def produce_event(
    tenant_id: str,
    topic_suffix: str,
    event_data: dict[str, Any],
    key: str | None = None,
) -> bool:
    """Produce an event to a tenant-scoped Kafka topic.

    Topic format: vigil.{tenant_id}.{topic_suffix}

    Args:
        tenant_id: Tenant identifier for topic scoping.
        topic_suffix: Topic suffix (e.g. "events.raw", "events.classified").
        event_data: Event payload to send.
        key: Optional message key for partitioning.

    Returns:
        True if sent successfully, False if Kafka is unavailable.
    """
    if not _kafka_available or _producer is None:
        logger.debug(
            "Kafka unavailable — dropping event for tenant=%s topic=%s",
            tenant_id,
            topic_suffix,
        )
        return False

    topic = f"vigil.{tenant_id}.{topic_suffix}"
    message_key = key or event_data.get("event_id", "")

    try:
        await _producer.send_and_wait(
            topic=topic,
            value=event_data,
            key=message_key,
        )
        logger.debug("Produced event to %s key=%s", topic, message_key)
        return True
    except Exception as e:
        logger.error("Failed to produce to %s: %s", topic, e)
        return False


def is_kafka_available() -> bool:
    """Check if Kafka producer is connected."""
    return _kafka_available


def _json_serializer(obj: Any) -> str:
    """JSON serializer for objects not serializable by default json module."""
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")
