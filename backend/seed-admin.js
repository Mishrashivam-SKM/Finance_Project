const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('./models/User');

/**
 * Seed script to create an admin user
 * Run with: node seed-admin.js
 */

const seedAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);

    console.log('Connected to MongoDB');

    // Admin credentials
    const adminEmail = 'admin@financeapp.com';
    const adminUsername = 'admin';
    const adminPassword = 'Admin@123456';

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log(`✓ Admin user already exists with email: ${adminEmail}`);
      console.log(`  You can login with:`);
      console.log(`  Email: ${adminEmail}`);
      console.log(`  Password: ${adminPassword}`);
      await mongoose.disconnect();
      return;
    }

    // Create admin user
    const adminUser = await User.create({
      username: adminUsername,
      email: adminEmail,
      password: adminPassword,
      role: 'admin'
    });

    console.log('✓ Admin user created successfully!');
    console.log('\nAdmin Credentials:');
    console.log(`Email: ${adminEmail}`);
    console.log(`Username: ${adminUsername}`);
    console.log(`Password: ${adminPassword}`);
    console.log(`Role: ${adminUser.role}`);
    console.log('\nYou can now login to the application with these credentials.');

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error seeding admin:', error.message);
    process.exit(1);
  }
};

seedAdmin();
