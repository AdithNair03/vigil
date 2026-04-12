import logging

logger = logging.getLogger("vigil.outcome.rewards")

REWARD_MAPPING = {
    "converted": 1.0,
    "clicked": 0.5,
    "seen": 0.2,
    "dismissed": -0.3,
    "expired": -0.1,
    "delivered": 0.0
}

_mock_db = {
    "outcomes": [],
    "intervention_assignments": {} # {intervention_id: type}
}

def compute_reward(event_type: str) -> float:
    return REWARD_MAPPING.get(event_type.lower(), 0.0)

def record_mock_outcome(tenant_id: str, u_id: str, int_id: str, e_type: str):
    """Fallback Postgres mock"""
    _mock_db["outcomes"].append({
        "tenant_id": tenant_id, "user_id": u_id,
        "intervention_id": int_id, "event_type": e_type,
        "reward": compute_reward(e_type)
    })
    
def get_stats():
     # Simple mock aggregation
     stats = {"converted": 0, "total": len(_mock_db["outcomes"])}
     for o in _mock_db["outcomes"]:
          if o["event_type"] == "converted":
              stats["converted"] += 1
     stats["conversion_rate"] = stats["converted"] / max(stats["total"], 1)
     return stats
