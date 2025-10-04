const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Wallet = require('./models/Wallet');
require('dotenv').config();

// Function to fix admin password
const fixAdminPassword = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.DATABASE_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Check if admin user exists
    let adminUser = await User.findOne({ email: 'admin@pay4u.co.in' });
    
    if (!adminUser) {
      console.log('Admin user not found. Creating new admin user...');
      
      // Create new admin user
      adminUser = await User.create({
        name: 'Admin',
        email: 'admin@pay4u.co.in',
        password: 'admin123', // This will be hashed automatically by the pre-save middleware
        phone: '9999999999',
        role: 'admin'
      });
      
      // Create wallet for admin
      await Wallet.create({
        user: adminUser._id,
        balance: 0
      });
      
      console.log('Admin user created successfully!');
    } else {
      console.log('Admin user found. Updating password...');
      
      // Update admin password
      adminUser.password = 'admin123'; // This will be hashed automatically by the pre-save middleware
      await adminUser.save();
      
      console.log('Admin password updated successfully!');
    }
    
    console.log('Admin credentials:');
    console.log('Email: admin@pay4u.co.in');
    console.log('Password: admin123');
    
    // Also create a test user if it doesn't exist
    let testUser = await User.findOne({ email: 'mukgarg11@gmail.com' });
    
    if (!testUser) {
      console.log('Creating test user...');
      
      testUser = await User.create({
        name: 'Test User',
        email: 'mukgarg11@gmail.com',
        password: 'test12345',
        phone: '9876543210',
        role: 'user'
      });
      
      // Create wallet for test user
      await Wallet.create({
        user: testUser._id,
        balance: 100
      });
      
      console.log('Test user created successfully!');
      console.log('Test user credentials:');
      console.log('Email: mukgarg11@gmail.com');
      console.log('Password: test12345');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error fixing admin password:', error);
    process.exit(1);
  }
};

// Run the function
fixAdminPassword();