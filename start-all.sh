#!/usr/bin/env bash
# ==============================================================================
# Toto Company Datacenter - Master Startup Script
# ==============================================================================

PROJECT_DIR="/home/imon/toto-datacenter"

echo "=================================================="
echo "🚀 Starting Toto Company Datacenter Services"
echo "=================================================="

# 1. Start Proxmox VE KVM VM (from Second SSD)
if ! pgrep -f "proxmox-pve" > /dev/null; then
    echo "[+] Launching Proxmox VE Hypervisor VM on Second SSD..."
    /home/imon/Extra_SSD/proxmox-vm/start-proxmox.sh
else
    echo "[✓] Proxmox VE Hypervisor VM is already running."
fi

# 2. Start Backend API (Port 8099)
if ! pgrep -f "toto-datacenter/backend" > /dev/null; then
    echo "[+] Starting Datacenter Backend API Engine (Port 8099)..."
    nohup "$PROJECT_DIR/backend/venv/bin/python" "$PROJECT_DIR/backend/main.py" > "$PROJECT_DIR/backend.log" 2>&1 &
    echo $! > "$PROJECT_DIR/backend.pid"
else
    echo "[✓] Backend API Engine is already running."
fi

# 3. Start Frontend Panel (Port 3099)
if ! pgrep -f "toto-datacenter-panel" > /dev/null; then
    echo "[+] Starting Datacenter Frontend Panel (Port 3099)..."
    cd "$PROJECT_DIR/frontend" && nohup npm run preview > "$PROJECT_DIR/frontend.log" 2>&1 &
    echo $! > "$PROJECT_DIR/frontend.pid"
else
    echo "[✓] Frontend Control Panel is already running."
fi

sleep 2
echo "=================================================="
echo "🎉 Toto Company Datacenter is LIVE:"
echo "   • Custom Control Panel: http://localhost:3099"
echo "   • Backend API Engine:   http://localhost:8099"
echo "   • Native Proxmox GUI:   https://127.0.0.1:8006"
echo "=================================================="
