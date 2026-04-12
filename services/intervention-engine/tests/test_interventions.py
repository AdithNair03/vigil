from fastapi.testclient import TestClient
from main import app
import hashlib

client = TestClient(app)

def test_health():
    res = client.get("/health")
    assert res.status_code == 200

def test_rest_select_and_record():
    # Make a non-holdout user hash
    # By default, determine_holdout checks if mod 100 < 10.
    # User 'u10' hash mod 100 might be holdout. Let's force not holdout via trial until valid or just find a safe string.
    user_id = "test_usr"
    for i in range(100):
         h = int(hashlib.sha256(f"usr{i}".encode('utf-8')).hexdigest(), 16)
         if (h % 100) >= 10:
              user_id = f"usr{i}"
              break
    
    req = {
        "event_id": "evt1",
        "context": {
            "tenant_id": "test_t1",
            "user_id": user_id,
            "value_gap_score": 1.2,
            "severity": "critical",
            "churn_probability": 0.9,
            "features": {"f1": 0.5}
        }
    }
    
    r = client.post("/select", json=req)
    assert r.status_code == 200
    data = r.json()
    assert data["intervention_type"] in ["NO_ACTION", "IN_APP_DISCOUNT", "PUSH_NOTIFICATION_GUIDE", "EMAIL_SUPPORT", "SMS_APOLOGY"]
    
    if data["intervention_type"] != "NO_ACTION":
         assert data["is_holdout"] == False
         
         # Now post a reward backwards correctly!
         rec = client.post("/record_outcome", json={
             "intervention_id": data["intervention_id"],
             "tenant_id": "test_t1",
             "user_id": user_id,
             "reward": 1.0
         })
         assert rec.status_code == 200
         assert rec.json()["status"] == "learned"
