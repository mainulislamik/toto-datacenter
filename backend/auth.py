import json
import os
import uuid
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from pydantic import BaseModel
from fastapi import Header, HTTPException, status, Depends

SECRET_KEY = os.getenv("JWT_SECRET", "toto-datacenter-super-secret-key-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 1 day

DB_FILE = os.path.join(os.path.dirname(__file__), "database.json")

class UserQuota(BaseModel):
    max_vms: int = 2
    max_cores: int = 4
    max_ram_mb: int = 4096
    max_disk_gb: int = 50

class UserCreate(BaseModel):
    username: str
    password: str
    email: Optional[str] = ""
    role: str = "user"
    company: Optional[str] = "Client"
    quota: Optional[UserQuota] = UserQuota()

class User(BaseModel):
    id: str
    username: str
    email: Optional[str] = ""
    role: str
    company: Optional[str] = ""
    quota: UserQuota
    created_at: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    username: str
    user_id: str

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
            "hashed_password": hash_password("ImonAdmin2026!"),
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
            "hashed_password": hash_password("DevPassword123!"),
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

def get_user_by_username(username: str) -> Optional[Dict[str, Any]]:
    db = load_db()
    for user in db.get("users", []):
        if user.get("username") == username:
            return user
    return None

def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    db = load_db()
    for user in db.get("users", []):
        if user.get("id") == user_id:
            return user
    return None

def get_all_users() -> List[Dict[str, Any]]:
    db = load_db()
    return db.get("users", [])

def save_user(user_dict: Dict[str, Any]) -> Dict[str, Any]:
    db = load_db()
    users = db.get("users", [])
    if "id" not in user_dict:
        user_dict["id"] = f"usr_{uuid.uuid4().hex[:8]}"
    if "created_at" not in user_dict:
        user_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    if "password" in user_dict:
        user_dict["hashed_password"] = hash_password(user_dict.pop("password"))
    
    for idx, u in enumerate(users):
        if u.get("id") == user_dict.get("id") or u.get("username") == user_dict.get("username"):
            users[idx] = user_dict
            db["users"] = users
            save_db(db)
            return user_dict
    users.append(user_dict)
    db["users"] = users
    save_db(db)
    return user_dict

def delete_user_by_id(user_id: str) -> bool:
    db = load_db()
    users = db.get("users", [])
    initial_len = len(users)
    users = [u for u in users if u.get("id") != user_id]
    if len(users) < initial_len:
        db["users"] = users
        save_db(db)
        return True
    return False

def authenticate_user(username: str, plain_password: str) -> Optional[Dict[str, Any]]:
    user = get_user_by_username(username)
    if not user:
        return None
    if not verify_password(plain_password, user.get("hashed_password", "")):
        return None
    return user

def create_access_token(user: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    now_utc = datetime.now(timezone.utc)
    expire = now_utc + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    payload = {
        "sub": user["username"],
        "user_id": user["id"],
        "role": user["role"],
        "exp": expire
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except Exception:
        return None

async def get_current_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authentication header",
            headers={"WWW-Authenticate": "Bearer"}
        )
    token = authorization.split(" ")[1]
    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"}
        )
    user = get_user_by_username(payload.get("sub", ""))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    return user

async def require_admin(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    if current_user.get("role") != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super Administrator access required"
        )
    return current_user

async def require_quota(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    return current_user
