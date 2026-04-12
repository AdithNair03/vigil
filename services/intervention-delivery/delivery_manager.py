import logging
import time
from typing import Dict, Any
from config import settings
from models import InterventionJob

logger = logging.getLogger("vigil.delivery")

_fallback_dedup_cache = {}
_redis_pool = None
_redis_available = False

try:
    import redis.asyncio as redis
except ImportError:
    redis = None

async def init_redis():
    global _redis_pool, _redis_available
    if redis is None:
        return False
    try:
        url = f"redis://{settings.redis_host}:{settings.redis_port}/1"
        _redis_pool = redis.from_url(url, decode_responses=True, socket_timeout=1.0)
        await _redis_pool.ping()
        _redis_available = True
        return True
    except Exception:
        _redis_available = False
        return False

async def close_redis():
    if _redis_pool:
        await _redis_pool.aclose()


async def is_in_cooldown(tenant_id: str, user_id: str) -> bool:
    key = f"vigil:dedup:{tenant_id}:{user_id}"
    if _redis_available and _redis_pool:
        try:
            return bool(await _redis_pool.get(key))
        except Exception:
            pass
            
    # Fallback checking dict timestamp 
    ts = _fallback_dedup_cache.get(key)
    if ts and time.time() - ts < settings.cooldown_seconds:
        return True
    return False

async def set_cooldown(tenant_id: str, user_id: str):
    key = f"vigil:dedup:{tenant_id}:{user_id}"
    if _redis_available and _redis_pool:
        try:
             await _redis_pool.set(key, "1", ex=settings.cooldown_seconds)
             return
        except Exception:
             pass
    _fallback_dedup_cache[key] = time.time()


async def deliver_intervention(job: dict) -> tuple[bool, str]:
    """Mock multi-channel delivery."""
    try:
        j = InterventionJob(**job)
    except Exception as e:
        return False, f"Invalid payload: {e}"
        
    if j.intervention_type == "NO_ACTION" or j.is_holdout:
        return True, "skipped"
        
    coold = await is_in_cooldown(j.tenant_id, j.user_id)
    if coold:
        return False, "cooldown"
        
    # Simulate delivery logic based on enum
    if j.intervention_type == "IN_APP_DISCOUNT":
         logger.info(f"Delivering In-App Discount to {j.user_id}")
    elif j.intervention_type == "PUSH_NOTIFICATION_GUIDE":
         logger.info(f"Pushing Notification to {j.user_id}")
    elif j.intervention_type == "EMAIL_SUPPORT":
         logger.info(f"Emailing Support to {j.user_id}")
    elif j.intervention_type == "SMS_APOLOGY":
         logger.info(f"SMS APOLOGY sent to {j.user_id}")
    else:
         return False, "unknown_type"
         
    await set_cooldown(j.tenant_id, j.user_id)
    return True, "delivered"
