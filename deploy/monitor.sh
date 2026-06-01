#!/bin/bash
################################################################################
# Monitoring & Maintenance Script for BountyBreach.com
#
# This script provides utilities for monitoring and maintaining the deployed
# application including:
# - Service status checks
# - Log monitoring
# - Performance metrics
# - System health
#
# Usage: ./monitor.sh [command]
# Commands: status | logs | metrics | health-check | backup
################################################################################

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

show_status() {
    echo -e "${BLUE}=== Service Status ===${NC}"
    echo ""
    
    echo -e "${YELLOW}PM2 Processes:${NC}"
    pm2 list
    echo ""
    
    echo -e "${YELLOW}Nginx Status:${NC}"
    sudo systemctl status nginx --no-pager | grep -E "Active|Loaded"
    echo ""
    
    echo -e "${YELLOW}System Memory:${NC}"
    free -h | grep Mem
    echo ""
    
    echo -e "${YELLOW}Disk Usage:${NC}"
    df -h | grep -E "Filesystem|/dev/xvda"
    echo ""
}

show_logs() {
    echo -e "${BLUE}=== Recent Logs ===${NC}"
    echo ""
    
    echo -e "${YELLOW}Foundation-Proxy Logs (last 50 lines):${NC}"
    pm2 logs foundation-proxy --lines 50 --nostream
    echo ""
    
    echo -e "${YELLOW}Nginx Error Log (last 20 lines):${NC}"
    sudo tail -n 20 /var/log/nginx/error.log
    echo ""
}

show_metrics() {
    echo -e "${BLUE}=== Performance Metrics ===${NC}"
    echo ""
    
    echo -e "${YELLOW}CPU & Memory Usage:${NC}"
    ps aux | grep "node\|nginx" | grep -v grep
    echo ""
    
    echo -e "${YELLOW}Top 5 Processes by Memory:${NC}"
    ps aux --sort=-%mem | head -6
    echo ""
    
    echo -e "${YELLOW}Network Connections:${NC}"
    sudo ss -tuln | grep -E "LISTEN|Proto"
    echo ""
}

health_check() {
    echo -e "${BLUE}=== Health Check ===${NC}"
    echo ""
    
    # Check foundation-proxy
    echo -e "${YELLOW}Foundation-Proxy Health:${NC}"
    if curl -s http://127.0.0.1:9091/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Foundation-proxy is responding${NC}"
    else
        echo -e "${RED}✗ Foundation-proxy is NOT responding${NC}"
    fi
    echo ""
    
    # Check Nginx
    echo -e "${YELLOW}Nginx Health:${NC}"
    if sudo systemctl is-active --quiet nginx; then
        echo -e "${GREEN}✓ Nginx is running${NC}"
    else
        echo -e "${RED}✗ Nginx is NOT running${NC}"
    fi
    echo ""
    
    # Check disk space
    echo -e "${YELLOW}Disk Space:${NC}"
    DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | cut -d'%' -f1)
    if [ "$DISK_USAGE" -lt 80 ]; then
        echo -e "${GREEN}✓ Disk usage: ${DISK_USAGE}% (OK)${NC}"
    else
        echo -e "${RED}✗ Disk usage: ${DISK_USAGE}% (WARNING)${NC}"
    fi
    echo ""
    
    # Check memory
    echo -e "${YELLOW}Memory Usage:${NC}"
    MEM_USAGE=$(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100)}')
    if [ "$MEM_USAGE" -lt 80 ]; then
        echo -e "${GREEN}✓ Memory usage: ${MEM_USAGE}% (OK)${NC}"
    else
        echo -e "${RED}✗ Memory usage: ${MEM_USAGE}% (WARNING)${NC}"
    fi
    echo ""
    
    # Check SSL certificate
    echo -e "${YELLOW}SSL Certificate:${NC}"
    CERT_DATE=$(sudo certbot certificates 2>/dev/null | grep "Expiry Date" | awk -F': ' '{print $2}')
    if [ -n "$CERT_DATE" ]; then
        echo -e "${GREEN}✓ Certificate expiry: ${CERT_DATE}${NC}"
    else
        echo -e "${RED}✗ No valid certificate found${NC}"
    fi
    echo ""
}

backup() {
    echo -e "${BLUE}=== Creating Backup ===${NC}"
    echo ""
    
    BACKUP_DIR="/home/ubuntu/backups"
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/bountybreach_backup_$TIMESTAMP.tar.gz"
    
    mkdir -p "$BACKUP_DIR"
    
    echo "Creating backup: $BACKUP_FILE"
    tar -czf "$BACKUP_FILE" \
        --exclude=node_modules \
        --exclude=.git \
        --exclude=foundation-proxy/node_modules \
        ~/bountybreach.github.io/foundation-proxy/.env \
        ~/bountybreach.github.io
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Backup created successfully${NC}"
        ls -lh "$BACKUP_FILE"
    else
        echo -e "${RED}✗ Backup failed${NC}"
    fi
    echo ""
    
    # Clean up old backups (keep only last 7 days)
    echo "Cleaning up old backups (older than 7 days)..."
    find "$BACKUP_DIR" -name "bountybreach_backup_*.tar.gz" -mtime +7 -delete
    echo -e "${GREEN}✓ Cleanup complete${NC}"
}

show_help() {
    cat << 'EOF'
Usage: ./monitor.sh [command]

Commands:
  status         Show service status (PM2, Nginx, system resources)
  logs           Show recent logs from foundation-proxy and Nginx
  metrics        Show performance metrics and process info
  health-check   Run health checks on services
  backup         Create a backup of configuration and code
  help           Show this help message

Examples:
  ./monitor.sh status
  ./monitor.sh logs
  ./monitor.sh health-check

For continuous monitoring:
  pm2 monit
  tail -f /var/log/nginx/error.log
EOF
}

# Main script
case "${1:-status}" in
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    metrics)
        show_metrics
        ;;
    health-check)
        health_check
        ;;
    backup)
        backup
        ;;
    help)
        show_help
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        show_help
        exit 1
        ;;
esac
