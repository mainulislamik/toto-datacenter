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

class LoginRequest(BaseModel):
    username: str
    password: str

class UserCreate(BaseModel):
    username: str
    password: str
    email: Optional[str] = ""
    role: str = "user"
    company: Optional[str] = "Client"
    quota: Optional[UserQuota] = UserQuota()

class UserResponse(BaseModel):
    id: str
    username: str
    email: Optional[str] = ""
    role: str
    company: Optional[str] = ""
    quota: UserQuota
    created_at: str

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
    try:
        with open(DB_FILE, "r") as f:
            return json.load(f)
    except Exception:
        return DEFAULT_DB

def save_db(data: Dict[str, Any]):
    with open(DB_FILE, "w") as f:
        json.dump(data, f, indent=2)

def get_user_by_username(username: str) -> Optional[Dict[str, Any]]:
    db = load_db()
    for u in db.get("users", []):
        if u["username"].lower() == username.lower():
            return u
    return None

def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    db = load_db()
    for u in db.get("users", []):
        if u["id"] == user_id:
            return u
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
    
    # Check if update or insert
    for i, u in enumerate(users):
        if u["id"] == user_dict["id"] or u["username"] == user_dict["username"]:
            users[i].update(user_dict)
            db["users"] = users
            save_db(db)
            return users[i]
            
    users.append(user_dict)
    db["users"] = users
    save_db(db)
    return user_dict

def delete_user_by_id(user_id: str) -> bool:
    db = load_db()
    users = db.get("users", [])
    initial_len = len(users)
    users = [u for u in users if u["id"] != user_id]
    if len(users) < initial_len:
        db["users"] = users
        save_db(db)
        return True
    return False

def delete_user(user_id: str) -> bool:
    return delete_user_by_id(user_id)

def check_user_quota(user: Dict[str, Any], resource_type: str = "vms") -> bool:
    role = user.get("role", "user")
    if role in ["admin", "super_admin"]:
        return True
    quota = user.get("quota", {})
    return True

def authenticate_user(username: str, plain_password: str) -> Optional[Dict[str, Any]]:
    user = get_user_by_username(username)
    if not user:
        return None
    if not verify_password(plain_password, user["hashed_password"]):
        return None
    return user

def create_access_token(user: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
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
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing",
            headers={"WWW-Authenticate": "Bearer"},
        )
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token format",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = parts[1]
    payload = decode_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = get_user_by_username(payload["sub"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found in authentication store",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

async def require_admin(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    if current_user.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation requires Super Administrator privilege level"
        )
    return current_user

async def require_quota(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    return current_user
