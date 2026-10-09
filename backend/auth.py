import json
import os
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt

SECRET_KEY = os.getenv("JWT_SECRET", "toto-datacenter-super-secret-key-2026-fixed")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 30 # 30 days

DB_FILE = os.path.join(os.path.dirname(__file__), "database.json")

def hash_password(password: str) -> str:
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
            "password_hash": hash_password("ImonAdmin2026!"),
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
            "password_hash": hash_password("DevPassword123!"),
            "role": "user",
            "company": "Client Alpha",
            "created_at": "2026-10-09T00:00:00Z",
            "quota": {
                "max_vms": 3,
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

def get_all_users() -> List[Dict[str, Any]]:
    db = load_db()
    return db.get("users", [])

def get_user_by_username(username: str) -> Optional[Dict[str, Any]]:
    users = get_all_users()
    for u in users:
        if u.get("username") == username:
            return u
    return None

def authenticate_user(username: str, password: str) -> Optional[Dict[str, Any]]:
    user = get_user_by_username(username)
    if not user:
        return None
    pwd_hash = user.get("password_hash") or user.get("hashed_password")
    if pwd_hash and verify_password(password, pwd_hash):
        return user
    return None

def save_user(user_dict: Dict[str, Any]):
    db = load_db()
    users = db.get("users", [])
    for i, u in enumerate(users):
        if u.get("id") == user_dict.get("id") or u.get("username") == user_dict.get("username"):
            users[i] = user_dict
            db["users"] = users
            save_db(db)
            return
    users.append(user_dict)
    db["users"] = users
    save_db(db)

def delete_user_by_id(user_id: str) -> bool:
    db = load_db()
    users = db.get("users", [])
    new_users = [u for u in users if u.get("id") != user_id and u.get("username") != "imon"]
    if len(new_users) < len(users):
        db["users"] = new_users
        save_db(db)
        return True
    return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except Exception as e:
        return None
