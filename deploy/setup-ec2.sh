#!/bin/bash
################################################################################
# EC2 Setup Script for BountyBreach.com Deployment
# 
# This script automates the initial setup of an Ubuntu EC2 instance including:
# - System updates
# - Node.js 20+ installation (installs from NodeSource 22.x channel)
# - Nginx installation
# - PM2 global installation
# - Repository cloning
#
# Usage: ./setup-ec2.sh
################################################################################

set -e  # Exit on error

SKIP_CLONE=false

for arg in "$@"; do
    case "$arg" in
        --skip-clone)
            SKIP_CLONE=true
            ;;
        -h|--help)
            echo "Usage: ./setup-ec2.sh [--skip-clone]"
            echo "  --skip-clone   Do not clone repository; require an existing local repo"
            exit 0
            ;;
        *)
            echo "Unknown option: $arg"
            echo "Usage: ./setup-ec2.sh [--skip-clone]"
            exit 1
            ;;
    esac
done

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== BountyBreach.com EC2 Setup ===${NC}"
echo "This script will set up your Ubuntu EC2 instance for production deployment."
echo ""

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
REPO_DIR=""

# Verify running as ubuntu user
if [ "$USER" != "ubuntu" ]; then
    echo -e "${RED}ERROR: This script must be run as the 'ubuntu' user${NC}"
    exit 1
fi

# Step 1: System Update
echo -e "${YELLOW}[1/7] Updating system packages...${NC}"
sudo apt update
sudo apt upgrade -y

# Step 2: Install or upgrade Node.js to supported version
echo -e "${YELLOW}[2/7] Ensuring Node.js 20+ is installed...${NC}"
NODE_MIN_MAJOR=20
NEEDS_NODE_INSTALL=true

if command -v node &> /dev/null; then
    CURRENT_NODE_VERSION="$(node --version)"
    CURRENT_NODE_MAJOR="$(echo "$CURRENT_NODE_VERSION" | sed 's/^v//' | cut -d. -f1)"
    if [[ "$CURRENT_NODE_MAJOR" =~ ^[0-9]+$ ]] && [ "$CURRENT_NODE_MAJOR" -ge "$NODE_MIN_MAJOR" ]; then
        NEEDS_NODE_INSTALL=false
        echo -e "${GREEN}✓ Node.js already supported: $CURRENT_NODE_VERSION${NC}"
    else
        echo -e "${YELLOW}! Node.js $CURRENT_NODE_VERSION is outdated. Upgrading to a supported version...${NC}"
    fi
fi

if [ "$NEEDS_NODE_INSTALL" = true ]; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt install -y nodejs
    echo -e "${GREEN}✓ Node.js $(node --version) installed/updated${NC}"
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

# Step 5: Resolve repository directory
echo -e "${YELLOW}[5/7] Resolving BountyBreach repository path...${NC}"
if [ -d "$PROJECT_ROOT/.git" ] && [ -f "$PROJECT_ROOT/foundation-proxy/package.json" ]; then
    REPO_DIR="$PROJECT_ROOT"
    echo -e "${GREEN}✓ Using current repository: $REPO_DIR${NC}"
elif [ -d "/home/ubuntu/bountybreach.github.io/.git" ] && [ -f "/home/ubuntu/bountybreach.github.io/foundation-proxy/package.json" ]; then
    REPO_DIR="/home/ubuntu/bountybreach.github.io"
    echo -e "${GREEN}✓ Using existing repository: $REPO_DIR${NC}"
else
    if [ "$SKIP_CLONE" = true ]; then
        echo -e "${RED}ERROR: Repository not found and --skip-clone was provided${NC}"
        echo "Expected one of:"
        echo "  - Current script parent directory to be a valid repo"
        echo "  - /home/ubuntu/bountybreach.github.io to exist"
        exit 1
    fi

    cd /home/ubuntu
    git clone https://github.com/bountybreach/bountybreach.github.io.git
    REPO_DIR="/home/ubuntu/bountybreach.github.io"
    echo -e "${GREEN}✓ Repository cloned to $REPO_DIR${NC}"
fi

# Step 6: Install foundation-proxy dependencies
echo -e "${YELLOW}[6/7] Installing foundation-proxy dependencies...${NC}"
cd "$REPO_DIR/foundation-proxy"
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
