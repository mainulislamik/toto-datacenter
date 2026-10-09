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
        self.ticket: Optional[str] = None
        self.csrf_token: Optional[str] = None
        self.ticket_expires: float = 0

    async def _ensure_auth(self):
        if self.ticket and time.time() < self.ticket_expires:
            return

        async with httpx.AsyncClient(verify=False, timeout=15.0) as client:
            resp = await client.post(
                f"{self.base_url}/access/ticket",
                data={"username": PROXMOX_USER, "password": PROXMOX_PASSWORD}
            )
            if resp.status_code != 200:
                raise Exception(f"Failed to authenticate with Proxmox: {resp.text}")

            data = resp.json()["data"]
            self.ticket = data["ticket"]
            self.csrf_token = data["CSRFPreventionToken"]
            self.ticket_expires = time.time() + 7000

    async def _request(self, method: str, path: str, data: Optional[Dict[str, Any]] = None, params: Optional[Dict[str, Any]] = None) -> Any:
        await self._ensure_auth()
        headers = {
            "CSRFPreventionToken": self.csrf_token,
            "Cookie": f"PVEAuthCookie={self.ticket}"
        }
        url = f"{self.base_url}{path}"
        async with httpx.AsyncClient(verify=False, timeout=60.0) as client:
            if method.upper() == "GET":
                resp = await client.get(url, headers=headers, params=params)
            elif method.upper() == "POST":
                resp = await client.post(url, headers=headers, data=data, params=params)
            elif method.upper() == "PUT":
                resp = await client.put(url, headers=headers, data=data, params=params)
            elif method.upper() == "DELETE":
                resp = await client.delete(url, headers=headers, params=params)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")

            if resp.status_code not in [200, 201, 204]:
                raise Exception(f"Proxmox API Error [{resp.status_code}]: {resp.text}")

            res = resp.json()
            return res.get("data", res)

    # Next Available VMID Helper
    async def get_next_vmid(self) -> int:
        data = await self._request("GET", "/cluster/nextid")
        return int(data)

    # Cluster & Node Health
    async def get_cluster_status(self) -> List[Dict[str, Any]]:
        return await self._request("GET", "/cluster/status")

    async def get_cluster_resources(self) -> List[Dict[str, Any]]:
        return await self._request("GET", "/cluster/resources")

    async def get_nodes(self) -> List[Dict[str, Any]]:
        return await self._request("GET", "/nodes")

    async def get_node_status(self, node: str = "pve") -> Dict[str, Any]:
        return await self._request("GET", f"/nodes/{node}/status")

    async def get_rrd_data(self, node: str = "pve", timeframe: str = "hour") -> List[Dict[str, Any]]:
        return await self._request("GET", f"/nodes/{node}/rrddata", params={"timeframe": timeframe})

    # QEMU / KVM Virtual Machines
    async def get_vms(self, node: str = "pve") -> List[Dict[str, Any]]:
        return await self._request("GET", f"/nodes/{node}/qemu")

    async def get_vm_config(self, node: str, vmid: int) -> Dict[str, Any]:
        return await self._request("GET", f"/nodes/{node}/qemu/{vmid}/config")

    async def create_vm(
        self,
        node: str,
        vmid: int,
        name: str,
        cores: int = 2,
        memory: int = 2048,
        disk_gb: int = 20,
        iso: Optional[str] = None,
        ostype: str = "l26",
        storage: str = "local-lvm",
        sockets: int = 1,
        net_bridge: str = "vmbr0",
        agent: bool = True
    ) -> str:
        payload: Dict[str, Any] = {
            "vmid": vmid,
            "name": name,
            "cores": cores,
            "sockets": sockets,
            "memory": memory,
            "scsihw": "virtio-scsi-pci",
            "scsi0": f"{storage}:{disk_gb},discard=on,ssd=1",
            "net0": f"virtio,bridge={net_bridge},firewall=1",
            "ostype": ostype,
            "boot": "order=scsi0;ide2;net0"
        }
        if iso:
            payload["ide2"] = f"{iso},media=cdrom"
        if agent:
            payload["agent"] = "enabled=1"

        return await self._request("POST", f"/nodes/{node}/qemu", data=payload)

    async def start_vm(self, node: str, vmid: int) -> str:
        return await self._request("POST", f"/nodes/{node}/qemu/{vmid}/status/start")

    async def stop_vm(self, node: str, vmid: int) -> str:
        return await self._request("POST", f"/nodes/{node}/qemu/{vmid}/status/stop")

    async def reboot_vm(self, node: str, vmid: int) -> str:
        return await self._request("POST", f"/nodes/{node}/qemu/{vmid}/status/reboot")

    async def vm_action(self, node: str, vmid: int, action: str) -> str:
        return await self._request("POST", f"/nodes/{node}/qemu/{vmid}/status/{action}")

    async def delete_vm(self, node: str, vmid: int, purge: bool = True) -> str:
        return await self._request("DELETE", f"/nodes/{node}/qemu/{vmid}", params={"purge": 1 if purge else 0})

    # LXC Micro-Containers
    async def get_lxcs(self, node: str = "pve") -> List[Dict[str, Any]]:
        return await self._request("GET", f"/nodes/{node}/lxc")

    async def get_lxc_templates(self, node: str = "pve", storage: str = "local") -> List[Dict[str, Any]]:
        content = await self._request("GET", f"/nodes/{node}/storage/{storage}/content", params={"content": "vztmpl"})
        return content

    async def create_lxc(
        self,
        node: str,
        vmid: int,
        hostname: str,
        cores: int = 1,
        memory: int = 512,
        disk_gb: int = 8,
        template: str = "local:vztmpl/alpine-3.22-default_20250617_amd64.tar.xz",
        password: str = "TotoLXC2026!",
        storage: str = "local-lvm",
        unprivileged: int = 1,
        net_bridge: str = "vmbr0",
        start_after_create: bool = True
    ) -> str:
        payload: Dict[str, Any] = {
            "vmid": vmid,
            "hostname": hostname,
            "ostemplate": template,
            "cores": cores,
            "memory": memory,
            "swap": 512,
            "rootfs": f"{storage}:{disk_gb}",
            "net0": f"name=eth0,bridge={net_bridge},ip=dhcp,firewall=1",
            "password": password,
            "unprivileged": unprivileged,
            "start": 1 if start_after_create else 0
        }
        return await self._request("POST", f"/nodes/{node}/lxc", data=payload)

    async def start_lxc(self, node: str, vmid: int) -> str:
        return await self._request("POST", f"/nodes/{node}/lxc/{vmid}/status/start")

    async def stop_lxc(self, node: str, vmid: int) -> str:
        return await self._request("POST", f"/nodes/{node}/lxc/{vmid}/status/stop")

    async def reboot_lxc(self, node: str, vmid: int) -> str:
        return await self._request("POST", f"/nodes/{node}/lxc/{vmid}/status/reboot")

    async def lxc_action(self, node: str, vmid: int, action: str) -> str:
        return await self._request("POST", f"/nodes/{node}/lxc/{vmid}/status/{action}")

    async def delete_lxc(self, node: str, vmid: int, purge: bool = True) -> str:
        return await self._request("DELETE", f"/nodes/{node}/lxc/{vmid}", params={"purge": 1 if purge else 0})

    # Live Snapshots (KVM & LXC)
    async def get_snapshots(self, node: str, vmid: int, is_lxc: bool = False) -> List[Dict[str, Any]]:
        endpoint = f"/nodes/{node}/lxc/{vmid}/snapshot" if is_lxc else f"/nodes/{node}/qemu/{vmid}/snapshot"
        return await self._request("GET", endpoint)

    async def create_snapshot(self, node: str, vmid: int, snapname: str, description: str = "", vmstate: bool = True, is_lxc: bool = False) -> str:
        endpoint = f"/nodes/{node}/lxc/{vmid}/snapshot" if is_lxc else f"/nodes/{node}/qemu/{vmid}/snapshot"
        payload: Dict[str, Any] = {
            "snapname": snapname,
            "description": description
        }
        if not is_lxc and vmstate:
            payload["vmstate"] = 1
        return await self._request("POST", endpoint, data=payload)

    async def rollback_snapshot(self, node: str, vmid: int, snapname: str, is_lxc: bool = False) -> str:
        endpoint = f"/nodes/{node}/lxc/{vmid}/snapshot/{snapname}/rollback" if is_lxc else f"/nodes/{node}/qemu/{vmid}/snapshot/{snapname}/rollback"
        return await self._request("POST", endpoint)

    async def delete_snapshot(self, node: str, vmid: int, snapname: str, is_lxc: bool = False) -> str:
        endpoint = f"/nodes/{node}/lxc/{vmid}/snapshot/{snapname}" if is_lxc else f"/nodes/{node}/qemu/{vmid}/snapshot/{snapname}"
        return await self._request("DELETE", endpoint)

    # VNC & Console
    async def get_vnc_proxy(self, node: str, vmid: int, is_lxc: bool = False) -> Dict[str, Any]:
        endpoint = f"/nodes/{node}/lxc/{vmid}/vncproxy" if is_lxc else f"/nodes/{node}/qemu/{vmid}/vncproxy"
        return await self._request("POST", endpoint, data={"websocket": 1})

    # Storage & ISOs
    async def get_storage_status(self, node: str = "pve") -> List[Dict[str, Any]]:
        return await self._request("GET", f"/nodes/{node}/storage")

    async def get_iso_images(self, node: str = "pve", storage: str = "local") -> List[Dict[str, Any]]:
        content = await self._request("GET", f"/nodes/{node}/storage/{storage}/content", params={"content": "iso"})
        return content

    async def download_iso_from_url(self, node: str, storage: str, url: str, filename: str) -> str:
        payload = {
            "content": "iso",
            "filename": filename,
            "url": url,
            "verify-certificates": 0
        }
        return await self._request("POST", f"/nodes/{node}/storage/{storage}/download-url", data=payload)

proxmox_client = ProxmoxClient()
