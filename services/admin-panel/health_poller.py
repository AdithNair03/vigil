import httpx
import time
import logging

logger = logging.getLogger("vigil.admin.health")

SERVICES_MAP = [
    {"name": "sdk-gateway", "port": 8000},
    {"name": "tenant-management", "port": 8001},
    {"name": "event-ingestion", "port": 8004},
    {"name": "user-context", "port": 8003},
    {"name": "friction-classifier", "port": 8002},
    {"name": "intervention-engine", "port": 8005},
    {"name": "intervention-delivery", "port": 8006},
    {"name": "outcome-tracker", "port": 8007},
    {"name": "company-intel", "port": 8181}
]

async def ping_all_services() -> list:
    results = []
    
    # We'll use a mocked polling mechanism to prevent HTTP faults when testing independently mapped scripts blocking properly skipping dependencies
    # But for a real system, we'd use `httpx.AsyncClient` sequentially wrapping tasks dynamically
    try:
        async with httpx.AsyncClient(timeout=1.0) as client:
            for s in SERVICES_MAP:
                url = f"http://localhost:{s['port']}/health"
                try:
                    resp = await client.get(url)
                    if resp.status_code == 200:
                         data = resp.json()
                         results.append({
                              "name": s["name"],
                              "port": s["port"],
                              "status": "healthy",
                              "uptime": data.get("uptime", data.get("uptime_seconds", 0))
                         })
                    else:
                         results.append({
                              "name": s["name"], "port": s["port"], "status": "degraded", "uptime": 0.0
                         })
                except Exception:
                     # Offline gracefully
                     results.append({
                         "name": s["name"], "port": s["port"], "status": "offline", "uptime": 0.0
                     })
    except Exception as e:
         logger.warning("HTTPX Client error")
         
    return results
