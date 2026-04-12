from pydantic import BaseModel, ConfigDict
from typing import Optional, List
import uuid

class TenantRegistrationRequest(BaseModel):
    company_name: str
    your_name: str
    email: str
    password: str
    industry: str # dropdown values from frontend
    company_size: str # 1-10, 11-50, etc.

class TenantResponse(BaseModel):
    tenant_id: str
    company_name: str
    your_name: str
    email: str
    industry: str
    company_size: str
    status: str
    sdk_key: str  # Only returned once on creation

class SDKKeyValidateRequest(BaseModel):
    sdk_key: str

class SDKKeyValidateResponse(BaseModel):
    valid: bool
    tenant_id: Optional[str] = None
    plan: Optional[str] = None

class StripeWebhookPayload(BaseModel):
    type: str # e.g. "invoice.payment_succeeded"
    tenant_id: str
    amount: int
