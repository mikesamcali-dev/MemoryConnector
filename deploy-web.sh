#!/bin/bash
# Memory Connector Web Deployment Script
# Usage: ./deploy-web.sh

set -e  # Exit on error

echo "🚀 Starting Web deployment..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
SERVER="memconnadmin@160.153.184.11"
REMOTE_PATH="/var/www/memory-connector/apps/web"
LOCAL_WEB_PATH="apps/web"

echo -e "${BLUE}📦 Building web frontend locally...${NC}"
cd "$LOCAL_WEB_PATH"
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Build failed - dist directory not found${NC}"
    exit 1
fi

echo -e "${BLUE}📦 Packaging dist directory...${NC}"
tar -czf dist.tar.gz dist

echo -e "${BLUE}📤 Uploading to production server...${NC}"
scp -i ~/.ssh/id_ed25519 dist.tar.gz "$SERVER:/tmp/web-dist.tar.gz"

echo -e "${BLUE}🔄 Deploying on server...${NC}"
ssh -i ~/.ssh/id_ed25519 "$SERVER" << 'ENDSSH'
set -e
cd /var/www/memory-connector/apps/web
echo "  → Backing up current dist..."
if [ -d "dist" ]; then
    mv dist dist.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
fi
echo "  → Extracting new build..."
tar -xzf /tmp/web-dist.tar.gz
rm /tmp/web-dist.tar.gz
echo "  → Setting permissions..."
chmod -R 755 dist
ENDSSH

# Clean up local tar file
cd -
rm "$LOCAL_WEB_PATH/dist.tar.gz"

echo -e "${GREEN}✅ Web deployment complete!${NC}"
echo -e "${BLUE}🔍 Testing homepage...${NC}"

# Test the endpoint
sleep 1
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://memoryconnector.com)
if [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}✅ Website is accessible (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${RED}⚠️  Website returned HTTP $HTTP_CODE${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Deployment finished!${NC}"
echo -e "${BLUE}💡 Remind users to:${NC}"
echo "   1. Clear browser cache (Ctrl+Shift+R)"
echo "   2. Unregister service workers (DevTools → Application → Service Workers)"
