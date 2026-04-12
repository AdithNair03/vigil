import pytest
from fastapi.testclient import TestClient

from main import app
import kafka_worker

client = TestClient(app)

def test_health_check_returns_ok():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["service"] == "event-ingestion"


def test_valid_event_passes_validation():
    payload = {
        "event_id": "123",
        "tenant_id": "t1",
        "user_id": "u1",
        "session_id": "s1",
        "event_type": "ad_load_fail",
        "industry": "streaming",
        "timestamp": "2024-05-10T12:00:00Z"
    }

    res = client.post("/test/ingest", json=payload)
    assert res.status_code == 200
    assert res.json()["status"] == "validated"


def test_invalid_event_routed_to_dlq():
    payload = {
        "tenant_id": "t1",  # missing user_id and session_id
        "industry": "bad_enum" # fails Pydantic enum validation
    }
    
    res = client.post("/test/ingest", json=payload)
    assert res.status_code == 422
    assert res.json()["queue"] == "dlq"

    
@pytest.mark.asyncio
async def test_process_raw_event_direct_call():
    """Test directly invoking the async service function."""
    valid_payload = {
        "event_id": "abc",
        "tenant_id": "test_tenant",
        "user_id": "usr_99",
        "session_id": "sess_88",
        "event_type": "app_crash"
    }
    
    result = await kafka_worker.process_raw_event(valid_payload)
    assert result == "validated"
