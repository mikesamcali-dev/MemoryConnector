#!/bin/bash

# SAM Deployment Script for GoDaddy VPS Production
# Run this on the production server after pushing changes

set -e  # Exit on error

echo "🚀 Starting SAM deployment to production..."

# 1. Pull latest changes
echo "📥 Pulling latest changes from GitHub..."
cd /var/www/memory-connector
git pull origin main

# 2. Install dependencies (if any new packages)
echo "📦 Installing backend dependencies..."
cd apps/api
npm install

# 3. Generate Prisma client
echo "🔄 Generating Prisma client..."
npx prisma generate

# 4. Run database migrations
echo "🗄️  Running database migrations..."
npx prisma migrate deploy

# 5. Rebuild backend
echo "🔨 Building backend..."
npm run build

# 6. Rebuild web app
echo "🌐 Building web app..."
cd ../web
npm install
npm run build

# 7. Rebuild admin app
echo "⚙️  Building admin app..."
cd ../admin
npm install
npm run build

# 8. Restart API with PM2
echo "♻️  Restarting API service..."
cd ../../
pm2 restart memory-connector-api

# 9. Wait and verify
echo "⏳ Waiting for service to restart..."
sleep 5

# 10. Health check
echo "🏥 Checking API health..."
HEALTH_RESPONSE=$(curl -s http://localhost:4000/api/v1/health || echo "failed")

if [[ $HEALTH_RESPONSE == *"ok"* ]]; then
  echo "✅ SAM deployment completed successfully!"
  echo "📊 API health check passed"
  echo "🔗 SAM available at: https://memoryconnector.com/app/sam"
else
  echo "❌ Warning: Health check failed"
  echo "Response: $HEALTH_RESPONSE"
  echo "📋 Check logs: pm2 logs memory-connector-api --lines 50"
  exit 1
fi

echo ""
echo "🎉 SAM is now live in production!"
echo ""
echo "Next steps:"
echo "  1. Test SAM at https://memoryconnector.com/app/sam"
echo "  2. Create a test memory to verify functionality"
echo "  3. Check PM2 logs if any issues: pm2 logs memory-connector-api"
echo ""
