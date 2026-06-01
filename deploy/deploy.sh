#!/bin/bash
################################################################################
# Deployment Script for BountyBreach.com
#
# This script automates:
# - Deployment of static files to Nginx
# - Starting foundation-proxy with PM2
# - Verifying services are running
#
# Usage: ./deploy.sh
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== BountyBreach.com Deployment ===${NC}"

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Verify environment file exists
if [ ! -f "$PROJECT_ROOT/foundation-proxy/.env" ]; then
    echo -e "${RED}ERROR: foundation-proxy/.env not found${NC}"
    echo "Please copy .env.example to .env and configure your production values"
    exit 1
fi

# Step 1: Stop current PM2 process (if running)
echo -e "${YELLOW}[1/5] Stopping current foundation-proxy process (if running)...${NC}"
if pm2 list | grep -q "foundation-proxy"; then
    pm2 delete foundation-proxy 2>/dev/null || true
    echo -e "${GREEN}✓ Stopped foundation-proxy${NC}"
else
    echo -e "${GREEN}✓ No running foundation-proxy process${NC}"
fi

# Step 2: Deploy static files
echo -e "${YELLOW}[2/5] Deploying static files to /var/www/bountybreach.com...${NC}"
sudo rsync -av --delete \
    --exclude='foundation-proxy' \
    --exclude='.git' \
    --exclude='deploy' \
    --exclude='node_modules' \
    "$PROJECT_ROOT/" /var/www/bountybreach.com/

sudo chown -R www-data:www-data /var/www/bountybreach.com
echo -e "${GREEN}✓ Static files deployed${NC}"

# Step 3: Start foundation-proxy with PM2
echo -e "${YELLOW}[3/5] Starting foundation-proxy with PM2...${NC}"
cd "$PROJECT_ROOT/foundation-proxy"
pm2 start server.js --name "foundation-proxy" --env production
echo -e "${GREEN}✓ foundation-proxy started${NC}"

# Step 4: Save PM2 process list and configure for startup
echo -e "${YELLOW}[4/5] Configuring PM2 for system startup...${NC}"
pm2 save
pm2 startup systemd -u ubuntu --hp /home/ubuntu 2>/dev/null | sudo bash || true
sudo systemctl enable pm2-ubuntu
echo -e "${GREEN}✓ PM2 configured for startup${NC}"

# Step 5: Verify services
echo -e "${YELLOW}[5/5] Verifying services...${NC}"
echo ""
echo -e "${GREEN}✓ PM2 Process Status:${NC}"
pm2 list

echo ""
echo -e "${GREEN}✓ Nginx Status:${NC}"
sudo systemctl status nginx --no-pager

echo ""
echo -e "${GREEN}=== Deployment Complete ===${NC}"
echo ""
echo "Service URLs:"
echo "  - Foundation Proxy: http://127.0.0.1:9091"
echo "  - Static Website: http://127.0.0.1 (via Nginx)"
echo ""
echo "Next steps:"
echo "1. If not already done, run: ./setup-nginx.sh"
echo "2. Install SSL certificate: sudo certbot --nginx -d bountybreach.com -d www.bountybreach.com"
echo "3. Update your DNS records to point to the EC2 Elastic IP"
echo ""
echo "Monitor logs with:"
echo "  - pm2 logs foundation-proxy"
echo "  - sudo tail -f /var/log/nginx/error.log"
echo ""
