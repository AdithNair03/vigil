from pydantic import BaseModel
from typing import List, Optional

class ServiceHealth(BaseModel):
    name: str
    port: int
    status: str
    uptime: float

class SystemHealthResponse(BaseModel):
    timestamp: float
    services: List[ServiceHealth]
    overall_status: str

class AuthTokenRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str

class TenantSummary(BaseModel):
    tenant_id: str
    company_name: str
    industry: str
    plan: str

class TestEventRequest(BaseModel):
    tenant_id: str
    event_type: str
    industry: str
    user_id: Optional[str] = "test-user-admin"
