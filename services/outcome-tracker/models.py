from pydantic import BaseModel, Field
import uuid

class OutcomeEvent(BaseModel):
    outcome_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    user_id: str
    intervention_id: str
    event_type: str # "delivered", "seen", "clicked", "converted", "dismissed", "expired"
    
class InterventionStatOut(BaseModel):
    intervention_type: str
    total_group: int
    converted: int
    conversion_rate: float
