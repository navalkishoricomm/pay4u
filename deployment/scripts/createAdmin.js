const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('../models/User');
const Wallet = require('../models/Wallet');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pay4u_production');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Create admin user
const createAdminUser = async () => {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists:', existingAdmin.email);
      return;
    }

    // Admin user details
    const adminData = {
      name: 'Admin User',
      email: 'admin@pay4u.com',
      password: 'Admin@123456', // Change this to a secure password
      phone: '9999999999',
      role: 'admin'
    };

    // Create admin user
    const adminUser = await User.create(adminData);
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', adminUser.email);
    console.log('🔑 Password: Admin@123456');
    console.log('⚠️  Please change the password after first login!');

    // Create wallet for admin user
    const adminWallet = await Wallet.create({
      user: adminUser._id,
      balance: 0,
      transactions: []
    });
    console.log('💰 Admin wallet created with ID:', adminWallet._id);

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  }
};

// Main function
const main = async () => {
  console.log('🚀 Creating Admin User for Pay4U...');
  await connectDB();
  await createAdminUser();
  
  console.log('✅ Admin creation process completed!');
  console.log('\n📋 Admin Login Details:');
  console.log('   Email: admin@pay4u.com');
  console.log('   Password: Admin@123456');
  console.log('   ⚠️  IMPORTANT: Change password after first login!');
  
  process.exit(0);
};

// Handle errors
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err.message);
  process.exit(1);
});

// Run the script
main();