from pydantic import BaseModel
from typing import List, Dict

class FrictionTrend(BaseModel):
    timestamp: str
    avg_score: float
    total_events: int
    
class InterventionROI(BaseModel):
    intervention_type: str
    success_rate: float
    estimated_arr_saved: float
    
class ProductIssue(BaseModel):
    category: str
    severity: str
    affected_users: int

class InterventionOutcome(BaseModel):
    type: str
    fired: int
    success: int
    riskBefore: int
    riskAfter: int
    revenue: float

class DashboardMetrics(BaseModel):
    tenant_id: str
    health_score: float
    trends: List[FrictionTrend]
    roi: List[InterventionROI]
    top_issues: List[ProductIssue]
    outcomes: List[InterventionOutcome] = []
    
class WeeklyReport(BaseModel):
    tenant_id: str
    summary_text: str
    key_findings: List[str]
