from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import time
import logging
from typing import List

from config import settings
from db_wrapper import create_tenant_record, validate_key, get_tenant_by_id, list_all_tenants, update_tenant_status
from models import (
    TenantRegistrationRequest,
    TenantResponse,
    SDKKeyValidateRequest,
    SDKKeyValidateResponse,
    StripeWebhookPayload
)

logger = logging.getLogger("vigil.tenant")

app = FastAPI(title="Tenant Management", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
_start_time = time.time()

@app.get("/health")
async def health():
    return {"status": "ok", "service": "tenant-management", "uptime": time.time() - _start_time}

@app.get("/")
async def root():
    return {"service": "tenant-management", "version": "0.1.0"}
    
@app.post("/tenants/register", response_model=TenantResponse)
async def register_tenant(req: TenantRegistrationRequest):
    """Company-facing self-service registration."""
    try:
        data = req.model_dump()
        rec = create_tenant_record(data)
        logger.info(f"Registered new tenant: {rec['company_name']} ({rec['tenant_id']})")
        return TenantResponse(**rec)
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(500, "Internal Server Error during registration")
    
@app.post("/tenants/validate", response_model=SDKKeyValidateResponse)
async def validate_sdk_key(req: SDKKeyValidateRequest):
    """Fast bounding proxy used by SDK Gateway interceptors caching values locally via REDIS."""
    v, t_id, plan = validate_key(req.sdk_key)
    return SDKKeyValidateResponse(valid=v, tenant_id=t_id if v else None, plan=plan if v else None)
    
@app.post("/billing/stripe-webhook")
async def stripe_webhook(req: StripeWebhookPayload):
    """Mocks incoming payment webhooks from Stripe asynchronously triggering billing updates internally mapping."""
    logger.info(f"Received mock webhook event {req.type} for {req.tenant_id}")
    return {"status": "handled"}

@app.get("/tenants/{tenant_id}", response_model=TenantResponse)
async def get_tenant(tenant_id: str):
    """Retrieve tenant details."""
    tenant = get_tenant_by_id(tenant_id)
    if not tenant:
        raise HTTPException(404, "Tenant not found")
    # Mask key in normal GET
    tenant["sdk_key"] = "vk_live_****"
    return tenant

@app.get("/tenants", response_model=List[TenantResponse])
async def list_tenants():
    """List all registered tenants (Internal/Admin)."""
    ts = list_all_tenants()
    for t in ts:
        t["sdk_key"] = "vk_live_****"
    return ts

@app.post("/tenants/{tenant_id}/revoke")
async def revoke_tenant(tenant_id: str):
    """Admin-only revoke access."""
    success = update_tenant_status(tenant_id, "inactive")
    if not success:
        raise HTTPException(404, "Tenant not found")
    return {"status": "revoked"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.http_port)
