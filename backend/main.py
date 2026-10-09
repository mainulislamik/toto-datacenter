import os
import uuid
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, Depends, HTTPException, status, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn

from auth import (
    authenticate_user, 
    create_access_token, 
    decode_token, 
    get_user_by_username, 
    get_all_users, 
    save_user, 
    delete_user_by_id,
    hash_password
)
from proxmox_client import proxmox_client

app = FastAPI(
    title="Toto Company Datacenter Orchestration Engine",
    version="2.0.0",
    description="Enterprise Cloud Hypervisor REST API & Multi-Tenant Control Engine"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------------------------------
# Pydantic Schemas
# ------------------------------------------------------------------------------
class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class QuotaSchema(BaseModel):
    max_vms: int = 5
    max_cores: int = 8
    max_ram_mb: int = 8192
    max_disk_gb: int = 100

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role: str = "user"
    company: str = "Client Organization"
    quota: QuotaSchema = Field(default_factory=QuotaSchema)

class VMCreateRequest(BaseModel):
    vmid: int
    name: str
    cores: int = 2
    memory: int = 2048
    disk_gb: int = 20
    iso: Optional[str] = None
    storage: str = "local-lvm"
    node: str = "pve"

class LXCCreateRequest(BaseModel):
    vmid: int
    hostname: str
    cores: int = 1
    memory: int = 512
    disk_gb: int = 8
    template: str
    password: str = "TotoLXC2026!"
    storage: str = "local-lvm"
    unprivileged: int = 1
    node: str = "pve"

class SnapshotCreateRequest(BaseModel):
    snapname: str
    description: str = ""
    vmstate: bool = True
    is_lxc: bool = False

class MarketplaceDeployRequest(BaseModel):
    app_id: str
    hostname: str
    cores: int = 2
    memory: int = 2048
    disk_gb: int = 15
    password: str = "TotoAdmin2026!"
    node: str = "pve"

class ISODownloadRequest(BaseModel):
    url: str
    filename: Optional[str] = None
    node: str = "pve"
    storage: str = "local"

# ------------------------------------------------------------------------------
# Auth Dependency
# ------------------------------------------------------------------------------
async def get_current_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or malformed Authorization header"
        )
    token = authorization.split(" ")[1]
    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    username = payload.get("sub")
    user = get_user_by_username(username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    return user

async def require_super_admin(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    if current_user.get("role") != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super Admin access required for this operation"
        )
    return current_user

# ------------------------------------------------------------------------------
# Marketplace Catalog
# ------------------------------------------------------------------------------
MARKETPLACE_APPS = [
    {
        "id": "docker-host",
        "name": "Docker & Docker Compose Host",
        "category": "DevOps / Containers",
        "description": "Pre-configured Linux container with Docker CE, Docker Compose v2, and Container CLI tools ready.",
        "icon": "container",
        "default_cores": 2,
        "default_ram_mb": 2048,
        "default_disk_gb": 15,
        "template": "local:vztmpl/debian-12-standard_12.12-1_amd64.tar.zst",
        "badge": "POPULAR"
    },
    {
        "id": "nginx-nodejs",
        "name": "Node.js 22 & Nginx Production",
        "category": "Web Hosting",
        "description": "High-performance Nginx Reverse Proxy + Node.js LTS runtime with PM2 process manager pre-installed.",
        "icon": "globe",
        "default_cores": 2,
        "default_ram_mb": 1024,
        "default_disk_gb": 10,
        "template": "local:vztmpl/debian-12-standard_12.12-1_amd64.tar.zst",
        "badge": "FAST"
    },
    {
        "id": "postgresql-16",
        "name": "PostgreSQL 16 Managed Database",
        "category": "Databases",
        "description": "Production tuned PostgreSQL 16 database server with automatic tuning, connection pooling, and remote access.",
        "icon": "database",
        "default_cores": 2,
        "default_ram_mb": 2048,
        "default_disk_gb": 20,
        "template": "local:vztmpl/debian-12-standard_12.12-1_amd64.tar.zst",
        "badge": "ENTERPRISE"
    },
    {
        "id": "redis-cache",
        "name": "Redis 7 In-Memory Micro-Cache",
        "category": "Databases",
        "description": "Ultra-lightweight Alpine Linux micro-container running Redis in-memory cache (<30MB RAM footprint).",
        "icon": "zap",
        "default_cores": 1,
        "default_ram_mb": 512,
        "default_disk_gb": 5,
        "template": "local:vztmpl/alpine-3.22-default_20250617_amd64.tar.xz",
        "badge": "LIGHTWEIGHT"
    },
    {
        "id": "python-fastapi",
        "name": "Python 3.12 FastAPI Microservice",
        "category": "Backend API",
        "description": "FastAPI ASGI backend stack with Uvicorn, Pydantic v2, Gunicorn, and Git deployment workflow.",
        "icon": "code",
        "default_cores": 1,
        "default_ram_mb": 1024,
        "default_disk_gb": 10,
        "template": "local:vztmpl/debian-12-standard_12.12-1_amd64.tar.zst",
        "badge": "API READY"
    }
]

# ------------------------------------------------------------------------------
# API Endpoints
# ------------------------------------------------------------------------------
@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "Toto Datacenter Engine",
        "version": "2.0.0",
        "enterprise_tier": "ACTIVE"
    }

@app.post("/api/auth/login", response_model=TokenResponse)
async def login(req: LoginRequest):
    user = authenticate_user(req.username, req.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    token = create_access_token({"sub": user["username"], "role": user["role"]})
    safe_user = {k: v for k, v in user.items() if k != "password_hash"}
    return {"access_token": token, "user": safe_user}

@app.get("/api/auth/me")
async def get_me(current_user: Dict[str, Any] = Depends(get_current_user)):
    return {k: v for k, v in current_user.items() if k != "password_hash"}

# Datacenter Telemetry & Overview
@app.get("/api/datacenter/overview")
async def get_datacenter_overview(current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        nodes = await proxmox_client.get_nodes()
        vms = await proxmox_client.get_vms("pve")
        lxcs = await proxmox_client.get_lxcs("pve")
        storage_list = await proxmox_client.get_storage_list("pve")

        pve_node = nodes[0] if nodes else {}
        total_cores = sum(n.get("maxcpu", 0) for n in nodes)
        total_mem = sum(n.get("maxmem", 0) for n in nodes)
        used_mem = sum(n.get("mem", 0) for n in nodes)
        total_disk = sum(n.get("maxdisk", 0) for n in nodes)
        used_disk = sum(n.get("disk", 0) for n in nodes)

        return {
            "datacenter_name": "Toto Company Datacenter DC-1",
            "tier": "Enterprise Private Cloud",
            "nodes_count": len(nodes),
            "nodes": nodes,
            "vms_total": len(vms),
            "vms_running": len([v for v in vms if v.get("status") == "running"]),
            "lxcs_total": len(lxcs),
            "lxcs_running": len([l for l in lxcs if l.get("status") == "running"]),
            "total_cores": total_cores,
            "memory": {
                "total_bytes": total_mem,
                "used_bytes": used_mem,
                "usage_pct": round((used_mem / total_mem * 100), 1) if total_mem > 0 else 0
            },
            "storage": {
                "total_bytes": total_disk,
                "used_bytes": used_disk,
                "usage_pct": round((used_disk / total_disk * 100), 1) if total_disk > 0 else 0
            },
            "storage_pools": storage_list
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/telemetry/rrd")
async def get_rrd_telemetry(timeframe: str = "hour", current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        return await proxmox_client.get_rrd_data("pve", timeframe=timeframe)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Virtual Machines (KVM)
@app.get("/api/vms")
async def list_vms(current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        all_vms = await proxmox_client.get_vms("pve")
        if current_user.get("role") == "super_admin":
            return all_vms
        allowed = current_user.get("allowed_vmids", [])
        return [vm for vm in all_vms if vm.get("vmid") in allowed]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/vms/create")
async def create_vm(req: VMCreateRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        # Check Quota if not super admin
        if current_user.get("role") != "super_admin":
            quota = current_user.get("quota", {})
            user_vms = current_user.get("allowed_vmids", [])
            if len(user_vms) >= quota.get("max_vms", 5):
                raise HTTPException(status_code=400, detail="VM creation limit exceeded for your tenant quota.")
            if req.cores > quota.get("max_cores", 8):
                raise HTTPException(status_code=400, detail="vCPU request exceeds maximum tenant quota.")
            if req.memory > quota.get("max_ram_mb", 8192):
                raise HTTPException(status_code=400, detail="RAM request exceeds maximum tenant quota.")

        task_id = await proxmox_client.create_vm(
            node=req.node,
            vmid=req.vmid,
            name=req.name,
            cores=req.cores,
            memory=req.memory,
            disk_gb=req.disk_gb,
            iso=req.iso,
            storage=req.storage
        )

        if current_user.get("role") != "super_admin":
            current_user.setdefault("allowed_vmids", []).append(req.vmid)
            save_user(current_user)

        return {"status": "provisioning", "vmid": req.vmid, "task": task_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/vms/{vmid}/action")
async def vm_action(vmid: int, action: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    if current_user.get("role") != "super_admin" and vmid not in current_user.get("allowed_vmids", []):
        raise HTTPException(status_code=403, detail="Access denied to this VM instance.")
    try:
        res = await proxmox_client.vm_action("pve", vmid, action)
        return {"status": "ok", "action": action, "task": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/vms/{vmid}")
async def delete_vm(vmid: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    if current_user.get("role") != "super_admin" and vmid not in current_user.get("allowed_vmids", []):
        raise HTTPException(status_code=403, detail="Access denied to this VM instance.")
    try:
        res = await proxmox_client.delete_vm("pve", vmid)
        if vmid in current_user.get("allowed_vmids", []):
            current_user["allowed_vmids"].remove(vmid)
            save_user(current_user)
        return {"status": "deleted", "vmid": vmid, "task": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# LXC Micro-Containers
@app.get("/api/lxc")
async def list_lxcs(current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        all_lxcs = await proxmox_client.get_lxcs("pve")
        if current_user.get("role") == "super_admin":
            return all_lxcs
        allowed = current_user.get("allowed_vmids", [])
        return [l for l in all_lxcs if l.get("vmid") in allowed]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/lxc/templates")
async def list_lxc_templates(current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        return await proxmox_client.get_lxc_templates("pve", storage="local")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/lxc/create")
async def create_lxc(req: LXCCreateRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        task_id = await proxmox_client.create_lxc(
            node=req.node,
            vmid=req.vmid,
            hostname=req.hostname,
            cores=req.cores,
            memory=req.memory,
            disk_gb=req.disk_gb,
            template=req.template,
            password=req.password,
            storage=req.storage,
            unprivileged=req.unprivileged
        )
        if current_user.get("role") != "super_admin":
            current_user.setdefault("allowed_vmids", []).append(req.vmid)
            save_user(current_user)
        return {"status": "provisioning", "vmid": req.vmid, "task": task_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/lxc/{vmid}/action")
async def lxc_action(vmid: int, action: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        res = await proxmox_client.lxc_action("pve", vmid, action)
        return {"status": "ok", "action": action, "task": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/lxc/{vmid}")
async def delete_lxc(vmid: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        res = await proxmox_client.delete_lxc("pve", vmid)
        return {"status": "deleted", "vmid": vmid, "task": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Snapshots (Live KVM & LXC)
@app.get("/api/snapshots/{vmid}")
async def list_snapshots(vmid: int, is_lxc: bool = False, current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        return await proxmox_client.get_snapshots("pve", vmid, is_lxc=is_lxc)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/snapshots/{vmid}")
async def create_snapshot(vmid: int, req: SnapshotCreateRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        res = await proxmox_client.create_snapshot(
            node="pve",
            vmid=vmid,
            snapname=req.snapname,
            description=req.description,
            vmstate=req.vmstate,
            is_lxc=req.is_lxc
        )
        return {"status": "snapshot_created", "task": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/snapshots/{vmid}/rollback/{snapname}")
async def rollback_snapshot(vmid: int, snapname: str, is_lxc: bool = False, current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        res = await proxmox_client.rollback_snapshot("pve", vmid, snapname, is_lxc=is_lxc)
        return {"status": "rollback_completed", "task": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/snapshots/{vmid}/{snapname}")
async def delete_snapshot(vmid: int, snapname: str, is_lxc: bool = False, current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        res = await proxmox_client.delete_snapshot("pve", vmid, snapname, is_lxc=is_lxc)
        return {"status": "snapshot_deleted", "task": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# App Marketplace
@app.get("/api/marketplace/apps")
async def get_marketplace_apps(current_user: Dict[str, Any] = Depends(get_current_user)):
    return MARKETPLACE_APPS

@app.post("/api/marketplace/deploy")
async def deploy_marketplace_app(req: MarketplaceDeployRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    app_meta = next((a for a in MARKETPLACE_APPS if a["id"] == req.app_id), None)
    if not app_meta:
        raise HTTPException(status_code=404, detail="Marketplace application template not found.")

    try:
        # Find next available VMID (>= 200)
        lxcs = await proxmox_client.get_lxcs("pve")
        vms = await proxmox_client.get_vms("pve")
        used_ids = {item["vmid"] for item in (lxcs + vms)}
        vmid = 200
        while vmid in used_ids:
            vmid += 1

        task_id = await proxmox_client.create_lxc(
            node=req.node,
            vmid=vmid,
            hostname=req.hostname or f"{req.app_id}-node",
            cores=req.cores or app_meta["default_cores"],
            memory=req.memory or app_meta["default_ram_mb"],
            disk_gb=req.disk_gb or app_meta["default_disk_gb"],
            template=app_meta["template"],
            password=req.password,
            storage="local-lvm"
        )
        return {
            "status": "deployed",
            "app": app_meta["name"],
            "vmid": vmid,
            "task": task_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# VNC Console
@app.get("/api/vms/{vmid}/console")
async def get_vm_console(vmid: int, is_lxc: bool = False, current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        return await proxmox_client.get_vnc_ticket("pve", vmid, is_lxc=is_lxc)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Storage & ISO
@app.get("/api/storage/isos")
async def list_isos(current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        return await proxmox_client.get_isos("pve", "local")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/storage/upload-url")
async def upload_iso_url(req: ISODownloadRequest, current_user: Dict[str, Any] = Depends(require_super_admin)):
    try:
        filename = req.filename or req.url.split("/")[-1] or "custom-os.iso"
        if not filename.endswith(".iso") and not filename.endswith(".img"):
            filename += ".iso"
        task_id = await proxmox_client.download_iso_from_url(req.node, req.storage, req.url, filename)
        return {"status": "download_started", "filename": filename, "task": task_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# User Management (Super Admin)
@app.get("/api/users")
async def get_users(current_user: Dict[str, Any] = Depends(require_super_admin)):
    users = get_all_users()
    return [{k: v for k, v in u.items() if k != "password_hash"} for u in users]

@app.post("/api/users")
async def create_user(user_in: UserCreate, current_user: Dict[str, Any] = Depends(require_super_admin)):
    existing = get_user_by_username(user_in.username)
    if existing:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    new_user = {
        "id": f"usr_{uuid.uuid4().hex[:8]}",
        "username": user_in.username,
        "email": user_in.email,
        "role": user_in.role,
        "company": user_in.company,
        "quota": user_in.quota.model_dump(),
        "allowed_vmids": [],
        "password_hash": hash_password(user_in.password),
        "created_at": "2026-10-10T00:00:00Z"
    }
    save_user(new_user)
    return {k: v for k, v in new_user.items() if k != "password_hash"}

@app.delete("/api/users/{user_id}")
async def delete_user(user_id: str, current_user: Dict[str, Any] = Depends(require_super_admin)):
    success = delete_user_by_id(user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found or cannot be deleted")
    return {"status": "user_deleted", "id": user_id}

@app.get("/api/system/git-status")
async def get_git_status(current_user: Dict[str, Any] = Depends(get_current_user)):
    return {
        "git_repo": "mainulislamik/toto-datacenter",
        "branch": "main",
        "last_commit": "6033720",
        "sync_status": "UP_TO_DATE",
        "iso_builder": {
            "answer_file": "iso-builder/answer.toml",
            "firstboot_script": "iso-builder/firstboot.sh",
            "iso_target": "toto-datacenter-v1.0.iso"
        }
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8099, reload=False)
