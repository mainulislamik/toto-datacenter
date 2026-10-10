import os
import uuid
import asyncio
import subprocess
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, Depends, HTTPException, status, Header, UploadFile, File, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from auth import (
    authenticate_user,
    create_access_token,
    get_user_by_username,
    get_all_users,
    save_user,
    delete_user,
    get_current_user,
    require_admin,
    check_user_quota,
    require_quota,
    Token,
    LoginRequest,
    UserCreate,
    UserResponse
)
from proxmox_client import proxmox_client
from iso_analyzer import analyze_iso, parse_iso_header_bytes

app = FastAPI(
    title="Toto Datacenter API",
    description="Custom Enterprise Cloud Control Plane & Hypervisor Orchestrator",
    version="2.5.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- PYDANTIC MODELS -----------------

class VMCreateRequest(BaseModel):
    name: str
    cores: int = 2
    memory_mb: int = 2048
    disk_gb: int = 20
    iso_volid: Optional[str] = None
    ostype: str = "l26"
    net0: str = "virtio,bridge=vmbr0,firewall=1"
    node: str = "pve"

class LXCCreateRequest(BaseModel):
    hostname: str
    cores: int = 1
    memory_mb: int = 512
    disk_gb: int = 8
    ostemplate: str = "local:vztmpl/ubuntu-22.04-standard_22.04-1_amd64.tar.zst"
    password: str = "TotoLXC2026!"
    node: str = "pve"

class SnapshotRequest(BaseModel):
    snapname: str
    description: Optional[str] = ""
    is_lxc: bool = False

class ISODownloadRequest(BaseModel):
    url: str
    filename: str
    storage: str = "local"
    node: str = "pve"

class ISOAnalyzeNameRequest(BaseModel):
    filename: str

class MarketplaceDeployRequest(BaseModel):
    app_id: str
    name: str
    cores: int = 2
    memory_mb: int = 2048
    disk_gb: int = 20
    is_lxc: bool = True
    node: str = "pve"

class MigrateRequest(BaseModel):
    vmid: int
    target_node: str
    is_lxc: bool = False
    online: bool = True

class NFSStorageRequest(BaseModel):
    storage: str
    server: str
    export: str
    content: str = "images,iso,backup"

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
        user_id=user.get("id", "usr-unknown")
    )

@app.get("/api/auth/me")
async def get_me(current_user: Dict[str, Any] = Depends(get_current_user)):
    user = get_user_by_username(current_user["username"])
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
    if user_id == "usr-admin-01":
        raise HTTPException(status_code=400, detail="Cannot delete master superadmin")
    ok = delete_user(user_id)
    if not ok:
        raise HTTPException(status_code=404, detail="User not found")
    return {"status": "success", "message": f"User {user_id} deleted"}

# ----------------- CLUSTER & PHYSICAL NODE ROUTES -----------------

@app.get("/api/cluster/nodes")
async def get_cluster_nodes(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Fetch all physical server nodes joined in the Proxmox bare-metal cluster"""
    try:
        nodes = await proxmox_client.get_nodes()
        return nodes
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/cluster/join-info")
async def get_cluster_join_info(admin_user: Dict[str, Any] = Depends(require_admin)):
    """Generate 1-click Join Command and SSL Fingerprint for adding new physical servers/nodes"""
    try:
        cmd = [
            "sshpass", "-p", "ProxmoxAdmin2026!",
            "ssh", "-o", "StrictHostKeyChecking=no", "-p", "2222",
            "root@127.0.0.1",
            "pvecm status && pvesh get /cluster/config/join --output-format json"
        ]
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        output = proc.stdout
        
        # Parse JSON part if available
        join_data = {}
        if "{" in output:
            try:
                json_str = output[output.find("{"):output.rfind("}")+1]
                import json
                join_data = json.loads(json_str)
            except Exception:
                pass

        fingerprint = join_data.get("fingerprint", "29:9B:AC:B6:05:42:1D:8A:A3:DC:1E:1D:AE:CA:A4:51:DF:76:20:67:41:AD:A3:D0:9E:92:94:55:94:9E:91:CC")
        preferred_ip = join_data.get("preferred_node", "10.0.2.15")
        
        join_command = f"pvecm add {preferred_ip} --fingerprint {fingerprint} --use_ssh"
        
        return {
            "cluster_name": "toto-datacenter",
            "primary_ip": preferred_ip,
            "fingerprint": fingerprint,
            "join_command": join_command,
            "raw_join_data": join_data,
            "instructions": [
                "1. Boot your secondary physical PC / server with Proxmox VE.",
                "2. Open the terminal or SSH on that new server.",
                f"3. Run: {join_command}",
                "4. Enter root password when prompted. The server will join this cluster in 10 seconds!"
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate cluster join info: {str(e)}")

# ----------------- LIVE VM & LXC MIGRATION ROUTES -----------------

@app.post("/api/cluster/migrate")
async def migrate_instance(req: MigrateRequest, admin_user: Dict[str, Any] = Depends(require_admin)):
    """Live zero-downtime migration of a VM or LXC container between physical server nodes"""
    try:
        if req.is_lxc:
            task = await proxmox_client.migrate_lxc(vmid=req.vmid, target_node=req.target_node, restart=True)
        else:
            task = await proxmox_client.migrate_vm(vmid=req.vmid, target_node=req.target_node, online=req.online)
        return {
            "status": "success",
            "message": f"Live migration of #{req.vmid} to physical node '{req.target_node}' initiated.",
            "task": task
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Live migration failed: {str(e)}")

# ----------------- DATACENTER OVERVIEW -----------------

@app.get("/api/datacenter/overview")
async def get_datacenter_overview(current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        node_status = await proxmox_client.get_node_status("pve")
        vms = await proxmox_client.get_vms("pve")
        lxcs = await proxmox_client.get_lxcs("pve")
        storage = await proxmox_client.get_storage("pve")
        nodes = await proxmox_client.get_nodes()
        
        total_vms = len(vms)
        running_vms = len([v for v in vms if v.get("status") == "running"])
        total_lxcs = len(lxcs)
        running_lxcs = len([l for l in lxcs if l.get("status") == "running"])
        
        total_cores = sum([n.get("cpuinfo", {}).get("cpus", 4) for n in nodes]) if nodes else 4
        total_mem_bytes = sum([n.get("memory", {}).get("total", 0) for n in nodes]) if nodes else node_status.get("memory", {}).get("total", 0)
        used_mem_bytes = sum([n.get("memory", {}).get("used", 0) for n in nodes]) if nodes else node_status.get("memory", {}).get("used", 0)
        
        total_storage_bytes = sum([s.get("total", 0) for s in storage])
        used_storage_bytes = sum([s.get("used", 0) for s in storage])

        return {
            "cluster_name": "toto-datacenter",
            "node_count": len(nodes) if nodes else 1,
            "nodes": nodes,
            "node_status": node_status,
            "vms": {
                "total": total_vms,
                "running": running_vms,
                "stopped": total_vms - running_vms
            },
            "lxcs": {
                "total": total_lxcs,
                "running": running_lxcs,
                "stopped": total_lxcs - running_lxcs
            },
            "compute": {
                "total_cores": total_cores,
                "cpu_usage_pct": round((node_status.get("cpu", 0) * 100), 2)
            },
            "memory": {
                "total_gb": round(total_mem_bytes / (1024**3), 2),
                "used_gb": round(used_mem_bytes / (1024**3), 2),
                "free_gb": round((total_mem_bytes - used_mem_bytes) / (1024**3), 2),
                "usage_pct": round((used_mem_bytes / max(total_mem_bytes, 1)) * 100, 2)
            },
            "storage": {
                "total_gb": round(total_storage_bytes / (1024**3), 2),
                "used_gb": round(used_storage_bytes / (1024**3), 2),
                "free_gb": round((total_storage_bytes - used_storage_bytes) / (1024**3), 2),
                "usage_pct": round((used_storage_bytes / max(total_storage_bytes, 1)) * 100, 2),
                "pools": storage
            },
            "user_context": {
                "username": current_user.get("username"),
                "role": current_user.get("role"),
                "quota": current_user.get("quota")
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/datacenter/metrics")
async def get_datacenter_metrics(timeframe: str = "hour", current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        return await proxmox_client.get_node_rrd(node="pve", timeframe=timeframe)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ----------------- VIRTUAL MACHINE ROUTES -----------------

@app.get("/api/vms")
async def list_vms(node: str = "pve", current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        vms = await proxmox_client.get_vms(node=node)
        # Filter if non-admin
        if current_user.get("role") != "admin":
            vms = [v for v in vms if str(v.get("vmid")) in current_user.get("allowed_vms", []) or current_user.get("username") in v.get("name", "")]
        return vms
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/vms")
async def create_virtual_machine(
    req: VMCreateRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    check_user_quota(current_user, "vms")
    try:
        # Find next free VMID
        existing = await proxmox_client.get_vms(node=req.node)
        used_ids = [int(v["vmid"]) for v in existing]
        next_vmid = max(used_ids + [100]) + 1

        config = {
            "vmid": next_vmid,
            "name": req.name,
            "cores": req.cores,
            "memory": req.memory_mb,
            "scsihw": "virtio-scsi-pci",
            "scsi0": f"local-lvm:{req.disk_gb}",
            "net0": req.net0,
            "ostype": req.ostype,
            "boot": "order=scsi0;ide2;net0"
        }
        if req.iso_volid:
            config["ide2"] = f"{req.iso_volid},media=cdrom"

        res = await proxmox_client.create_vm(config, node=req.node)
        return {"status": "success", "vmid": next_vmid, "task": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/vms/{vmid}/start")
async def start_virtual_machine(vmid: int, node: str = "pve", current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        await proxmox_client.start_vm(vmid, node=node)
        return {"status": "success", "message": f"VM {vmid} started"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/vms/{vmid}/stop")
async def stop_virtual_machine(vmid: int, node: str = "pve", current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        await proxmox_client.stop_vm(vmid, node=node)
        return {"status": "success", "message": f"VM {vmid} stopped"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/vms/{vmid}/reboot")
async def reboot_virtual_machine(vmid: int, node: str = "pve", current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        await proxmox_client.reboot_vm(vmid, node=node)
        return {"status": "success", "message": f"VM {vmid} rebooted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/vms/{vmid}")
async def delete_virtual_machine(vmid: int, node: str = "pve", admin_user: Dict[str, Any] = Depends(require_admin)):
    try:
        await proxmox_client.delete_vm(vmid, node=node)
        return {"status": "success", "message": f"VM {vmid} deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ----------------- LXC MICRO-CONTAINER HUB ROUTES -----------------

@app.get("/api/lxc")
async def list_lxcs(node: str = "pve", current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        lxcs = await proxmox_client.get_lxcs(node=node)
        if current_user.get("role") != "admin":
            lxcs = [l for l in lxcs if str(l.get("vmid")) in current_user.get("allowed_lxcs", []) or current_user.get("username") in l.get("name", "")]
        return lxcs
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/lxc/templates")
async def list_lxc_templates(node: str = "pve", storage: str = "local", current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        return await proxmox_client.get_lxc_templates(node=node, storage=storage)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/lxc")
async def create_lxc_container(
    req: LXCCreateRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    check_user_quota(current_user, "lxcs")
    try:
        existing = await proxmox_client.get_lxcs(node=req.node)
        used_ids = [int(l["vmid"]) for l in existing]
        next_vmid = max(used_ids + [200]) + 1

        config = {
            "vmid": next_vmid,
            "hostname": req.hostname,
            "cores": req.cores,
            "memory": req.memory_mb,
            "rootfs": f"local-lvm:{req.disk_gb}",
            "ostemplate": req.ostemplate,
            "password": req.password,
            "net0": "name=eth0,bridge=vmbr0,ip=dhcp,firewall=1",
            "unprivileged": 1,
            "start": 1
        }
        res = await proxmox_client.create_lxc(config, node=req.node)
        return {"status": "success", "vmid": next_vmid, "task": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/lxc/{vmid}/start")
async def start_lxc_container(vmid: int, node: str = "pve", current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        await proxmox_client.start_lxc(vmid, node=node)
        return {"status": "success", "message": f"LXC {vmid} started"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/lxc/{vmid}/stop")
async def stop_lxc_container(vmid: int, node: str = "pve", current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        await proxmox_client.stop_lxc(vmid, node=node)
        return {"status": "success", "message": f"LXC {vmid} stopped"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/lxc/{vmid}/reboot")
async def reboot_lxc_container(vmid: int, node: str = "pve", current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        await proxmox_client.reboot_lxc(vmid, node=node)
        return {"status": "success", "message": f"LXC {vmid} rebooted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/lxc/{vmid}")
async def delete_lxc_container(vmid: int, node: str = "pve", admin_user: Dict[str, Any] = Depends(require_admin)):
    try:
        await proxmox_client.delete_lxc(vmid, node=node)
        return {"status": "success", "message": f"LXC {vmid} deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ----------------- 1-CLICK APP MARKETPLACE -----------------

MARKETPLACE_APPS = {
    "docker": {
        "id": "docker",
        "name": "Docker & Compose Engine",
        "category": "DevOps / Containers",
        "description": "Ready-to-use Docker 27 CE with docker-compose-plugin and Portainer Web UI",
        "icon": "container",
        "cores": 2,
        "memory_mb": 2048,
        "disk_gb": 20,
        "is_lxc": True
    },
    "node-nginx": {
        "id": "node-nginx",
        "name": "Node.js 22 LTS & Nginx Stack",
        "category": "Web Hosting / Full-Stack",
        "description": "High performance Node.js 22, PM2 Process Manager, and Nginx reverse proxy",
        "icon": "globe",
        "cores": 2,
        "memory_mb": 2048,
        "disk_gb": 15,
        "is_lxc": True
    },
    "postgresql": {
        "id": "postgresql",
        "name": "PostgreSQL 16 Enterprise Database",
        "category": "Databases",
        "description": "Production tuned PostgreSQL 16 with pg_stat_statements and automated vacuuming",
        "icon": "database",
        "cores": 2,
        "memory_mb": 4096,
        "disk_gb": 30,
        "is_lxc": True
    },
    "redis": {
        "id": "redis",
        "name": "Redis 7 In-Memory Cache & MQ",
        "category": "Databases / Cache",
        "description": "Ultra-fast Redis 7 memory cache with persistence and password security",
        "icon": "zap",
        "cores": 1,
        "memory_mb": 1024,
        "disk_gb": 10,
        "is_lxc": True
    },
    "fastapi-ai": {
        "id": "fastapi-ai",
        "name": "FastAPI & Python 3.12 AI Stack",
        "category": "AI / Backend Services",
        "description": "Modern Python 3.12, FastAPI, Uvicorn, PyTorch/ONNX runtime and Jupyter support",
        "icon": "cpu",
        "cores": 4,
        "memory_mb": 4096,
        "disk_gb": 25,
        "is_lxc": False
    }
}

@app.get("/api/marketplace/apps")
async def list_marketplace_apps(current_user: Dict[str, Any] = Depends(get_current_user)):
    return list(MARKETPLACE_APPS.values())

@app.post("/api/marketplace/deploy")
async def deploy_marketplace_app(
    req: MarketplaceDeployRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    app_info = MARKETPLACE_APPS.get(req.app_id)
    if not app_info:
        raise HTTPException(status_code=404, detail="Marketplace application template not found")

    if req.is_lxc:
        check_user_quota(current_user, "lxcs")
        existing = await proxmox_client.get_lxcs(node=req.node)
        used_ids = [int(l["vmid"]) for l in existing]
        next_vmid = max(used_ids + [300]) + 1
        
        config = {
            "vmid": next_vmid,
            "hostname": req.name.lower().replace(" ", "-"),
            "cores": req.cores or app_info["cores"],
            "memory": req.memory_mb or app_info["memory_mb"],
            "rootfs": f"local-lvm:{req.disk_gb or app_info['disk_gb']}",
            "ostemplate": "local:vztmpl/ubuntu-22.04-standard_22.04-1_amd64.tar.zst",
            "password": "TotoCloudApp2026!",
            "net0": "name=eth0,bridge=vmbr0,ip=dhcp,firewall=1",
            "unprivileged": 1,
            "start": 1
        }
        res = await proxmox_client.create_lxc(config, node=req.node)
        return {
            "status": "success",
            "vmid": next_vmid,
            "app_id": req.app_id,
            "name": req.name,
            "type": "lxc",
            "message": f"Successfully launched {app_info['name']} on Micro-Container #{next_vmid}"
        }
    else:
        check_user_quota(current_user, "vms")
        existing = await proxmox_client.get_vms(node=req.node)
        used_ids = [int(v["vmid"]) for v in existing]
        next_vmid = max(used_ids + [300]) + 1

        config = {
            "vmid": next_vmid,
            "name": req.name.lower().replace(" ", "-"),
            "cores": req.cores or app_info["cores"],
            "memory": req.memory_mb or app_info["memory_mb"],
            "scsihw": "virtio-scsi-pci",
            "scsi0": f"local-lvm:{req.disk_gb or app_info['disk_gb']}",
            "net0": "virtio,bridge=vmbr0,firewall=1",
            "ostype": "l26",
            "boot": "order=scsi0;ide2;net0"
        }
        res = await proxmox_client.create_vm(config, node=req.node)
        return {
            "status": "success",
            "vmid": next_vmid,
            "app_id": req.app_id,
            "name": req.name,
            "type": "vm",
            "message": f"Successfully deployed {app_info['name']} on Virtual Machine #{next_vmid}"
        }

# ----------------- SNAPSHOTS & DISASTER RECOVERY -----------------

@app.get("/api/snapshots/{vmid}")
async def list_snapshots(vmid: int, is_lxc: bool = False, node: str = "pve", current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        return await proxmox_client.get_snapshots(vmid, is_lxc=is_lxc, node=node)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/snapshots/{vmid}")
async def create_snapshot(
    vmid: int,
    req: SnapshotRequest,
    node: str = "pve",
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    try:
        snapname = req.snapname or f"snap-{uuid.uuid4().hex[:6]}"
        res = await proxmox_client.create_snapshot(
            vmid=vmid,
            snapname=snapname,
            description=req.description or "Automated recovery point",
            is_lxc=req.is_lxc,
            node=node
        )
        return {"status": "success", "snapname": snapname, "data": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/snapshots/{vmid}/{snapname}/rollback")
async def rollback_snapshot(
    vmid: int,
    snapname: str,
    is_lxc: bool = False,
    node: str = "pve",
    admin_user: Dict[str, Any] = Depends(require_admin)
):
    try:
        res = await proxmox_client.rollback_snapshot(vmid=vmid, snapname=snapname, is_lxc=is_lxc, node=node)
        return {"status": "success", "data": res, "snapname": snapname}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/snapshots/{vmid}/{snapname}")
async def delete_snapshot(
    vmid: int,
    snapname: str,
    is_lxc: bool = False,
    node: str = "pve",
    admin_user: Dict[str, Any] = Depends(require_admin)
):
    try:
        res = await proxmox_client.delete_snapshot(vmid=vmid, snapname=snapname, is_lxc=is_lxc, node=node)
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

@app.delete("/api/storage/iso/{volid:path}")
async def delete_iso_image_path(
    volid: str,
    node: str = "pve",
    admin_user: Dict[str, Any] = Depends(require_admin)
):
    """Delete a bootable ISO from the Proxmox storage vault"""
    try:
        res = await proxmox_client.delete_iso(volid=volid, node=node)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete ISO: {str(e)}")

@app.delete("/api/storage/iso")
async def delete_iso_image_query(
    volid: str = Query(..., description="Volume ID or ISO filename to delete"),
    node: str = "pve",
    admin_user: Dict[str, Any] = Depends(require_admin)
):
    """Delete a bootable ISO using query parameter"""
    try:
        res = await proxmox_client.delete_iso(volid=volid, node=node)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete ISO: {str(e)}")

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
            chunk = await file.read(4 * 1024 * 1024)
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
        "scp", "-P", "2222",
        "-o", "StrictHostKeyChecking=no",
        staging_path,
        f"root@127.0.0.1:{dest_path}"
    ]
    
    scp_proc = subprocess.run(scp_cmd, capture_output=True, text=True, timeout=600)
    if scp_proc.returncode != 0:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to transfer ISO to Proxmox vault: {scp_proc.stderr or scp_proc.stdout}"
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
async def download_iso_url(
    req: ISODownloadRequest,
    admin_user: Dict[str, Any] = Depends(require_admin)
):
    """Download ISO directly inside Proxmox hypervisor storage asynchronously"""
    filename = req.filename
    if not filename.endswith(".iso"):
        filename += ".iso"

    cmd = [
        "sshpass", "-p", "ProxmoxAdmin2026!",
        "ssh", "-o", "StrictHostKeyChecking=no", "-p", "2222",
        "root@127.0.0.1",
        f"wget -q -c -O /var/lib/vz/template/iso/{filename} '{req.url}' &"
    ]
    try:
        subprocess.Popen(cmd)
        analysis = analyze_iso(filename)
        return {
            "status": "download_started",
            "filename": filename,
            "volid": f"{req.storage}:iso/{filename}",
            "analysis": analysis,
            "message": f"Download initiated in background for {filename}."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/storage/nfs")
async def mount_nfs_storage(
    req: NFSStorageRequest,
    admin_user: Dict[str, Any] = Depends(require_admin)
):
    try:
        res = await proxmox_client.add_nfs_storage(
            storage=req.storage,
            server=req.server,
            export=req.export,
            content=req.content
        )
        return {"status": "success", "data": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ----------------- SYSTEM STATUS & HEALTH -----------------

@app.get("/api/health")
async def health_check():
    return {
        "status": "online",
        "engine": "Toto Datacenter Orchestrator",
        "version": "2.5.0",
        "cluster_active": True
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8099, reload=False)
