# BountyBreach.com EC2 Deployment Scripts

This directory contains automated scripts for deploying bountybreach.com to AWS EC2 with Node.js, Nginx, and SSL support.

## Quick Start

### 1. Initial EC2 Setup (run once)
```bash
chmod +x deploy/setup-ec2.sh
./deploy/setup-ec2.sh
```

This installs:
- Node.js 20+ (via NodeSource 22.x channel)
- Nginx
- PM2
- Clones the repository
- Installs dependencies

### 2. Configure Environment
```bash
cp deploy/.env.example foundation-proxy/.env
nano foundation-proxy/.env
```

Update with your production values:
- `BB_PROXY_FOUNDATION_BASE_URL`: Your backend API URL
- `BB_PROXY_FOUNDATION_TOKEN`: Authentication token

### 3. Set Up Nginx
```bash
chmod +x deploy/setup-nginx.sh
sudo deploy/setup-nginx.sh
```

Configures:
- Reverse proxy for /api/* to foundation-proxy
- Static file serving
- CORS headers
- Security headers

### 4. Deploy Application
```bash
chmod +x deploy/deploy.sh
./deploy/deploy.sh
```

Deploys:
- Static files to `/var/www/bountybreach.com`
- Starts foundation-proxy with PM2
- Configures startup on reboot

### 5. Install SSL Certificate
```bash
chmod +x deploy/setup-ssl.sh
sudo deploy/setup-ssl.sh
```

Installs Let's Encrypt certificate and enables auto-renewal.

### 6. Update DNS
Point `bountybreach.com` and `www.bountybreach.com` to your EC2 Elastic IP.

## Scripts Overview

### setup-ec2.sh
**Purpose**: Initial EC2 environment setup

**What it does**:
- Updates system packages
- Installs/updates Node.js 20+, Nginx, PM2
- Clones the GitHub repository
- Creates static files directory

**When to run**: First time deploying to a fresh EC2 instance

**Requirements**: SSH access as `ubuntu` user

### setup-nginx.sh
**Purpose**: Configure Nginx as reverse proxy

**What it does**:
- Creates Nginx configuration for bountybreach.com
- Sets up HTTP → HTTPS redirect
- Configures /api/* proxy to foundation-proxy (port 9091)
- Enables gzip compression
- Sets security headers

**When to run**: After initial setup, or when updating proxy configuration

**Requirements**: `sudo` access

### deploy.sh
**Purpose**: Deploy application and start services

**What it does**:
- Syncs static files to `/var/www/bountybreach.com`
- Stops previous foundation-proxy process (if running)
- Starts foundation-proxy with PM2
- Configures PM2 for system startup

**When to run**: Each time you deploy new code

**Requirements**: `.env` file already configured in `foundation-proxy/`

### setup-ssl.sh
**Purpose**: Install SSL certificate from Let's Encrypt

**What it does**:
- Installs Certbot
- Obtains SSL certificate
- Configures automatic renewal
- Updates Nginx configuration

**When to run**: After Nginx is running and DNS is pointing to EC2

**Requirements**: `sudo` access, DNS must be configured

### monitor.sh
**Purpose**: Monitor application health and performance

**Commands**:
- `./monitor.sh status` - Show service status and resource usage
- `./monitor.sh logs` - Show recent application logs
- `./monitor.sh metrics` - Show performance metrics
- `./monitor.sh health-check` - Run health checks on services
- `./monitor.sh backup` - Create configuration backup

**When to use**: Troubleshooting and ongoing maintenance

## Configuration Files

### .env.example
Template for environment variables. Copy to `foundation-proxy/.env` and configure:

**Required**:
- `BB_PROXY_FOUNDATION_BASE_URL`: Backend API endpoint
- `BB_PROXY_FOUNDATION_TOKEN`: Authentication token

**Optional**:
- `PORT`: Server port (default: 9091)
- `BB_PROXY_ALLOWED_ORIGINS`: CORS origins
- `BB_PROXY_CHAT_TIMEOUT_MS`: LLM request timeout
- `BB_PROXY_AUTH_TIMEOUT_MS`: Auth check timeout

See `.env.example` for full documentation.

## Architecture

```
┌─ EC2 Instance ─────────────────────────┐
│                                         │
│  /var/www/bountybreach.com (Nginx)    │
│  Static HTML, CSS, JS                  │
│                                         │
│  Nginx (Port 443/SSL)                 │
│  ├─ / → Static files                  │
│  ├─ /api/* → Port 9091                │
│  └─ /upstream/* → Port 9091           │
│                                         │
│  foundation-proxy (Port 9091)          │
│  Node.js + Express                     │
│  Managed by PM2                        │
│                                         │
└─────────────────────────────────────────┘
           │
           ↓
BountyBreach AI Foundation Backend
FastAPI + PostgreSQL + Ollama
```

## Deployment Checklist

- [ ] EC2 instance launched (Ubuntu 22.04+, t3.medium+)
- [ ] Security Groups configured (22, 80, 443)
- [ ] Elastic IP allocated and associated
- [ ] SSH key pair set up locally
- [ ] Repository cloned and scripts made executable
- [ ] Run `setup-ec2.sh`
- [ ] Configure `.env` file with production values
- [ ] Run `setup-nginx.sh`
- [ ] Run `deploy.sh`
- [ ] Run `setup-ssl.sh`
- [ ] DNS updated to point to Elastic IP
- [ ] Wait 15-30 minutes for DNS propagation
- [ ] Test HTTPS access: `https://bountybreach.com`
- [ ] Verify API connectivity: `curl -X POST https://bountybreach.com/api/v1/ai/chat ...`
- [ ] Monitor logs: `pm2 logs foundation-proxy`

## Troubleshooting

### 502 Bad Gateway
```bash
# Check if foundation-proxy is running
pm2 list

# Restart it
pm2 restart foundation-proxy

# Check logs
pm2 logs foundation-proxy
```

### SSL Certificate Error
```bash
# Check certificate status
sudo certbot certificates

# Verify DNS is pointing to correct IP
nslookup bountybreach.com

# Check Nginx config
sudo nginx -t
```

### High CPU/Memory
```bash
# Monitor processes
pm2 monit

# Check system resources
top

# Review logs for errors
pm2 logs foundation-proxy
```

### Request Timeouts
Increase timeouts in `foundation-proxy/.env`:
```env
BB_PROXY_CHAT_TIMEOUT_MS=180000  # 3 minutes instead of 2
```

## Maintenance

### Regular Monitoring
```bash
# Daily health check
./deploy/monitor.sh health-check

# View logs
pm2 logs foundation-proxy

# Monitor metrics
pm2 monit
```

### Updates
```bash
# Pull latest code
cd ~/bountybreach.github.io
git pull origin main

# Redeploy
./deploy/deploy.sh
```

### Backups
```bash
# Create backup
./deploy/monitor.sh backup

# Backups stored in ~/backups/
ls -lh ~/backups/
```

## Security Best Practices

1. **SSH Access**
   - Use SSH keys (not passwords)
   - Disable root SSH login
   - Restrict to specific IPs if possible

2. **Environment Variables**
   - Keep `.env` files out of version control
   - Use AWS Secrets Manager for tokens
   - Rotate credentials regularly

3. **Firewall**
   - Use Security Groups to restrict access
   - Only allow ports 22, 80, 443
   - Consider AWS WAF for additional protection

4. **SSL/TLS**
   - Certbot auto-renewal is configured
   - Monitor certificate expiration: `sudo certbot certificates`
   - Renewal runs automatically 30 days before expiration

5. **Monitoring**
   - Set up CloudWatch alerts for:
     - High CPU/Memory
     - Disk space
     - Error rate
   - Check logs regularly for suspicious activity

## Support

For issues:
1. Check logs: `pm2 logs foundation-proxy`
2. Run health check: `./deploy/monitor.sh health-check`
3. Verify backend connectivity
4. Review error logs: `sudo tail -f /var/log/nginx/error.log`
5. Check system resources: `./deploy/monitor.sh metrics`

See `DEPLOYMENT_GUIDE.md` for detailed troubleshooting steps.
