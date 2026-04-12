import pytest
from fastapi.testclient import TestClient

from main import app
import redis_client

client = TestClient(app)

@pytest.fixture(autouse=True)
def clear_fallback_cache():
    """Clear memory dict before each test so state resets."""
    redis_client._fallback_cache.clear()

def test_health_check_returns_ok():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "user-context"
    # Testing grace-fallback, it will be False on test env usually
    assert "redis_connected" in data

def test_get_context_not_found():
    res = client.get("/users/tenant1/userX/context")
    assert res.status_code == 404

def test_post_context_creates_new():
    payload = {
      "event_id": "1",
      "tenant_id": "tenant1",
      "user_id": "user1",
      "session_id": "sess1",
      "event_type": "ad_error",
      "payload": {"foo": "bar"}
    }
    
    res = client.post("/users/tenant1/user1/context", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["tenant_id"] == "tenant1"
    assert data["user_id"] == "user1"
    assert data["event_count_30d"] == 1
    assert len(data["recent_events"]) == 1
    
    # Retrieve it using GET
    res_get = client.get("/users/tenant1/user1/context")
    assert res_get.status_code == 200
    assert res_get.json()["event_count_30d"] == 1

def test_rolling_window_limits_to_30_events():
    payload = {
      "event_id": "1",
      "tenant_id": "tenant1",
      "user_id": "target",
      "session_id": "sess1",
      "event_type": "spam",
    }
    
    # Insert 32 events
    for i in range(32):
        payload["event_id"] = str(i)
        res = client.post("/users/tenant1/target/context", json=payload)
        assert res.status_code == 200
    
    data = client.get("/users/tenant1/target/context").json()
    assert data["event_count_30d"] == 32
    # But recent events list is strictly bounded to 30.
    assert len(data["recent_events"]) == 30
    assert data["recent_events"][-1]["event_id"] == "31"
