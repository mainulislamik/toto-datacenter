# 🏢 Toto Company Datacenter (TOTO CLOUD OS v1.0)

**Toto Company Datacenter** is a private turnkey cloud infrastructure platform powered by Proxmox VE 8.4 KVM Hypervisor with a custom Light-Themed Multi-Tenant Web Management Control Panel, RBAC Quota Management Engine, and 1-Click Bare-Metal Automated ISO Installer.

---

## 🌟 Key Architecture & Capabilities

1. **Custom Control Panel (Frontend):**
   * **URL:** `http://localhost:3099` (or `http://<HOST_IP>:3099`)
   * Built with React + Tailwind CSS + Lucide Icons (Light Theme, High-Contrast `#0f172a` / `#475569`).
   * Multi-Tenant User Portal with live VM telemetry, power state control, and Web noVNC console launcher.

2. **Datacenter Orchestration Engine (Backend):**
   * **URL:** `http://localhost:8099`
   * FastAPI + JWT Auth + RBAC Quotas + Proxmox REST API Connector.
   * Real-time cluster status, node health, storage pool metrics, and automated quota enforcement per user.

3. **Hypervisor Core (Proxmox VE 8.4):**
   * Running on Second SSD (`/dev/sda1` / `local-lvm` Thin Pool with 135.84 GB Storage).
   * Native Proxmox Web GUI: `https://127.0.0.1:8006`

4. **1-Click Bare-Metal ISO Installer (`iso-builder/`):**
   * Unattended Proxmox installer (`answer.toml`) + First-Boot provisioning hook (`firstboot.sh`).
   * Booting from a USB pendrive on any new PC installs the entire hypervisor and auto-launches this Datacenter Control Panel with zero manual configuration.

---

## 🔐 Default Access & Credentials

| Role | Username | Password | Access Level |
|---|---|---|---|
| **Super Admin** | `imon` | `ImonAdmin2026!` | Full Cluster & User Management |
| **Demo User** | `developer1` | `DevPassword123!` | Quota Restricted Tenant VM Access |
| **Native Hypervisor** | `root` | `ProxmoxAdmin2026!` | Proxmox VE Root (Port 8006 / 2222) |

---

## 🚀 Quick Start Commands

```bash
# Start all Datacenter services (Hypervisor, Backend, Frontend)
./start-all.sh

# Stop all Datacenter services
./stop-all.sh
```

---

## 💿 How to Deploy on a New Bare-Metal Machine

1. Generate the bootable ISO:
   ```bash
   cd iso-builder && ./build-iso.sh
   ```
2. Flash the generated `toto-datacenter-v1.0.iso` to a USB flash drive:
   ```bash
   sudo dd if=toto-datacenter-v1.0.iso of=/dev/sdX bs=4M status=progress conv=fdatasync
   ```
3. Insert USB into the new target computer and boot. The installation and panel setup will complete in ~5 minutes.
