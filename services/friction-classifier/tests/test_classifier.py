import pytest
from fastapi.testclient import TestClient

from main import app
from ml_engine import extract_features, classify_event

client = TestClient(app)

def test_health_check_returns_ok():
    assert client.get("/health").status_code == 200

def test_rest_classify_endpoint_spawns_predictions():
    payload = {
        "event": {
            "tenant_id": "test_tnt",
            "user_id": "usr1",
            "session_id": "ss1",
            "event_type": "ad_impression_paid_tier",
            "industry": "streaming"
        },
        "user_context": {
            "tenant_id": "test_tnt",
            "user_id": "usr1",
            "event_count_30d": 50,
            "days_since_signup": 365,
            "recent_events": [
                {"tenant_id": "test_tnt", "user_id": "usr1", "session_id": "ss1", "event_type": "foo"}
            ]
        }
    }
    
    req = client.post("/classify", json=payload)
    assert req.status_code == 200
    resp = req.json()
    assert "score" in resp
    assert resp["score"]["value_gap_score"] >= 0.0 and resp["score"]["value_gap_score"] <= 10.0


def test_feature_engineering_loads_base_industry_weights():
    evt = {"industry": "banking", "event_type": "transfer_declined", "session_id": "baz"}
    ctx = {"recent_events": [{"session_id": "baz"}], "days_since_signup": 100}
    
    ft = extract_features(evt, ctx)
    assert ft["industry_base_weight"] == 0.8
    assert ft["user_tenure_days"] == 100
    assert ft["session_event_count"] == 2  # base + 1 recent


def test_classify_event_maps_correctly():
    evt = {"tenant_id": "my_tenant", "industry": "saas", "event_type": "feature_paywall_hit"}
    ctx = {}
    
    s, req = classify_event(evt, ctx)
    assert s["tenant_id"] == "my_tenant"
    assert "critical" in s["severity"] or "warning" in s["severity"] or "medium" in s["severity"] or "low" in s["severity"]
    assert "industry_base_weight" in s["feature_importance"]
