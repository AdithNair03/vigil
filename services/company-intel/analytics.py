import logging

logger = logging.getLogger("vigil.intel.analytics")

# Mock Clickhouse in-memory tables
_mock_olap = {
    "tenant_metrics": {
         "t1": {"health_score": 8.5}
    },
    "friction_events": [
         {"tenant_id": "t1", "timestamp": "2024-05-15T10:00:00Z", "score": 6.0},
         {"tenant_id": "t1", "timestamp": "2024-05-15T11:00:00Z", "score": 7.5}
    ],
    "interventions": [
         {"tenant_id": "t1", "type": "IN_APP_DISCOUNT", "success": True, "value": 150.0},
         {"tenant_id": "t1", "type": "EMAIL_SUPPORT", "success": False, "value": 0.0}
    ],
    "issues": [
         {"tenant_id": "t1", "category": "monetization", "severity": "high", "users": 42}
    ]
}

def get_dashboard_metrics(tenant_id: str) -> dict:
    """Mock ClickHouse Query mapping aggregating time-series OLAP."""
    
    health = _mock_olap["tenant_metrics"].get(tenant_id, {"health_score": 10.0})["health_score"]
    
    trends = []
    # aggregate simple
    for fe in _mock_olap["friction_events"]:
         if fe["tenant_id"] == tenant_id:
              trends.append({
                  "timestamp": fe["timestamp"],
                  "avg_score": fe["score"],
                  "total_events": 1
              })
              
    rois = []
    for intv in _mock_olap["interventions"]:
         if intv["tenant_id"] == tenant_id:
             rois.append({
                 "intervention_type": intv["type"],
                 "success_rate": 1.0 if intv["success"] else 0.0,
                 "estimated_arr_saved": intv["value"]
             })
             
    issues = []
    for iss in _mock_olap["issues"]:
         if iss["tenant_id"] == tenant_id:
             issues.append({
                 "category": iss["category"],
                 "severity": iss["severity"],
                 "affected_users": iss["users"]
             })

    outcomes = [
        {"type": "Discount Pulse", "fired": 240, "success": 82, "riskBefore": 88, "riskAfter": 22, "revenue": 12400.0},
        {"type": "Feature Unlock", "fired": 110, "success": 65, "riskBefore": 72, "riskAfter": 35, "revenue": 8200.0},
        {"type": "Onboarding Help", "fired": 450, "success": 91, "riskBefore": 45, "riskAfter": 12, "revenue": 21000.0},
        {"type": "Price Lock", "fired": 85, "success": 74, "riskBefore": 94, "riskAfter": 42, "revenue": 15500.0}
    ]

    return {
         "tenant_id": tenant_id,
         "health_score": health,
         "trends": trends,
         "roi": rois,
         "top_issues": issues,
         "outcomes": outcomes
    }

def generate_weekly_report(tenant_id: str) -> dict:
    """Mocks calling Claude API asynchronously."""
    return {
        "tenant_id": tenant_id,
        "summary_text": "Overall friction diminished by 15% this week. Interventions saved an estimated $150 ARR.",
        "key_findings": [
             "Monetization barriers are triggering critical churn friction.",
             "In-App Discounts successfully rescued 100% of exposed critical users."
        ]
    }
