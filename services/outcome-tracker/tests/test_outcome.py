import pytest
from fastapi.testclient import TestClient
from main import app
import reward_computer

client = TestClient(app)

@pytest.fixture(autouse=True)
def clear_db():
    reward_computer._mock_db["outcomes"].clear()

def test_health():
    assert client.get("/health").status_code == 200

def test_reward_mapping_correctness():
    assert reward_computer.compute_reward("converted") == 1.0
    assert reward_computer.compute_reward("dismissed") == -0.3

def test_recording_route_propagates_reward():
    payload = {
        "tenant_id": "test", "user_id": "u", "intervention_id": "inv1", "event_type": "clicked"
    }
    r = client.post("/test/record", json=payload)
    assert r.status_code == 200
    assert r.json()["reward"] == 0.5
    
    s = client.get("/stats")
    assert s.json()["total_group"] == 1
    assert s.json()["converted"] == 0
    
    # add converted
    payload["event_type"] = "converted"
    client.post("/test/record", json=payload)
    
    s2 = client.get("/stats")
    assert s2.json()["total_group"] == 2
    assert s2.json()["converted"] == 1
    assert s2.json()["conversion_rate"] == 0.5
