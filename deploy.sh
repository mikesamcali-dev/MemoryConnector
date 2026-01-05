#!/bin/bash
# Memory Connector Full Deployment Script
# Deploys both API and Web frontend
# Usage: ./deploy.sh [api|web|all]

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

DEPLOY_TARGET="${1:-all}"

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Memory Connector Deployment                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

case "$DEPLOY_TARGET" in
    api)
        echo -e "${YELLOW}📡 Deploying API only...${NC}"
        ./deploy-api.sh
        ;;
    web)
        echo -e "${YELLOW}🌐 Deploying Web only...${NC}"
        ./deploy-web.sh
        ;;
    all)
        echo -e "${YELLOW}🚀 Deploying full stack (API + Web)...${NC}"
        echo ""
        echo -e "${BLUE}Step 1/2: Deploying API...${NC}"
        ./deploy-api.sh
        echo ""
        echo -e "${BLUE}Step 2/2: Deploying Web...${NC}"
        ./deploy-web.sh
        ;;
    *)
        echo -e "${RED}❌ Invalid target: $DEPLOY_TARGET${NC}"
        echo "Usage: ./deploy.sh [api|web|all]"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ Deployment Complete!                       ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}🌐 Production URL:${NC} https://memoryconnector.com"
echo -e "${BLUE}📊 View logs:${NC} ssh -i ~/.ssh/id_ed25519 memconnadmin@160.153.184.11 'pm2 logs'"
echo ""
