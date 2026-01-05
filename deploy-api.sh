#!/bin/bash
# Memory Connector API Deployment Script
# Usage: ./deploy-api.sh

set -e  # Exit on error

echo "🚀 Starting API deployment..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
SERVER="memconnadmin@160.153.184.11"
REMOTE_PATH="/var/www/memory-connector/apps/api"
LOCAL_API_PATH="apps/api"

echo -e "${BLUE}📦 Building API locally...${NC}"
cd "$LOCAL_API_PATH"
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Build failed - dist directory not found${NC}"
    exit 1
fi

echo -e "${BLUE}📦 Packaging dist directory...${NC}"
tar -czf dist.tar.gz dist

echo -e "${BLUE}📤 Uploading to production server...${NC}"
scp -i ~/.ssh/id_ed25519 dist.tar.gz "$SERVER:/tmp/"

echo -e "${BLUE}🔄 Deploying on server...${NC}"
ssh -i ~/.ssh/id_ed25519 "$SERVER" << 'ENDSSH'
set -e
cd /var/www/memory-connector/apps/api
echo "  → Backing up current dist..."
if [ -d "dist" ]; then
    mv dist dist.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
fi
echo "  → Extracting new build..."
tar -xzf /tmp/dist.tar.gz
rm /tmp/dist.tar.gz
echo "  → Restarting PM2..."
pm2 restart memory-connector-api
sleep 3
echo "  → Checking status..."
pm2 status memory-connector-api
ENDSSH

# Clean up local tar file
cd -
rm "$LOCAL_API_PATH/dist.tar.gz"

echo -e "${GREEN}✅ API deployment complete!${NC}"
echo -e "${BLUE}🔍 Testing endpoint...${NC}"

# Test the endpoint
sleep 2
HEALTH_RESPONSE=$(curl -s https://memoryconnector.com/api/v1/health)
if echo "$HEALTH_RESPONSE" | grep -q '"status":"ok"'; then
    echo -e "${GREEN}✅ API is healthy${NC}"
else
    echo -e "${RED}⚠️  API health check failed${NC}"
    echo "$HEALTH_RESPONSE"
fi

echo ""
echo -e "${GREEN}🎉 Deployment finished!${NC}"
echo -e "${BLUE}📊 Check logs:${NC} ssh -i ~/.ssh/id_ed25519 $SERVER 'pm2 logs memory-connector-api --lines 50'"
