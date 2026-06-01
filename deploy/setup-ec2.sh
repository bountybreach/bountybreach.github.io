#!/bin/bash
################################################################################
# EC2 Setup Script for BountyBreach.com Deployment
# 
# This script automates the initial setup of an Ubuntu EC2 instance including:
# - System updates
# - Node.js 18+ installation
# - Nginx installation
# - PM2 global installation
# - Repository cloning
#
# Usage: ./setup-ec2.sh
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== BountyBreach.com EC2 Setup ===${NC}"
echo "This script will set up your Ubuntu EC2 instance for production deployment."
echo ""

# Verify running as ubuntu user
if [ "$USER" != "ubuntu" ]; then
    echo -e "${RED}ERROR: This script must be run as the 'ubuntu' user${NC}"
    exit 1
fi

# Step 1: System Update
echo -e "${YELLOW}[1/7] Updating system packages...${NC}"
sudo apt update
sudo apt upgrade -y

# Step 2: Install Node.js 18+
echo -e "${YELLOW}[2/7] Installing Node.js 18+...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
    echo -e "${GREEN}✓ Node.js $(node --version) installed${NC}"
else
    echo -e "${GREEN}✓ Node.js already installed: $(node --version)${NC}"
fi

# Step 3: Install Nginx
echo -e "${YELLOW}[3/7] Installing Nginx...${NC}"
if ! command -v nginx &> /dev/null; then
    sudo apt install -y nginx
    sudo systemctl enable nginx
    echo -e "${GREEN}✓ Nginx installed and enabled${NC}"
else
    echo -e "${GREEN}✓ Nginx already installed${NC}"
fi

# Step 4: Install PM2 globally
echo -e "${YELLOW}[4/7] Installing PM2 globally...${NC}"
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
    echo -e "${GREEN}✓ PM2 installed globally${NC}"
else
    echo -e "${GREEN}✓ PM2 already installed$(pm2 --version)${NC}"
fi

# Step 5: Clone repository
echo -e "${YELLOW}[5/7] Cloning BountyBreach repository...${NC}"
if [ ! -d "/home/ubuntu/bountybreach.github.io" ]; then
    cd /home/ubuntu
    git clone https://github.com/bountybreach/bountybreach.github.io.git
    echo -e "${GREEN}✓ Repository cloned${NC}"
else
    echo -e "${GREEN}✓ Repository already exists, updating...${NC}"
    cd /home/ubuntu/bountybreach.github.io
    git pull origin main
fi

# Step 6: Install foundation-proxy dependencies
echo -e "${YELLOW}[6/7] Installing foundation-proxy dependencies...${NC}"
cd /home/ubuntu/bountybreach.github.io/foundation-proxy
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Step 7: Create static files directory
echo -e "${YELLOW}[7/7] Setting up static files directory...${NC}"
sudo mkdir -p /var/www/bountybreach.com
sudo chown -R ubuntu:ubuntu /var/www/bountybreach.com
echo -e "${GREEN}✓ Static files directory created${NC}"

echo ""
echo -e "${GREEN}=== EC2 Setup Complete ===${NC}"
echo ""
echo "Next steps:"
echo "1. Configure environment variables:"
echo "   - Copy deploy/.env.example to foundation-proxy/.env"
echo "   - Edit foundation-proxy/.env with your production values"
echo ""
echo "2. Deploy static files and start services:"
echo "   - Run: ./deploy/deploy.sh"
echo ""
echo "3. Configure Nginx:"
echo "   - Run: ./deploy/setup-nginx.sh"
echo ""
echo "4. Update DNS to point bountybreach.com to your EC2 Elastic IP"
echo ""
