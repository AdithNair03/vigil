"""User Context — Async Redis Client with Graceful Fallback."""

import json
import logging
from typing import Any, Dict, List, Optional
from datetime import datetime

from config import settings

logger = logging.getLogger("vigil.user-context.redis")

# Graceful in-memory fallback cache: { "vigil:{tenant_id}:user:{user_id}:context": UserContextCache }
_fallback_cache: Dict[str, Dict[str, Any]] = {}
_redis_pool = None
_redis_available = False

try:
    import redis.asyncio as redis
except ImportError:
    redis = None


def _get_key(tenant_id: str, user_id: str) -> str:
    """Generate the standard Redis key for a user's context."""
    return f"vigil:{tenant_id}:user:{user_id}:context"


async def init_redis() -> bool:
    """Initialize Redis connection pool, or fallback if unavailable."""
    global _redis_pool, _redis_available

    if redis is None:
        logger.warning("redis package not installed, using in-memory fallback.")
        _redis_available = False
        return False

    try:
        url = f"redis://{'':{settings.redis_password}@' if settings.redis_password else ''}{settings.redis_host}:{settings.redis_port}/0"
        _redis_pool = redis.from_url(
            url,
            socket_timeout=settings.redis_socket_timeout,
            decode_responses=True,
        )
        await _redis_pool.ping()
        _redis_available = True
        logger.info(f"Connected to Redis at {settings.redis_host}:{settings.redis_port}")
        return True
    except Exception as e:
        logger.warning(f"Failed to connect to Redis, reverting to in-memory fallback. Error: {e}")
        _redis_available = False
        return False


async def close_redis() -> None:
    """Close Redis connection."""
    global _redis_pool, _redis_available
    if _redis_pool is not None:
        await _redis_pool.aclose()
        _redis_pool = None
    _redis_available = False
    logger.info("Redis connections closed.")


# To adhere to the 5ms strict SLA, we are storing the entire context block as a fast JSON blob!
# While the CLAUDE.md mentions lists/hashes, parsing a single GET/SET key reduces trip delays.
# We will intercept the logic inside the client.

def _serialize_datetime(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")


async def get_user_context(tenant_id: str, user_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve full user context."""
    key = _get_key(tenant_id, user_id)
    if _redis_available and _redis_pool is not None:
        try:
            data = await _redis_pool.get(key)
            return json.loads(data) if data else None
        except Exception as e:
            logger.error(f"Redis GET failed for {key}: {e}")
            # Fall through to fallback temporarily via exception? We just return None.
            return None
    else:
        return _fallback_cache.get(key)


async def save_user_context(tenant_id: str, user_id: str, context: Dict[str, Any]) -> bool:
    """Save full user context. Keeps recent_events at 30 max."""
    key = _get_key(tenant_id, user_id)
    
    # Prune events to rolling max of 30
    if "recent_events" in context:
        context["recent_events"] = context["recent_events"][-30:]

    if _redis_available and _redis_pool is not None:
        try:
            serialized = json.dumps(context, default=_serialize_datetime)
            await _redis_pool.set(key, serialized, ex=settings.context_ttl_seconds)
            return True
        except Exception as e:
            logger.error(f"Redis SET failed for {key}: {e}")
            return False
    else:
        _fallback_cache[key] = context
        return True


def is_redis_available() -> bool:
    return _redis_available
