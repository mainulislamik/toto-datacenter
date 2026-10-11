#!/usr/bin/env bash
# ==============================================================================
# Toto Company Datacenter - Master Shutdown Script
# ==============================================================================

echo "=================================================="
echo "🛑 Shutting Down Toto Company Datacenter & Proxmox"
echo "=================================================="

# 1. Stop Frontend (Port 3099 / Vite)
echo "[*] Stopping Frontend Panel (Port 3099)..."
fuser -k 3099/tcp 2>/dev/null || true
pkill -f "vite --port 3099" 2>/dev/null || true
pkill -f "toto-datacenter-panel" 2>/dev/null || true
echo "[✓] Frontend Panel stopped."

# 2. Stop Backend (Port 8099 / FastAPI)
echo "[*] Stopping Backend API Engine (Port 8099)..."
fuser -k 8099/tcp 2>/dev/null || true
pkill -f "toto-datacenter/backend" 2>/dev/null || true
echo "[✓] Backend API stopped."

# 3. Stop Proxmox VE Hypervisor VM
echo "[*] Stopping Proxmox VE KVM Hypervisor VM..."
if [ -f "/home/imon/Extra_SSD/proxmox-vm/stop-proxmox.sh" ]; then
    /home/imon/Extra_SSD/proxmox-vm/stop-proxmox.sh
fi
# Safety check
pkill -f "name proxmox-pve" 2>/dev/null || true
echo "[✓] Proxmox VE VM stopped."

echo "=================================================="
echo "✅ All Datacenter services and Proxmox are fully STOPPED."
echo "   CPU and RAM are now completely freed."
echo "   To start again anytime, run:"
echo "   ~/start-datacenter.sh (or /home/imon/toto-datacenter/start-all.sh)"
echo "=================================================="
