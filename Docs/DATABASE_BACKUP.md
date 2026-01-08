# Database Backup Guide

This document describes the automated database backup system for Memory Connector running on the GoDaddy VPS (memoryconnector.com).

## Overview

**Automated daily backups are configured and running:**

- **Backup Script Location**: `/home/memconnadmin/backup-db.sh`
- **Backup Storage Location**: `/home/memconnadmin/backups/`
- **Schedule**: Daily at 2:00 AM (server time)
- **Retention Policy**: 7 days (automatically deletes backups older than 7 days)
- **Backup Format**: Compressed SQL dumps (`.sql.gz` files)
- **Database**: PostgreSQL 16 (`memory_connector` database)

---

## Backup Script

The backup script is located at `/home/memconnadmin/backup-db.sh` and performs the following operations:

1. Creates a timestamped PostgreSQL dump
2. Compresses the dump with gzip
3. Verifies the backup was created successfully
4. Removes backups older than 7 days
5. Lists all remaining backups

### Script Configuration

```bash
#!/bin/bash
set -e

# Configuration
BACKUP_DIR="/home/memconnadmin/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="memory_connector"
DB_USER="memory_user"
RETENTION_DAYS=7

# Get database password from .env file
DB_PASSWORD=$(grep "DATABASE_URL" /var/www/memory-connector/apps/api/.env | cut -d':' -f3 | cut -d'@' -f1)

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Create backup
echo "Starting database backup: $DATE"
PGPASSWORD="$DB_PASSWORD" pg_dump -U $DB_USER -h localhost $DB_NAME | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Verify backup was created
if [ -f "$BACKUP_DIR/db_$DATE.sql.gz" ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_DIR/db_$DATE.sql.gz" | cut -f1)
    echo "Backup created successfully: db_$DATE.sql.gz ($BACKUP_SIZE)"
else
    echo "ERROR: Backup failed"
    exit 1
fi

# Remove backups older than retention period
echo "Cleaning up old backups (keeping last $RETENTION_DAYS days)"
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +$RETENTION_DAYS -delete

# List remaining backups
echo "Current backups:"
ls -lh $BACKUP_DIR/db_*.sql.gz 2>/dev/null || echo "No backups found"

echo "Backup complete: $(date)"
```

---

## Automated Schedule (Cron)

The backup script runs automatically via cron every day at 2:00 AM.

### View Current Cron Jobs

```bash
# SSH into the server
ssh memconnadmin@160.153.184.11

# View cron jobs for memconnadmin user
crontab -l
```

### Expected Cron Entry

```cron
0 2 * * * /home/memconnadmin/backup-db.sh >> /home/memconnadmin/backup.log 2>&1
```

This means:
- **`0 2 * * *`**: Run at 2:00 AM every day
- **`/home/memconnadmin/backup-db.sh`**: Execute the backup script
- **`>> /home/memconnadmin/backup.log 2>&1`**: Append output to backup.log

---

## Manual Backup Operations

### Run Backup Manually

```bash
# SSH into the server
ssh memconnadmin@160.153.184.11

# Execute backup script manually
/home/memconnadmin/backup-db.sh
```

### List All Backups

```bash
# SSH into the server
ssh memconnadmin@160.153.184.11

# List all backup files with size and date
ls -lh /home/memconnadmin/backups/
```

### Check Backup Disk Usage

```bash
# SSH into the server
ssh memconnadmin@160.153.184.11

# Check total size of backup directory
du -sh /home/memconnadmin/backups/

# Check individual backup sizes
du -h /home/memconnadmin/backups/db_*.sql.gz
```

### View Backup Log

```bash
# SSH into the server
ssh memconnadmin@160.153.184.11

# View recent backup log entries
tail -n 50 /home/memconnadmin/backup.log

# View entire backup log
cat /home/memconnadmin/backup.log
```

---

## Restoring from Backup

### Restore Latest Backup

```bash
# SSH into the server
ssh memconnadmin@160.153.184.11

# Find the latest backup
ls -lt /home/memconnadmin/backups/db_*.sql.gz | head -1

# Example: Restore the latest backup (replace YYYYMMDD_HHMMSS with actual timestamp)
LATEST_BACKUP=$(ls -t /home/memconnadmin/backups/db_*.sql.gz | head -1)
echo "Restoring from: $LATEST_BACKUP"

# IMPORTANT: Stop the API before restoring
cd /var/www/memory-connector
pm2 stop memory-connector-api

# Get database password
DB_PASSWORD=$(grep "DATABASE_URL" /var/www/memory-connector/apps/api/.env | cut -d':' -f3 | cut -d'@' -f1)

# Drop existing connections (if any)
PGPASSWORD="$DB_PASSWORD" psql -U memory_user -h localhost -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'memory_connector' AND pid <> pg_backend_pid();"

# Drop and recreate database
PGPASSWORD="$DB_PASSWORD" psql -U memory_user -h localhost -d postgres -c "DROP DATABASE IF EXISTS memory_connector;"
PGPASSWORD="$DB_PASSWORD" psql -U memory_user -h localhost -d postgres -c "CREATE DATABASE memory_connector;"

# Restore backup
gunzip < $LATEST_BACKUP | PGPASSWORD="$DB_PASSWORD" psql -U memory_user -h localhost -d memory_connector

# Restart API
pm2 restart memory-connector-api

# Verify restoration
PGPASSWORD="$DB_PASSWORD" psql -U memory_user -h localhost -d memory_connector -c "SELECT COUNT(*) FROM users;"
```

### Restore Specific Backup

```bash
# SSH into the server
ssh memconnadmin@160.153.184.11

# List all backups with dates
ls -lh /home/memconnadmin/backups/

# Restore a specific backup (replace with actual filename)
BACKUP_FILE="/home/memconnadmin/backups/db_20260108_020000.sql.gz"

# Follow the same steps as "Restore Latest Backup" but use $BACKUP_FILE instead
```

---

## Download Backup to Local Machine

### From Windows (PowerShell)

```powershell
# Download the latest backup to your local machine
scp memconnadmin@160.153.184.11:/home/memconnadmin/backups/db_*.sql.gz "C:\Backups\"

# Download a specific backup
scp memconnadmin@160.153.184.11:/home/memconnadmin/backups/db_20260108_020000.sql.gz "C:\Backups\"
```

### From Linux/Mac (Terminal)

```bash
# Download the latest backup
scp memconnadmin@160.153.184.11:/home/memconnadmin/backups/db_*.sql.gz ~/backups/

# Download a specific backup
scp memconnadmin@160.153.184.11:/home/memconnadmin/backups/db_20260108_020000.sql.gz ~/backups/
```

---

## Backup Monitoring

### Verify Backups are Running

```bash
# SSH into the server
ssh memconnadmin@160.153.184.11

# Check recent backup log entries
tail -n 20 /home/memconnadmin/backup.log

# Verify backups exist for the last 7 days
ls -lt /home/memconnadmin/backups/ | head -8
```

### Expected Output

You should see:
- At least 7 backup files (one for each of the last 7 days)
- Recent entries in backup.log showing successful backups
- No error messages in the log

### Troubleshooting Failed Backups

If backups are failing, check:

1. **Check backup log for errors:**
   ```bash
   tail -n 100 /home/memconnadmin/backup.log | grep -i error
   ```

2. **Verify PostgreSQL is running:**
   ```bash
   sudo systemctl status postgresql
   ```

3. **Test database connection:**
   ```bash
   DB_PASSWORD=$(grep "DATABASE_URL" /var/www/memory-connector/apps/api/.env | cut -d':' -f3 | cut -d'@' -f1)
   PGPASSWORD="$DB_PASSWORD" psql -U memory_user -h localhost -d memory_connector -c "SELECT 1;"
   ```

4. **Check disk space:**
   ```bash
   df -h
   ```

5. **Manually run backup script:**
   ```bash
   /home/memconnadmin/backup-db.sh
   ```

---

## Modifying Backup Settings

### Change Retention Period

```bash
# SSH into the server
ssh memconnadmin@160.153.184.11

# Edit backup script
nano /home/memconnadmin/backup-db.sh

# Change RETENTION_DAYS value (default is 7)
# RETENTION_DAYS=14  # Keep backups for 14 days
# RETENTION_DAYS=30  # Keep backups for 30 days

# Save and exit (Ctrl+X, Y, Enter)
```

### Change Backup Schedule

```bash
# SSH into the server
ssh memconnadmin@160.153.184.11

# Edit crontab
crontab -e

# Current: 0 2 * * * (daily at 2 AM)
# Examples:
# 0 */12 * * *  # Every 12 hours
# 0 3 * * *     # Daily at 3 AM
# 0 2 * * 0     # Weekly on Sunday at 2 AM

# Save and exit
```

### Change Backup Location

```bash
# SSH into the server
ssh memconnadmin@160.153.184.11

# Create new backup directory
mkdir -p /path/to/new/backup/location

# Edit backup script
nano /home/memconnadmin/backup-db.sh

# Change BACKUP_DIR value
# BACKUP_DIR="/path/to/new/backup/location"

# Save and exit (Ctrl+X, Y, Enter)

# Test new location
/home/memconnadmin/backup-db.sh
```

---

## Best Practices

1. **Monitor backups regularly**: Check the backup log at least weekly
2. **Test restoration periodically**: Verify you can restore backups successfully
3. **Download critical backups**: Keep local copies of important backups
4. **Monitor disk space**: Ensure server has enough space for backups
5. **Update retention policy**: Adjust based on your data retention requirements
6. **Document changes**: Update this document when changing backup configuration

---

## Emergency Contacts

- **VPS Provider**: GoDaddy (account: memconnadmin@160.153.184.11)
- **Database**: PostgreSQL 16
- **Server IP**: 160.153.184.11
- **Domain**: https://memoryconnector.com

---

## Backup File Naming Convention

Backup files are named with the following format:
```
db_YYYYMMDD_HHMMSS.sql.gz
```

Example:
```
db_20260108_020015.sql.gz
```
- **20260108**: Date (January 8, 2026)
- **020015**: Time (2:00:15 AM)
- **.sql.gz**: Compressed SQL dump

---

## Related Documentation

- [GODADDY_DEPLOYMENT_GUIDE.md](./GODADDY_DEPLOYMENT_GUIDE.md) - Full deployment guide including backup setup
- [CLAUDE.md](../CLAUDE.md) - Project overview and quick reference
- [FINAL_MVP_STATUS.md](./FINAL_MVP_STATUS.md) - Complete system status

---

**Last Updated**: January 8, 2026
