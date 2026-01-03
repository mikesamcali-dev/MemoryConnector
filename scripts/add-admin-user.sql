-- Add Admin User Script
-- Email: mike@prophet21tools.com
-- This script creates a new admin user

-- Create the admin user with no password initially
-- Password will be set in the next step using the password hash generator
INSERT INTO users (id, email, password_hash, provider, tier, roles, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'mike@prophet21tools.com',
  NULL, -- Password will be set after running generate-password-hash.js
  'local',
  'free',
  ARRAY['user', 'admin'],
  NOW(),
  NOW()
);

-- Verify the admin user was created
SELECT
  id,
  email,
  provider,
  tier,
  roles,
  created_at,
  CASE
    WHEN password_hash IS NULL THEN 'No password set - run generate-password-hash.js'
    ELSE 'Password set'
  END as password_status
FROM users
WHERE email = 'mike@prophet21tools.com';

-- Next steps:
-- 1. Generate password hash (from root directory):
--    node scripts/generate-password-hash.js "YourSecurePassword123!"
--
-- 2. Set the password using the generated hash:
--    UPDATE users SET password_hash = '<generated-hash>' WHERE email = 'mike@prophet21tools.com';
