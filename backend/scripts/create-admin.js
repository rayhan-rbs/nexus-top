/**
 * Create Admin User Script
 * Run: node scripts/create-admin.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const User = require('../models/User');

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');

    // Admin credentials
    const adminData = {
      name: 'Admin',
      email: 'admin@nexustop.com',
      password: 'admin123',
      phone: '01700000000',
      role: 'admin',
      emailVerified: true,
      isActive: true
    };

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminData.email });
    
    if (existingAdmin) {
      console.log('⚠️ Admin already exists!');
      console.log('📧 Email:', existingAdmin.email);
      console.log('🔑 Please use existing credentials or delete the user first.');
      process.exit(0);
    }

    // Create admin
    const admin = await User.create(adminData);
    
    console.log('🎉 Admin user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:    admin@nexustop.com');
    console.log('🔑 Password: admin123');
    console.log('👤 Role:     admin');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  IMPORTANT: Change password after first login!');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating admin:', err.message);
    process.exit(1);
  }
}

createAdmin();