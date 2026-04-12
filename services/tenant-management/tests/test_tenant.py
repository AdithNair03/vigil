import pytest
from fastapi.testclient import TestClient
import os
import json

from main import app

client = TestClient(app)

@pytest.fixture(autouse=True)
def clean_db():
    if os.path.exists("test_db.json"):
        os.remove("test_db.json")

def test_health():
    assert client.get("/health").status_code == 200

def test_onboard_generates_valid_sdk_key_hashed():
    # 1. Onboard
    req = {
        "company_name": "Test Co",
        "industry": "gaming",
        "plan": "growth"
    }
    r = client.post("/tenants/register", json=req)
    assert r.status_code == 200
    data = r.json()
    assert data["company_name"] == "Test Co"
    sdk_key = data["sdk_key"]
    assert sdk_key.startswith("vgl_")
    
    # 2. Check hashing validation mechanism natively
    v_req = client.post("/tenants/validate", json={"sdk_key": sdk_key})
    assert v_req.status_code == 200
    assert v_req.json()["valid"] == True
    assert v_req.json()["tenant_id"] == data["tenant_id"]
    
    # 3. Invalid check
    bad = client.post("/tenants/validate", json={"sdk_key": "vgl_fake_123"})
    assert bad.json()["valid"] == False

def test_stripe_mock_webhook_handles_parameters():
    req = {"type": "invoice.payment_succeeded", "tenant_id": "test_t1", "amount": 500}
    res = client.post("/billing/stripe-webhook", json=req)
    assert res.status_code == 200
    assert res.json()["status"] == "handled"
