#!/usr/bin/env bash
# ==============================================================================
# Toto Company Datacenter - Master Stop Script
# ==============================================================================

echo "=================================================="
echo "🛑 Stopping Toto Company Datacenter Services"
echo "=================================================="

pkill -f "toto-datacenter/backend" 2>/dev/null && echo "[✓] Backend API stopped." || echo "[!] Backend was not running."
pkill -f "toto-datacenter-panel" 2>/dev/null && echo "[✓] Frontend Panel stopped." || echo "[!] Frontend was not running."

echo "[*] To also stop the Proxmox Hypervisor VM, run:"
echo "    /home/imon/Extra_SSD/proxmox-vm/stop-proxmox.sh"
echo "=================================================="
