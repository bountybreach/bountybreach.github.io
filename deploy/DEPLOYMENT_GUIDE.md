#!/bin/bash
################################################################################
# Comprehensive EC2 Deployment Guide for BountyBreach.com
#
# This document provides step-by-step instructions for deploying
# bountybreach.com to AWS EC2 with Nginx, Node.js, and SSL.
#
################################################################################

cat << 'EOF'

╔══════════════════════════════════════════════════════════════════════════════╗
║                   BountyBreach.com EC2 Deployment Guide                     ║
╚══════════════════════════════════════════════════════════════════════════════╝

## PREREQUISITES

1. AWS EC2 Instance
   - OS: Ubuntu 22.04 LTS or newer
   - Instance Type: t3.medium or larger (2 vCPU, 4GB RAM minimum)
   - Security Groups: Allow SSH (22), HTTP (80), HTTPS (443)
   - Elastic IP: Allocated and associated
   - Storage: 50GB EBS volume minimum

2. Domain Setup
   - Domain: bountybreach.com
   - Registrar access for DNS updates

3. Local Machine Setup
   - SSH key pair (secureAI.pem) with correct permissions (chmod 400)
   - Git installed
   - Basic terminal/SSH knowledge

## STEP 1: Initial Connection & Verification

# SSH into your EC2 instance
ssh -i secureAI.pem ubuntu@YOUR_ELASTIC_IP

# Verify Ubuntu version
lsb_release -a

# Expected output: Ubuntu 22.04 LTS or newer

## STEP 2: Clone Repository with Deployment Scripts

# Navigate to home directory
cd ~

# Clone the repository
git clone https://github.com/bountybreach/bountybreach.github.io.git
cd bountybreach.github.io

## STEP 3: Run Initial EC2 Setup Script

# Make setup script executable
chmod +x deploy/setup-ec2.sh

# Run the setup script
./deploy/setup-ec2.sh

# Output should show:
# ✓ Node.js 20+ installed/updated
# ✓ Nginx installed and enabled
# ✓ PM2 installed globally
# ✓ Repository cloned
# ✓ Dependencies installed
# ✓ Static files directory created

## STEP 4: Configure Environment Variables

# Copy the example environment file
cp deploy/.env.example foundation-proxy/.env

# Edit with your actual values
nano foundation-proxy/.env

# REQUIRED values to update:
# - BB_PROXY_FOUNDATION_BASE_URL: Your backend API URL
# - BB_PROXY_FOUNDATION_TOKEN: Your authentication token
# - BB_PROXY_ALLOWED_ORIGINS: Your production domain

# Example configuration:
# BB_PROXY_FOUNDATION_BASE_URL=https://api.bountybreach.com
# BB_PROXY_FOUNDATION_TOKEN=sk_prod_abc123def456
# BB_PROXY_ALLOWED_ORIGINS=https://bountybreach.com,https://www.bountybreach.com

# Save: Ctrl+X, Y, Enter (in nano)

## STEP 5: Set Up Nginx Reverse Proxy

# Make setup-nginx.sh executable
chmod +x deploy/setup-nginx.sh

# Run with sudo
sudo deploy/setup-nginx.sh

# Output should show:
# ✓ Nginx configuration created
# ✓ Default site disabled
# ✓ bountybreach.com site enabled
# ✓ Nginx restarted

## STEP 6: Deploy Application & Start Services

# Make deploy.sh executable
chmod +x deploy/deploy.sh

# Run deployment
./deploy/deploy.sh

# Output should show:
# ✓ Stopped current foundation-proxy process
# ✓ Static files deployed
# ✓ foundation-proxy started
# ✓ PM2 configured for startup

# Verify PM2 process is running
pm2 list
pm2 logs foundation-proxy --lines 20

## STEP 7: Install SSL Certificate

# Make setup-ssl.sh executable
chmod +x deploy/setup-ssl.sh

# Run SSL setup with sudo
sudo deploy/setup-ssl.sh

# You'll be prompted to:
# 1. Enter an email address
# 2. Agree to Let's Encrypt terms of service
# 3. Agree to EFF terms

# Verify certificate installation
sudo certbot certificates

## STEP 8: Test Local Connectivity

# Test static files
curl -H 'Host: bountybreach.com' http://127.0.0.1

# Test API proxy
curl -X POST http://127.0.0.1/api/v1/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "query": "test",
    "agent_id": "test-agent",
    "tenant_id": "production"
  }'

# Test auth endpoint
curl -X POST http://127.0.0.1/upstream/auth-check \
  -H "Content-Type: application/json"

## STEP 9: Update DNS

In your domain registrar (GoDaddy, Namecheap, Route 53, etc.):

1. Update DNS A record for bountybreach.com to point to YOUR_ELASTIC_IP
2. Update DNS A record for www.bountybreach.com to point to YOUR_ELASTIC_IP
   OR create a CNAME pointing to bountybreach.com

Example for Route 53:
- Name: bountybreach.com
- Type: A
- Value: YOUR_ELASTIC_IP (e.g., 54.123.456.789)

- Name: www.bountybreach.com
- Type: CNAME
- Value: bountybreach.com

DNS propagation: 15 minutes to 48 hours

## STEP 10: Verify Deployment

# Wait 15-30 minutes for DNS propagation

# Test HTTPS access
curl -I https://bountybreach.com
# Should return 200 OK with SSL certificate info

# Check SSL certificate
curl -vI https://bountybreach.com 2>&1 | grep -A5 "subject="

# Test website
open https://bountybreach.com  # macOS
# or browser: https://bountybreach.com

# Verify API connectivity from frontend
# Check browser console for any errors

## MONITORING & MAINTENANCE

### View Logs

# Foundation-proxy logs
pm2 logs foundation-proxy

# Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# System logs (PM2)
pm2 monit

### Restart Services

# Restart foundation-proxy
pm2 restart foundation-proxy

# Restart Nginx
sudo systemctl restart nginx

# Restart all PM2 apps
pm2 restart all

### Certificate Management

# Renew certificate immediately (test)
sudo certbot renew --dry-run

# View all certificates
sudo certbot certificates

# Set up auto-renewal (should be done automatically)
sudo systemctl status certbot.timer

### Update Application

# Pull latest changes
cd ~/bountybreach.github.io
git pull origin main

# Redeploy
./deploy/deploy.sh

# Verify
pm2 list

## TROUBLESHOOTING

### 502 Bad Gateway Error

Symptoms: Accessing bountybreach.com returns 502 Bad Gateway

Steps:
1. Check foundation-proxy is running: pm2 list
2. Restart it: pm2 restart foundation-proxy
3. Check logs: pm2 logs foundation-proxy
4. Verify backend URL is correct in .env
5. Test connectivity: curl https://YOUR_BACKEND_URL/health

### SSL Certificate Not Working

Symptoms: Browser shows "Not Secure" or certificate error

Steps:
1. Check certificate status: sudo certbot certificates
2. Verify DNS is pointing to correct IP: nslookup bountybreach.com
3. Check Nginx configuration: sudo nginx -t
4. Renew if needed: sudo certbot renew

### High CPU/Memory Usage

Steps:
1. Check PM2 processes: pm2 monit
2. Check system resources: top
3. Review Nginx config for inefficiencies
4. Check foundation-proxy logs for errors

### Requests Timing Out

Symptoms: API requests hang or return 504 timeout

Steps:
1. Check backend connectivity: curl https://YOUR_BACKEND_URL
2. Review timeout settings in .env
3. Increase timeouts if needed:
   - BB_PROXY_CHAT_TIMEOUT_MS=180000 (3 minutes)
4. Check Nginx timeouts in /etc/nginx/sites-available/bountybreach.com
5. Monitor system resources

## SECURITY BEST PRACTICES

1. SSH Access
   - Disable root SSH: sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
   - Use SSH key pairs (not passwords)
   - Restrict to specific IPs if possible
   - Change default SSH port 22 if desired

2. Firewall
   - Only allow necessary ports (22, 80, 443)
   - Use Security Groups to restrict access
   - Consider AWS WAF for additional protection

3. Environment Variables
   - Store sensitive values in AWS Secrets Manager
   - Never commit .env to version control
   - Rotate tokens regularly

4. Backups
   - Enable EBS snapshots
   - Regularly backup static files and configuration
   - Document recovery procedures

5. Monitoring
   - Enable CloudWatch for EC2 metrics
   - Set up alerts for:
     - High CPU/Memory
     - Disk space
     - Error logs
   - Monitor SSL certificate expiration (Certbot handles renewal)

## PERFORMANCE OPTIMIZATION

1. Enable Gzip Compression
   - Already configured in Nginx setup
   - Reduces bandwidth by 70-80%

2. Caching Headers
   - Already configured in Nginx setup
   - Static assets cached for 30 days
   - HTML cached for 1 day

3. CDN Integration (Optional)
   - Consider CloudFront for global distribution
   - Cache TTL: 1 day for HTML, 30 days for assets

4. Database Connection Pooling
   - Ensure backend has proper connection limits

## USEFUL COMMANDS REFERENCE

# Process Management
pm2 start server.js --name "myapp"
pm2 stop myapp
pm2 restart myapp
pm2 delete myapp
pm2 list
pm2 logs myapp
pm2 monit
pm2 save
pm2 startup
pm2 unstartup

# Nginx Management
sudo systemctl start nginx
sudo systemctl stop nginx
sudo systemctl restart nginx
sudo systemctl reload nginx
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Certificate Management
sudo certbot --nginx
sudo certbot renew
sudo certbot renew --dry-run
sudo certbot certificates

# File Operations
rsync -av --delete source/ destination/
sudo chown -R www-data:www-data /var/www/html

# System Monitoring
top
htop (if installed)
df -h
du -sh ./
free -h
ps aux
netstat -tuln

## DEPLOYMENT SUMMARY

Current Architecture:
```
                    ┌─ EC2 Instance ─────────────────────────────┐
                    │                                             │
                    │  /var/www/bountybreach.com (Nginx root)   │
                    │  Static HTML, CSS, JS                      │
                    │                                             │
Internet ─── DNS ──→│  Nginx (Port 443/SSL)                     │
                    │  ├─ / → Static files                      │
                    │  ├─ /api/* → Port 9091                    │
                    │  └─ /upstream/* → Port 9091               │
                    │                                             │
                    │  foundation-proxy (Port 9091)              │
                    │  Node.js + Express                         │
                    │  Managed by PM2                            │
                    │                                             │
                    └─────────────────────────────────────────────┘
                                    │
                                    │
                                    ↓
                    BountyBreach AI Foundation Backend
                    (Docker/K8s or standalone)
                    FastAPI + PostgreSQL + Ollama

```

## SUPPORT & NEXT STEPS

1. Monitor application for 24 hours
2. Review logs for any errors
3. Set up alerting for production issues
4. Plan for auto-scaling if needed
5. Schedule regular backups
6. Review security settings monthly

For issues:
1. Check logs: pm2 logs foundation-proxy
2. Verify backend connectivity
3. Review Nginx configuration
4. Check SSL certificate status
5. Monitor system resources

EOF
