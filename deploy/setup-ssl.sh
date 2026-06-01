#!/bin/bash
################################################################################
# SSL Certificate Setup Script for BountyBreach.com
#
# This script:
# - Installs Certbot and the Nginx plugin
# - Obtains an SSL certificate from Let's Encrypt
# - Configures Nginx with HTTPS and redirect
# - Configures automatic renewal
#
# Usage: sudo ./setup-ssl.sh
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== BountyBreach.com SSL Setup ===${NC}"

# Check if running with sudo
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}ERROR: This script must be run with sudo${NC}"
    exit 1
fi

# Step 1: Install Certbot
echo -e "${YELLOW}[1/4] Installing Certbot...${NC}"
if ! command -v certbot &> /dev/null; then
    apt install -y certbot python3-certbot-nginx
    echo -e "${GREEN}✓ Certbot installed${NC}"
else
    echo -e "${GREEN}✓ Certbot already installed${NC}"
fi

# Step 2: Obtain certificate
echo -e "${YELLOW}[2/4] Obtaining SSL certificate from Let's Encrypt...${NC}"
echo "You will be prompted to enter an email address and agree to the terms."
echo ""

certbot --nginx --redirect -d bountybreach.com -d www.bountybreach.com

# Step 3: Enable automatic renewal
echo -e "${YELLOW}[3/4] Setting up automatic certificate renewal...${NC}"
systemctl enable certbot.timer
systemctl start certbot.timer
echo -e "${GREEN}✓ Automatic renewal configured${NC}"

# Step 4: Verify renewal
echo -e "${YELLOW}[4/4] Testing certificate renewal (dry run)...${NC}"
certbot renew --dry-run

echo ""
echo -e "${GREEN}=== SSL Setup Complete ===${NC}"
echo ""
echo "Your certificate is now active for:"
echo "  - bountybreach.com"
echo "  - www.bountybreach.com"
echo ""
echo "The certificate will automatically renew 30 days before expiration."
echo ""
echo "To check certificate status:"
echo "  certbot certificates"
echo ""
