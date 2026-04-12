"""Friction Classifier — River Online ML Engine.

Includes feature engineering, River ML pipeline instantiation per tenant, 
and synchronous inference functions to hit the strict <15ms latency budget.
"""

import math
import logging
from typing import Dict, Tuple

try:
    from river import compose
    from river import linear_model
    from river import preprocessing
except ImportError:
    compose = None
    linear_model = None
    preprocessing = None

logger = logging.getLogger("vigil.friction-classifier.engine")

# Global dict of {tenant_id: River Pipeline}
_tenant_models = {}

INDUSTRY_SIGNAL_DICT = {
    "streaming": {
        "ad_impression_paid_tier": 0.9,
        "rental_paywall_hit": 0.6,
        "cancel_flow_opened": 0.95,
    },
    "food": {
        "delivery_late_no_update": 0.85,
        "wrong_item": 0.9,
    },
    "banking": {
        "hidden_fee_surfaced": 0.65,
        "transfer_declined": 0.8,
    },
    "saas": {
        "feature_paywall_hit": 0.55,
        "renewal_price_shock": 0.85,
    }
}


def _get_model(tenant_id: str):
    """Retrieve or spawn a new online logistic regression pipeline."""
    if compose is None: # Graceful degrade in isolated CI/CD
        return None
        
    if tenant_id not in _tenant_models:
        _tenant_models[tenant_id] = compose.Pipeline(
            preprocessing.StandardScaler(),
            linear_model.LogisticRegression()
        )
        logger.info(f"Initialized new River online model for tenant: {tenant_id}")
    return _tenant_models[tenant_id]


def extract_features(event: dict, context: dict) -> Dict[str, float]:
    """Feature engineering pipeline."""
    industry = event.get("industry", "streaming").lower()
    event_type = event.get("event_type", "unknown")
    
    # 1. Industry Base Weight
    base_weight = INDUSTRY_SIGNAL_DICT.get(industry, {}).get(event_type, 0.5)
    
    # 2. Session Event Count
    session_id = event.get("session_id", "")
    session_count = 1
    recent_events = context.get("recent_events", [])
    if recent_events:
         session_count += sum(1 for e in recent_events if e.get("session_id") == session_id)
         
    # 3. Time Since Last Friction (Mocked using recent events array distance heuristically for tests)
    time_since_last_friction = 0.0
    if len(recent_events) > 0:
        time_since_last_friction = 1.0 # arbitrary default flag
        
    # 4. User Tenure Days
    tenure_days = float(context.get("days_since_signup", 0))

    # 5. Severity proxy
    event_severity = base_weight * min(1.0, session_count / 10.0)

    return {
        "event_severity": event_severity,
        "session_event_count": float(session_count),
        "time_since_last_friction": time_since_last_friction,
        "industry_base_weight": base_weight,
        "user_tenure_days": tenure_days
    }


def classify_event(event: dict, context: dict) -> Tuple[dict, bool]:
    """Compute friction gap, severity and churn rate."""
    tenant_id = event.get("tenant_id", "default")
    features = extract_features(event, context)
    
    model = _get_model(tenant_id)
    churn_probability = 0.0
    confidence = 0.5
    
    if model:
        # Predict probability of Churn (1 = churn, 0 = no churn)
        # Using .predict_proba_one
        proba_dict = model.predict_proba_one(features)
        
        # In cases where the class "True" isn't fully established, handle missing key
        churn_probability = proba_dict.get(True, 0.0)
        
        # Learn incrementally! We assume high severity * multi-session = positive churn class heuristically locally
        target_churn_proxy = (features["event_severity"] > 0.5 and features["session_event_count"] > 3)
        model.learn_one(features, target_churn_proxy)
        
        confidence = 0.8 # arbitrary confidence indicator
    else:
        # Fallback pseudo-math if River doesn't exist
        churn_probability = min(1.0, features["event_severity"])
        
    # Translate churn probability to Value Gap Score (0-10, reversed)
    # High churn (1.0) -> Low Value Score (0.0)
    value_gap_score = max(0.0, min(10.0, (1.0 - churn_probability) * 10))
    
    # Severity bounds
    if value_gap_score < 3.0:
        severity = "critical"
        req_intervention = True
    elif value_gap_score < 6.0:
        severity = "warning"
        req_intervention = True
    elif value_gap_score < 8.0:
        severity = "medium"
        req_intervention = False
    else:
        severity = "low"
        req_intervention = False

    score_manifest = {
        "event_id": event.get("event_id", ""),
        "tenant_id": tenant_id,
        "user_id": event.get("user_id", ""),
        "value_gap_score": round(value_gap_score, 2),
        "severity": severity,
        "churn_probability": round(churn_probability, 3),
        "friction_category": "quality",
        "confidence": confidence,
        "feature_importance": features
    }
    
    return score_manifest, req_intervention
