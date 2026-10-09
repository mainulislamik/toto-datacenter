import os
import uuid
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, Depends, HTTPException, status, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from auth import (
    load_db, save_db, verify_password, get_password_hash,
    create_access_token, decode_token
)
from proxmox_client import proxmox_api

app = FastAPI(
    title="Toto Company Datacenter Orchestration API",
    version="1.0.0",
    description="Multi-tenant Private Cloud and Proxmox VE Control Plane Engine"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------------------------------
# Schemas
# ------------------------------------------------------------------------------
class LoginRequest(BaseModel):
    username: str
    password: str

class UserQuota(BaseModel):
    max_vms: int = 5
    max_cores: int = 8
    max_ram_mb: int = 8192
    max_disk_gb: int = 100

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role: str = "user" # super_admin | tenant_admin | user
    company: str = "Toto Datacenter Tenant"
    quota: UserQuota = Field(default_factory=UserQuota)
    allowed_vmids: List[int] = []

class UserUpdate(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None
    company: Optional[str] = None
    password: Optional[str] = None
    quota: Optional[UserQuota] = None
    allowed_vmids: Optional[List[int]] = None

class VMCreateRequest(BaseModel):
    node: str = "pve"
    name: str
    cores: int = 2
    memory: int = 2048 # MB
    disk: int = 20 # GB
    iso: Optional[str] = None # e.g. "local:iso/ubuntu.iso"
    storage: str = "local-lvm"
    ostype: str = "l26" # Linux 2.6/3.x/4.x/5.x/6.x

class VMActionRequest(BaseModel):
    action: str # start, stop, shutdown, reboot, reset

# ------------------------------------------------------------------------------
# Auth Dependency
# ------------------------------------------------------------------------------
async def get_current_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authentication token"
        )
    token = authorization.split(" ")[1]
    payload = decode_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    db = load_db()
    user = next((u for u in db["users"] if u["username"] == payload["sub"]), None)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User no longer exists"
        )
    return user

async def require_super_admin(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    if user.get("role") != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super Admin access required for this operation"
        )
    return user

# ------------------------------------------------------------------------------
# Authentication Endpoints
# ------------------------------------------------------------------------------
@app.post("/api/auth/login")
async def login(req: LoginRequest):
    db = load_db()
    user = next((u for u in db["users"] if u["username"] == req.username), None)
    if not user or not verify_password(req.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    
    token = create_access_token({"sub": user["username"], "role": user["role"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "role": user["role"],
            "company": user.get("company", ""),
            "quota": user.get("quota", {}),
            "allowed_vmids": user.get("allowed_vmids", [])
        }
    }

@app.get("/api/auth/me")
async def get_me(user: Dict[str, Any] = Depends(get_current_user)):
    return {
        "id": user["id"],
        "username": user["username"],
        "email": user["email"],
        "role": user["role"],
        "company": user.get("company", ""),
        "quota": user.get("quota", {}),
        "allowed_vmids": user.get("allowed_vmids", [])
    }

# ------------------------------------------------------------------------------
# Multi-Tenant User & Role Management
# ------------------------------------------------------------------------------
@app.get("/api/users")
async def list_users(admin: Dict[str, Any] = Depends(require_super_admin)):
    db = load_db()
    safe_users = []
    for u in db["users"]:
        safe_users.append({
            "id": u["id"],
            "username": u["username"],
            "email": u["email"],
            "role": u["role"],
            "company": u.get("company", ""),
            "created_at": u.get("created_at", ""),
            "quota": u.get("quota", {}),
            "allowed_vmids": u.get("allowed_vmids", [])
        })
    return safe_users

@app.post("/api/users")
async def create_user(req: UserCreate, admin: Dict[str, Any] = Depends(require_super_admin)):
    db = load_db()
    if any(u["username"] == req.username for u in db["users"]):
        raise HTTPException(status_code=400, detail="Username already exists")
    if any(u["email"] == req.email for u in db["users"]):
        raise HTTPException(status_code=400, detail="Email already exists")
    
    new_user = {
        "id": f"usr_{uuid.uuid4().hex[:8]}",
        "username": req.username,
        "email": req.email,
        "hashed_password": get_password_hash(req.password),
        "role": req.role,
        "company": req.company,
        "created_at": "2026-10-09T00:00:00Z",
        "quota": req.quota.model_dump(),
        "allowed_vmids": req.allowed_vmids
    }
    db["users"].append(new_user)
    save_db(db)
    return {"message": "User created successfully", "user_id": new_user["id"]}

@app.put("/api/users/{user_id}")
async def update_user(user_id: str, req: UserUpdate, admin: Dict[str, Any] = Depends(require_super_admin)):
    db = load_db()
    user = next((u for u in db["users"] if u["id"] == user_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if req.email is not None:
        user["email"] = req.email
    if req.role is not None:
        user["role"] = req.role
    if req.company is not None:
        user["company"] = req.company
    if req.password:
        user["hashed_password"] = get_password_hash(req.password)
    if req.quota is not None:
        user["quota"] = req.quota.model_dump()
    if req.allowed_vmids is not None:
        user["allowed_vmids"] = req.allowed_vmids
    
    save_db(db)
    return {"message": "User updated successfully"}

@app.delete("/api/users/{user_id}")
async def delete_user(user_id: str, admin: Dict[str, Any] = Depends(require_super_admin)):
    db = load_db()
    user = next((u for u in db["users"] if u["id"] == user_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user["role"] == "super_admin" and len([u for u in db["users"] if u["role"] == "super_admin"]) <= 1:
        raise HTTPException(status_code=400, detail="Cannot delete the sole Super Admin")
    
    db["users"] = [u for u in db["users"] if u["id"] != user_id]
    save_db(db)
    return {"message": "User deleted successfully"}

# ------------------------------------------------------------------------------
# Datacenter Core & Hypervisor Orchestration
# ------------------------------------------------------------------------------
@app.get("/api/datacenter/overview")
async def get_overview(user: Dict[str, Any] = Depends(get_current_user)):
    try:
        resources = await proxmox_api.get_cluster_resources()
        nodes = [r for r in resources if r.get("type") == "node"]
        vms = [r for r in resources if r.get("type") == "qemu" or r.get("type") == "lxc"]
        storages = [r for r in resources if r.get("type") == "storage"]

        total_cores = sum(n.get("maxcpu", 0) for n in nodes)
        total_mem = sum(n.get("maxmem", 0) for n in nodes)
        used_mem = sum(n.get("mem", 0) for n in nodes)
        total_disk = sum(s.get("maxdisk", 0) for s in storages)
        used_disk = sum(s.get("disk", 0) for s in storages)

        running_vms = len([v for v in vms if v.get("status") == "running"])
        stopped_vms = len([v for v in vms if v.get("status") == "stopped"])

        return {
            "datacenter_name": "Toto Company Datacenter DC-1",
            "nodes_count": len(nodes),
            "vms_total": len(vms),
            "vms_running": running_vms,
            "vms_stopped": stopped_vms,
            "total_cores": total_cores,
            "memory": {
                "total_bytes": total_mem,
                "used_bytes": used_mem,
                "free_bytes": max(0, total_mem - used_mem),
                "usage_pct": round((used_mem / total_mem * 100) if total_mem else 0, 1)
            },
            "storage": {
                "total_bytes": total_disk,
                "used_bytes": used_disk,
                "free_bytes": max(0, total_disk - used_disk),
                "usage_pct": round((used_disk / total_disk * 100) if total_disk else 0, 1)
            },
            "nodes": nodes
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Hypervisor error: {str(e)}")

@app.get("/api/nodes")
async def get_nodes(user: Dict[str, Any] = Depends(get_current_user)):
    try:
        nodes = await proxmox_api.get_nodes()
        return nodes
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/nodes/{node}/status")
async def get_node_status(node: str, user: Dict[str, Any] = Depends(get_current_user)):
    try:
        status_data = await proxmox_api.get_node_status(node)
        return status_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/vms")
async def list_vms(user: Dict[str, Any] = Depends(get_current_user)):
    try:
        resources = await proxmox_api.get_cluster_resources(resource_type="vm")
        
        # Super Admin sees everything; normal user only sees assigned VM IDs
        if user["role"] == "super_admin":
            return resources
        
        allowed = set(user.get("allowed_vmids", []))
        return [v for v in resources if v.get("vmid") in allowed]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/vms")
async def create_vm(req: VMCreateRequest, user: Dict[str, Any] = Depends(get_current_user)):
    # Quota validation for non-superadmin
    if user["role"] != "super_admin":
        user_quota = user.get("quota", {})
        existing_vms = await list_vms(user)
        if len(existing_vms) >= user_quota.get("max_vms", 5):
            raise HTTPException(status_code=400, detail="VM limit reached for your account quota")
        if req.cores > user_quota.get("max_cores", 4):
            raise HTTPException(status_code=400, detail=f"Max core limit is {user_quota.get('max_cores')} cores")
        if req.memory > user_quota.get("max_ram_mb", 4096):
            raise HTTPException(status_code=400, detail=f"Max RAM limit is {user_quota.get('max_ram_mb')} MB")
        if req.disk > user_quota.get("max_disk_gb", 50):
            raise HTTPException(status_code=400, detail=f"Max Disk limit is {user_quota.get('max_disk_gb')} GB")

    try:
        next_vmid = await proxmox_api.get_next_vmid()
        vm_params: Dict[str, Any] = {
            "vmid": next_vmid,
            "name": req.name,
            "cores": req.cores,
            "sockets": 1,
            "memory": req.memory,
            "ostype": req.ostype,
            "scsihw": "virtio-scsi-pci",
            "scsi0": f"{req.storage}:{req.disk},discard=on",
            "net0": "virtio,bridge=vmbr0,firewall=1"
        }
        if req.iso:
            vm_params["ide2"] = f"{req.iso},media=cdrom"
            vm_params["boot"] = "order=ide2;scsi0"
        else:
            vm_params["boot"] = "order=scsi0"

        res = await proxmox_api.create_vm(req.node, vm_params)

        # Auto-assign newly created VM to user if not super_admin
        if user["role"] != "super_admin":
            db = load_db()
            for u in db["users"]:
                if u["id"] == user["id"]:
                    u.setdefault("allowed_vmids", []).append(next_vmid)
            save_db(db)

        return {"message": "VM creation initiated", "vmid": next_vmid, "task": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create VM: {str(e)}")

@app.post("/api/vms/{node}/{vmid}/action")
async def vm_action(node: str, vmid: int, req: VMActionRequest, user: Dict[str, Any] = Depends(get_current_user)):
    if user["role"] != "super_admin":
        if vmid not in user.get("allowed_vmids", []):
            raise HTTPException(status_code=403, detail="You do not have access to manage this VM")

    try:
        res = await proxmox_api.vm_action(node, vmid, req.action)
        return {"message": f"Action '{req.action}' submitted successfully", "task": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Action failed: {str(e)}")

@app.delete("/api/vms/{node}/{vmid}")
async def delete_vm(node: str, vmid: int, user: Dict[str, Any] = Depends(get_current_user)):
    if user["role"] != "super_admin":
        if vmid not in user.get("allowed_vmids", []):
            raise HTTPException(status_code=403, detail="You do not have access to delete this VM")

    try:
        res = await proxmox_api.delete_vm(node, vmid)
        # remove from user's allowed list
        db = load_db()
        for u in db["users"]:
            if vmid in u.get("allowed_vmids", []):
                u["allowed_vmids"].remove(vmid)
        save_db(db)
        return {"message": "VM deleted successfully", "task": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete VM: {str(e)}")

@app.get("/api/vms/{node}/{vmid}/config")
async def get_vm_config(node: str, vmid: int, user: Dict[str, Any] = Depends(get_current_user)):
    if user["role"] != "super_admin" and vmid not in user.get("allowed_vmids", []):
        raise HTTPException(status_code=403, detail="Access denied")
    try:
        config = await proxmox_api.get_vm_config(node, vmid)
        return config
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/vms/{node}/{vmid}/console")
async def get_vm_console(node: str, vmid: int, user: Dict[str, Any] = Depends(get_current_user)):
    if user["role"] != "super_admin" and vmid not in user.get("allowed_vmids", []):
        raise HTTPException(status_code=403, detail="Access denied")
    try:
        ticket_data = await proxmox_api.get_vnc_proxy(node, vmid)
        return ticket_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/storages")
async def get_storages(node: str = "pve", user: Dict[str, Any] = Depends(get_current_user)):
    try:
        storages = await proxmox_api.get_storages(node)
        return storages
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/isos")
async def get_isos(node: str = "pve", storage: str = "local", user: Dict[str, Any] = Depends(get_current_user)):
    try:
        isos = await proxmox_api.get_iso_images(node, storage)
        return isos
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health():
    return {
        "status": "healthy",
        "service": "Toto Datacenter Engine",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8099)
