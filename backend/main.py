import os
import uuid
import asyncio
import subprocess
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, Depends, HTTPException, status, Header, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from proxmox_client import proxmox_client
from iso_analyzer import analyze_iso, parse_iso_header_bytes
from auth import (
    authenticate_user,
    create_access_token,
    get_user_by_username,
    get_all_users,
    save_user,
    delete_user_by_id,
    get_current_user,
    require_admin,
    require_quota,
    UserCreate,
    Token
)

app = FastAPI(
    title="Toto Datacenter API",
    version="2.5.0",
    description="Enterprise Datacenter Orchestration API for Proxmox KVM & LXC with Multi-Node Clustering and Intelligent Storage"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request Models
class LoginRequest(BaseModel):
    username: str
    password: str

class VMCreateRequest(BaseModel):
    vmid: int
    name: str
    cores: int = 2
    memory: int = 2048
    disk_gb: int = 20
    iso: Optional[str] = None
    os_type: str = "l26"
    bios: str = "seabios"
    node: str = "pve"

class LXCCreateRequest(BaseModel):
    vmid: int
    hostname: str
    ostemplate: str = "local:vztmpl/ubuntu-22.04-standard_22.04-1_amd64.tar.zst"
    cores: int = 2
    memory: int = 2048
    disk_gb: int = 10
    password: str = "TotoLXC2026!"
    node: str = "pve"

class SnapshotCreateRequest(BaseModel):
    snapname: str
    description: Optional[str] = ""
    vmstate: bool = False

class AppDeployRequest(BaseModel):
    app_id: str
    vmid: int
    name: str
    password: Optional[str] = "TotoApp2026!"
    node: str = "pve"

class ISOUploadURLRequest(BaseModel):
    url: str
    filename: Optional[str] = None
    node: str = "pve"

class ISOAnalyzeNameRequest(BaseModel):
    filename: str

class VMMigrateRequest(BaseModel):
    target_node: str
    source_node: str = "pve"
    online: bool = True

class LXCMigrateRequest(BaseModel):
    target_node: str
    source_node: str = "pve"
    restart: bool = False

class AddNFSRequest(BaseModel):
    storage_name: str
    server_ip: str
    export_path: str
    node: str = "pve"

# ----------------- AUTHENTICATION ROUTES -----------------

@app.post("/api/auth/login", response_model=Token)
async def login(req: LoginRequest):
    user = authenticate_user(req.username, req.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token(user)
    return Token(
        access_token=token,
        token_type="bearer",
        role=user.get("role", "user"),
        username=user.get("username", req.username),
        user_id=user.get("id", "usr_unknown")
    )

@app.get("/api/auth/me")
async def get_me(current_user: Dict[str, Any] = Depends(get_current_user)):
    user = get_user_by_username(current_user.get("username", ""))
    if not user:
        return current_user
    return {
        "id": user.get("id"),
        "username": user.get("username"),
        "role": user.get("role"),
        "quota": user.get("quota", {})
    }

@app.get("/api/auth/users")
async def list_users(admin_user: Dict[str, Any] = Depends(require_admin)):
    users = get_all_users()
    return [
        {
            "id": u.get("id"),
            "username": u.get("username"),
            "role": u.get("role"),
            "quota": u.get("quota", {}),
            "created_at": u.get("created_at")
        } for u in users
    ]

@app.post("/api/auth/users")
async def create_user_account(
    req: UserCreate,
    admin_user: Dict[str, Any] = Depends(require_admin)
):
    existing = get_user_by_username(req.username)
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    user = save_user(req.dict())
    return {
        "status": "success",
        "user": {
            "id": user.get("id"),
            "username": user.get("username"),
            "role": user.get("role"),
            "quota": user.get("quota", {})
        }
    }

@app.delete("/api/auth/users/{user_id}")
async def delete_user_account(
    user_id: str,
    admin_user: Dict[str, Any] = Depends(require_admin)
):
    if user_id in ["usr_admin", "usr-admin-01"]:
        raise HTTPException(status_code=400, detail="Cannot delete default super admin")
    deleted = delete_user_by_id(user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="User not found")
    return {"status": "success", "message": f"User {user_id} deleted"}

# ----------------- CLUSTER & SCALE-OUT ROUTES -----------------

@app.get("/api/cluster/nodes")
async def get_cluster_nodes(current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        return await proxmox_client.get_nodes()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/cluster/status")
async def get_cluster_status(current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        return await proxmox_client.get_cluster_status()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/cluster/join-info")
async def get_cluster_join_info(admin_user: Dict[str, Any] = Depends(require_admin)):
    try:
        return await proxmox_client.get_cluster_join_info()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ----------------- DATACENTER OVERVIEW -----------------

@app.get("/api/overview")
async def get_datacenter_overview(current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        user_role = current_user.get("role", "user")
        vms = await proxmox_client.get_vms()
        lxcs = await proxmox_client.get_lxcs()
        storages = await proxmox_client.get_storage()
        nodes = await proxmox_client.get_nodes()

        allowed_vmids = current_user.get("allowed_vmids", [])
        if user_role != "super_admin" and allowed_vmids:
            vms = [v for v in vms if v.get("vmid") in allowed_vmids]
            lxcs = [c for c in lxcs if c.get("vmid") in allowed_vmids]

        total_vms = len(vms)
        running_vms = sum(1 for v in vms if v.get("status") == "running")
        total_lxcs = len(lxcs)
        running_lxcs = sum(1 for c in lxcs if c.get("status") == "running")

        total_ram = sum(v.get("maxmem", 0) for v in vms) + sum(c.get("maxmem", 0) for c in lxcs)
        used_ram = sum(v.get("mem", 0) for v in vms if v.get("status") == "running") + sum(c.get("mem", 0) for c in lxcs if c.get("status") == "running")

        total_disk = sum(s.get("total", 0) for s in storages)
        used_disk = sum(s.get("used", 0) for s in storages)

        return {
            "cluster_nodes": len(nodes),
            "total_vms": total_vms,
            "running_vms": running_vms,
            "total_lxcs": total_lxcs,
            "running_lxcs": running_lxcs,
            "memory": {
                "used": used_ram,
                "total": total_ram or 6442450944,
                "percentage": round((used_ram / (total_ram or 6442450944)) * 100, 1)
            },
            "storage": {
                "used": used_disk,
                "total": total_disk or 160000000000,
                "percentage": round((used_disk / (total_disk or 160000000000)) * 100, 1) if total_disk else 0
            },
            "nodes": nodes,
            "user_quota": current_user.get("quota", {})
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ----------------- VIRTUAL MACHINES (KVM) -----------------

@app.get("/api/vms")
async def list_vms(current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        vms = await proxmox_client.get_vms()
        if current_user.get("role") != "super_admin" and current_user.get("allowed_vmids"):
            vms = [v for v in vms if v.get("vmid") in current_user.get("allowed_vmids", [])]
        return vms
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/vms")
async def create_vm(
    req: VMCreateRequest,
    current_user: Dict[str, Any] = Depends(require_quota)
):
    try:
        vm_config = {
            "vmid": req.vmid,
            "name": req.name,
            "cores": req.cores,
            "memory": req.memory,
            "scsihw": "virtio-scsi-pci",
            "virtio0": f"local-lvm:{req.disk_gb}",
            "ostype": req.os_type,
            "bios": req.bios,
            "net0": "virtio,bridge=vmbr0"
        }
        if req.iso:
            vm_config["ide2"] = f"{req.iso},media=cdrom"
            vm_config["boot"] = "order=ide2;virtio0"
        else:
            vm_config["boot"] = "order=virtio0"

        res = await proxmox_client.create_vm(vm_config, node=req.node)
        return {"status": "success", "data": res, "vmid": req.vmid}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/vms/{vmid}/start")
async def start_vm(vmid: int, node: str = "pve", current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        res = await proxmox_client.start_vm(vmid, node=node)
        return {"status": "success", "data": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/vms/{vmid}/stop")
async def stop_vm(vmid: int, node: str = "pve", current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        res = await proxmox_client.stop_vm(vmid, node=node)
        return {"status": "success", "data": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/vms/{vmid}/reboot")
async def reboot_vm(vmid: int, node: str = "pve", current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        res = await proxmox_client.reboot_vm(vmid, node=node)
        return {"status": "success", "data": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/vms/{vmid}")
async def delete_vm(vmid: int, node: str = "pve", admin_user: Dict[str, Any] = Depends(require_admin)):
    try:
        res = await proxmox_client.delete_vm(vmid, node=node)
        return {"status": "success", "data": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/vms/{vmid}/migrate")
async def live_migrate_vm(
    vmid: int,
    req: VMMigrateRequest,
    admin_user: Dict[str, Any] = Depends(require_admin)
):
    try:
        res = await proxmox_client.migrate_vm(vmid, target_node=req.target_node, source_node=req.source_node, online=req.online)
        return {"status": "success", "data": res, "vmid": vmid, "target_node": req.target_node}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ----------------- LXC CONTAINERS -----------------

@app.get("/api/lxc")
async def list_lxcs(current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        lxcs = await proxmox_client.get_lxcs()
        if current_user.get("role") != "super_admin" and current_user.get("allowed_vmids"):
            lxcs = [c for c in lxcs if c.get("vmid") in current_user.get("allowed_vmids", [])]
        return lxcs
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/lxc")
async def create_lxc(
    req: LXCCreateRequest,
    current_user: Dict[str, Any] = Depends(require_quota)
):
    try:
        lxc_config = {
            "vmid": req.vmid,
            "hostname": req.hostname,
            "ostemplate": req.ostemplate,
            "cores": req.cores,
            "memory": req.memory,
            "rootfs": f"local-lvm:{req.disk_gb}",
            "password": req.password,
            "net0": "name=eth0,bridge=vmbr0,ip=dhcp,firewall=1",
            "unprivileged": 1,
            "start": 1
        }
        res = await proxmox_client.create_lxc(lxc_config, node=req.node)
        return {"status": "success", "data": res, "vmid": req.vmid}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/lxc/{vmid}/start")
async def start_lxc(vmid: int, node: str = "pve", current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        res = await proxmox_client.start_lxc(vmid, node=node)
        return {"status": "success", "data": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/lxc/{vmid}/stop")
async def stop_lxc(vmid: int, node: str = "pve", current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        res = await proxmox_client.stop_lxc(vmid, node=node)
        return {"status": "success", "data": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/lxc/{vmid}")
async def delete_lxc(vmid: int, node: str = "pve", admin_user: Dict[str, Any] = Depends(require_admin)):
    try:
        res = await proxmox_client.delete_lxc(vmid, node=node)
        return {"status": "success", "data": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/lxc/{vmid}/migrate")
async def migrate_lxc_container(
    vmid: int,
    req: LXCMigrateRequest,
    admin_user: Dict[str, Any] = Depends(require_admin)
):
    try:
        res = await proxmox_client.migrate_lxc(vmid, target_node=req.target_node, source_node=req.source_node, restart=req.restart)
        return {"status": "success", "data": res, "vmid": vmid, "target_node": req.target_node}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ----------------- APP MARKETPLACE -----------------

MARKETPLACE_TEMPLATES = {
    "docker": {
        "name": "Docker Engine + Portainer CE",
        "description": "Ubuntu 22.04 LTS with Docker Daemon, Docker Compose v2, and Portainer Web UI",
        "category": "DevOps",
        "icon": "Layers",
        "recommended_cores": 2,
        "recommended_ram": 2048,
        "recommended_disk": 20,
        "ostemplate": "local:vztmpl/ubuntu-22.04-standard_22.04-1_amd64.tar.zst",
    },
    "node-nginx": {
        "name": "Node.js 20 LTS + Nginx Web Server",
        "description": "High-performance JavaScript backend environment with Nginx reverse proxy",
        "category": "Web & Backend",
        "icon": "Zap",
        "recommended_cores": 2,
        "recommended_ram": 2048,
        "recommended_disk": 15,
        "ostemplate": "local:vztmpl/ubuntu-22.04-standard_22.04-1_amd64.tar.zst",
    },
    "postgres": {
        "name": "PostgreSQL 16 Enterprise Database",
        "description": "Production-ready Relational SQL DB with SSL & remote connection tuning",
        "category": "Database",
        "icon": "HardDrive",
        "recommended_cores": 2,
        "recommended_ram": 4096,
        "recommended_disk": 30,
        "ostemplate": "local:vztmpl/debian-12-standard_12.2-1_amd64.tar.zst",
    },
    "redis": {
        "name": "Redis 7 In-Memory Fast Cache",
        "description": "High-speed key-value cache with persistence (AOF+RDB) enabled",
        "category": "Database",
        "icon": "Activity",
        "recommended_cores": 1,
        "recommended_ram": 1024,
        "recommended_disk": 10,
        "ostemplate": "local:vztmpl/alpine-3.19-default_20240207_amd64.tar.xz",
    },
    "fastapi": {
        "name": "Python 3.11 FastAPI Async Microservice",
        "description": "Modern async Python stack with Uvicorn, Pydantic v2, and Poetry",
        "category": "API Services",
        "icon": "Cpu",
        "recommended_cores": 2,
        "recommended_ram": 2048,
        "recommended_disk": 15,
        "ostemplate": "local:vztmpl/debian-12-standard_12.2-1_amd64.tar.zst",
    }
}

@app.get("/api/marketplace/templates")
async def get_marketplace_templates(current_user: Dict[str, Any] = Depends(get_current_user)):
    return MARKETPLACE_TEMPLATES

@app.post("/api/marketplace/deploy")
async def deploy_marketplace_app(
    req: AppDeployRequest,
    current_user: Dict[str, Any] = Depends(require_quota)
):
    template = MARKETPLACE_TEMPLATES.get(req.app_id)
    if not template:
        raise HTTPException(status_code=404, detail="Marketplace app template not found")

    try:
        lxc_config = {
            "vmid": req.vmid,
            "hostname": f"{req.app_id}-{req.vmid}",
            "ostemplate": template["ostemplate"],
            "cores": template["recommended_cores"],
            "memory": template["recommended_ram"],
            "rootfs": f"local-lvm:{template['recommended_disk']}",
            "password": req.password or "TotoApp2026!",
            "net0": "name=eth0,bridge=vmbr0,ip=dhcp,firewall=1",
            "unprivileged": 1,
            "start": 1
        }
        res = await proxmox_client.create_lxc(lxc_config, node=req.node)
        return {
            "status": "success",
            "message": f"Deploying {template['name']} into LXC Container #{req.vmid}",
            "data": res,
            "vmid": req.vmid,
            "app": template["name"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ----------------- SNAPSHOTS (DISASTER RECOVERY) -----------------

@app.get("/api/vms/{vmid}/snapshots")
async def list_snapshots(vmid: int, is_lxc: bool = False, node: str = "pve", current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        return await proxmox_client.get_snapshots(vmid, is_lxc=is_lxc, node=node)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/vms/{vmid}/snapshots")
async def create_snapshot(
    vmid: int,
    req: SnapshotCreateRequest,
    is_lxc: bool = False,
    node: str = "pve",
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    try:
        res = await proxmox_client.create_snapshot(
            vmid,
            snapname=req.snapname,
            description=req.description or "",
            is_lxc=is_lxc,
            node=node
        )
        return {"status": "success", "data": res, "snapname": req.snapname}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/vms/{vmid}/snapshots/{snapname}/rollback")
async def rollback_snapshot(
    vmid: int,
    snapname: str,
    is_lxc: bool = False,
    node: str = "pve",
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    try:
        res = await proxmox_client.rollback_snapshot(vmid, snapname=snapname, is_lxc=is_lxc, node=node)
        return {"status": "success", "data": res, "snapname": snapname}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/vms/{vmid}/snapshots/{snapname}")
async def delete_snapshot(
    vmid: int,
    snapname: str,
    is_lxc: bool = False,
    node: str = "pve",
    admin_user: Dict[str, Any] = Depends(require_admin)
):
    try:
        res = await proxmox_client.delete_snapshot(vmid, snapname=snapname, is_lxc=is_lxc, node=node)
        return {"status": "success", "data": res, "snapname": snapname}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ----------------- STORAGE & ISO VAULT -----------------

@app.get("/api/storage/pools")
async def list_storage_pools(node: str = "pve", current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        return await proxmox_client.get_storage(node=node)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/storage/isos")
async def list_isos(node: str = "pve", storage: str = "local", current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        raw_isos = await proxmox_client.get_isos(node=node, storage=storage)
        enhanced_isos = []
        for iso in raw_isos:
            volid = iso.get("volid", "")
            filename = volid.split("/")[-1] if "/" in volid else volid
            analysis = analyze_iso(filename)
            iso["filename"] = filename
            iso["analysis"] = analysis
            enhanced_isos.append(iso)
        return enhanced_isos
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/storage/analyze-name")
async def analyze_iso_filename(req: ISOAnalyzeNameRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    return analyze_iso(req.filename)

@app.post("/api/storage/upload")
async def upload_iso_file(
    file: UploadFile = File(...),
    admin_user: Dict[str, Any] = Depends(require_admin)
):
    """Direct multipart ISO upload using local SSD staging buffer and SCP transfer (Guarantees No Broken Pipe)"""
    filename = file.filename or f"iso-{uuid.uuid4().hex[:8]}.iso"
    if not (filename.endswith(".iso") or filename.endswith(".img")):
        filename += ".iso"

    staging_dir = "/home/imon/Extra_SSD/toto-iso-staging"
    os.makedirs(staging_dir, exist_ok=True)
    staging_path = os.path.join(staging_dir, filename)

    header_bytes = b""
    with open(staging_path, "wb") as f_out:
        while True:
            chunk = await file.read(4 * 1024 * 1024) # 4MB buffer chunk
            if not chunk:
                break
            if len(header_bytes) < 65536:
                header_bytes += chunk[:65536 - len(header_bytes)]
            f_out.write(chunk)

    header_data = parse_iso_header_bytes(header_bytes)
    analysis = analyze_iso(filename, header_info=header_data)

    dest_path = f"/var/lib/vz/template/iso/{filename}"
    scp_cmd = [
        "sshpass", "-p", "ProxmoxAdmin2026!",
        "scp", "-P", "2222", "-o", "StrictHostKeyChecking=no",
        staging_path, f"root@127.0.0.1:{dest_path}"
    ]

    scp_proc = subprocess.run(scp_cmd, capture_output=True, text=True, timeout=600)
    if scp_proc.returncode != 0:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to copy ISO to Proxmox vault: {scp_proc.stderr or scp_proc.stdout}"
        )

    file_size = os.path.getsize(staging_path) if os.path.exists(staging_path) else (file.size or len(header_bytes))

    return {
        "status": "success",
        "filename": filename,
        "volid": f"local:iso/{filename}",
        "size_bytes": file_size,
        "analysis": analysis
    }

@app.post("/api/storage/upload-url")
async def download_iso_from_url(
    req: ISOUploadURLRequest,
    admin_user: Dict[str, Any] = Depends(require_admin)
):
    url = req.url.strip()
    filename = req.filename or url.split("/")[-1].split("?")[0]
    if not (filename.endswith(".iso") or filename.endswith(".img")):
        filename += ".iso"

    analysis = analyze_iso(filename)
    dest_path = f"/var/lib/vz/template/iso/{filename}"
    remote_cmd = f"curl -sL -o '{dest_path}' '{url}' &"
    
    ssh_cmd = [
        "sshpass", "-p", "ProxmoxAdmin2026!",
        "ssh", "-o", "StrictHostKeyChecking=no", "-p", "2222",
        "root@127.0.0.1", remote_cmd
    ]
    subprocess.Popen(ssh_cmd)

    return {
        "status": "success",
        "message": f"Background download initiated on Proxmox node for {filename}",
        "filename": filename,
        "volid": f"local:iso/{filename}",
        "analysis": analysis
    }

@app.post("/api/storage/nfs")
async def add_nfs_storage(
    req: AddNFSRequest,
    admin_user: Dict[str, Any] = Depends(require_admin)
):
    try:
        res = await proxmox_client.add_nfs_storage(
            storage=req.storage_name,
            server=req.server_ip,
            export=req.export_path
        )
        return {"status": "success", "data": res, "storage_name": req.storage_name}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8099)
