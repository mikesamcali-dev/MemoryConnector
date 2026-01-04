/**
 * Generate Password Hash for Admin User
 *
 * This script generates an argon2 password hash that can be inserted into the database.
 *
 * Usage (from apps/api directory):
 *   node scripts/generate-password-hash.js "your-password-here"
 *
 * Then use the output in SQL:
 *   UPDATE users SET password_hash = '<generated-hash>' WHERE email = 'mike@prophet21tools.com';
 */

const argon2 = require('argon2');

async function generatePasswordHash() {
  const password = process.argv[2];

  if (!password) {
    console.error('\n❌ Error: Password is required');
    console.error('\nUsage: node scripts/generate-password-hash.js "your-password-here"\n');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('\n❌ Error: Password must be at least 8 characters long\n');
    process.exit(1);
  }

  try {
    const hash = await argon2.hash(password);

    console.log('\n✅ Password hash generated successfully!\n');
    console.log('Password:', password);
    console.log('Hash:', hash);
    console.log('\nSQL to set password:');
    console.log('-------------------');
    console.log(`UPDATE users SET password_hash = '${hash}' WHERE email = 'mike@prophet21tools.com';\n`);
  } catch (error) {
    console.error('\n❌ Error generating password hash:', error.message, '\n');
    process.exit(1);
  }
}

generatePasswordHash();
