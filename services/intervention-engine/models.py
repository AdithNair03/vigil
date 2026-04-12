"""Intervention Engine Models."""

from typing import Dict, Any, List
from pydantic import BaseModel, Field
import uuid

# Pre-defined Library of Actions
INTERVENTIONS = [
    "NO_ACTION",
    "IN_APP_DISCOUNT",
    "PUSH_NOTIFICATION_GUIDE",
    "EMAIL_SUPPORT",
    "SMS_APOLOGY"
]

class ContextBase(BaseModel):
    tenant_id: str
    user_id: str
    value_gap_score: float
    severity: str
    churn_probability: float
    features: Dict[str, float] = Field(default_factory=dict)

class SelectRequest(BaseModel):
    event_id: str
    context: ContextBase

class SelectedInterventionBase(BaseModel):
    intervention_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_id: str
    tenant_id: str
    user_id: str
    intervention_type: str
    is_holdout: bool
    confidence_score: float
    
class RecordOutcomeRequest(BaseModel):
    intervention_id: str
    tenant_id: str
    user_id: str
    reward: float  # computed by Outcome Tracker
    
class RecordOutcomeResponse(BaseModel):
    status: str
