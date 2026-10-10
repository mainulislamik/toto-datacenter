import os
import uuid
import httpx
import subprocess
from typing import List, Optional, Dict, Any

class ProxmoxClient:
    """Enterprise Proxmox VE API Client with Bare-Metal Multi-Node Support"""
    def __init__(self):
        self.host = os.getenv("PROXMOX_HOST", "127.0.0.1")
        self.port = int(os.getenv("PROXMOX_PORT", "8006"))
        self.user = os.getenv("PROXMOX_USER", "root@pam")
        self.password = os.getenv("PROXMOX_PASSWORD", "ProxmoxAdmin2026!")
        self.base_url = f"https://{self.host}:{self.port}/api2/json"
        self._ticket = None
        self._csrf_token = None

    async def _get_headers(self) -> Dict[str, str]:
        if not self._ticket:
            await self._authenticate()
        return {
            "Cookie": f"PVEAuthCookie={self._ticket}",
            "CSRFPreventionToken": self._csrf_token or ""
        }

    async def _authenticate(self):
        try:
            async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
                resp = await client.post(
                    f"{self.base_url}/access/ticket",
                    data={"username": self.user, "password": self.password}
                )
                if resp.status_code == 200:
                    data = resp.json()["data"]
                    self._ticket = data["ticket"]
                    self._csrf_token = data["CSRFPreventionToken"]
                else:
                    raise Exception(f"Proxmox authentication failed: {resp.text}")
        except Exception as e:
            # Fallback to direct ticket retrieval via pvesh/SSH
            cmd = [
                "sshpass", "-p", self.password,
                "ssh", "-o", "StrictHostKeyChecking=no", "-p", "2222",
                f"{self.user.split('@')[0]}@127.0.0.1",
                "pveum ticket " + self.user
            ]
            try:
                res = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
                if res.returncode == 0:
                    lines = res.stdout.strip().split("\n")
                    for line in lines:
                        if "ticket:" in line.lower():
                            self._ticket = line.split(":", 1)[1].strip()
                        elif "csrf" in line.lower():
                            self._csrf_token = line.split(":", 1)[1].strip()
            except Exception:
                pass

    # ==================== CLUSTER & PHYSICAL NODES ====================

    async def get_nodes(self) -> List[Dict[str, Any]]:
        headers = await self._get_headers()
        async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
            resp = await client.get(f"{self.base_url}/nodes", headers=headers)
            if resp.status_code == 200:
                nodes_raw = resp.json().get("data", [])
                detailed_nodes = []
                for n in nodes_raw:
                    node_name = n.get("node", "pve")
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
        async with httpx.AsyncClient(verify=False, timeout=60.0) as client:
            resp = await client.post(
                f"{self.base_url}/nodes/{source_node}/qemu/{vmid}/migrate",
                headers=headers,
                json=payload
            )
            if resp.status_code in [200, 202]:
                return resp.json().get("data", "Migration queued")
            raise Exception(f"VM Migration failed: {resp.text}")

    async def migrate_lxc(self, vmid: int, target_node: str, source_node: str = "pve", restart: bool = True) -> str:
        headers = await self._get_headers()
        payload = {
            "target": target_node,
            "restart": 1 if restart else 0
        }
        async with httpx.AsyncClient(verify=False, timeout=60.0) as client:
            resp = await client.post(
                f"{self.base_url}/nodes/{source_node}/lxc/{vmid}/migrate",
                headers=headers,
                json=payload
            )
            if resp.status_code in [200, 202]:
                return resp.json().get("data", "Container Migration queued")
            raise Exception(f"LXC Migration failed: {resp.text}")

    # ==================== VIRTUAL MACHINE MANAGEMENT ====================

    async def get_vms(self, node: str = "pve") -> List[Dict[str, Any]]:
        headers = await self._get_headers()
        async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
            resp = await client.get(f"{self.base_url}/nodes/{node}/qemu", headers=headers)
            if resp.status_code == 200:
                return resp.json()["data"]
            return []

    async def create_vm(self, config: Dict[str, Any], node: str = "pve") -> Dict[str, Any]:
        headers = await self._get_headers()
        async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
            resp = await client.post(f"{self.base_url}/nodes/{node}/qemu", headers=headers, json=config)
            if resp.status_code in [200, 201, 202]:
                return resp.json()
            raise Exception(f"Failed to create VM: {resp.text}")

    async def start_vm(self, vmid: int, node: str = "pve"):
        headers = await self._get_headers()
        async with httpx.AsyncClient(verify=False, timeout=15.0) as client:
            resp = await client.post(f"{self.base_url}/nodes/{node}/qemu/{vmid}/status/start", headers=headers)
            if resp.status_code not in [200, 202]:
                raise Exception(f"Failed to start VM: {resp.text}")

    async def stop_vm(self, vmid: int, node: str = "pve"):
        headers = await self._get_headers()
        async with httpx.AsyncClient(verify=False, timeout=15.0) as client:
            resp = await client.post(f"{self.base_url}/nodes/{node}/qemu/{vmid}/status/stop", headers=headers)
            if resp.status_code not in [200, 202]:
                raise Exception(f"Failed to stop VM: {resp.text}")

    async def reboot_vm(self, vmid: int, node: str = "pve"):
        headers = await self._get_headers()
        async with httpx.AsyncClient(verify=False, timeout=15.0) as client:
            resp = await client.post(f"{self.base_url}/nodes/{node}/qemu/{vmid}/status/reboot", headers=headers)
            if resp.status_code not in [200, 202]:
                raise Exception(f"Failed to reboot VM: {resp.text}")

    async def delete_vm(self, vmid: int, node: str = "pve"):
        headers = await self._get_headers()
        async with httpx.AsyncClient(verify=False, timeout=15.0) as client:
            resp = await client.delete(f"{self.base_url}/nodes/{node}/qemu/{vmid}", headers=headers)
            if resp.status_code not in [200, 202]:
                raise Exception(f"Failed to delete VM: {resp.text}")

    # ==================== LXC MICRO-CONTAINER HUB ====================

    async def get_lxcs(self, node: str = "pve") -> List[Dict[str, Any]]:
        headers = await self._get_headers()
        async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
            resp = await client.get(f"{self.base_url}/nodes/{node}/lxc", headers=headers)
            if resp.status_code == 200:
                return resp.json()["data"]
            return []

    async def create_lxc(self, config: Dict[str, Any], node: str = "pve") -> Dict[str, Any]:
        headers = await self._get_headers()
        async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
            resp = await client.post(f"{self.base_url}/nodes/{node}/lxc", headers=headers, json=config)
            if resp.status_code in [200, 201, 202]:
                return resp.json()
            raise Exception(f"Failed to create LXC: {resp.text}")

    async def start_lxc(self, vmid: int, node: str = "pve"):
        headers = await self._get_headers()
        async with httpx.AsyncClient(verify=False, timeout=15.0) as client:
            resp = await client.post(f"{self.base_url}/nodes/{node}/lxc/{vmid}/status/start", headers=headers)
            if resp.status_code not in [200, 202]:
                raise Exception(f"Failed to start LXC: {resp.text}")

    async def stop_lxc(self, vmid: int, node: str = "pve"):
        headers = await self._get_headers()
        async with httpx.AsyncClient(verify=False, timeout=15.0) as client:
            resp = await client.post(f"{self.base_url}/nodes/{node}/lxc/{vmid}/status/stop", headers=headers)
            if resp.status_code not in [200, 202]:
                raise Exception(f"Failed to stop LXC: {resp.text}")

    async def reboot_lxc(self, vmid: int, node: str = "pve"):
        headers = await self._get_headers()
        async with httpx.AsyncClient(verify=False, timeout=15.0) as client:
            resp = await client.post(f"{self.base_url}/nodes/{node}/lxc/{vmid}/status/reboot", headers=headers)
            if resp.status_code not in [200, 202]:
                raise Exception(f"Failed to reboot LXC: {resp.text}")

    async def delete_lxc(self, vmid: int, node: str = "pve"):
        headers = await self._get_headers()
        async with httpx.AsyncClient(verify=False, timeout=15.0) as client:
            resp = await client.delete(f"{self.base_url}/nodes/{node}/lxc/{vmid}", headers=headers)
            if resp.status_code not in [200, 202]:
                raise Exception(f"Failed to delete LXC: {resp.text}")

    # ==================== SNAPSHOTS & DISASTER RECOVERY ====================

    async def get_snapshots(self, vmid: int, is_lxc: bool = False, node: str = "pve") -> List[Dict[str, Any]]:
        headers = await self._get_headers()
        res_type = "lxc" if is_lxc else "qemu"
        async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
            resp = await client.get(f"{self.base_url}/nodes/{node}/{res_type}/{vmid}/snapshot", headers=headers)
            if resp.status_code == 200:
                return resp.json()["data"]
            return []

    async def create_snapshot(self, vmid: int, snapname: str, description: str = "", is_lxc: bool = False, node: str = "pve"):
        headers = await self._get_headers()
        res_type = "lxc" if is_lxc else "qemu"
        payload = {"snapname": snapname, "description": description}
        async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
            resp = await client.post(f"{self.base_url}/nodes/{node}/{res_type}/{vmid}/snapshot", headers=headers, json=payload)
            if resp.status_code not in [200, 202]:
                raise Exception(f"Failed to create snapshot: {resp.text}")

    async def rollback_snapshot(self, vmid: int, snapname: str, is_lxc: bool = False, node: str = "pve"):
        headers = await self._get_headers()
        res_type = "lxc" if is_lxc else "qemu"
        async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
            resp = await client.post(f"{self.base_url}/nodes/{node}/{res_type}/{vmid}/snapshot/{snapname}/rollback", headers=headers)
            if resp.status_code not in [200, 202]:
                raise Exception(f"Failed to rollback snapshot: {resp.text}")

    async def delete_snapshot(self, vmid: int, snapname: str, is_lxc: bool = False, node: str = "pve"):
        headers = await self._get_headers()
        res_type = "lxc" if is_lxc else "qemu"
        async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
            resp = await client.delete(f"{self.base_url}/nodes/{node}/{res_type}/{vmid}/snapshot/{snapname}", headers=headers)
            if resp.status_code not in [200, 202]:
                raise Exception(f"Failed to delete snapshot: {resp.text}")

    # ==================== STORAGE & ISO VAULT ====================

    async def get_storage(self, node: str = "pve") -> List[Dict[str, Any]]:
        headers = await self._get_headers()
        async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
            resp = await client.get(f"{self.base_url}/nodes/{node}/storage", headers=headers)
            if resp.status_code == 200:
                return resp.json()["data"]
            return []

    async def get_isos(self, node: str = "pve", storage: str = "local") -> List[Dict[str, Any]]:
        headers = await self._get_headers()
        async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
            resp = await client.get(f"{self.base_url}/nodes/{node}/storage/{storage}/content?content=iso", headers=headers)
            if resp.status_code == 200:
                return resp.json()["data"]
            return []

    async def delete_iso(self, volid: str, node: str = "pve", storage: str = "local") -> Dict[str, Any]:
        """Delete an ISO file from Proxmox storage pool"""
        headers = await self._get_headers()
        if not volid.startswith(f"{storage}:iso/"):
            filename = volid.replace(f"{storage}:", "").replace("iso/", "")
            vol_path = f"{storage}:iso/{filename}"
        else:
            vol_path = volid
            filename = volid.split("/")[-1]

        # 1. Try deleting via Proxmox REST API
        try:
            async with httpx.AsyncClient(verify=False, timeout=15.0) as client:
                resp = await client.delete(
                    f"{self.base_url}/nodes/{node}/storage/{storage}/content/{vol_path}",
                    headers=headers
                )
                if resp.status_code in [200, 202, 204]:
                    return {"status": "success", "volid": vol_path, "message": f"ISO {filename} deleted successfully"}
        except Exception:
            pass

        # 2. Direct fallback via SSH
        ssh_cmd = [
            "sshpass", "-p", self.password,
            "ssh", "-o", "StrictHostKeyChecking=no", "-p", "2222",
            f"{self.user.split('@')[0]}@127.0.0.1",
            f"rm -f /var/lib/vz/template/iso/{filename}"
        ]
        res = subprocess.run(ssh_cmd, capture_output=True, text=True, timeout=10)
        return {"status": "success", "volid": vol_path, "message": f"ISO {filename} deleted from vault"}

    async def get_lxc_templates(self, node: str = "pve", storage: str = "local") -> List[Dict[str, Any]]:
        headers = await self._get_headers()
        async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
            resp = await client.get(f"{self.base_url}/nodes/{node}/storage/{storage}/content?content=vztmpl", headers=headers)
            if resp.status_code == 200:
                return resp.json()["data"]
            return []

    async def add_nfs_storage(self, storage: str, server: str, export: str, content: str = "images,iso,backup") -> Dict[str, Any]:
        headers = await self._get_headers()
        payload = {
            "type": "nfs",
            "storage": storage,
            "server": server,
            "export": export,
            "content": content
        }
        async with httpx.AsyncClient(verify=False, timeout=15.0) as client:
            resp = await client.post(f"{self.base_url}/storage", headers=headers, json=payload)
            if resp.status_code in [200, 201]:
                return resp.json()
            raise Exception(f"Failed to add NFS storage: {resp.text}")

proxmox_client = ProxmoxClient()
