/**
 * Generate Password Hash for Admin User
 *
 * This script generates an argon2 password hash that can be inserted into the database.
 *
 * Usage:
 *   node scripts/generate-password-hash.js "your-password-here"
 *
 * Then use the output in SQL:
 *   UPDATE users SET password_hash = '<generated-hash>' WHERE email = 'mike@prophet21tools.com';
 */

const path = require('path');

// Try to load argon2 from apps/api/node_modules
let argon2;
try {
  argon2 = require(path.join(__dirname, '../apps/api/node_modules/argon2'));
} catch (err) {
  try {
    // Fallback: try loading from local node_modules
    argon2 = require('argon2');
  } catch (err2) {
    console.error('\n❌ Error: argon2 module not found');
    console.error('\nPlease install dependencies first:');
    console.error('  cd apps/api && pnpm install\n');
    process.exit(1);
  }
}

async function generatePasswordHash() {
  const password = process.argv[2];

  if (!password) {
    console.error('Error: Password is required');
    console.error('Usage: node scripts/generate-password-hash.js "your-password-here"');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('Error: Password must be at least 8 characters long');
    process.exit(1);
  }

  try {
    const hash = await argon2.hash(password);

    console.log('\n✅ Password hash generated successfully!\n');
    console.log('Password:', password);
    console.log('Hash:', hash);
    console.log('\nSQL to set password:');
    console.log('-------------------');
    console.log(`UPDATE users SET password_hash = '${hash}' WHERE email = 'mike@prophet21tools.com';`);
    console.log('\n');
  } catch (error) {
    console.error('Error generating password hash:', error.message);
    process.exit(1);
  }
}

generatePasswordHash();
