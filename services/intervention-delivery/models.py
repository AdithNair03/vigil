from pydantic import BaseModel, Field

class InterventionJob(BaseModel):
    intervention_id: str
    event_id: str
    tenant_id: str
    user_id: str
    intervention_type: str
    is_holdout: bool
    confidence_score: float

class DeliveryResult(BaseModel):
    intervention_id: str
    status: str
    detail: str = ""
