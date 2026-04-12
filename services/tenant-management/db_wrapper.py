import json
import os
from typing import Optional, List
import secrets
import string
import hashlib
import time

from config import settings

_db_path = settings.db_json_path

def _load_db():
    if not os.path.exists(_db_path):
        return {"tenants": {}, "sdk_keys": {}, "billing": []}
    with open(_db_path, "r") as f:
        return json.load(f)

def _save_db(data):
    with open(_db_path, "w") as f:
        json.dump(data, f, indent=2)

def generate_sdk_key() -> str:
    """Generate unique SDK key format: vk_live_ + 16 random chars."""
    rand = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(16))
    return f"vk_live_{rand}"

def hash_key(key: str) -> str:
    return hashlib.sha256(key.encode('utf-8')).hexdigest()

def create_tenant_record(data: dict) -> dict:
    db = _load_db()
    t_id = f"tnt_{int(time.time())}"
    key = generate_sdk_key()
    hashed = hash_key(key)
    
    tenant_obj = {
        "tenant_id": t_id,
        "company_name": data.get("company_name"),
        "your_name": data.get("your_name"),
        "email": data.get("email"),
        "password": data.get("password"), # Mock auth
        "industry": data.get("industry"),
        "company_size": data.get("company_size"),
        "status": "active",
        "registered_at": time.strftime("%Y-%m-%d %H:%M:%S")
    }
    
    db["tenants"][t_id] = tenant_obj
    db["sdk_keys"][hashed] = t_id
    _save_db(db)
    
    # Return with raw key once
    tenant_obj["sdk_key"] = key
    return tenant_obj

def validate_key(key: str) -> tuple[bool, str, str]:
    db = _load_db()
    h = hash_key(key)
    if h in db["sdk_keys"]:
        t_id = db["sdk_keys"][h]
        t = db["tenants"].get(t_id)
        if t and t["status"] == "active":
             return True, t_id, "growth"
    return False, "", ""

def get_tenant_by_id(tenant_id: str) -> Optional[dict]:
    db = _load_db()
    return db["tenants"].get(tenant_id)

def list_all_tenants() -> List[dict]:
    db = _load_db()
    return list(db["tenants"].values())

def update_tenant_status(tenant_id: str, status: str):
    db = _load_db()
    if tenant_id in db["tenants"]:
        db["tenants"][tenant_id]["status"] = status
        _save_db(db)
        return True
    return False
