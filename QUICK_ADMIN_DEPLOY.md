# Quick Admin Deployment Guide

**Problem**: https://admin.memoryconnector.com/login is blank

**Cause**: Admin app not deployed to production server

## Quick Fix (5 minutes)

### Option 1: Automated Script (Recommended)

```powershell
# From project root
.\scripts\deploy-admin.ps1
```

Then follow Step 3 and 4 below for Nginx and SSL setup.

### Option 2: Manual Deployment

**Step 1: Build Locally**
```powershell
cd "C:\Visual Studio\Memory Connector"
pnpm build:admin
```

**Step 2: Upload to Server**
```powershell
scp -r apps\admin\dist\* memconnadmin@160.153.184.11:/var/www/memory-connector/apps/admin/dist/
```

**Step 3: Configure Nginx**
```powershell
# Upload nginx config
scp infra\nginx\admin.memoryconnector.com.conf memconnadmin@160.153.184.11:/tmp/

# SSH to server
ssh memconnadmin@160.153.184.11

# Move and enable config
sudo mv /tmp/admin.memoryconnector.com.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/admin.memoryconnector.com.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**Step 4: Setup SSL**
```bash
# On the server
sudo certbot --nginx -d admin.memoryconnector.com
```

**Step 5: Test**

Visit https://admin.memoryconnector.com - should now show login page!

## If Still Blank

**Check DNS:**
```powershell
nslookup admin.memoryconnector.com
# Should return: 160.153.184.11
```

**Check Nginx logs:**
```bash
sudo tail -f /var/log/nginx/admin-memoryconnector-error.log
```

**Check files exist:**
```bash
ls -la /var/www/memory-connector/apps/admin/dist/
# Should show: index.html, assets/, favicon.svg
```

**Clear browser cache** or try incognito mode

## Full Documentation

See `Docs/ADMIN_APP_DEPLOYMENT.md` for complete guide.
