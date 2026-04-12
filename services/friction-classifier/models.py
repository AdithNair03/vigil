"""Friction Classifier — Pydantic Validation Models."""

import uuid
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

class FrictionEventBase(BaseModel):
    event_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    user_id: str
    session_id: str
    event_type: str
    industry: str = "streaming"
    payload: Dict[str, Any] = Field(default_factory=dict)

class UserContextDataBase(BaseModel):
    tenant_id: str
    user_id: str
    event_count_30d: int = 0
    days_since_signup: int = 0
    recent_events: List[FrictionEventBase] = Field(default_factory=list)
    churn_risk_segment: str = "low"

class FrictionScoreBase(BaseModel):
    event_id: str
    tenant_id: str
    user_id: str
    value_gap_score: float
    severity: str
    churn_probability: float
    friction_category: str
    confidence: float
    feature_importance: Dict[str, float] = Field(default_factory=dict)

class ClassifyRequest(BaseModel):
    event: FrictionEventBase
    user_context: UserContextDataBase

class ClassifyResponse(BaseModel):
    score: FrictionScoreBase
    requires_intervention: bool
