#!/usr/bin/env bash
# ==============================================================================
# Toto Company Datacenter - First-Boot Provisioning Script
# Runs automatically on the first boot after bare-metal OS installation
# ==============================================================================
set -euo pipefail

LOG_FILE="/var/log/toto-datacenter-firstboot.log"
exec > >(tee -a "${LOG_FILE}") 2>&1

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting Toto Company Datacenter First-Boot Provisioning..."

# 1. Configure Free Community Proxmox Repository & Disable Enterprise Nag
echo "[+] Configuring PVE No-Subscription Repository..."
if [ -f /etc/apt/sources.list.d/pve-enterprise.list ]; then
    sed -i 's/^deb/#deb/' /etc/apt/sources.list.d/pve-enterprise.list || true
fi
if [ -f /etc/apt/sources.list.d/ceph.list ]; then
    sed -i 's/^deb/#deb/' /etc/apt/sources.list.d/ceph.list || true
fi

if ! grep -q "pve-no-subscription" /etc/apt/sources.list; then
    echo "deb http://download.proxmox.com/debian/pve bookworm pve-no-subscription" >> /etc/apt/sources.list
fi

# 2. Patch Proxmox Subscription Nag Popup
echo "[+] Removing Proxmox Subscription Nag..."
if [ -f /usr/share/javascript/proxmox-widget-toolkit/proxmoxlib.js ]; then
    sed -Ezi.bak "s/(Ext.Msg.show\(\{\s+title: gettext\('No valid sub)/void\(\{ \/\/\1/g" /usr/share/javascript/proxmox-widget-toolkit/proxmoxlib.js || true
    systemctl restart pveproxy.service || true
fi

# 3. Update Package Index and Install Dependencies
echo "[+] Installing Core Infrastructure Tools..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y curl wget git python3 python3-pip python3-venv bridge-utils net-tools qemu-guest-agent

# 4. Install Node.js 20 LTS for Frontend
if ! command -v node &>/dev/null; then
    echo "[+] Installing Node.js 20 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

# 5. Clone or Deploy Toto Datacenter Control Panel
INSTALL_DIR="/opt/toto-datacenter"
echo "[+] Setting up Toto Datacenter Control Panel in ${INSTALL_DIR}..."
mkdir -p "${INSTALL_DIR}"

if [ ! -d "${INSTALL_DIR}/.git" ]; then
    git clone https://github.com/mainulislamik/toto-datacenter.git "${INSTALL_DIR}" || true
fi

# 6. Setup Backend Virtualenv & Dependencies
if [ -d "${INSTALL_DIR}/backend" ]; then
    echo "[+] Initializing Backend Service..."
    python3 -m venv "${INSTALL_DIR}/backend/venv"
    "${INSTALL_DIR}/backend/venv/bin/pip" install -r "${INSTALL_DIR}/backend/requirements.txt" || true
fi

# 7. Build Frontend Panel
if [ -d "${INSTALL_DIR}/frontend" ]; then
    echo "[+] Building Next.js Frontend Panel..."
    cd "${INSTALL_DIR}/frontend"
    npm install --legacy-peer-deps || npm install
    npm run build || true
fi

# 8. Create and Enable Systemd Services
echo "[+] Registering Datacenter Systemd Services..."
cat << 'EOF' > /etc/systemd/system/toto-datacenter-backend.service
[Unit]
Description=Toto Datacenter Backend API Engine
After=network.target pveproxy.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/toto-datacenter/backend
ExecStart=/opt/toto-datacenter/backend/venv/bin/python main.py
Restart=always
RestartSec=5
Environment=PORT=8099
Environment=PROXMOX_HOST=127.0.0.1
Environment=PROXMOX_PORT=8006

[Install]
WantedBy=multi-user.target
EOF

cat << 'EOF' > /etc/systemd/system/toto-datacenter-frontend.service
[Unit]
Description=Toto Datacenter Frontend Web Panel
After=network.target toto-datacenter-backend.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/toto-datacenter/frontend
ExecStart=/usr/bin/npm start -- -p 3099
Restart=always
RestartSec=5
Environment=PORT=3099
Environment=NEXT_PUBLIC_API_URL=http://localhost:8099

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now toto-datacenter-backend.service || true
systemctl enable --now toto-datacenter-frontend.service || true

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Toto Company Datacenter First-Boot Provisioning COMPLETED successfully!"
