import os
import time
import httpx
from typing import Dict, Any, List, Optional

PROXMOX_HOST = os.getenv("PROXMOX_HOST", "127.0.0.1")
PROXMOX_PORT = int(os.getenv("PROXMOX_PORT", "8006"))
PROXMOX_USER = os.getenv("PROXMOX_USER", "root@pam")
PROXMOX_PASS = os.getenv("PROXMOX_PASS", "ProxmoxAdmin2026!")

BASE_URL = f"https://{PROXMOX_HOST}:{PROXMOX_PORT}/api2/json"

class ProxmoxClient:
    def __init__(self):
        self.ticket: Optional[str] = None
        self.csrf_token: Optional[str] = None
        self.ticket_timestamp: float = 0
        self.client = httpx.AsyncClient(verify=False, timeout=20.0)

    async def _ensure_auth(self):
        # Refresh ticket if older than 1.5 hours (tokens valid for 2h)
        if not self.ticket or (time.time() - self.ticket_timestamp > 5400):
            await self._login()

    async def _login(self):
        try:
            resp = await self.client.post(
                f"{BASE_URL}/access/ticket",
                data={"username": PROXMOX_USER, "password": PROXMOX_PASS}
            )
            resp.raise_for_status()
            data = resp.json().get("data", {})
            self.ticket = data.get("ticket")
            self.csrf_token = data.get("CSRFPreventionToken")
            self.ticket_timestamp = time.time()
        except Exception as e:
            print(f"[ProxmoxClient] Auth error: {e}")
            raise

    def _get_headers(self) -> Dict[str, str]:
        headers = {}
        if self.csrf_token:
            headers["CSRFPreventionToken"] = self.csrf_token
        return headers

    def _get_cookies(self) -> Dict[str, str]:
        cookies = {}
        if self.ticket:
            cookies["PVEAuthCookie"] = self.ticket
        return cookies

    async def get_cluster_resources(self, resource_type: Optional[str] = None) -> List[Dict[str, Any]]:
        await self._ensure_auth()
        params = {}
        if resource_type:
            params["type"] = resource_type
        resp = await self.client.get(
            f"{BASE_URL}/cluster/resources",
            headers=self._get_headers(),
            cookies=self._get_cookies(),
            params=params
        )
        resp.raise_for_status()
        return resp.json().get("data", [])

    async def get_nodes(self) -> List[Dict[str, Any]]:
        await self._ensure_auth()
        resp = await self.client.get(
            f"{BASE_URL}/nodes",
            headers=self._get_headers(),
            cookies=self._get_cookies()
        )
        resp.raise_for_status()
        return resp.json().get("data", [])

    async def get_node_status(self, node: str = "pve") -> Dict[str, Any]:
        await self._ensure_auth()
        resp = await self.client.get(
            f"{BASE_URL}/nodes/{node}/status",
            headers=self._get_headers(),
            cookies=self._get_cookies()
        )
        resp.raise_for_status()
        return resp.json().get("data", {})

    async def get_node_vms(self, node: str = "pve") -> List[Dict[str, Any]]:
        await self._ensure_auth()
        resp = await self.client.get(
            f"{BASE_URL}/nodes/{node}/qemu",
            headers=self._get_headers(),
            cookies=self._get_cookies()
        )
        resp.raise_for_status()
        return resp.json().get("data", [])

    async def get_vm_config(self, node: str, vmid: int) -> Dict[str, Any]:
        await self._ensure_auth()
        resp = await self.client.get(
            f"{BASE_URL}/nodes/{node}/qemu/{vmid}/config",
            headers=self._get_headers(),
            cookies=self._get_cookies()
        )
        resp.raise_for_status()
        return resp.json().get("data", {})

    async def vm_action(self, node: str, vmid: int, action: str) -> Dict[str, Any]:
        # action: start, stop, shutdown, reboot, reset, suspend, resume
        await self._ensure_auth()
        resp = await self.client.post(
            f"{BASE_URL}/nodes/{node}/qemu/{vmid}/status/{action}",
            headers=self._get_headers(),
            cookies=self._get_cookies()
        )
        resp.raise_for_status()
        return resp.json()

    async def get_next_vmid(self) -> int:
        await self._ensure_auth()
        resp = await self.client.get(
            f"{BASE_URL}/cluster/nextid",
            headers=self._get_headers(),
            cookies=self._get_cookies()
        )
        resp.raise_for_status()
        return int(resp.json().get("data", 100))

    async def create_vm(self, node: str, params: Dict[str, Any]) -> Dict[str, Any]:
        await self._ensure_auth()
        resp = await self.client.post(
            f"{BASE_URL}/nodes/{node}/qemu",
            headers=self._get_headers(),
            cookies=self._get_cookies(),
            data=params
        )
        resp.raise_for_status()
        return resp.json()

    async def delete_vm(self, node: str, vmid: int) -> Dict[str, Any]:
        await self._ensure_auth()
        resp = await self.client.delete(
            f"{BASE_URL}/nodes/{node}/qemu/{vmid}",
            headers=self._get_headers(),
            cookies=self._get_cookies()
        )
        resp.raise_for_status()
        return resp.json()

    async def get_storages(self, node: str = "pve") -> List[Dict[str, Any]]:
        await self._ensure_auth()
        resp = await self.client.get(
            f"{BASE_URL}/nodes/{node}/storage",
            headers=self._get_headers(),
            cookies=self._get_cookies()
        )
        resp.raise_for_status()
        return resp.json().get("data", [])

    async def get_iso_images(self, node: str = "pve", storage: str = "local") -> List[Dict[str, Any]]:
        await self._ensure_auth()
        resp = await self.client.get(
            f"{BASE_URL}/nodes/{node}/storage/{storage}/content",
            headers=self._get_headers(),
            cookies=self._get_cookies(),
            params={"content": "iso"}
        )
        resp.raise_for_status()
        return resp.json().get("data", [])

    async def get_vnc_proxy(self, node: str, vmid: int) -> Dict[str, Any]:
        await self._ensure_auth()
        resp = await self.client.post(
            f"{BASE_URL}/nodes/{node}/qemu/{vmid}/vncproxy",
            headers=self._get_headers(),
            cookies=self._get_cookies(),
            data={"websocket": 1}
        )
        resp.raise_for_status()
        return resp.json().get("data", {})

proxmox_api = ProxmoxClient()
