#!/usr/bin/env bash
# ==============================================================================
# Toto Company Datacenter - Custom Bootable ISO Generator
# Generates a 100% automated bare-metal installer ISO with embedded answer.toml
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORK_DIR="/tmp/toto-iso-build"
BASE_ISO="${SCRIPT_DIR}/proxmox-ve_8.4-1.iso"
OUTPUT_ISO="${SCRIPT_DIR}/toto-datacenter-v1.0.iso"
ANSWER_FILE="${SCRIPT_DIR}/answer.toml"

echo "======================================================================"
echo "    Toto Company Datacenter - Bootable ISO Builder                    "
echo "======================================================================"

# 1. Check for Base Proxmox ISO
if [ ! -f "${BASE_ISO}" ]; then
    # Look for cached copies on this host
    if [ -f "/home/imon/Extra_SSD/proxmox-vm/proxmox-ve_8.4-1.iso" ]; then
        echo "[+] Using local cached Proxmox VE 8.4 ISO..."
        cp "/home/imon/Extra_SSD/proxmox-vm/proxmox-ve_8.4-1.iso" "${BASE_ISO}"
    else
        echo "[+] Downloading official Proxmox VE 8.4 ISO..."
        wget -c -O "${BASE_ISO}" "https://enterprise.proxmox.com/iso/proxmox-ve_8.4-1.iso"
    fi
fi

# 2. Check Prerequisites
for tool in xorriso genisoimage 7z; do
    if ! command -v "${tool}" &>/dev/null; then
        echo "[-] Error: ${tool} is required. Install via: sudo apt-get install -y ${tool}"
        exit 1
    fi
done

# 3. Clean Workspace
rm -rf "${WORK_DIR}"
mkdir -p "${WORK_DIR}/iso_files" "${WORK_DIR}/extracted"

echo "[+] Preparing Answer ISO Partition with label 'proxmox-ais'..."
mkdir -p "${WORK_DIR}/ais_content"
cp "${ANSWER_FILE}" "${WORK_DIR}/ais_content/answer.toml"
if [ -f "${SCRIPT_DIR}/firstboot.sh" ]; then
    cp "${SCRIPT_DIR}/firstboot.sh" "${WORK_DIR}/ais_content/firstboot.sh"
fi

# Generate the answer partition ISO
genisoimage -V "proxmox-ais" -J -r -o "${WORK_DIR}/answer.iso" "${WORK_DIR}/ais_content"

# 4. Integrate Answer File into ISO Boot Image
echo "[+] Embedding automated installation into Toto Datacenter ISO..."
# We generate a hybrid bootable ISO containing the automated answer payload
cp "${BASE_ISO}" "${OUTPUT_ISO}"

# If proxmox-auto-install-assistant is available, prepare directly:
if command -v proxmox-auto-install-assistant &>/dev/null; then
    proxmox-auto-install-assistant prepare-iso "${BASE_ISO}" --answer "${ANSWER_FILE}" --output "${OUTPUT_ISO}"
else
    # Direct xorriso hybrid embedding
    echo "[+] Using xorriso auto-installer embedding..."
    xorriso -indev "${BASE_ISO}" \
            -outdev "${OUTPUT_ISO}" \
            -boot_image any replay \
            -add "${ANSWER_FILE}" /answer.toml \
            -commit
fi

echo "======================================================================"
echo "[SUCCESS] Custom Datacenter ISO Generated:"
echo "          -> ${OUTPUT_ISO}"
echo ""
echo "🔥 How to Flash to USB Pendrive for New PC Deployment:"
echo "   Linux command:   sudo dd if=${OUTPUT_ISO} of=/dev/sdX bs=4M status=progress conv=fdatasync"
echo "   Windows command: Use Rufus (select 'DD Image mode') or Ventoy"
echo "======================================================================"
