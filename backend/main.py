import os
import uuid
import asyncio
import subprocess
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, Depends, HTTPException, status, Header, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from auth import (
    get_user_by_username,
    authenticate_user,
    create_access_token,
    decode_token,
    get_all_users,
    save_user,
    delete_user_by_id,
    hash_password,
    UserQuota
)
from proxmox_client import proxmox_client
from iso_analyzer import analyze_iso, parse_iso_header_bytes

app = FastAPI(
    title="Toto Datacenter API Engine",
    version="2.0.0",
    description="Enterprise REST API for Toto Company Datacenter with Intelligent ISO Classifier and Multi-Tenancy"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency: Get Current Authenticated User
async def get_current_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required"
        )
    token = authorization.split(" ")[1]
    payload = decode_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    user = get_user_by_username(payload["sub"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User no longer exists"
        )
    return user

async def require_admin(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    if current_user.get("role") != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super Admin access required for this operation"
        )
    return current_user

# ==============================================================================
# 1. Health & Datacenter Overview
# ==============================================================================

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "Toto Datacenter Engine",
        "version": "2.0.0",
        "enterprise_tier": "ACTIVE",
        "ai_iso_classifier": "ENABLED"
    }

@app.get("/api/datacenter/overview")
async def get_overview(current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        nodes = await proxmox_client.get_nodes()
        vms = await proxmox_client.get_vms("pve")
        lxcs = await proxmox_client.get_lxcs("pve")
        storage_pools = await proxmox_client.get_storage_status("pve")
        
        # Filter for non-admin users
        if current_user.get("role") != "super_admin":
            allowed = set(current_user.get("allowed_vmids", []))
            vms = [v for v in vms if v.get("vmid") in allowed]
            lxcs = [c for c in lxcs if c.get("vmid") in allowed]

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
            "vms_running": sum(1 for v in vms if v.get("status") == "running"),
            "lxcs_total": len(lxcs),
            "lxcs_running": sum(1 for c in lxcs if c.get("status") == "running"),
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
            "storage_pools": storage_pools
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==============================================================================
# 2. Authentication & User Management
# ==============================================================================

class LoginRequest(BaseModel):
    username: str
    password: str

@app.post("/api/auth/login")
async def login(req: LoginRequest):
    user = authenticate_user(req.username, req.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    access_token = create_access_token(data={
        "sub": user["username"],
        "role": user["role"],
        "id": user["id"]
    })
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "username": user["username"],
            "role": user["role"],
            "company": user.get("company", ""),
            "quota": user.get("quota", {})
        }
    }

@app.get("/api/users")
async def list_users(admin_user: Dict[str, Any] = Depends(require_admin)):
    users = get_all_users()
    sanitized = []
    for u in users:
        u_copy = u.copy()
        u_copy.pop("hashed_password", None)
        sanitized.append(u_copy)
    return sanitized

class CreateUserRequest(BaseModel):
    username: str
    email: str
    password: str
    role: str = "user"
    company: str = ""
    quota: UserQuota

@app.post("/api/users")
async def create_user(req: CreateUserRequest, admin_user: Dict[str, Any] = Depends(require_admin)):
    existing = get_user_by_username(req.username)
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    new_user = {
        "id": f"usr_{uuid.uuid4().hex[:8]}",
        "username": req.username,
        "email": req.email,
        "hashed_password": hash_password(req.password),
        "role": req.role,
        "company": req.company,
        "created_at": "2026-10-10T00:00:00Z",
        "quota": req.quota.model_dump(),
        "allowed_vmids": []
    }
    save_user(new_user)
    new_user.pop("hashed_password", None)
    return new_user

@app.delete("/api/users/{user_id}")
async def delete_user(user_id: str, admin_user: Dict[str, Any] = Depends(require_admin)):
    if delete_user_by_id(user_id):
        return {"status": "deleted", "id": user_id}
    raise HTTPException(status_code=404, detail="User not found")

# ==============================================================================
# 3. KVM Virtual Machines Management
# ==============================================================================

@app.get("/api/vms")
async def list_vms(current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        vms = await proxmox_client.get_vms("pve")
        if current_user.get("role") != "super_admin":
            allowed = set(current_user.get("allowed_vmids", []))
            vms = [v for v in vms if v.get("vmid") in allowed]
        return vms
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class CreateVMRequest(BaseModel):
    name: str
    cores: int = 2
    memory: int = 2048
    disk_gb: int = 20
    iso: Optional[str] = None
    ostype: str = "l26"
    vmid: Optional[int] = None

@app.post("/api/vms")
async def create_vm(req: CreateVMRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        quota = current_user.get("quota", {})
        if current_user.get("role") != "super_admin":
            existing_vms = await proxmox_client.get_vms("pve")
            user_vms = [v for v in existing_vms if v.get("vmid") in current_user.get("allowed_vmids", [])]
            if len(user_vms) >= quota.get("max_vms", 2):
                raise HTTPException(status_code=400, detail="VM limit exceeded for your quota")
            if req.cores > quota.get("max_cores", 4):
                raise HTTPException(status_code=400, detail="Requested vCPU cores exceed your quota")
            if req.memory > quota.get("max_ram_mb", 4096):
                raise HTTPException(status_code=400, detail="Requested RAM exceeds your quota")

        vmid = req.vmid or await proxmox_client.get_next_vmid()
        res = await proxmox_client.create_vm(
            node="pve",
            vmid=vmid,
            name=req.name,
            cores=req.cores,
            memory=req.memory,
            disk_gb=req.disk_gb,
            iso=req.iso,
            ostype=req.ostype
        )
        if current_user.get("role") != "super_admin":
            current_user.setdefault("allowed_vmids", []).append(vmid)
            save_user(current_user)

        return {"status": "created", "vmid": vmid, "task": res}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/vms/{vmid}/action")
async def vm_action(vmid: int, action: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    if current_user.get("role") != "super_admin" and vmid not in current_user.get("allowed_vmids", []):
        raise HTTPException(status_code=403, detail="Access denied to this VM")
    try:
        if action == "start":
            res = await proxmox_client.start_vm("pve", vmid)
        elif action == "stop":
            res = await proxmox_client.stop_vm("pve", vmid)
        elif action == "reboot":
            res = await proxmox_client.reboot_vm("pve", vmid)
        else:
            raise HTTPException(status_code=400, detail="Invalid action")
        return {"status": "ok", "action": action, "task": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/vms/{vmid}")
async def delete_vm(vmid: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    if current_user.get("role") != "super_admin" and vmid not in current_user.get("allowed_vmids", []):
        raise HTTPException(status_code=403, detail="Access denied to this VM")
    try:
        res = await proxmox_client.delete_vm("pve", vmid)
        return {"status": "deleted", "vmid": vmid, "task": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/vms/{vmid}/console")
async def get_vm_console(vmid: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    if current_user.get("role") != "super_admin" and vmid not in current_user.get("allowed_vmids", []):
        raise HTTPException(status_code=403, detail="Access denied to this VM")
    try:
        vnc_data = await proxmox_client.get_vnc_proxy("pve", vmid)
        return vnc_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==============================================================================
# 4. LXC Micro-Containers Hub
# ==============================================================================

@app.get("/api/lxc")
async def list_lxcs(current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        lxcs = await proxmox_client.get_lxcs("pve")
        if current_user.get("role") != "super_admin":
            allowed = set(current_user.get("allowed_vmids", []))
            lxcs = [c for c in lxcs if c.get("vmid") in allowed]
        return lxcs
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/lxc/templates")
async def list_lxc_templates(current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        return await proxmox_client.get_lxc_templates("pve", "local")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class CreateLXCRequest(BaseModel):
    hostname: str
    cores: int = 1
    memory: int = 512
    disk_gb: int = 5
    template: str
    password: str = "RootPass2026!"
    vmid: Optional[int] = None

@app.post("/api/lxc")
async def create_lxc(req: CreateLXCRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        vmid = req.vmid or await proxmox_client.get_next_vmid()
        res = await proxmox_client.create_lxc(
            node="pve",
            vmid=vmid,
            hostname=req.hostname,
            cores=req.cores,
            memory=req.memory,
            disk_gb=req.disk_gb,
            template=req.template,
            password=req.password
        )
        if current_user.get("role") != "super_admin":
            current_user.setdefault("allowed_vmids", []).append(vmid)
            save_user(current_user)
        return {"status": "created", "vmid": vmid, "task": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/lxc/{vmid}/action")
async def lxc_action(vmid: int, action: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        if action == "start":
            res = await proxmox_client.start_lxc("pve", vmid)
        elif action == "stop":
            res = await proxmox_client.stop_lxc("pve", vmid)
        elif action == "reboot":
            res = await proxmox_client.reboot_lxc("pve", vmid)
        else:
            raise HTTPException(status_code=400, detail="Invalid action")
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

# ==============================================================================
# 5. App Marketplace
# ==============================================================================

MARKETPLACE_CATALOG = [
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

@app.get("/api/marketplace/apps")
async def get_marketplace_apps():
    return MARKETPLACE_CATALOG

class DeployAppRequest(BaseModel):
    app_id: str
    instance_name: str
    cores: Optional[int] = None
    memory: Optional[int] = None
    disk_gb: Optional[int] = None
    root_password: str = "AppAdmin2026!"

@app.post("/api/marketplace/deploy")
async def deploy_marketplace_app(req: DeployAppRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    app_meta = next((a for a in MARKETPLACE_CATALOG if a["id"] == req.app_id), None)
    if not app_meta:
        raise HTTPException(status_code=404, detail="Marketplace application not found")
    
    vmid = await proxmox_client.get_next_vmid()
    cores = req.cores or app_meta["default_cores"]
    memory = req.memory or app_meta["default_ram_mb"]
    disk_gb = req.disk_gb or app_meta["default_disk_gb"]

    res = await proxmox_client.create_lxc(
        node="pve",
        vmid=vmid,
        hostname=req.instance_name,
        cores=cores,
        memory=memory,
        disk_gb=disk_gb,
        template=app_meta["template"],
        password=req.root_password
    )
    if current_user.get("role") != "super_admin":
        current_user.setdefault("allowed_vmids", []).append(vmid)
        save_user(current_user)

    # Start container automatically after creation
    asyncio.create_task(start_lxc_delayed(vmid))

    return {
        "status": "deployed",
        "app": app_meta["name"],
        "vmid": vmid,
        "task": res
    }

async def start_lxc_delayed(vmid: int):
    await asyncio.sleep(5)
    try:
        await proxmox_client.start_lxc("pve", vmid)
    except Exception:
        pass

# ==============================================================================
# 6. Live Snapshots Engine
# ==============================================================================

@app.get("/api/snapshots/{vmid}")
async def list_snapshots(vmid: int, is_lxc: bool = False, current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        return await proxmox_client.get_snapshots("pve", vmid, is_lxc=is_lxc)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class CreateSnapshotRequest(BaseModel):
    snapname: str
    description: str = ""
    vmstate: bool = True
    is_lxc: bool = False

@app.post("/api/snapshots/{vmid}")
async def create_snapshot(vmid: int, req: CreateSnapshotRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
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

@app.post("/api/snapshots/{vmid}/rollback")
async def rollback_snapshot(vmid: int, snapname: str, is_lxc: bool = False, current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        res = await proxmox_client.rollback_snapshot("pve", vmid, snapname, is_lxc=is_lxc)
        return {"status": "rolled_back", "snapname": snapname, "task": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/snapshots/{vmid}/{snapname}")
async def delete_snapshot(vmid: int, snapname: str, is_lxc: bool = False, current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        res = await proxmox_client.delete_snapshot("pve", vmid, snapname, is_lxc=is_lxc)
        return {"status": "snapshot_deleted", "snapname": snapname, "task": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==============================================================================
# 7. Intelligent ISO Classifier & Storage Vault
# ==============================================================================

@app.get("/api/storage/isos")
async def list_isos(current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        raw_isos = await proxmox_client.get_iso_images("pve", "local")
        enriched = []
        for iso in raw_isos:
            volid = iso.get("volid", "")
            filename = volid.split("/")[-1] if "/" in volid else volid
            analysis = analyze_iso(filename)
            iso_copy = iso.copy()
            iso_copy["filename"] = filename
            iso_copy["analysis"] = analysis
            enriched.append(iso_copy)
        return enriched
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class AnalyzeNameRequest(BaseModel):
    filename: str

@app.post("/api/storage/analyze-name")
async def analyze_iso_name(req: AnalyzeNameRequest):
    return analyze_iso(req.filename)

class UploadUrlRequest(BaseModel):
    url: str
    filename: Optional[str] = None

@app.post("/api/storage/upload-url")
async def upload_iso_from_url(req: UploadUrlRequest, admin_user: Dict[str, Any] = Depends(require_admin)):
    try:
        filename = req.filename or req.url.split("/")[-1].split("?")[0]
        if not filename.endswith(".iso") and not filename.endswith(".img"):
            filename += ".iso"
            
        analysis = analyze_iso(filename)
        
        # Trigger background download directly onto Proxmox node via SSH curl
        download_cmd = f"sshpass -p 'ProxmoxAdmin2026!' ssh -o StrictHostKeyChecking=no -p 2222 root@127.0.0.1 'curl -L -o /var/lib/vz/template/iso/{filename} {req.url} >/dev/null 2>&1 &'"
        subprocess.Popen(download_cmd, shell=True)
        
        return {
            "status": "download_started",
            "filename": filename,
            "target_path": f"/var/lib/vz/template/iso/{filename}",
            "analysis": analysis
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/storage/upload")
async def upload_iso_file(
    file: UploadFile = File(...),
    admin_user: Dict[str, Any] = Depends(require_admin)
):
    try:
        filename = file.filename or "uploaded.iso"
        if not filename.endswith(".iso") and not filename.endswith(".img"):
            filename += ".iso"

        # Read first 64KB to parse ISO 9660 PVD header
        header_chunk = await file.read(65536)
        pvd_bytes = header_chunk[32768:34816] if len(header_chunk) >= 34816 else b""
        header_info = parse_iso_header_bytes(pvd_bytes)
        
        analysis = analyze_iso(filename, header_info=header_info)
        
        # Save temp file on host then stream/copy to Proxmox ISO directory
        temp_path = f"/tmp/{filename}"
        with open(temp_path, "wb") as f:
            f.write(header_chunk)
            while chunk := await file.read(1024 * 1024 * 4): # 4MB chunks
                f.write(chunk)
                
        # Move into Proxmox VM storage via scp
        scp_cmd = f"sshpass -p 'ProxmoxAdmin2026!' scp -P 2222 -o StrictHostKeyChecking=no {temp_path} root@127.0.0.1:/var/lib/vz/template/iso/{filename}"
        res = subprocess.run(scp_cmd, shell=True, capture_output=True, text=True)
        
        if os.path.exists(temp_path):
            os.remove(temp_path)
            
        if res.returncode != 0:
            raise Exception(f"Failed to copy to Proxmox ISO vault: {res.stderr}")
            
        return {
            "status": "uploaded",
            "filename": filename,
            "volid": f"local:iso/{filename}",
            "analysis": analysis
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==============================================================================
# 8. Real-Time Telemetry & Git Status
# ==============================================================================

@app.get("/api/telemetry/rrd")
async def get_telemetry():
    try:
        return await proxmox_client.get_rrd_data("pve")
    except Exception as e:
        return {"data": []}

@app.get("/api/git/status")
async def get_git_status():
    return {
        "repository": "https://github.com/mainulislamik/toto-datacenter",
        "branch": "main",
        "version": "2.1.0-enterprise",
        "commit": "c2bc816",
        "status": "synced"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8099)
