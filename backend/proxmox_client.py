import os
import time
import httpx
from typing import Dict, Any, List, Optional

PROXMOX_HOST = os.getenv("PROXMOX_HOST", "127.0.0.1")
PROXMOX_PORT = int(os.getenv("PROXMOX_PORT", "8006"))
PROXMOX_USER = os.getenv("PROXMOX_USER", "root@pam")
PROXMOX_PASSWORD = os.getenv("PROXMOX_PASSWORD", "ProxmoxAdmin2026!")

class ProxmoxClient:
    def __init__(self):
        self.base_url = f"https://{PROXMOX_HOST}:{PROXMOX_PORT}/api2/json"
        self.ticket = None
        self.csrf_token = None
        self.ticket_time = 0

    async def _ensure_auth(self):
        if self.ticket and (time.time() - self.ticket_time < 3600):
            return
        
        async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
            resp = await client.post(
                f"{self.base_url}/access/ticket",
                data={"username": PROXMOX_USER, "password": PROXMOX_PASSWORD}
            )
            if resp.status_code == 200:
                data = resp.json()["data"]
                self.ticket = data["ticket"]
                self.csrf_token = data["CSRFPreventionToken"]
                self.ticket_time = time.time()
            else:
                raise Exception(f"Failed to authenticate with Proxmox: {resp.text}")

    async def _get_headers(self):
        await self._ensure_auth()
        return {
            "Cookie": f"PVEAuthCookie={self.ticket}",
            "CSRFPreventionToken": self.csrf_token or ""
        }

    # ==================== CLUSTER & MULTI-NODE API ====================

    async def get_cluster_status(self) -> List[Dict[str, Any]]:
        headers = await self._get_headers()
        async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
            resp = await client.get(f"{self.base_url}/cluster/status", headers=headers)
            if resp.status_code == 200:
                return resp.json().get("data", [])
            return []

    async def get_cluster_join_info(self) -> Dict[str, Any]:
        headers = await self._get_headers()
        async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
            resp = await client.get(f"{self.base_url}/cluster/config/join", headers=headers)
            if resp.status_code == 200:
                return resp.json().get("data", {})
            return {}

    async def get_nodes(self) -> List[Dict[str, Any]]:
        headers = await self._get_headers()
        async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
            resp = await client.get(f"{self.base_url}/nodes", headers=headers)
            if resp.status_code == 200:
                nodes = resp.json()["data"]
                # Fetch detailed telemetry for each node
                detailed_nodes = []
                for n in nodes:
                    node_name = n.get("node")
                    try:
                        status_resp = await client.get(f"{self.base_url}/nodes/{node_name}/status", headers=headers)
                        if status_resp.status_code == 200:
                            n_status = status_resp.json().get("data", {})
                            n["cpuinfo"] = n_status.get("cpuinfo", {})
                            n["memory"] = n_status.get("memory", {})
                            n["rootfs"] = n_status.get("rootfs", {})
                            n["pveversion"] = n_status.get("pveversion", "8.4")
                            n["kversion"] = n_status.get("kversion", "")
                            n["loadavg"] = n_status.get("loadavg", [0, 0, 0])
                            n["uptime"] = n_status.get("uptime", 0)
                    except Exception:
                        pass
                    detailed_nodes.append(n)
                return detailed_nodes
            return []

    async def get_node_status(self, node: str = "pve") -> Dict[str, Any]:
        headers = await self._get_headers()
        async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
            resp = await client.get(f"{self.base_url}/nodes/{node}/status", headers=headers)
            if resp.status_code == 200:
                return resp.json()["data"]
            return {}

    async def get_node_rrd(self, node: str = "pve", timeframe: str = "hour") -> List[Dict[str, Any]]:
        headers = await self._get_headers()
        async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
            resp = await client.get(f"{self.base_url}/nodes/{node}/rrddata?timeframe={timeframe}", headers=headers)
            if resp.status_code == 200:
                return resp.json()["data"]
            return []

    # ==================== LIVE VM & LXC MIGRATION ====================

    async def migrate_vm(self, vmid: int, target_node: str, source_node: str = "pve", online: bool = True) -> str:
        headers = await self._get_headers()
        payload = {
            "target": target_node,
            "online": 1 if online else 0
        }
        async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
            resp = await client.post(f"{self.base_url}/nodes/{source_node}/qemu/{vmid}/migrate", headers=headers, json=payload)
            if resp.status_code == 200:
                return resp.json().get("data", "Migration queued")
            raise Exception(f"VM Live Migration failed: {resp.text}")

    async def migrate_lxc(self, vmid: int, target_node: str, source_node: str = "pve", restart: bool = True) -> str:
        headers = await self._get_headers()
        payload = {
            "target": target_node,
            "restart": 1 if restart else 0
        }
        async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
            resp = await client.post(f"{self.base_url}/nodes/{source_node}/lxc/{vmid}/migrate", headers=headers, json=payload)
            if resp.status_code == 200:
                return resp.json().get("data", "LXC Migration queued")
            raise Exception(f"LXC Migration failed: {resp.text}")

    # ==================== VM OPERATIONS ====================

    async def get_vms(self, node: str = "pve") -> List[Dict[str, Any]]:
        headers = await self._get_headers()
        async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
            resp = await client.get(f"{self.base_url}/nodes/{node}/qemu", headers=headers)
            if resp.status_code == 200:
                return resp.json()["data"]
            return []

    async def get_vm_status(self, vmid: int, node: str = "pve") -> Dict[str, Any]:
        headers = await self._get_headers()
        async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
            resp = await client.get(f"{self.base_url}/nodes/{node}/qemu/{vmid}/status/current", headers=headers)
            if resp.status_code == 200:
                return resp.json()["data"]
            return {}

    async def create_vm(self, config: Dict[str, Any], node: str = "pve") -> Dict[str, Any]:
        headers = await self._get_headers()
        async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
            resp = await client.post(f"{self.base_url}/nodes/{node}/qemu", headers=headers, json=config)
            if resp.status_code == 200:
                return resp.json()
            raise Exception(f"Failed to create VM: {resp.text}")

    async def start_vm(self, vmid: int, node: str = "pve"):
        headers = await self._get_headers()
        async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
            resp = await client.post(f"{self.base_url}/nodes/{node}/qemu/{vmid}/status/start", headers=headers)
            return resp.status_code == 200

    async def stop_vm(self, vmid: int, node: str = "pve"):
        headers = await self._get_headers()
        async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
            resp = await client.post(f"{self.base_url}/nodes/{node}/qemu/{vmid}/status/stop", headers=headers)
            return resp.status_code == 200

    async def reboot_vm(self, vmid: int, node: str = "pve"):
        headers = await self._get_headers()
        async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
            resp = await client.post(f"{self.base_url}/nodes/{node}/qemu/{vmid}/status/reboot", headers=headers)
            return resp.status_code == 200

    async def delete_vm(self, vmid: int, node: str = "pve"):
        headers = await self._get_headers()
        async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
            resp = await client.delete(f"{self.base_url}/nodes/{node}/qemu/{vmid}", headers=headers)
            return resp.status_code == 200

    # ==================== LXC OPERATIONS ====================

    async def get_lxcs(self, node: str = "pve") -> List[Dict[str, Any]]:
        headers = await self._get_headers()
        async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
            resp = await client.get(f"{self.base_url}/nodes/{node}/lxc", headers=headers)
            if resp.status_code == 200:
                return resp.json().get("data", [])
            return []

    async def create_lxc(self, config: Dict[str, Any], node: str = "pve") -> Dict[str, Any]:
        headers = await self._get_headers()
        async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
            resp = await client.post(f"{self.base_url}/nodes/{node}/lxc", headers=headers, json=config)
            if resp.status_code == 200:
                return resp.json()
            raise Exception(f"Failed to create LXC: {resp.text}")

    async def start_lxc(self, vmid: int, node: str = "pve"):
        headers = await self._get_headers()
        async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
            resp = await client.post(f"{self.base_url}/nodes/{node}/lxc/{vmid}/status/start", headers=headers)
            return resp.status_code == 200

    async def stop_lxc(self, vmid: int, node: str = "pve"):
        headers = await self._get_headers()
        async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
            resp = await client.post(f"{self.base_url}/nodes/{node}/lxc/{vmid}/status/stop", headers=headers)
            return resp.status_code == 200

    async def reboot_lxc(self, vmid: int, node: str = "pve"):
        headers = await self._get_headers()
        async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
            resp = await client.post(f"{self.base_url}/nodes/{node}/lxc/{vmid}/status/reboot", headers=headers)
            return resp.status_code == 200

    async def delete_lxc(self, vmid: int, node: str = "pve"):
        headers = await self._get_headers()
        async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
            resp = await client.delete(f"{self.base_url}/nodes/{node}/lxc/{vmid}", headers=headers)
            return resp.status_code == 200

    # ==================== SNAPSHOTS ====================

    async def get_snapshots(self, vmid: int, is_lxc: bool = False, node: str = "pve") -> List[Dict[str, Any]]:
        headers = await self._get_headers()
        res_type = "lxc" if is_lxc else "qemu"
        async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
            resp = await client.get(f"{self.base_url}/nodes/{node}/{res_type}/{vmid}/snapshot", headers=headers)
            if resp.status_code == 200:
                return resp.json().get("data", [])
            return []

    async def create_snapshot(self, vmid: int, snapname: str, description: str = "", is_lxc: bool = False, node: str = "pve") -> Dict[str, Any]:
        headers = await self._get_headers()
        res_type = "lxc" if is_lxc else "qemu"
        payload = {"snapname": snapname, "description": description}
        if not is_lxc:
            payload["vmstate"] = 1
        async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
            resp = await client.post(f"{self.base_url}/nodes/{node}/{res_type}/{vmid}/snapshot", headers=headers, json=payload)
            if resp.status_code == 200:
                return resp.json()
            raise Exception(f"Snapshot creation failed: {resp.text}")

    async def rollback_snapshot(self, vmid: int, snapname: str, is_lxc: bool = False, node: str = "pve") -> Dict[str, Any]:
        headers = await self._get_headers()
        res_type = "lxc" if is_lxc else "qemu"
        async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
            resp = await client.post(f"{self.base_url}/nodes/{node}/{res_type}/{vmid}/snapshot/{snapname}/rollback", headers=headers)
            if resp.status_code == 200:
                return resp.json()
            raise Exception(f"Snapshot rollback failed: {resp.text}")

    async def delete_snapshot(self, vmid: int, snapname: str, is_lxc: bool = False, node: str = "pve") -> Dict[str, Any]:
        headers = await self._get_headers()
        res_type = "lxc" if is_lxc else "qemu"
        async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
            resp = await client.delete(f"{self.base_url}/nodes/{node}/{res_type}/{vmid}/snapshot/{snapname}", headers=headers)
            if resp.status_code == 200:
                return resp.json()
            raise Exception(f"Snapshot deletion failed: {resp.text}")

    # ==================== STORAGE & EXPANSION ====================

    async def get_storage(self, node: str = "pve") -> List[Dict[str, Any]]:
        headers = await self._get_headers()
        async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
            resp = await client.get(f"{self.base_url}/nodes/{node}/storage", headers=headers)
            if resp.status_code == 200:
                return resp.json()["data"]
            return []

    async def add_nfs_storage(self, storage: str, server: str, export: str, content: str = "images,iso,backup") -> Dict[str, Any]:
        headers = await self._get_headers()
        payload = {
            "storage": storage,
            "type": "nfs",
            "server": server,
            "export": export,
            "content": content
        }
        async with httpx.AsyncClient(verify=False, timeout=15.0) as client:
            resp = await client.post(f"{self.base_url}/storage", headers=headers, json=payload)
            if resp.status_code == 200:
                return resp.json()
            raise Exception(f"Failed to add NFS storage: {resp.text}")

    async def get_isos(self, node: str = "pve", storage: str = "local") -> List[Dict[str, Any]]:
        headers = await self._get_headers()
        async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
            resp = await client.get(f"{self.base_url}/nodes/{node}/storage/{storage}/content?content=iso", headers=headers)
            if resp.status_code == 200:
                return resp.json()["data"]
            return []

    async def get_lxc_templates(self, node: str = "pve", storage: str = "local") -> List[Dict[str, Any]]:
        headers = await self._get_headers()
        async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
            resp = await client.get(f"{self.base_url}/nodes/{node}/storage/{storage}/content?content=vztmpl", headers=headers)
            if resp.status_code == 200:
                return resp.json().get("data", [])
            return []

    async def get_next_vmid(self) -> int:
        headers = await self._get_headers()
        async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
            resp = await client.get(f"{self.base_url}/cluster/nextid", headers=headers)
            if resp.status_code == 200:
                return int(resp.json()["data"])
            return 100

    async def get_vnc_proxy(self, vmid: int, node: str = "pve") -> Dict[str, Any]:
        headers = await self._get_headers()
        async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
            resp = await client.post(f"{self.base_url}/nodes/{node}/qemu/{vmid}/vncproxy", headers=headers, json={"websocket": 1})
            if resp.status_code == 200:
                return resp.json()["data"]
            return {}

proxmox_client = ProxmoxClient()
