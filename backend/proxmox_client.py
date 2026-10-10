import os
import uuid
import httpx
import subprocess
from typing import List, Optional, Dict, Any

class ProxmoxClient:
    """Enterprise Proxmox VE API Client with Bare-Metal Multi-Node Support"""
    def __init__(self):
        self.host = os.getenv("PROXMOX_HOST", "127.0.0.1")
        self.port = os.getenv("PROXMOX_PORT", "8006")
        self.user = os.getenv("PROXMOX_USER", "root@pam")
        self.token_name = os.getenv("PROXMOX_TOKEN_NAME", "toto-agent")
        self.token_value = os.getenv("PROXMOX_TOKEN_VALUE", "d95ab655-37a4-4fd6-aed4-241693f8c2b0")
        self.password = os.getenv("PROXMOX_PASSWORD", "ProxmoxAdmin2026!")
        self.base_url = f"https://{self.host}:{self.port}/api2/json"
        self._ticket: Optional[str] = None
        self._csrf: Optional[str] = None

    async def _get_headers(self) -> Dict[str, str]:
        # Return PVE API Token header by default
        if self.token_value:
            return {
                "Authorization": f"PVEAPIToken={self.user}!{self.token_name}={self.token_value}",
                "Content-Type": "application/json"
            }
        return {"Content-Type": "application/json"}

    # ==================== CLUSTER & PHYSICAL NODES ====================

    async def get_nodes(self) -> List[Dict[str, Any]]:
        headers = await self._get_headers()
        async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
            resp = await client.get(f"{self.base_url}/nodes", headers=headers)
            if resp.status_code == 200:
                return resp.json()["data"]
            return []

    async def get_node_status(self, node: str = "pve") -> Dict[str, Any]:
        headers = await self._get_headers()
        async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
            resp = await client.get(f"{self.base_url}/nodes/{node}/status", headers=headers)
            if resp.status_code == 200:
                return resp.json()["data"]
            return {}

    async def get_cluster_status(self) -> List[Dict[str, Any]]:
        headers = await self._get_headers()
        async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
            resp = await client.get(f"{self.base_url}/cluster/status", headers=headers)
            if resp.status_code == 200:
                return resp.json()["data"]
            return []

    async def get_join_info(self, node: str = "pve") -> Dict[str, Any]:
        headers = await self._get_headers()
        async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
            resp = await client.get(f"{self.base_url}/nodes/{node}/cluster/config/join", headers=headers)
            if resp.status_code == 200:
                return resp.json()["data"]
            return {}

    # ==================== KVM VIRTUAL MACHINES ====================

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

    async def get_vm_config(self, vmid: int, node: str = "pve") -> Dict[str, Any]:
        headers = await self._get_headers()
        async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
            resp = await client.get(f"{self.base_url}/nodes/{node}/qemu/{vmid}/config", headers=headers)
            if resp.status_code == 200:
                return resp.json()["data"]
            return {}

    async def update_vm_config(self, vmid: int, config: Dict[str, Any], node: str = "pve") -> Dict[str, Any]:
        headers = await self._get_headers()
        async with httpx.AsyncClient(verify=False, timeout=15.0) as client:
            resp = await client.put(f"{self.base_url}/nodes/{node}/qemu/{vmid}/config", headers=headers, json=config)
            if resp.status_code in [200, 201, 202]:
                return resp.json()
            raise Exception(f"Failed to update VM config: {resp.text}")

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

    async def shutdown_vm(self, vmid: int, node: str = "pve"):
        headers = await self._get_headers()
        async with httpx.AsyncClient(verify=False, timeout=15.0) as client:
            resp = await client.post(f"{self.base_url}/nodes/{node}/qemu/{vmid}/status/shutdown", headers=headers)
            if resp.status_code not in [200, 202]:
                raise Exception(f"Failed to shutdown VM: {resp.text}")

    async def reset_vm(self, vmid: int, node: str = "pve"):
        headers = await self._get_headers()
        async with httpx.AsyncClient(verify=False, timeout=15.0) as client:
            resp = await client.post(f"{self.base_url}/nodes/{node}/qemu/{vmid}/status/reset", headers=headers)
            if resp.status_code not in [200, 202]:
                raise Exception(f"Failed to reset VM: {resp.text}")

    async def suspend_vm(self, vmid: int, node: str = "pve"):
        headers = await self._get_headers()
        async with httpx.AsyncClient(verify=False, timeout=15.0) as client:
            resp = await client.post(f"{self.base_url}/nodes/{node}/qemu/{vmid}/status/suspend", headers=headers)
            if resp.status_code not in [200, 202]:
                raise Exception(f"Failed to suspend VM: {resp.text}")

    async def resume_vm(self, vmid: int, node: str = "pve"):
        headers = await self._get_headers()
        async with httpx.AsyncClient(verify=False, timeout=15.0) as client:
            resp = await client.post(f"{self.base_url}/nodes/{node}/qemu/{vmid}/status/resume", headers=headers)
            if resp.status_code not in [200, 202]:
                raise Exception(f"Failed to resume VM: {resp.text}")

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

    async def resize_vm_disk(self, vmid: int, disk: str, size: str, node: str = "pve") -> Dict[str, Any]:
        headers = await self._get_headers()
        async with httpx.AsyncClient(verify=False, timeout=15.0) as client:
            resp = await client.put(f"{self.base_url}/nodes/{node}/qemu/{vmid}/resize", headers=headers, json={"disk": disk, "size": size})
            if resp.status_code in [200, 202]:
                return resp.json()
            raise Exception(f"Failed to resize VM disk: {resp.text}")

    async def get_vm_vnc(self, vmid: int, node: str = "pve") -> Dict[str, Any]:
        headers = await self._get_headers()
        async with httpx.AsyncClient(verify=False, timeout=15.0) as client:
            resp = await client.post(f"{self.base_url}/nodes/{node}/qemu/{vmid}/vncproxy", headers=headers, json={"websocket": 1})
            if resp.status_code in [200, 202]:
                return resp.json()["data"]
            return {"vmid": vmid, "port": 5900 + vmid}

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

    # ==================== LIVE MIGRATION ====================

    async def migrate_vm(self, vmid: int, target_node: str, source_node: str = "pve", online: bool = True) -> Dict[str, Any]:
        headers = await self._get_headers()
        payload = {"target": target_node, "online": 1 if online else 0}
        async with httpx.AsyncClient(verify=False, timeout=60.0) as client:
            resp = await client.post(f"{self.base_url}/nodes/{source_node}/qemu/{vmid}/migrate", headers=headers, json=payload)
            if resp.status_code in [200, 202]:
                return resp.json()
            raise Exception(f"Failed to migrate VM {vmid}: {resp.text}")

    async def migrate_lxc(self, vmid: int, target_node: str, source_node: str = "pve", restart: bool = True) -> Dict[str, Any]:
        headers = await self._get_headers()
        payload = {"target": target_node, "restart": 1 if restart else 0}
        async with httpx.AsyncClient(verify=False, timeout=60.0) as client:
            resp = await client.post(f"{self.base_url}/nodes/{source_node}/lxc/{vmid}/migrate", headers=headers, json=payload)
            if resp.status_code in [200, 202]:
                return resp.json()
            raise Exception(f"Failed to migrate LXC {vmid}: {resp.text}")

    # ==================== SNAPSHOTS & DISASTER RECOVERY ====================

    async def get_snapshots(self, vmid: int, is_lxc: bool = False, node: str = "pve") -> List[Dict[str, Any]]:
        headers = await self._get_headers()
        endpoint = "lxc" if is_lxc else "qemu"
        async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
            resp = await client.get(f"{self.base_url}/nodes/{node}/{endpoint}/{vmid}/snapshot", headers=headers)
            if resp.status_code == 200:
                return resp.json()["data"]
            return []

    async def create_snapshot(self, vmid: int, snapname: str, description: str = "", is_lxc: bool = False, node: str = "pve") -> Dict[str, Any]:
        headers = await self._get_headers()
        endpoint = "lxc" if is_lxc else "qemu"
        payload = {"snapname": snapname, "description": description, "vmstate": 1}
        async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
            resp = await client.post(f"{self.base_url}/nodes/{node}/{endpoint}/{vmid}/snapshot", headers=headers, json=payload)
            if resp.status_code in [200, 202]:
                return resp.json()
            raise Exception(f"Failed to create snapshot: {resp.text}")

    async def rollback_snapshot(self, vmid: int, snapname: str, is_lxc: bool = False, node: str = "pve") -> Dict[str, Any]:
        headers = await self._get_headers()
        endpoint = "lxc" if is_lxc else "qemu"
        async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
            resp = await client.post(f"{self.base_url}/nodes/{node}/{endpoint}/{vmid}/snapshot/{snapname}/rollback", headers=headers)
            if resp.status_code in [200, 202]:
                return resp.json()
            raise Exception(f"Failed to rollback snapshot: {resp.text}")

    async def delete_snapshot(self, vmid: int, snapname: str, is_lxc: bool = False, node: str = "pve") -> Dict[str, Any]:
        headers = await self._get_headers()
        endpoint = "lxc" if is_lxc else "qemu"
        async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
            resp = await client.delete(f"{self.base_url}/nodes/{node}/{endpoint}/{vmid}/snapshot/{snapname}", headers=headers)
            if resp.status_code in [200, 202]:
                return resp.json()
            raise Exception(f"Failed to delete snapshot: {resp.text}")

    # ==================== STORAGE & ISO VAULT ====================

    async def get_storage(self, node: str = "pve") -> List[Dict[str, Any]]:
        headers = await self._get_headers()
        async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
            resp = await client.get(f"{self.base_url}/nodes/{node}/storage", headers=headers)
            if resp.status_code == 200:
                return resp.json()["data"]
            return []

    async def get_isos(self, node: str = "pve", storage: Optional[str] = None) -> List[Dict[str, Any]]:
        headers = await self._get_headers()
        storages_to_check = [storage] if storage else ["extra-ssd", "local"]
        all_isos = []
        seen_volids = set()

        async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
            for s in storages_to_check:
                try:
                    resp = await client.get(f"{self.base_url}/nodes/{node}/storage/{s}/content?content=iso", headers=headers)
                    if resp.status_code == 200:
                        data = resp.json().get("data", [])
                        for item in data:
                            if item.get("volid") not in seen_volids:
                                seen_volids.add(item.get("volid"))
                                item["storage_pool"] = s
                                all_isos.append(item)
                except Exception:
                    pass
        return all_isos

    async def delete_iso(self, volid: str, node: str = "pve", storage: Optional[str] = None) -> Dict[str, Any]:
        """Delete an ISO file from Proxmox storage pool"""
        headers = await self._get_headers()
        if ":" in volid:
            storage_name = volid.split(":")[0]
            vol_path = volid
            filename = volid.split("/")[-1]
        else:
            storage_name = storage or "local"
            filename = volid.replace(f"{storage_name}:", "").replace("iso/", "")
            vol_path = f"{storage_name}:iso/{filename}"

        # 1. Delete via Proxmox REST API
        try:
            async with httpx.AsyncClient(verify=False, timeout=15.0) as client:
                resp = await client.delete(
                    f"{self.base_url}/nodes/{node}/storage/{storage_name}/content/{vol_path}",
                    headers=headers
                )
                if resp.status_code in [200, 204]:
                    return {"status": "success", "volid": vol_path, "message": f"ISO {filename} deleted successfully"}
        except Exception:
            pass

        # 2. Direct SSH deletion fallback
        paths_to_clean = [
            f"/mnt/extra-vault/template/iso/{filename}",
            f"/var/lib/vz/template/iso/{filename}"
        ]
        clean_cmd = f"rm -f {' '.join(paths_to_clean)}"
        ssh_cmd = [
            "sshpass", "-p", "ProxmoxAdmin2026!",
            "ssh", "-o", "StrictHostKeyChecking=no", "-p", "2222", "root@127.0.0.1",
            clean_cmd
        ]
        subprocess.run(ssh_cmd, check=False)
        return {"status": "success", "volid": vol_path, "message": f"ISO {filename} deleted successfully"}

    async def move_iso_to_extra(self, filename: str) -> Dict[str, Any]:
        """Move an ISO from root local (/var/lib/vz) to extra-ssd (/mnt/extra-vault)"""
        cmd = f"mv -f /var/lib/vz/template/iso/{filename} /mnt/extra-vault/template/iso/{filename} 2>/dev/null || true"
        ssh_cmd = [
            "sshpass", "-p", "ProxmoxAdmin2026!",
            "ssh", "-o", "StrictHostKeyChecking=no", "-p", "2222", "root@127.0.0.1",
            cmd
        ]
        proc = subprocess.run(ssh_cmd, capture_output=True, text=True, timeout=120)
        return {"status": "success", "filename": filename, "target_storage": "extra-ssd"}

    async def add_nfs_storage(self, storage: str, server: str, export: str, node: str = "pve") -> Dict[str, Any]:
        headers = await self._get_headers()
        payload = {
            "storage": storage,
            "type": "nfs",
            "server": server,
            "export": export,
            "content": "images,iso,backup,vztmpl"
        }
        async with httpx.AsyncClient(verify=False, timeout=15.0) as client:
            resp = await client.post(f"{self.base_url}/storage", headers=headers, json=payload)
            if resp.status_code in [200, 201]:
                return resp.json()
            raise Exception(f"Failed to add NFS storage: {resp.text}")

proxmox_client = ProxmoxClient()
