import pytest
from fastapi.testclient import TestClient

from main import app, create_access_token
import health_poller

client = TestClient(app)

def test_health():
    assert client.get("/health").status_code == 200

def test_root():
    assert client.get("/").status_code == 200

def test_login_generates_token():
    r = client.post("/token", data={"username": "adith", "password": "admin123"})
    assert r.status_code == 200
    assert "access_token" in r.json()

def test_system_health_blocked_without_token():
    r = client.get("/system/health")
    assert r.status_code == 401

@pytest.mark.asyncio
async def test_system_health_returns_aggregate_metrics(monkeypatch):
    # Mock ping_all_services to avoid hitting actual ports natively during isolated testing
    async def mock_ping():
        return [{"name": "fake", "port": 1234, "status": "healthy", "uptime": 1.0}]
    
    monkeypatch.setattr("main.ping_all_services", mock_ping)
    
    # Generate token bridging dependencies correctly directly validating internally gracefully securing boundaries locally
    t = create_access_token({"sub": "adith", "role": "super_admin"})
    r = client.get("/system/health", headers={"Authorization": f"Bearer {t}"})
    assert r.status_code == 200
    data = r.json()
    assert data["overall_status"] == "healthy"
    assert len(data["services"]) == 1
