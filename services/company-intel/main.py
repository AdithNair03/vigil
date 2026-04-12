from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import time

from config import settings
from models import DashboardMetrics, WeeklyReport
from analytics import get_dashboard_metrics, generate_weekly_report

_start_time = time.time()

app = FastAPI(title="Company Intelligence API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "ok", "service": "company-intel", "uptime_seconds": round(time.time() - _start_time, 2)}
    
@app.get("/")
async def root():
    return {"service": "company-intel", "version": "0.1.0"}

@app.get("/api/v1/tenants/{tenant_id}/dashboard", response_model=DashboardMetrics)
async def dashboard(tenant_id: str):
    """Serve real-time metrics summarizing OLAP pipeline stores."""
    data = get_dashboard_metrics(tenant_id)
    return DashboardMetrics(**data)

@app.get("/api/v1/analytics", response_model=DashboardMetrics)
async def analytics(tenant_id: str = "t1"):
    """Alias for dashboard metrics, defaults to t1 for dev."""
    data = get_dashboard_metrics(tenant_id)
    return DashboardMetrics(**data)

@app.post("/api/v1/tenants/{tenant_id}/reports/generate", response_model=WeeklyReport)
async def generate_report(tenant_id: str):
    """Trigger AI generation asynchronously proxy."""
    # In production, this drops to celery and Claude API. Local, returns mock.
    data = generate_weekly_report(tenant_id)
    return WeeklyReport(**data)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.http_port)
