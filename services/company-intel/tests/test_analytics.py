import pytest
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)

def test_health():
    assert client.get("/health").status_code == 200

def test_dashboard_endpoint_structures_valid():
    res = client.get("/api/v1/tenants/t1/dashboard")
    assert res.status_code == 200
    data = res.json()
    assert data["tenant_id"] == "t1"
    assert data["health_score"] == 8.5
    assert len(data["trends"]) == 2
    assert len(data["roi"]) == 2
    assert len(data["top_issues"]) == 1

def test_dashboard_endpoint_empty_tenant():
    res = client.get("/api/v1/tenants/unknown/dashboard")
    assert res.status_code == 200
    assert res.json()["health_score"] == 10.0 # Default missing

def test_report_generation():
    res = client.post("/api/v1/tenants/t1/reports/generate")
    assert res.status_code == 200
    assert "summary_text" in res.json()
