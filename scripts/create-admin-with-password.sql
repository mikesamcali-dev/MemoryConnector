-- Create Admin User with Password (Single Step)
-- Email: mike@prophet21tools.com
--
-- IMPORTANT: Replace 'YOUR_PASSWORD_HASH_HERE' with the actual hash
-- generated from generate-password-hash.js
--
-- Usage:
--   1. Generate hash: node scripts/generate-password-hash.js "YourPassword123!"
--   2. Copy the hash from output
--   3. Replace 'YOUR_PASSWORD_HASH_HERE' below with the copied hash
--   4. Run this script: psql -d memory_connector -f scripts/create-admin-with-password.sql

INSERT INTO users (id, email, password_hash, provider, tier, roles, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'mike@prophet21tools.com',
  'YOUR_PASSWORD_HASH_HERE', -- Replace this with actual hash from generate-password-hash.js
  'local',
  'free',
  ARRAY['user', 'admin'],
  NOW(),
  NOW()
);

-- Verify the admin user was created with password
SELECT
  id,
  email,
  provider,
  tier,
  roles,
  created_at,
  CASE
    WHEN password_hash IS NULL THEN '❌ ERROR: No password set'
    WHEN password_hash = 'YOUR_PASSWORD_HASH_HERE' THEN '❌ ERROR: Password hash not replaced'
    ELSE '✅ Password set successfully'
  END as password_status
FROM users
WHERE email = 'mike@prophet21tools.com';
