# 💿 Toto Company Datacenter - Bare-Metal ISO Deployment

This directory contains the tools to build a 100% automated, zero-touch bootable Proxmox VE installation ISO embedded with the **Toto Company Datacenter** environment.

---

## 🚀 Quick Start (Generating the Bootable ISO)

Run the automated builder script:

```bash
cd /opt/toto-datacenter/iso-builder  # or ~/toto-datacenter/iso-builder
./build-iso.sh
```

This will output `toto-datacenter-v1.0.iso`.

---

## ⚡ Flashing to USB Flash Drive

### Option A: On Linux (Terminal)
1. Insert your USB pendrive and identify its device path using `lsblk` (e.g. `/dev/sdb`).
2. Run the `dd` command (replace `/dev/sdX` with your USB drive):
   ```bash
   sudo dd if=toto-datacenter-v1.0.iso of=/dev/sdX bs=4M status=progress conv=fdatasync
   ```

### Option B: On Windows
1. Download **Rufus** (or use **Ventoy**).
2. Select the `toto-datacenter-v1.0.iso` file and choose your USB drive.
3. When prompted, select **"Write in DD Image mode"**.

---

## 🖥️ Deploying onto a New PC

1. Plug the USB flash drive into the target server / PC.
2. Power on the PC and press the Boot Menu key (`F12`, `F11`, or `Delete`).
3. Select the USB drive (UEFI or Legacy mode).
4. **Sit back and relax!** The automated installer will:
   - Partition the target storage disk.
   - Install the Proxmox VE hypervisor kernel and packages.
   - Configure timezone (`Asia/Dhaka`), networking, and root credentials (`ProxmoxAdmin2026!`).
   - Run the `firstboot.sh` hook to remove the subscription nag and start the **Toto Datacenter Control Panel**.
5. Once complete, access your datacenter control panel at:
   - **Custom Control Panel:** `http://<NEW_SERVER_IP>:3099`
   - **Proxmox Web UI:** `https://<NEW_SERVER_IP>:8006`
