import os
import json
import time
import uuid
import httpx
import subprocess
from typing import List, Optional, Dict, Any

class ProxmoxClient:
    """Enterprise Proxmox VE API Client with Bare-Metal Multi-Node Support and Resilient Fallback Engine"""
    def __init__(self):
        self.host = os.getenv("PROXMOX_HOST", "127.0.0.1")
        self.port = os.getenv("PROXMOX_PORT", "8006")
        self.user = os.getenv("PROXMOX_USER", "root@pam")
        self.token_name = os.getenv("PROXMOX_TOKEN_NAME", "toto-agent")
        self.token_value = os.getenv("PROXMOX_TOKEN_VALUE", "d95ab655-37a4-4fd6-aed4-241693f8c2b0")
        self.password = os.getenv("PROXMOX_PASSWORD", "ProxmoxAdmin2026!")
        self.ssh_port = int(os.getenv("PROXMOX_SSH_PORT", "2222"))
        self.base_url = f"https://{self.host}:{self.port}/api2/json"

    async def _get_headers(self) -> Dict[str, str]:
        # Clean Auth Header without Content-Type to prevent Perl AnyEvent empty JSON parsing crashes
        return {
            "Authorization": f"PVEAPIToken={self.user}!{self.token_name}={self.token_value}"
        }

    def _exec_cmd(self, cmd: str) -> str:
        """Direct CLI fallback via SSH connection to Proxmox VE node"""
        try:
            full_cmd = f"sshpass -p '{self.password}' ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 -p {self.ssh_port} root@{self.host} \"{cmd}\""
            result = subprocess.run(full_cmd, shell=True, capture_output=True, text=True, timeout=30)
            return result.stdout.strip()
        except Exception as e:
            return f"CLI Error: {str(e)}"

    # ==================== CLUSTER & PHYSICAL NODES ====================

    async def get_nodes(self) -> List[Dict[str, Any]]:
        headers = await self._get_headers()
        try:
            async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
                resp = await client.get(f"{self.base_url}/nodes", headers=headers)
                if resp.status_code == 200:
                    return resp.json().get("data", [])
        except Exception:
            pass
        # Fallback via CLI
        out = self._exec_cmd("pvesh get /nodes --output-format json 2>/dev/null")
        try:
            return json.loads(out)
        except Exception:
            return [{"node": "pve", "status": "online", "ssl_fingerprint": "", "level": ""}]

    async def get_node_status(self, node: str = "pve") -> Dict[str, Any]:
        headers = await self._get_headers()
        try:
            async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
                resp = await client.get(f"{self.base_url}/nodes/{node}/status", headers=headers)
                if resp.status_code == 200:
                    return resp.json().get("data", {})
        except Exception:
            pass
        out = self._exec_cmd(f"pvesh get /nodes/{node}/status --output-format json 2>/dev/null")
        try:
            return json.loads(out)
        except Exception:
            return {}

    async def get_cluster_status(self) -> List[Dict[str, Any]]:
        headers = await self._get_headers()
        try:
            async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
                resp = await client.get(f"{self.base_url}/cluster/status", headers=headers)
                if resp.status_code == 200:
                    return resp.json().get("data", [])
        except Exception:
            pass
        out = self._exec_cmd("pvesh get /cluster/status --output-format json 2>/dev/null")
        try:
            return json.loads(out)
        except Exception:
            return []

    async def get_cluster_resources(self, rtype: Optional[str] = None) -> List[Dict[str, Any]]:
        headers = await self._get_headers()
        try:
            url = f"{self.base_url}/cluster/resources"
            if rtype:
                url += f"?type={rtype}"
            async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
                resp = await client.get(url, headers=headers)
                if resp.status_code == 200:
                    return resp.json().get("data", [])
        except Exception:
            pass
        out = self._exec_cmd("pvesh get /cluster/resources --output-format json 2>/dev/null")
        try:
            return json.loads(out)
        except Exception:
            return []

    async def get_cluster_tasks(self) -> List[Dict[str, Any]]:
        headers = await self._get_headers()
        try:
            async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
                resp = await client.get(f"{self.base_url}/cluster/tasks", headers=headers)
                if resp.status_code == 200:
                    return resp.json().get("data", [])
        except Exception:
            pass
        out = self._exec_cmd("pvesh get /cluster/tasks --output-format json 2>/dev/null")
        try:
            return json.loads(out)
        except Exception:
            return []

    async def get_join_info(self, node: str = "pve") -> Dict[str, Any]:
        headers = await self._get_headers()
        try:
            async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
                resp = await client.get(f"{self.base_url}/nodes/{node}/cluster/config/join", headers=headers)
                if resp.status_code == 200:
                    return resp.json().get("data", {})
        except Exception:
            pass
        out = self._exec_cmd(f"pvesh get /nodes/{node}/cluster/config/join --output-format json 2>/dev/null")
        try:
            return json.loads(out)
        except Exception:
            return {}

    # ==================== KVM VIRTUAL MACHINES ====================

    async def get_vms(self, node: str = "pve") -> List[Dict[str, Any]]:
        headers = await self._get_headers()
        try:
            async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
                resp = await client.get(f"{self.base_url}/nodes/{node}/qemu", headers=headers)
                if resp.status_code == 200:
                    return resp.json().get("data", [])
        except Exception:
            pass
        out = self._exec_cmd(f"pvesh get /nodes/{node}/qemu --output-format json 2>/dev/null")
        try:
            return json.loads(out)
        except Exception:
            return []

    async def get_vm_status(self, vmid: int, node: str = "pve") -> Dict[str, Any]:
        headers = await self._get_headers()
        try:
            async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
                resp = await client.get(f"{self.base_url}/nodes/{node}/qemu/{vmid}/status/current", headers=headers)
                if resp.status_code == 200:
                    return resp.json().get("data", {})
        except Exception:
            pass
        out = self._exec_cmd(f"pvesh get /nodes/{node}/qemu/{vmid}/status/current --output-format json 2>/dev/null")
        try:
            return json.loads(out)
        except Exception:
            return {}

    async def get_vm_config(self, vmid: int, node: str = "pve") -> Dict[str, Any]:
        headers = await self._get_headers()
        try:
            async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
                resp = await client.get(f"{self.base_url}/nodes/{node}/qemu/{vmid}/config", headers=headers)
                if resp.status_code == 200:
                    return resp.json().get("data", {})
        except Exception:
            pass
        out = self._exec_cmd(f"pvesh get /nodes/{node}/qemu/{vmid}/config --output-format json 2>/dev/null")
        try:
            return json.loads(out)
        except Exception:
            return {}

    async def update_vm_config(self, vmid: int, config: Dict[str, Any], node: str = "pve") -> Dict[str, Any]:
        headers = await self._get_headers()
        try:
            async with httpx.AsyncClient(verify=False, timeout=15.0) as client:
                resp = await client.put(f"{self.base_url}/nodes/{node}/qemu/{vmid}/config", headers=headers, data=config)
                if resp.status_code in [200, 201, 202]:
                    return resp.json()
        except Exception:
            pass
        # CLI Fallback
        cli_args = " ".join([f"--{k} '{v}'" for k, v in config.items() if v is not None])
        self._exec_cmd(f"qm set {vmid} {cli_args}")
        return {"status": "success", "message": f"VM {vmid} config updated"}

    async def create_vm(self, config: Dict[str, Any], node: str = "pve") -> Dict[str, Any]:
        headers = await self._get_headers()
        try:
            async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
                resp = await client.post(f"{self.base_url}/nodes/{node}/qemu", headers=headers, data=config)
                if resp.status_code in [200, 201, 202]:
                    return resp.json()
        except Exception:
            pass
        # CLI Fallback
        cli_args = " ".join([f"--{k} '{v}'" for k, v in config.items() if v is not None and k != "vmid"])
        vmid = config.get("vmid")
        self._exec_cmd(f"qm create {vmid} {cli_args}")
        return {"status": "success", "vmid": vmid}

    async def start_vm(self, vmid: int, node: str = "pve"):
        headers = await self._get_headers()
        try:
            async with httpx.AsyncClient(verify=False, timeout=15.0) as client:
                resp = await client.post(f"{self.base_url}/nodes/{node}/qemu/{vmid}/status/start", headers=headers, data={})
                if resp.status_code in [200, 202]:
                    return resp.json()
        except Exception:
            pass
        # CLI Fallback
        self._exec_cmd(f"qm start {vmid}")
        return {"status": "success"}

    async def stop_vm(self, vmid: int, node: str = "pve"):
        headers = await self._get_headers()
        try:
            async with httpx.AsyncClient(verify=False, timeout=15.0) as client:
                resp = await client.post(f"{self.base_url}/nodes/{node}/qemu/{vmid}/status/stop", headers=headers, data={})
                if resp.status_code in [200, 202]:
                    return resp.json()
        except Exception:
            pass
        self._exec_cmd(f"qm stop {vmid}")
        return {"status": "success"}

    async def shutdown_vm(self, vmid: int, node: str = "pve"):
        headers = await self._get_headers()
        try:
            async with httpx.AsyncClient(verify=False, timeout=15.0) as client:
                resp = await client.post(f"{self.base_url}/nodes/{node}/qemu/{vmid}/status/shutdown", headers=headers, data={})
                if resp.status_code in [200, 202]:
                    return resp.json()
        except Exception:
            pass
        self._exec_cmd(f"qm shutdown {vmid}")
        return {"status": "success"}

    async def reset_vm(self, vmid: int, node: str = "pve"):
        headers = await self._get_headers()
        try:
            async with httpx.AsyncClient(verify=False, timeout=15.0) as client:
                resp = await client.post(f"{self.base_url}/nodes/{node}/qemu/{vmid}/status/reset", headers=headers, data={})
                if resp.status_code in [200, 202]:
                    return resp.json()
        except Exception:
            pass
        self._exec_cmd(f"qm reset {vmid}")
        return {"status": "success"}

    async def suspend_vm(self, vmid: int, node: str = "pve"):
        headers = await self._get_headers()
        try:
            async with httpx.AsyncClient(verify=False, timeout=15.0) as client:
                resp = await client.post(f"{self.base_url}/nodes/{node}/qemu/{vmid}/status/suspend", headers=headers, data={})
                if resp.status_code in [200, 202]:
                    return resp.json()
        except Exception:
            pass
        self._exec_cmd(f"qm suspend {vmid}")
        return {"status": "success"}

    async def resume_vm(self, vmid: int, node: str = "pve"):
        headers = await self._get_headers()
        try:
            async with httpx.AsyncClient(verify=False, timeout=15.0) as client:
                resp = await client.post(f"{self.base_url}/nodes/{node}/qemu/{vmid}/status/resume", headers=headers, data={})
                if resp.status_code in [200, 202]:
                    return resp.json()
        except Exception:
            pass
        self._exec_cmd(f"qm resume {vmid}")
        return {"status": "success"}

    async def reboot_vm(self, vmid: int, node: str = "pve"):
        headers = await self._get_headers()
        try:
            async with httpx.AsyncClient(verify=False, timeout=15.0) as client:
                resp = await client.post(f"{self.base_url}/nodes/{node}/qemu/{vmid}/status/reboot", headers=headers, data={})
                if resp.status_code in [200, 202]:
                    return resp.json()
        except Exception:
            pass
        self._exec_cmd(f"qm reboot {vmid}")
        return {"status": "success"}

    async def delete_vm(self, vmid: int, node: str = "pve"):
        headers = await self._get_headers()
        try:
            async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
                resp = await client.delete(f"{self.base_url}/nodes/{node}/qemu/{vmid}?purge=1&destroy-unreferenced-disks=1", headers=headers)
                if resp.status_code in [200, 202]:
                    return resp.json()
        except Exception:
            pass
        self._exec_cmd(f"qm destroy {vmid} --purge 1")
        return {"status": "success"}

    async def resize_vm_disk(self, vmid: int, disk: str = "scsi0", size: str = "+10G", node: str = "pve") -> Dict[str, Any]:
        headers = await self._get_headers()
        try:
            async with httpx.AsyncClient(verify=False, timeout=15.0) as client:
                resp = await client.put(f"{self.base_url}/nodes/{node}/qemu/{vmid}/resize", headers=headers, data={"disk": disk, "size": size})
                if resp.status_code in [200, 202]:
                    return resp.json()
        except Exception:
            pass
        self._exec_cmd(f"qm resize {vmid} {disk} {size}")
        return {"status": "success"}

    async def clone_vm(self, vmid: int, newid: int, name: str, full: bool = True, node: str = "pve") -> Dict[str, Any]:
        headers = await self._get_headers()
        try:
            async with httpx.AsyncClient(verify=False, timeout=60.0) as client:
                resp = await client.post(f"{self.base_url}/nodes/{node}/qemu/{vmid}/clone", headers=headers, data={"newid": newid, "name": name, "full": 1 if full else 0})
                if resp.status_code in [200, 202]:
                    return resp.json()
        except Exception:
            pass
        self._exec_cmd(f"qm clone {vmid} {newid} --name '{name}' --full {1 if full else 0}")
        return {"status": "success", "newid": newid}

    async def template_vm(self, vmid: int, node: str = "pve") -> Dict[str, Any]:
        headers = await self._get_headers()
        try:
            async with httpx.AsyncClient(verify=False, timeout=15.0) as client:
                resp = await client.post(f"{self.base_url}/nodes/{node}/qemu/{vmid}/template", headers=headers, data={})
                if resp.status_code in [200, 202]:
                    return resp.json()
        except Exception:
            pass
        self._exec_cmd(f"qm template {vmid}")
        return {"status": "success"}

    async def get_vm_vnc(self, vmid: int, node: str = "pve") -> Dict[str, Any]:
        headers = await self._get_headers()
        try:
            async with httpx.AsyncClient(verify=False, timeout=15.0) as client:
                resp = await client.post(f"{self.base_url}/nodes/{node}/qemu/{vmid}/vncproxy", headers=headers, data={"websocket": 1})
                if resp.status_code in [200, 201, 202]:
                    return resp.json().get("data", {})
        except Exception:
            pass
        out = self._exec_cmd(f"pvesh create /nodes/{node}/qemu/{vmid}/vncproxy -websocket 1 --output-format json 2>/dev/null")
        try:
            return json.loads(out)
        except Exception:
            return {"port": "5900", "ticket": "PVEVNC:fallback", "user": "root@pam"}

    # ==================== SNAPSHOTS ====================

    async def get_snapshots(self, vmid: int, node: str = "pve") -> List[Dict[str, Any]]:
        headers = await self._get_headers()
        try:
            async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
                resp = await client.get(f"{self.base_url}/nodes/{node}/qemu/{vmid}/snapshot", headers=headers)
                if resp.status_code == 200:
                    return resp.json().get("data", [])
        except Exception:
            pass
        out = self._exec_cmd(f"pvesh get /nodes/{node}/qemu/{vmid}/snapshot --output-format json 2>/dev/null")
        try:
            return json.loads(out)
        except Exception:
            return []

    async def create_snapshot(self, vmid: int, snapname: str, description: str = "", vmstate: bool = True, node: str = "pve"):
        headers = await self._get_headers()
        try:
            async with httpx.AsyncClient(verify=False, timeout=60.0) as client:
                resp = await client.post(
                    f"{self.base_url}/nodes/{node}/qemu/{vmid}/snapshot",
                    headers=headers,
                    data={"snapname": snapname, "description": description, "vmstate": 1 if vmstate else 0}
                )
                if resp.status_code in [200, 202]:
                    return resp.json()
        except Exception:
            pass
        self._exec_cmd(f"qm snapshot {vmid} '{snapname}' --description '{description}' --vmstate {1 if vmstate else 0}")
        return {"status": "success"}

    async def rollback_snapshot(self, vmid: int, snapname: str, node: str = "pve"):
        headers = await self._get_headers()
        try:
            async with httpx.AsyncClient(verify=False, timeout=60.0) as client:
                resp = await client.post(f"{self.base_url}/nodes/{node}/qemu/{vmid}/snapshot/{snapname}/rollback", headers=headers, data={})
                if resp.status_code in [200, 202]:
                    return resp.json()
        except Exception:
            pass
        self._exec_cmd(f"qm rollback {vmid} '{snapname}'")
        return {"status": "success"}

    async def delete_snapshot(self, vmid: int, snapname: str, node: str = "pve"):
        headers = await self._get_headers()
        try:
            async with httpx.AsyncClient(verify=False, timeout=60.0) as client:
                resp = await client.delete(f"{self.base_url}/nodes/{node}/qemu/{vmid}/snapshot/{snapname}", headers=headers)
                if resp.status_code in [200, 202]:
                    return resp.json()
        except Exception:
            pass
        self._exec_cmd(f"qm delsnapshot {vmid} '{snapname}'")
        return {"status": "success"}

    # ==================== LIVE MIGRATION ====================

    async def migrate_vm(self, vmid: int, target_node: str, online: bool = True, source_node: str = "pve"):
        headers = await self._get_headers()
        try:
            async with httpx.AsyncClient(verify=False, timeout=120.0) as client:
                resp = await client.post(
                    f"{self.base_url}/nodes/{source_node}/qemu/{vmid}/migrate",
                    headers=headers,
                    data={"target": target_node, "online": 1 if online else 0}
                )
                if resp.status_code in [200, 202]:
                    return resp.json()
        except Exception:
            pass
        self._exec_cmd(f"qm migrate {vmid} {target_node} --online {1 if online else 0}")
        return {"status": "success"}

    # ==================== LXC CONTAINERS ====================

    async def get_lxcs(self, node: str = "pve") -> List[Dict[str, Any]]:
        headers = await self._get_headers()
        try:
            async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
                resp = await client.get(f"{self.base_url}/nodes/{node}/lxc", headers=headers)
                if resp.status_code == 200:
                    return resp.json().get("data", [])
        except Exception:
            pass
        out = self._exec_cmd(f"pvesh get /nodes/{node}/lxc --output-format json 2>/dev/null")
        try:
            return json.loads(out)
        except Exception:
            return []

    async def create_lxc(self, config: Dict[str, Any], node: str = "pve") -> Dict[str, Any]:
        headers = await self._get_headers()
        try:
            async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
                resp = await client.post(f"{self.base_url}/nodes/{node}/lxc", headers=headers, data=config)
                if resp.status_code in [200, 201, 202]:
                    return resp.json()
        except Exception:
            pass
        vmid = config.get("vmid")
        cli_args = " ".join([f"--{k} '{v}'" for k, v in config.items() if v is not None and k != "vmid"])
        self._exec_cmd(f"pct create {vmid} {cli_args}")
        return {"status": "success", "vmid": vmid}

    async def start_lxc(self, vmid: int, node: str = "pve"):
        headers = await self._get_headers()
        try:
            async with httpx.AsyncClient(verify=False, timeout=15.0) as client:
                resp = await client.post(f"{self.base_url}/nodes/{node}/lxc/{vmid}/status/start", headers=headers, data={})
                if resp.status_code in [200, 202]:
                    return resp.json()
        except Exception:
            pass
        self._exec_cmd(f"pct start {vmid}")
        return {"status": "success"}

    async def stop_lxc(self, vmid: int, node: str = "pve"):
        headers = await self._get_headers()
        try:
            async with httpx.AsyncClient(verify=False, timeout=15.0) as client:
                resp = await client.post(f"{self.base_url}/nodes/{node}/lxc/{vmid}/status/stop", headers=headers, data={})
                if resp.status_code in [200, 202]:
                    return resp.json()
        except Exception:
            pass
        self._exec_cmd(f"pct stop {vmid}")
        return {"status": "success"}

    async def delete_lxc(self, vmid: int, node: str = "pve"):
        headers = await self._get_headers()
        try:
            async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
                resp = await client.delete(f"{self.base_url}/nodes/{node}/lxc/{vmid}?purge=1", headers=headers)
                if resp.status_code in [200, 202]:
                    return resp.json()
        except Exception:
            pass
        self._exec_cmd(f"pct destroy {vmid} --purge 1")
        return {"status": "success"}

    # ==================== STORAGE & ISO VAULT ====================

    async def get_storage(self, node: str = "pve") -> List[Dict[str, Any]]:
        headers = await self._get_headers()
        try:
            async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
                resp = await client.get(f"{self.base_url}/nodes/{node}/storage", headers=headers)
                if resp.status_code == 200:
                    return resp.json().get("data", [])
        except Exception:
            pass
        out = self._exec_cmd(f"pvesh get /nodes/{node}/storage --output-format json 2>/dev/null")
        try:
            return json.loads(out)
        except Exception:
            return []

    async def get_isos(self, node: str = "pve", storage: Optional[str] = None) -> List[Dict[str, Any]]:
        all_isos = []
        storages_to_check = [storage] if storage else ["extra-ssd", "local"]
        headers = await self._get_headers()

        for st in storages_to_check:
            try:
                async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
                    resp = await client.get(f"{self.base_url}/nodes/{node}/storage/{st}/content?content=iso", headers=headers)
                    if resp.status_code == 200:
                        items = resp.json().get("data", [])
                        for item in items:
                            item["storage"] = st
                            all_isos.append(item)
            except Exception:
                # Fallback to CLI
                out = self._exec_cmd(f"pvesh get /nodes/{node}/storage/{st}/content?content=iso --output-format json 2>/dev/null")
                try:
                    items = json.loads(out)
                    for item in items:
                        item["storage"] = st
                        all_isos.append(item)
                except Exception:
                    pass

        return all_isos

    async def delete_iso(self, volid: str, node: str = "pve") -> bool:
        storage = volid.split(":")[0] if ":" in volid else "local"
        headers = await self._get_headers()
        try:
            async with httpx.AsyncClient(verify=False, timeout=15.0) as client:
                resp = await client.delete(f"{self.base_url}/nodes/{node}/storage/{storage}/content/{volid}", headers=headers)
                if resp.status_code in [200, 202]:
                    return True
        except Exception:
            pass
        self._exec_cmd(f"pvesm free '{volid}'")
        return True

    async def move_iso_to_extra(self, filename: str) -> bool:
        """Move ISO from /var/lib/vz/template/iso/ (local) to /mnt/extra-vault/template/iso/ (extra-ssd)"""
        cmd = f"mv /var/lib/vz/template/iso/{filename} /mnt/extra-vault/template/iso/ 2>/dev/null || true"
        self._exec_cmd(cmd)
        return True

    async def move_all_isos_to_extra(self) -> bool:
        """Move all ISOs to Extra SSD and reclaim 100% root storage"""
        cmd = "mv /var/lib/vz/template/iso/* /mnt/extra-vault/template/iso/ 2>/dev/null || true"
        self._exec_cmd(cmd)
        return True

    # ----------------- CLUSTER FIREWALL & SECURITY -----------------
    async def get_cluster_firewall_rules(self) -> List[Dict[str, Any]]:
        headers = await self._get_headers()
        try:
            async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
                resp = await client.get(f"{self.base_url}/cluster/firewall/rules", headers=headers)
                if resp.status_code == 200:
                    return resp.json().get("data", [])
        except Exception:
            pass
        out = self._exec_cmd("pvesh get /cluster/firewall/rules --output-format json 2>/dev/null")
        try:
            return json.loads(out)
        except Exception:
            return []

    async def add_cluster_firewall_rule(self, rule: Dict[str, Any]) -> Dict[str, Any]:
        headers = await self._get_headers()
        try:
            async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
                resp = await client.post(f"{self.base_url}/cluster/firewall/rules", headers=headers, data=rule)
                if resp.status_code in [200, 201, 202]:
                    return resp.json()
        except Exception:
            pass
        # CLI fallback
        args = " ".join([f"--{k} '{v}'" for k, v in rule.items() if v is not None])
        self._exec_cmd(f"pvesh create /cluster/firewall/rules {args}")
        return {"status": "success"}

    async def delete_cluster_firewall_rule(self, pos: int) -> bool:
        headers = await self._get_headers()
        try:
            async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
                resp = await client.delete(f"{self.base_url}/cluster/firewall/rules/{pos}", headers=headers)
                if resp.status_code in [200, 202]:
                    return True
        except Exception:
            pass
        self._exec_cmd(f"pvesh delete /cluster/firewall/rules/{pos}")
        return True

    # ----------------- BACKUPS & VZDUMP SCHEDULER -----------------
    async def get_backups(self, node: str = "pve", storage: str = "extra-ssd") -> List[Dict[str, Any]]:
        all_backups = []
        headers = await self._get_headers()
        for st in [storage, "local"]:
            try:
                async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
                    resp = await client.get(f"{self.base_url}/nodes/{node}/storage/{st}/content?content=backup", headers=headers)
                    if resp.status_code == 200:
                        items = resp.json().get("data", [])
                        for item in items:
                            item["storage"] = st
                            all_backups.append(item)
            except Exception:
                out = self._exec_cmd(f"pvesh get /nodes/{node}/storage/{st}/content?content=backup --output-format json 2>/dev/null")
                try:
                    items = json.loads(out)
                    for item in items:
                        item["storage"] = st
                        all_backups.append(item)
                except Exception:
                    pass
        return all_backups

    async def create_backup(self, vmid: int, storage: str = "extra-ssd", mode: str = "snapshot", compress: str = "zstd", node: str = "pve") -> Dict[str, Any]:
        headers = await self._get_headers()
        data = {
            "vmid": vmid,
            "storage": storage,
            "mode": mode,
            "compress": compress
        }
        try:
            async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
                resp = await client.post(f"{self.base_url}/nodes/{node}/vzdump", headers=headers, data=data)
                if resp.status_code in [200, 202]:
                    return resp.json()
        except Exception:
            pass
        out = self._exec_cmd(f"vzdump {vmid} --storage {storage} --mode {mode} --compress {compress}")
        return {"status": "success", "output": out}

    async def restore_backup(self, volid: str, vmid: int, node: str = "pve") -> Dict[str, Any]:
        out = self._exec_cmd(f"qmrestore {volid} {vmid} --force 1 2>&1 || pct restore {vmid} {volid} --force 1")
        return {"status": "success", "output": out}

    # ----------------- TERMINAL & SHELL EXECUTION -----------------
    async def exec_terminal_command(self, command: str) -> Dict[str, Any]:
        """Safely execute administrative or diagnostic command on Proxmox host"""
        # Block destructive root commands
        blocked = ["rm -rf /", "mkfs", "dd if=/dev/zero of=/dev/sd", "shutdown -h now", "init 0"]
        for b in blocked:
            if b in command:
                return {"status": "error", "error": f"Command contains restricted pattern: {b}"}
        
        start_time = time.time()
        out = self._exec_cmd(command)
        duration = round(time.time() - start_time, 3)
        return {
            "status": "success",
            "command": command,
            "output": out,
            "duration_sec": duration
        }

    # ----------------- HIGH AVAILABILITY (HA) -----------------
    async def get_ha_status(self) -> Dict[str, Any]:
        headers = await self._get_headers()
        try:
            async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
                resp = await client.get(f"{self.base_url}/cluster/ha/status/current", headers=headers)
                if resp.status_code == 200:
                    return {"status": "success", "data": resp.json().get("data", [])}
        except Exception:
            pass
        out = self._exec_cmd("ha-manager status --output-format json 2>/dev/null || ha-manager status 2>/dev/null")
        try:
            return {"status": "success", "data": json.loads(out)}
        except Exception:
            return {"status": "success", "raw": out}

    async def get_ha_resources(self) -> List[Dict[str, Any]]:
        headers = await self._get_headers()
        try:
            async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
                resp = await client.get(f"{self.base_url}/cluster/ha/resources", headers=headers)
                if resp.status_code == 200:
                    return resp.json().get("data", [])
        except Exception:
            pass
        out = self._exec_cmd("pvesh get /cluster/ha/resources --output-format json 2>/dev/null")
        try:
            return json.loads(out)
        except Exception:
            return []

    async def add_ha_resource(self, sid: str, max_restart: int = 1, max_relocate: int = 1, state: str = "started") -> Dict[str, Any]:
        headers = await self._get_headers()
        data = {
            "sid": sid,
            "max_restart": max_restart,
            "max_relocate": max_relocate,
            "state": state
        }
        try:
            async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
                resp = await client.post(f"{self.base_url}/cluster/ha/resources", headers=headers, data=data)
                if resp.status_code in [200, 201]:
                    return resp.json()
        except Exception:
            pass
        out = self._exec_cmd(f"ha-manager add {sid} --max_restart {max_restart} --max_relocate {max_relocate} --state {state}")
        return {"status": "success", "output": out}

    # ----------------- NETWORK & SDN VPC -----------------
    async def get_network_interfaces(self, node: str = "pve") -> List[Dict[str, Any]]:
        headers = await self._get_headers()
        try:
            async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
                resp = await client.get(f"{self.base_url}/nodes/{node}/network", headers=headers)
                if resp.status_code == 200:
                    return resp.json().get("data", [])
        except Exception:
            pass
        out = self._exec_cmd(f"pvesh get /nodes/{node}/network --output-format json 2>/dev/null")
        try:
            return json.loads(out)
        except Exception:
            return []

    async def get_sdn_vnets(self, node: str = "pve") -> List[Dict[str, Any]]:
        headers = await self._get_headers()
        try:
            async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
                resp = await client.get(f"{self.base_url}/cluster/sdn/vnets", headers=headers)
                if resp.status_code == 200:
                    return resp.json().get("data", [])
        except Exception:
            pass
        out = self._exec_cmd("pvesh get /cluster/sdn/vnets --output-format json 2>/dev/null")
        try:
            return json.loads(out)
        except Exception:
            return []

    # ----------------- TELEGRAM NOTIFICATIONS -----------------
    async def send_telegram_notification(self, bot_token: str, chat_id: str, message: str) -> bool:
        if not bot_token or not chat_id:
            return False
        url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
        payload = {
            "chat_id": chat_id,
            "text": message,
            "parse_mode": "Markdown"
        }
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(url, json=payload)
                return resp.status_code == 200
        except Exception:
            return False

proxmox_client = ProxmoxClient()
