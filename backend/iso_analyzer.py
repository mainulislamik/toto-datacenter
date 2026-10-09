import re
import os
from typing import Dict, Any, Optional

def parse_iso_header_bytes(header_bytes: bytes) -> Dict[str, str]:
    """
    Parses ISO 9660 Primary Volume Descriptor (offset 32768, length 2048).
    """
    info = {
        "is_valid_iso": False,
        "volume_id": "",
        "system_id": "",
        "publisher_id": "",
        "preparer_id": "",
        "application_id": ""
    }
    
    if len(header_bytes) < 2048:
        return info
        
    # Check Standard Identifier at byte 1..6 (offset 1 is type 1 = Primary Volume Descriptor, 1..6 is 'CD001')
    if header_bytes[1:6] == b"CD001":
        info["is_valid_iso"] = True
        info["system_id"] = header_bytes[8:40].decode('latin1', errors='ignore').strip()
        info["volume_id"] = header_bytes[40:72].decode('latin1', errors='ignore').strip()
        info["publisher_id"] = header_bytes[318:446].decode('latin1', errors='ignore').strip()
        info["preparer_id"] = header_bytes[446:574].decode('latin1', errors='ignore').strip()
        info["application_id"] = header_bytes[574:702].decode('latin1', errors='ignore').strip()
        
    return info

def analyze_iso(filename: str, volume_id: str = "", header_info: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
    """
    Intelligently analyzes and classifies an ISO file based on filename, Volume ID, and ISO 9660 metadata.
    Returns rich metadata including OS family, distro name, version, architecture, recommended VM hardware specs,
    and boot requirements.
    """
    text = f"{filename} {volume_id}".lower()
    if header_info:
        for k, v in header_info.items():
            if isinstance(v, str):
                text += f" {v.lower()}"
                
    result = {
        "os_family": "Unknown",
        "distro": "Generic Operating System",
        "version": "Unknown",
        "arch": "x86_64",
        "category": "Operating System",
        "icon": "disc",
        "badge_color": "slate",
        "boot_type": "UEFI / BIOS Hybrid",
        "recommended_specs": {
            "cores": 2,
            "memory_mb": 2048,
            "disk_gb": 20,
            "ostype": "l26"
        },
        "description": "Standard bootable ISO installer.",
        "tags": ["Installer", "x86_64"]
    }
    
    # --- 1. Architecture Detection ---
    if "arm64" in text or "aarch64" in text:
        result["arch"] = "aarch64"
    elif "i386" in text or "x86_32" in text or "i686" in text:
        result["arch"] = "i386"
    else:
        result["arch"] = "x86_64"

    # --- 2. UBUNTU ---
    if "ubuntu" in text:
        result["os_family"] = "Linux"
        result["icon"] = "ubuntu"
        result["badge_color"] = "orange"
        result["recommended_specs"]["ostype"] = "l26"
        
        # Version detection
        if "24.04" in text or "noble" in text:
            result["version"] = "24.04 LTS (Noble Numbat)"
        elif "22.04" in text or "jammy" in text:
            result["version"] = "22.04 LTS (Jammy Jellyfish)"
        elif "20.04" in text or "focal" in text:
            result["version"] = "20.04 LTS (Focal Fossa)"
        else:
            ver_match = re.search(r'ubuntu[_-]?(\d+\.\d+)', text)
            result["version"] = ver_match.group(1) if ver_match else "Latest"
            
        if "server" in text or "live-server" in text:
            result["distro"] = "Ubuntu Server"
            result["category"] = "Enterprise Server"
            result["recommended_specs"] = {"cores": 2, "memory_mb": 2048, "disk_gb": 20, "ostype": "l26"}
            result["description"] = "Standard cloud & enterprise server operating system with OpenSSH, systemd, and cloud-init."
        elif "desktop" in text:
            result["distro"] = "Ubuntu Desktop"
            result["category"] = "Desktop GUI"
            result["recommended_specs"] = {"cores": 4, "memory_mb": 4096, "disk_gb": 35, "ostype": "l26"}
            result["description"] = "Full GNOME graphical workstation environment for Linux desktop workflows."
        else:
            result["distro"] = "Ubuntu Linux"
            result["category"] = "Linux Distribution"
            result["recommended_specs"] = {"cores": 2, "memory_mb": 2048, "disk_gb": 20, "ostype": "l26"}
            
        result["tags"] = ["Linux", "Debian-based", "systemd", result["arch"]]
        return result

    # --- 3. DEBIAN ---
    if "debian" in text:
        result["os_family"] = "Linux"
        result["icon"] = "debian"
        result["badge_color"] = "red"
        result["recommended_specs"]["ostype"] = "l26"
        
        if "12" in text or "bookworm" in text:
            result["version"] = "12 (Bookworm)"
        elif "11" in text or "bullseye" in text:
            result["version"] = "11 (Bullseye)"
        elif "13" in text or "trixie" in text:
            result["version"] = "13 (Trixie)"
        else:
            result["version"] = "Stable"
            
        if "netinst" in text:
            result["distro"] = "Debian Minimal (Netinst)"
            result["category"] = "Minimal Server"
            result["recommended_specs"] = {"cores": 1, "memory_mb": 1024, "disk_gb": 10, "ostype": "l26"}
            result["description"] = "Rock-solid Debian base minimal net-installer. Extremely stable."
        else:
            result["distro"] = "Debian GNU/Linux"
            result["category"] = "Enterprise Server"
            result["recommended_specs"] = {"cores": 2, "memory_mb": 2048, "disk_gb": 15, "ostype": "l26"}
            result["description"] = "The Universal Operating System. Foundation for rock-solid server deployments."
            
        result["tags"] = ["Linux", "Debian", "APT", result["arch"]]
        return result

    # --- 4. RED HAT / ROCKY / ALMALINUX / CENTOS / FEDORA ---
    if any(k in text for k in ["rocky", "alma", "rhel", "redhat", "centos", "fedora"]):
        result["os_family"] = "Linux"
        result["icon"] = "redhat"
        result["badge_color"] = "blue"
        result["recommended_specs"]["ostype"] = "l26"
        
        if "rocky" in text:
            result["distro"] = "Rocky Linux"
        elif "alma" in text:
            result["distro"] = "AlmaLinux"
        elif "centos" in text:
            result["distro"] = "CentOS Stream"
        elif "fedora" in text:
            result["distro"] = "Fedora Server"
        else:
            result["distro"] = "Red Hat Enterprise Linux"
            
        ver_match = re.search(r'(\d+(\.\d+)?)', text)
        result["version"] = ver_match.group(1) if ver_match else "9.x"
        result["category"] = "Enterprise Linux (RHEL-compatible)"
        result["recommended_specs"] = {"cores": 2, "memory_mb": 4096, "disk_gb": 25, "ostype": "l26"}
        result["description"] = "Production 1:1 binary compatible enterprise Linux standard for high-performance enterprise workloads."
        result["tags"] = ["Linux", "RHEL", "RPM", "SELinux", result["arch"]]
        return result

    # --- 5. ALPINE LINUX ---
    if "alpine" in text:
        result["os_family"] = "Linux"
        result["distro"] = "Alpine Linux"
        result["icon"] = "alpine"
        result["badge_color"] = "cyan"
        result["category"] = "Ultra-Lightweight / Micro-OS"
        alpine_match = re.search(r'alpine[_-]?(\d+\.\d+(\.\d+)?)', text)
        result["version"] = alpine_match.group(1) if alpine_match else "3.x"
        result["recommended_specs"] = {"cores": 1, "memory_mb": 512, "disk_gb": 5, "ostype": "l26"}
        result["description"] = "Security-oriented, lightweight Linux distribution based on musl libc and busybox. <100MB footprint."
        result["tags"] = ["Linux", "musl", "BusyBox", "Lightweight"]
        return result

    # --- 6. ARCH LINUX / MANJARO ---
    if "archlinux" in text or "arch" in text or "manjaro" in text:
        result["os_family"] = "Linux"
        result["distro"] = "Arch Linux" if "arch" in text else "Manjaro Linux"
        result["icon"] = "arch"
        result["badge_color"] = "sky"
        result["category"] = "Rolling Release Workstation"
        result["version"] = "Rolling Release"
        result["recommended_specs"] = {"cores": 2, "memory_mb": 2048, "disk_gb": 20, "ostype": "l26"}
        result["description"] = "Bleeding-edge rolling release distribution with Pacman package manager."
        result["tags"] = ["Linux", "Rolling", "Pacman", result["arch"]]
        return result

    # --- 7. KALI LINUX / PARROT OS (Cybersecurity) ---
    if "kali" in text or "parrot" in text:
        result["os_family"] = "Linux"
        result["distro"] = "Kali Linux" if "kali" in text else "Parrot Security OS"
        result["icon"] = "shield"
        result["badge_color"] = "violet"
        result["category"] = "Cybersecurity & Pentesting"
        result["version"] = "2024.x" if "2024" in text else "Rolling"
        result["recommended_specs"] = {"cores": 4, "memory_mb": 4096, "disk_gb": 35, "ostype": "l26"}
        result["description"] = "Advanced penetration testing, security auditing, and forensic tool suite."
        result["tags"] = ["Security", "Penetration Testing", "Debian", result["arch"]]
        return result

    # --- 8. MICROSOFT WINDOWS (Server & Client) ---
    if any(k in text for k in ["windows", "win11", "win10", "winserver", "srv2022", "srv2019", "srv2025", "win_"]):
        result["os_family"] = "Windows"
        result["icon"] = "windows"
        result["badge_color"] = "blue"
        result["boot_type"] = "UEFI (OVMF) + TPM 2.0"
        
        if "2025" in text:
            result["distro"] = "Windows Server 2025"
            result["version"] = "2025 Datacenter/Standard"
            result["recommended_specs"] = {"cores": 4, "memory_mb": 8192, "disk_gb": 64, "ostype": "win11"}
        elif "2022" in text:
            result["distro"] = "Windows Server 2022"
            result["version"] = "2022 Datacenter/Standard"
            result["recommended_specs"] = {"cores": 4, "memory_mb": 4096, "disk_gb": 50, "ostype": "win11"}
        elif "2019" in text or "2016" in text:
            result["distro"] = "Windows Server 2019/2016"
            result["version"] = "2019/2016"
            result["recommended_specs"] = {"cores": 4, "memory_mb": 4096, "disk_gb": 40, "ostype": "win10"}
        elif "11" in text or "win11" in text:
            result["distro"] = "Windows 11"
            result["version"] = "Pro / Enterprise"
            result["recommended_specs"] = {"cores": 4, "memory_mb": 4096, "disk_gb": 64, "ostype": "win11"}
        elif "10" in text or "win10" in text:
            result["distro"] = "Windows 10"
            result["version"] = "Pro / Enterprise"
            result["recommended_specs"] = {"cores": 2, "memory_mb": 4096, "disk_gb": 40, "ostype": "win10"}
        else:
            result["distro"] = "Microsoft Windows"
            result["version"] = "Generic"
            result["recommended_specs"] = {"cores": 4, "memory_mb": 4096, "disk_gb": 50, "ostype": "win11"}
            
        result["category"] = "Microsoft Windows OS"
        result["description"] = "Windows operating system with VirtIO drivers and VirtIO SCSI disk controller."
        result["tags"] = ["Windows", "NT Kernel", "UEFI", "TPM2", result["arch"]]
        return result

    # --- 9. PFSENSE / OPNSENSE (Firewall & Routing) ---
    if "pfsense" in text or "opnsense" in text:
        result["os_family"] = "BSD"
        result["distro"] = "pfSense CE" if "pfsense" in text else "OPNsense"
        result["icon"] = "network"
        result["badge_color"] = "emerald"
        result["category"] = "Enterprise Router & Firewall"
        result["version"] = "Community Edition"
        result["recommended_specs"] = {"cores": 2, "memory_mb": 2048, "disk_gb": 10, "ostype": "other"}
        result["description"] = "Open source firewall and routing platform based on FreeBSD with stateful packet filtering."
        result["tags"] = ["Firewall", "Router", "FreeBSD", "Networking"]
        return result

    # --- 10. TRUENAS (Storage NAS) ---
    if "truenas" in text or "freenas" in text:
        result["os_family"] = "Storage OS"
        result["distro"] = "TrueNAS SCALE" if "scale" in text else "TrueNAS CORE"
        result["icon"] = "hard-drive"
        result["badge_color"] = "indigo"
        result["category"] = "Enterprise NAS & Storage"
        result["version"] = "SCALE (Debian-based)" if "scale" in text else "CORE (FreeBSD-based)"
        result["recommended_specs"] = {"cores": 4, "memory_mb": 8192, "disk_gb": 30, "ostype": "l26"}
        result["description"] = "OpenStorage platform powered by OpenZFS, offering NFS, SMB, iSCSI, and snapshot protection."
        result["tags"] = ["NAS", "OpenZFS", "Storage", "Enterprise"]
        return result

    # --- 11. PROXMOX VE / PBS (Hypervisors) ---
    if "proxmox" in text or "pve" in text:
        result["os_family"] = "Hypervisor"
        result["distro"] = "Proxmox VE (PVE)" if "pve" in text or "proxmox-ve" in text else "Proxmox Backup Server"
        result["icon"] = "server"
        result["badge_color"] = "orange"
        result["category"] = "Type-1 Hypervisor"
        result["version"] = "8.x"
        result["recommended_specs"] = {"cores": 4, "memory_mb": 8192, "disk_gb": 40, "ostype": "l26"}
        result["description"] = "Enterprise virtualization platform based on Debian GNU/Linux with KVM and LXC."
        result["tags"] = ["Hypervisor", "KVM", "LXC", "Virtualization"]
        return result

    # --- 12. RESCUE & UTILITY TOOLS ---
    if any(k in text for k in ["rescue", "clonezilla", "gparted", "memtest", "hiren"]):
        result["os_family"] = "Utility"
        if "clonezilla" in text:
            result["distro"] = "Clonezilla Live"
        elif "gparted" in text:
            result["distro"] = "GParted Live"
        elif "memtest" in text:
            result["distro"] = "MemTest86+"
        else:
            result["distro"] = "SystemRescue Live"
            
        result["icon"] = "tool"
        result["badge_color"] = "amber"
        result["category"] = "System Rescue & Diagnostics"
        result["version"] = "Live Utility"
        result["recommended_specs"] = {"cores": 1, "memory_mb": 1024, "disk_gb": 5, "ostype": "l26"}
        result["description"] = "Bootable emergency live toolkit for partition repair, disk cloning, and hardware diagnostics."
        result["tags"] = ["Live CD", "Diagnostics", "Recovery"]
        return result

    # Default fallback
    return result
