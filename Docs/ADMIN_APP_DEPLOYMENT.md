# Admin App Deployment Guide

This guide covers deploying the admin panel subdomain (admin.memoryconnector.com) to your production server.

## Prerequisites

- Main application already deployed (see GODADDY_DEPLOYMENT_GUIDE.md)
- DNS A record configured for admin.memoryconnector.com pointing to your VPS IP
- SSH access to your production server
- Admin app built locally

## Step 1: Build Admin App Locally

From your Windows development machine:

```powershell
cd "C:\Visual Studio\Memory Connector"

# Build the admin app
pnpm build:admin

# Verify build exists
ls apps\admin\dist
# Should show: assets/, favicon.svg, index.html
```

## Step 2: Upload Admin Build to Server

```powershell
# Upload admin build files to server
scp -r apps\admin\dist\* memconnadmin@160.153.184.11:/var/www/memory-connector/apps/admin/dist/

# If the dist directory doesn't exist on server, create it first:
# ssh memconnadmin@160.153.184.11
# mkdir -p /var/www/memory-connector/apps/admin/dist
# exit
```

## Step 3: Configure DNS

1. Log into your domain registrar (GoDaddy DNS management)
2. Add A record:
   - **Type**: A
   - **Name**: admin
   - **Value**: Your VPS IP (160.153.184.11)
   - **TTL**: 600 (or default)
3. Wait 5-30 minutes for DNS propagation
4. Verify: `nslookup admin.memoryconnector.com`

## Step 4: Deploy Nginx Configuration

SSH into your server:

```bash
ssh memconnadmin@160.153.184.11
```

Upload the Nginx configuration:

```bash
# From your local machine, upload the nginx config
scp infra\nginx\admin.memoryconnector.com.conf memconnadmin@160.153.184.11:/tmp/

# On the server, move it to nginx sites-available
sudo mv /tmp/admin.memoryconnector.com.conf /etc/nginx/sites-available/

# Enable the site
sudo ln -s /etc/nginx/sites-available/admin.memoryconnector.com.conf /etc/nginx/sites-enabled/

# Test nginx configuration
sudo nginx -t

# If test passes, reload nginx
sudo systemctl reload nginx
```

## Step 5: Configure SSL Certificate

```bash
# Request SSL certificate for admin subdomain
sudo certbot --nginx -d admin.memoryconnector.com

# Follow prompts:
# 1. Enter email address (use same as main domain)
# 2. Agree to Terms of Service: Y
# 3. Redirect HTTP to HTTPS: 2 (recommended)

# Verify certificate
sudo certbot certificates

# Should show certificate for admin.memoryconnector.com
```

## Step 6: Verify Deployment

### Check Nginx Configuration

```bash
# View nginx error logs
sudo tail -f /var/log/nginx/admin-memoryconnector-error.log

# View access logs
sudo tail -f /var/log/nginx/admin-memoryconnector-access.log
```

### Test in Browser

1. Visit https://admin.memoryconnector.com
2. Should see admin login page
3. Test login with admin credentials
4. Verify API calls work (check browser Network tab)

### Common Issues

**Blank page / 404 errors:**
- Check files exist: `ls -la /var/www/memory-connector/apps/admin/dist/`
- Verify nginx config: `sudo nginx -t`
- Check logs: `sudo tail -f /var/log/nginx/admin-memoryconnector-error.log`

**502 Bad Gateway:**
- Backend API not running
- Check PM2: `pm2 status`
- Restart API: `pm2 restart memory-connector-api`

**SSL Certificate errors:**
- DNS not propagated yet (wait 30 mins)
- Check DNS: `nslookup admin.memoryconnector.com`
- Verify certificate: `sudo certbot certificates`

**API calls failing (CORS errors):**
- Update backend .env CORS_ORIGIN to include admin subdomain:
  ```bash
  # Edit .env
  nano /var/www/memory-connector/apps/api/.env

  # Update CORS_ORIGIN
  CORS_ORIGIN=https://memoryconnector.com,https://www.memoryconnector.com,https://admin.memoryconnector.com

  # Restart backend
  pm2 restart memory-connector-api
  ```

## Future Deployments

When you update the admin app:

```powershell
# 1. Build locally
cd "C:\Visual Studio\Memory Connector"
pnpm build:admin

# 2. Upload to server
scp -r apps\admin\dist\* memconnadmin@160.153.184.11:/var/www/memory-connector/apps/admin/dist/

# 3. Clear browser cache and test
# No nginx reload needed for static file updates
```

## Maintenance

### View Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/admin-memoryconnector-access.log

# Error logs
sudo tail -f /var/log/nginx/admin-memoryconnector-error.log
```

### SSL Certificate Renewal

Certificates auto-renew via certbot. Verify:

```bash
# Check renewal timer
sudo systemctl status certbot.timer

# Test renewal (dry run)
sudo certbot renew --dry-run
```

### Remove Admin App

If you need to remove the admin app:

```bash
# Disable nginx site
sudo rm /etc/nginx/sites-enabled/admin.memoryconnector.com.conf

# Test and reload
sudo nginx -t
sudo systemctl reload nginx

# Revoke SSL certificate
sudo certbot revoke --cert-name admin.memoryconnector.com

# Remove files
rm -rf /var/www/memory-connector/apps/admin/dist
```

## Security Notes

1. **Admin Access**: The admin panel should only be accessed by authorized users
2. **Strong Passwords**: Use strong passwords for admin accounts
3. **HTTPS Only**: Admin panel forces HTTPS redirect
4. **IP Restriction** (Optional): Consider restricting access by IP:
   ```nginx
   # In nginx config, add to location / block:
   allow YOUR_IP_ADDRESS;
   deny all;
   ```

## Architecture

```
┌─────────────────────────────────────────┐
│  admin.memoryconnector.com              │
│  (Nginx - Port 443)                     │
│  - Serves: /apps/admin/dist             │
│  - Proxies /api/* to localhost:4000     │
└─────────────────────────────────────────┘
                    │
                    │ API calls
                    ↓
┌─────────────────────────────────────────┐
│  Backend API (PM2)                      │
│  localhost:4000                         │
│  - Handles admin + user requests        │
└─────────────────────────────────────────┘
                    │
                    ↓
┌─────────────────────────────────────────┐
│  PostgreSQL Database                    │
│  localhost:5432                         │
└─────────────────────────────────────────┘
```

Both the main app (memoryconnector.com) and admin app (admin.memoryconnector.com) use the same backend API and database.
