# Admin User Setup Guide

This guide explains how to create `mike@prophet21tools.com` as an admin user for both development and production environments.

**Note:** This user does not exist yet and will be created from scratch.

## Quick Start (Production)

### Method 1: Single-Step Creation (Recommended)

**Step 1: Generate password hash**

```bash
# From root directory
node scripts/generate-password-hash.js "YourSecurePassword123!"

# OR from apps/api directory
cd apps/api
node ../../scripts/generate-password-hash.js "YourSecurePassword123!"
```

Output will be:
```
✅ Password hash generated successfully!

Password: YourSecurePassword123!
Hash: $argon2id$v=19$m=65536,t=3,p=4$...

SQL to set password:
-------------------
UPDATE users SET password_hash = '$argon2id$...' WHERE email = 'mike@prophet21tools.com';
```

**Step 2: Edit the SQL script**

Open `scripts/create-admin-with-password.sql` and replace `YOUR_PASSWORD_HASH_HERE` with the hash from Step 1.

**Step 3: Run the script**

```bash
# Connect to production database
psql -h your-db-host -U your-db-user -d memory_connector -f scripts/create-admin-with-password.sql
```

✅ Done! User created with password.

---

### Method 2: Two-Step Creation

**Step 1: Create user without password**

```bash
psql -h your-db-host -U your-db-user -d memory_connector -f scripts/add-admin-user.sql
```

**Step 2: Generate and set password**

```bash
# Generate hash (from root directory)
node scripts/generate-password-hash.js "YourSecurePassword123!"

# Connect to database
psql -h your-db-host -U your-db-user -d memory_connector

# Set password (use hash from previous command)
UPDATE users SET password_hash = '$argon2id$...' WHERE email = 'mike@prophet21tools.com';
```

✅ Done! Password set.

---

## Development Environment Setup

### Quick Method (Docker)

```bash
# Step 1: Generate password hash (from root directory)
node scripts/generate-password-hash.js "DevPassword123!"

# Step 2: Copy and run SQL
docker exec -it memory-connector-postgres psql -U postgres -d memory_connector -c "
INSERT INTO users (id, email, password_hash, provider, tier, roles, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'mike@prophet21tools.com',
  '<paste-hash-here>',
  'local',
  'free',
  ARRAY['user', 'admin'],
  NOW(),
  NOW()
);
"
```

### Using SQL Files

```bash
# Copy script to container
docker cp scripts/create-admin-with-password.sql memory-connector-postgres:/tmp/

# Run it
docker exec -it memory-connector-postgres psql -U postgres -d memory_connector -f /tmp/create-admin-with-password.sql
```

---

## Verify Admin Access

After creating the user:

### 1. Check Database

```sql
SELECT
  id,
  email,
  roles,
  tier,
  CASE WHEN password_hash IS NULL THEN '❌ No password' ELSE '✅ Password set' END as status
FROM users
WHERE email = 'mike@prophet21tools.com';
```

Expected output:
```
email                    | roles         | tier | status
-------------------------|---------------|------|---------------
mike@prophet21tools.com  | {user,admin}  | free | ✅ Password set
```

### 2. Test Admin Login

**Production:**
- Navigate to: https://admin.memoryconnector.com/login
- Email: mike@prophet21tools.com
- Password: (the one you set)
- Should redirect to: https://admin.memoryconnector.com/dashboard

**Development:**
- Navigate to: http://localhost:5174/login
- Email: mike@prophet21tools.com
- Password: (the one you set)
- Should redirect to: http://localhost:5174/dashboard

---

## Password Management

### Change Password

```bash
# 1. Generate new hash (from root directory)
node scripts/generate-password-hash.js "NewSecurePassword456!"

# 2. Update in database
psql -d memory_connector -c "
UPDATE users
SET password_hash = '<new-hash-here>',
    updated_at = NOW()
WHERE email = 'mike@prophet21tools.com';
"
```

### Password Requirements

- **Minimum:** 8 characters
- **Recommended:** 12+ characters with uppercase, lowercase, numbers, special characters
- **Hashing:** argon2id (automatic via script)

---

## Production Deployment Checklist

Before deploying to production:

- [ ] **Generate strong password** (use password manager)
- [ ] **Run password hash generator** with production password
- [ ] **Update SQL script** with generated hash
- [ ] **Connect to production database** (verify connection first)
- [ ] **Run admin user creation script**
- [ ] **Verify user created** (check database)
- [ ] **Test admin login** at admin.memoryconnector.com
- [ ] **Save credentials** in secure password manager
- [ ] **Delete password from terminal history** (optional: `history -c`)
- [ ] **Enable 2FA** (future enhancement)

---

## Troubleshooting

### Error: "duplicate key value violates unique constraint"

User already exists. To add admin role:

```sql
UPDATE users
SET roles = ARRAY['user', 'admin']
WHERE email = 'mike@prophet21tools.com';
```

### Error: "permission denied for table users"

Grant database privileges:

```sql
GRANT ALL PRIVILEGES ON DATABASE memory_connector TO your_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
```

### Password hash not working

Ensure:
1. ✅ Hash was generated using `generate-password-hash.js`
2. ✅ Full hash was copied (starts with `$argon2id$...`)
3. ✅ No extra spaces or quotes in the hash
4. ✅ Hash is in single quotes in SQL: `'$argon2id$...'`

### Can't login to admin panel

Check:
1. ✅ User has both 'user' AND 'admin' roles
2. ✅ Password hash is set (not NULL)
3. ✅ Accessing correct URL (admin.memoryconnector.com)
4. ✅ Using correct email (mike@prophet21tools.com)
5. ✅ Backend API is running and accessible

Verify roles:
```sql
SELECT email, roles FROM users WHERE email = 'mike@prophet21tools.com';
-- Should show: {user,admin}
```

---

## Security Best Practices

1. ✅ **Use strong passwords** (16+ characters, random)
2. ✅ **Never commit passwords** to version control
3. ✅ **Store in password manager** (1Password, LastPass, etc.)
4. ✅ **Rotate passwords** every 90 days
5. ✅ **Use HTTPS only** in production
6. ✅ **Monitor admin access** via audit logs
7. ✅ **Limit admin users** (only those who need it)
8. ✅ **Consider OAuth** for additional security

---

## Files Reference

- `add-admin-user.sql` - Creates admin user without password (2-step process)
- `create-admin-with-password.sql` - Creates admin user with password (1-step process)
- `generate-password-hash.js` - Generates argon2 password hashes
- `ADMIN_USER_SETUP.md` - This documentation

---

## Quick Command Reference

```bash
# Generate password hash
node scripts/generate-password-hash.js "YourPassword"

# Create admin user (production)
psql -h prod-host -U user -d memory_connector -f scripts/create-admin-with-password.sql

# Create admin user (development)
docker exec -it memory-connector-postgres psql -U postgres -d memory_connector -f /tmp/create-admin-with-password.sql

# Verify user
psql -d memory_connector -c "SELECT email, roles FROM users WHERE email = 'mike@prophet21tools.com';"

# Change password
psql -d memory_connector -c "UPDATE users SET password_hash = 'new-hash' WHERE email = 'mike@prophet21tools.com';"
```
