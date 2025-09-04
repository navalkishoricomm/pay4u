#!/bin/bash

# Fix Nginx SSL Configuration for Pay4U
# This script updates the Nginx configuration to properly handle HTTPS requests

echo "🔧 Fixing Nginx SSL Configuration for Pay4U..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ Please run this script as root (use sudo)${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Step 1: Backing up current Nginx configuration...${NC}"
cp /etc/nginx/sites-available/pay4u /etc/nginx/sites-available/pay4u.backup.$(date +%Y%m%d_%H%M%S)
echo -e "${GREEN}✅ Backup created${NC}"

echo -e "${YELLOW}📋 Step 2: Updating Nginx configuration with SSL support...${NC}"
cp nginx-ssl-fixed.conf /etc/nginx/sites-available/pay4u
echo -e "${GREEN}✅ Configuration updated${NC}"

echo -e "${YELLOW}📋 Step 3: Testing Nginx configuration...${NC}"
if nginx -t; then
    echo -e "${GREEN}✅ Nginx configuration is valid${NC}"
else
    echo -e "${RED}❌ Nginx configuration has errors. Restoring backup...${NC}"
    cp /etc/nginx/sites-available/pay4u.backup.* /etc/nginx/sites-available/pay4u
    exit 1
fi

echo -e "${YELLOW}📋 Step 4: Reloading Nginx...${NC}"
if systemctl reload nginx; then
    echo -e "${GREEN}✅ Nginx reloaded successfully${NC}"
else
    echo -e "${RED}❌ Failed to reload Nginx${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Step 5: Checking Nginx status...${NC}"
systemctl status nginx --no-pager -l

echo -e "${YELLOW}📋 Step 6: Testing HTTPS API endpoint...${NC}"
echo "Testing local backend (HTTP):"
curl -s http://localhost:5000/api/health | jq . || echo "Backend response (raw): $(curl -s http://localhost:5000/api/health)"

echo "\nTesting HTTPS API through Nginx:"
curl -s https://pay4u.co.in/api/health | jq . || echo "HTTPS API response (raw): $(curl -s https://pay4u.co.in/api/health)"

echo -e "${GREEN}🎉 Nginx SSL configuration has been updated!${NC}"
echo -e "${YELLOW}📝 What was fixed:${NC}"
echo "   • Enabled HTTPS server block on port 443"
echo "   • Added SSL certificate configuration"
echo "   • Set up HTTP to HTTPS redirect"
echo "   • Configured proper proxy headers for backend"
echo "   • Added security headers and HSTS"

echo -e "${YELLOW}🔍 Next steps:${NC}"
echo "   1. Test the application: https://pay4u.co.in"
echo "   2. Test API endpoints: https://pay4u.co.in/api/health"
echo "   3. Verify login functionality works"
echo "   4. Test geolocation features"

echo -e "${YELLOW}🚨 If you encounter issues:${NC}"
echo "   • Check logs: sudo tail -f /var/log/nginx/pay4u_error.log"
echo "   • Verify SSL certificates: sudo certbot certificates"
echo "   • Check backend status: pm2 status"