/**
 * Test script for SuperAdmin functionality
 * This will help you test the SuperAdmin features locally
 * 
 * Usage: node scripts/testSuperAdmin.js
 */

require('dotenv').config();
const axios = require('axios');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

const BASE_URL = 'http://localhost:3000';

async function testSuperAdmin() {
  try {
    console.log('\n=== SuperAdmin Test Script ===\n');

    // Step 1: Login as SuperAdmin
    console.log('Step 1: Login as SuperAdmin');
    const email = await question('Enter SuperAdmin email: ');
    const password = await question('Enter SuperAdmin password: ');

    console.log('\n⏳ Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/api/users/login`, {
      identifier: email,
      password: password
    });

    const token = loginResponse.data.token;
    const user = loginResponse.data.user;

    console.log('✅ Login successful!');
    console.log(`   User: ${user.name}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Token: ${token.substring(0, 20)}...`);

    if (user.role !== 'SuperAdmin') {
      console.error('\n❌ Error: User is not a SuperAdmin');
      console.log(`   Current role: ${user.role}`);
      rl.close();
      process.exit(1);
    }

    // Step 2: Create Admin
    console.log('\n\nStep 2: Create Admin Account');
    const adminEmail = await question('Enter new admin email: ');
    const adminName = await question('Enter new admin name: ');
    const adminPhone = await question('Enter new admin phone (optional): ');

    console.log('\n⏳ Creating admin account...');
    
    try {
      const createAdminResponse = await axios.post(
        `${BASE_URL}/api/users/superadmin/create-admin`,
        {
          email: adminEmail,
          name: adminName,
          phone_number: adminPhone || ''
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('\n✅ Admin account created successfully!');
      console.log('   User ID:', createAdminResponse.data.user_id);
      console.log('   Email:', createAdminResponse.data.email);
      console.log('   Name:', createAdminResponse.data.name);
      console.log('   Message:', createAdminResponse.data.message);
      console.log('\n📧 Login credentials have been sent to the admin\'s email');

    } catch (createError) {
      console.error('\n❌ Error creating admin:');
      if (createError.response) {
        console.error('   Status:', createError.response.status);
        console.error('   Error:', createError.response.data.error);
      } else {
        console.error('   Error:', createError.message);
      }
      rl.close();
      process.exit(1);
    }

    // Step 3: Get all admins
    console.log('\n\nStep 3: Get All Admins');
    const viewAdmins = await question('View all admins? (y/n): ');

    if (viewAdmins.toLowerCase() === 'y') {
      console.log('\n⏳ Fetching admins...');
      
      try {
        const adminsResponse = await axios.get(
          `${BASE_URL}/api/users/superadmin/all-admins`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        console.log('\n✅ Admins retrieved successfully!');
        console.log(`   Total admins: ${adminsResponse.data.admins.length}`);
        
        adminsResponse.data.admins.forEach((admin, index) => {
          console.log(`\n   Admin ${index + 1}:`);
          console.log(`      Name: ${admin.name}`);
          console.log(`      Email: ${admin.email}`);
          console.log(`      Phone: ${admin.phone_number || 'N/A'}`);
          console.log(`      Created: ${new Date(admin.createdAt).toLocaleDateString()}`);
          if (admin.Creator) {
            console.log(`      Created by: ${admin.Creator.name}`);
          }
        });

      } catch (adminsError) {
        console.error('\n❌ Error fetching admins:');
        if (adminsError.response) {
          console.error('   Status:', adminsError.response.status);
          console.error('   Error:', adminsError.response.data.error);
        } else {
          console.error('   Error:', adminsError.message);
        }
      }
    }

    console.log('\n\n=== Test Complete ===\n');
    rl.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
    rl.close();
    process.exit(1);
  }
}

// Run the test
testSuperAdmin();
