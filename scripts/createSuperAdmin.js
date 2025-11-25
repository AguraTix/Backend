/**
 * Script to create the first SuperAdmin account
 * Run this script once to create your first SuperAdmin
 * 
 * Usage: node scripts/createSuperAdmin.js
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const { User, sequelize } = require('../models');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createSuperAdmin() {
  try {
    console.log('\n=== Create SuperAdmin Account ===\n');

    // Check if SuperAdmin already exists
    const existingSuperAdmin = await User.findOne({ where: { role: 'SuperAdmin' } });
    if (existingSuperAdmin) {
      console.log('⚠️  A SuperAdmin account already exists:');
      console.log(`   Email: ${existingSuperAdmin.email}`);
      console.log(`   Name: ${existingSuperAdmin.name}`);
      console.log('\nIf you want to create another SuperAdmin, you can do so manually in the database.');
      rl.close();
      process.exit(0);
    }

    // Get SuperAdmin details
    const email = await question('Enter SuperAdmin email: ');
    const name = await question('Enter SuperAdmin name: ');
    const phone_number = await question('Enter SuperAdmin phone number: ');
    const password = await question('Enter SuperAdmin password (min 8 chars, must contain letter, number): ');

    // Validate inputs
    if (!email || !name || !password) {
      console.error('\n❌ Error: All fields are required');
      rl.close();
      process.exit(1);
    }

    if (password.length < 8) {
      console.error('\n❌ Error: Password must be at least 8 characters long');
      rl.close();
      process.exit(1);
    }

    if (!/(?=.*[A-Za-z])/.test(password)) {
      console.error('\n❌ Error: Password must contain at least one letter');
      rl.close();
      process.exit(1);
    }

    if (!/(?=.*\d)/.test(password)) {
      console.error('\n❌ Error: Password must contain at least one number');
      rl.close();
      process.exit(1);
    }

    // Hash password
    console.log('\n⏳ Creating SuperAdmin account...');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create SuperAdmin
    const superAdmin = await User.create({
      email,
      name,
      password: hashedPassword,
      role: 'SuperAdmin',
      phone_number: phone_number || '',
      email_verified: true,
      email_verified_at: new Date()
    });

    console.log('\n✅ SuperAdmin account created successfully!');
    console.log('\n=== SuperAdmin Details ===');
    console.log(`User ID: ${superAdmin.user_id}`);
    console.log(`Email: ${superAdmin.email}`);
    console.log(`Name: ${superAdmin.name}`);
    console.log(`Role: ${superAdmin.role}`);
    console.log('\n=== Next Steps ===');
    console.log('1. Login with your SuperAdmin credentials');
    console.log('2. Use the /api/users/superadmin/create-admin endpoint to create admin accounts');
    console.log('3. SuperAdmin can view and manage all data in the system');
    console.log('\n=== Login Command ===');
    console.log(`curl -X POST http://localhost:3000/api/users/login \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -d '{"identifier": "${email}", "password": "YOUR_PASSWORD"}'`);

    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creating SuperAdmin:', error.message);
    if (error.errors) {
      error.errors.forEach(err => console.error(`   - ${err.message}`));
    }
    rl.close();
    process.exit(1);
  }
}

// Run the script
createSuperAdmin();
