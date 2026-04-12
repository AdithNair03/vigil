import time
import logging
import httpx
from typing import List
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
import jwt

from config import settings
from health_poller import ping_all_services
from models import SystemHealthResponse, AuthTokenRequest, TokenResponse, TenantSummary, TestEventRequest

logger = logging.getLogger("vigil.admin")

app = FastAPI(title="Admin Panel", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
_start_time = time.time()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def create_access_token(data: dict):
    return jwt.encode(data, settings.admin_secret_key, algorithm="HS256")

def verify_admin_token(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, settings.admin_secret_key, algorithms=["HS256"])
        if payload.get("role") != "super_admin" or payload.get("sub") != "adith":
             raise HTTPException(status_code=403, detail="Not authorized")
        return payload
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

@app.post("/token", response_model=TokenResponse)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    # Adith-only auth securely mapping internal JWT configurations validating boundaries
    if form_data.username != "adith" or form_data.password != "vigil@admin2024":
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    
    token = create_access_token(data={"sub": "adith", "role": "super_admin"})
    return {"access_token": token, "token_type": "bearer"}

@app.get("/health")
async def health():
    return {"status": "ok", "service": "admin-panel", "uptime": time.time() - _start_time}

@app.get("/")
async def root():
    return {"service": "admin-panel", "version": "0.1.0"}

@app.get("/system/health", response_model=SystemHealthResponse)
async def get_system_health(token: dict = Depends(verify_admin_token)):
    """Cross-polling bounded locally iterating all configured ports properly isolating offline metrics gracefully."""
    svcs = await ping_all_services()
    up = sum(1 for s in svcs if s["status"] == "healthy")
    overall = "healthy" if up == len(svcs) else "degraded" if up > 0 else "offline"
    
    return SystemHealthResponse(
        timestamp=time.time(),
        services=svcs,
        overall_status=overall
    )

@app.get("/admin/health", response_model=SystemHealthResponse)
async def get_admin_health(token: dict = Depends(verify_admin_token)):
    """Alias for /system/health."""
    return await get_system_health(token)

@app.get("/admin/tenants", response_model=List[TenantSummary])
async def list_admin_tenants(token: dict = Depends(verify_admin_token)):
    """Fetch all tenants from Tenant Management service."""
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get("http://localhost:8001/tenants")
            if resp.status_code == 200:
                return resp.json()
            else:
                 raise HTTPException(502, "Failed to fetch from Tenant Management")
        except Exception as e:
            raise HTTPException(502, f"Tenant Management unreachable: {e}")

@app.post("/admin/tenants/{tenant_id}/revoke")
async def admin_revoke_tenant(tenant_id: str, token: dict = Depends(verify_admin_token)):
    """Proxy revoke call to Tenant Management."""
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(f"http://localhost:8001/tenants/{tenant_id}/revoke")
            if resp.status_code == 200:
                return resp.json()
            else:
                 raise HTTPException(502, "Failed to revoke in Tenant Management")
        except Exception as e:
            raise HTTPException(502, f"Tenant Management unreachable: {e}")

@app.post("/admin/events/test")
async def generate_test_event(req: TestEventRequest, token: dict = Depends(verify_admin_token)):
    """Generate a mock friction event and send it to SDK Gateway."""
    async with httpx.AsyncClient() as client:
        try:
            # We need a valid SDK key if we were doing real auth, 
            # but for test events we might just send directly to internal ingestion if possible,
            # or use a known test key.
            # For now, we'll try to hit the SDK Gateway's /events endpoint (if it exists)
            # or /ingest if it's gRPC.
            # Local SDK Gateway is at 8000.
            event_payload = {
                "tenant_id": req.tenant_id,
                "user_id": req.user_id,
                "event_type": req.event_type,
                "industry": req.industry,
                "timestamp": time.time(),
                "payload": {"source": "admin_test_panel"}
            }
            # Sending to SDK Gateway
            resp = await client.post("http://localhost:8000/events", json=event_payload)
            if resp.status_code in [200, 202]:
                return {"status": "event_fired", "response": resp.json()}
            else:
                return {"status": "failed_to_fire", "code": resp.status_code, "detail": resp.text}
        except Exception as e:
            raise HTTPException(502, f"SDK Gateway unreachable: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.http_port)
