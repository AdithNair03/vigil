import pytest
from fastapi.testclient import TestClient
from main import app
import delivery_manager

client = TestClient(app)

@pytest.fixture(autouse=True)
def clear_dedup():
    delivery_manager._fallback_dedup_cache.clear()

def test_health():
    assert client.get("/health").status_code == 200

def test_delivery_skips_holdout():
    res = client.post("/test/deliver", json={
        "intervention_id": "1", "event_id": "2", "tenant_id": "t", "user_id": "u",
        "intervention_type": "IN_APP_DISCOUNT", "is_holdout": True, "confidence_score": 0.9
    })
    assert res.json()["status"] == "success"
    assert res.json()["detail"] == "skipped"

def test_delivery_deduplicates_fast_succession():
    j = {
        "intervention_id": "1", "event_id": "2", "tenant_id": "t", "user_id": "u1",
        "intervention_type": "IN_APP_DISCOUNT", "is_holdout": False, "confidence_score": 0.9
    }
    r1 = client.post("/test/deliver", json=j)
    assert r1.json()["status"] == "success"
    assert r1.json()["detail"] == "delivered"
    
    r2 = client.post("/test/deliver", json=j)
    assert r2.json()["status"] == "failed"
    assert r2.json()["detail"] == "cooldown"
