"""User Context — Pydantic models (matching Proto for validation constraints)."""

from datetime import datetime, timezone
from typing import Any
from pydantic import BaseModel, Field


class FrictionEvent(BaseModel):
    """Friction event received to update the context."""
    event_id: str
    tenant_id: str
    user_id: str
    session_id: str
    event_type: str
    industry: str = ""
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    payload: dict[str, Any] = Field(default_factory=dict)
    schema_version: str = "1.0.0"
    sdk_version: str = ""
    platform: str = ""
    app_version: str = ""


class UserContextData(BaseModel):
    """Full user context containing historical counts and features."""
    tenant_id: str
    user_id: str
    event_count_30d: int = 0
    avg_value_gap_score: float = 0.0
    friction_event_count_7d: int = 0
    intervention_count_7d: int = 0
    intervention_success_rate: float = 0.0
    subscription_tier: str = "free"
    days_since_signup: int = 0
    last_active: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    recent_events: list[FrictionEvent] = Field(default_factory=list)
    feature_vector: dict[str, float] = Field(default_factory=dict)
    churn_risk_segment: str = "low"
    
