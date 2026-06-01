#!/bin/bash
################################################################################
# Nginx Setup Script for BountyBreach.com
#
# This script:
# - Creates Nginx configuration for bountybreach.com
# - Sets up SSL redirect (HTTP → HTTPS)
# - Configures reverse proxy for /api/* routes to foundation-proxy
# - Enables the site
#
# Usage: ./setup-nginx.sh
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== BountyBreach.com Nginx Setup ===${NC}"

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Check if running with sudo
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}ERROR: This script must be run with sudo${NC}"
    exit 1
fi

# Step 1: Create Nginx configuration file
echo -e "${YELLOW}[1/4] Creating Nginx configuration...${NC}"

cat > /etc/nginx/sites-available/bountybreach.com << 'EOF'
# HTTP redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name bountybreach.com www.bountybreach.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name bountybreach.com www.bountybreach.com;

    # SSL configuration (will be updated by certbot)
    # ssl_certificate /etc/letsencrypt/live/bountybreach.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/bountybreach.com/privkey.pem;

    # SSL hardening
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Root directory for static files
    root /var/www/bountybreach.com;
    index index.html;

    # API proxy to foundation-proxy
    location /api/ {
        proxy_pass http://127.0.0.1:9091;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts for long-running LLM requests
        proxy_connect_timeout 30s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;
    }

    # Upstream auth check endpoint
    location /upstream/ {
        proxy_pass http://127.0.0.1:9091;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Auth endpoints are fast
        proxy_connect_timeout 10s;
        proxy_send_timeout 10s;
        proxy_read_timeout 10s;
    }

    # Static file caching
    location ~ ^/(assets|images|screenshots)/ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Versioned asset caching
    location ~ \.(js|css)$ {
        expires 7d;
        add_header Cache-Control "public, must-revalidate";
    }

    # SPA fallback: try files, then directories, then index.html
    location / {
        try_files $uri $uri/ /index.html;
        expires 1d;
        add_header Cache-Control "public, must-revalidate";
    }

    # Deny access to sensitive files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    location ~ ~$ {
        deny all;
        access_log off;
        log_not_found off;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;
}
EOF

echo -e "${GREEN}✓ Nginx configuration created${NC}"

# Step 2: Remove default Nginx site if it exists
echo -e "${YELLOW}[2/4] Disabling default Nginx site...${NC}"
if [ -L /etc/nginx/sites-enabled/default ]; then
    rm /etc/nginx/sites-enabled/default
    echo -e "${GREEN}✓ Default site disabled${NC}"
else
    echo -e "${GREEN}✓ Default site already disabled${NC}"
fi

# Step 3: Enable the bountybreach.com site
echo -e "${YELLOW}[3/4] Enabling bountybreach.com site...${NC}"
if [ ! -L /etc/nginx/sites-enabled/bountybreach.com ]; then
    ln -s /etc/nginx/sites-available/bountybreach.com /etc/nginx/sites-enabled/bountybreach.com
fi

# Test Nginx configuration
echo -e "${YELLOW}[4/4] Testing Nginx configuration...${NC}"
if nginx -t; then
    echo -e "${GREEN}✓ Nginx configuration is valid${NC}"
    systemctl restart nginx
    echo -e "${GREEN}✓ Nginx restarted${NC}"
else
    echo -e "${RED}ERROR: Nginx configuration test failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}=== Nginx Setup Complete ===${NC}"
echo ""
echo "Next steps:"
echo "1. Install SSL certificate:"
echo "   sudo certbot --nginx -d bountybreach.com -d www.bountybreach.com"
echo ""
echo "2. Verify Nginx is running:"
echo "   sudo systemctl status nginx"
echo ""
echo "3. Test the site (before DNS update):"
echo "   curl -H 'Host: bountybreach.com' http://127.0.0.1"
echo ""
