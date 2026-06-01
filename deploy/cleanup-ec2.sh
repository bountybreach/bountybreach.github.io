#!/usr/bin/env bash
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_step() {
  echo -e "${YELLOW}[$1] $2${NC}"
}

print_ok() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_warn() {
  echo -e "${RED}! $1${NC}"
}

cat <<'BANNER'
=========================================================
   DANGEROUS: EC2 CLEANUP SCRIPT (APP + NGINX + PM2)
=========================================================
This script removes:
- PM2 processes and startup config
- Nginx service + site config for bountybreach
- Deployed app files under /var/www/bountybreach.com
- Local repo ~/bountybreach.github.io (optional)
- Let's Encrypt cert for bountybreach.com (optional)
- Node.js/PM2/Nginx packages (optional)
BANNER

echo
read -r -p "Type YES to continue: " confirm
if [[ "$confirm" != "YES" ]]; then
  print_warn "Aborted. No changes made."
  exit 1
fi

echo
print_step "1/8" "Stopping and removing PM2 processes"
if command -v pm2 >/dev/null 2>&1; then
  pm2 delete all || true
  pm2 save || true
  pm2 unstartup systemd -u ubuntu --hp /home/ubuntu || true
  sudo systemctl disable pm2-ubuntu || true
  sudo systemctl stop pm2-ubuntu || true
  print_ok "PM2 cleanup complete"
else
  print_ok "PM2 not installed; skipping"
fi

echo
print_step "2/8" "Stopping and disabling Nginx"
sudo systemctl stop nginx || true
sudo systemctl disable nginx || true
print_ok "Nginx service stopped/disabled"

echo
print_step "3/8" "Removing deployed web files"
sudo rm -rf /var/www/bountybreach.com
print_ok "Removed /var/www/bountybreach.com"

echo
print_step "4/8" "Removing local repository (if present)"
if [[ -d "$HOME/bountybreach.github.io" ]]; then
  rm -rf "$HOME/bountybreach.github.io"
  print_ok "Removed $HOME/bountybreach.github.io"
else
  print_ok "Repository path not found; skipping"
fi

echo
print_step "5/8" "Removing Nginx site config"
sudo rm -f /etc/nginx/sites-enabled/bountybreach.com
sudo rm -f /etc/nginx/sites-available/bountybreach.com
print_ok "Removed bountybreach Nginx site config"

echo
print_step "6/8" "Optionally removing Let's Encrypt cert"
read -r -p "Remove cert for bountybreach.com? (y/N): " rm_cert
if [[ "$rm_cert" =~ ^[Yy]$ ]]; then
  if command -v certbot >/dev/null 2>&1; then
    sudo certbot delete --cert-name bountybreach.com || true
  fi
  sudo rm -rf /etc/letsencrypt/live/bountybreach.com || true
  sudo rm -rf /etc/letsencrypt/archive/bountybreach.com || true
  sudo rm -f /etc/letsencrypt/renewal/bountybreach.com.conf || true
  print_ok "Certificate cleanup complete"
else
  print_ok "Certificate kept"
fi

echo
print_step "7/8" "Optionally uninstalling runtime packages"
read -r -p "Uninstall nginx/nodejs/certbot and PM2? (y/N): " rm_pkgs
if [[ "$rm_pkgs" =~ ^[Yy]$ ]]; then
  sudo apt purge -y nginx certbot python3-certbot-nginx nodejs || true
  if command -v npm >/dev/null 2>&1; then
    sudo npm uninstall -g pm2 || true
  fi
  sudo apt autoremove -y || true
  sudo apt autoclean || true
  print_ok "Package cleanup complete"
else
  print_ok "Packages kept"
fi

echo
print_step "8/8" "Post-cleanup checks"
echo "PM2:" && (pm2 list || true)
echo
echo "Open ports (80/443/9091):" && (sudo ss -tulpen | grep -E ':(80|443|9091)\b' || true)
echo
echo "Nginx status:" && (systemctl status nginx --no-pager || true)

echo
print_ok "Cleanup finished."
cat <<'NEXT'
Next recommended actions:
1) In GoDaddy, remove or update DNS records pointing to this EC2 IP.
2) In AWS, release unused Elastic IP / EBS snapshots if no longer needed.
3) If you want full wipe, terminate the EC2 instance from AWS Console.
NEXT
