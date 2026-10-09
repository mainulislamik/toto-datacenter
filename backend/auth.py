import json
import os
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import bcrypt
import jwt

SECRET_KEY = os.getenv("JWT_SECRET", "toto-datacenter-super-secret-key-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 1 day

DB_FILE = os.path.join(os.path.dirname(__file__), "database.json")

def get_password_hash(password: str) -> str:
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

DEFAULT_DB = {
    "users": [
        {
            "id": "usr_admin",
            "username": "imon",
            "email": "imon@toto-datacenter.local",
            "hashed_password": get_password_hash("ImonAdmin2026!"),
            "role": "super_admin",
            "company": "Toto Company Datacenter",
            "created_at": "2026-10-09T00:00:00Z",
            "quota": {
                "max_vms": 50,
                "max_cores": 64,
                "max_ram_mb": 131072,
                "max_disk_gb": 1024
            },
            "allowed_vmids": []
        },
        {
            "id": "usr_dev",
            "username": "developer1",
            "email": "dev1@toto-datacenter.local",
            "hashed_password": get_password_hash("DevPass2026!"),
            "role": "user",
            "company": "Client Alpha",
            "created_at": "2026-10-09T00:00:00Z",
            "quota": {
                "max_vms": 2,
                "max_cores": 4,
                "max_ram_mb": 4096,
                "max_disk_gb": 50
            },
            "allowed_vmids": [100, 101]
        }
    ]
}

def load_db() -> Dict[str, Any]:
    if not os.path.exists(DB_FILE):
        save_db(DEFAULT_DB)
        return DEFAULT_DB
    with open(DB_FILE, "r") as f:
        try:
            return json.load(f)
        except Exception:
            return DEFAULT_DB

def save_db(data: Dict[str, Any]):
    with open(DB_FILE, "w") as f:
        json.dump(data, f, indent=2)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except Exception:
        return None
