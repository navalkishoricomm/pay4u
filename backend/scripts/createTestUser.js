const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
require('dotenv').config();

async function createTestUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/traepay4u');
    console.log('Connected to MongoDB');

    // Check if test user already exists
    const existingUser = await User.findOne({ email: 'test@example.com' });
    if (existingUser) {
      console.log('Test user already exists');
      console.log('User ID:', existingUser._id);
      console.log('Email:', existingUser.email);
      return;
    }

    // Create test user
    const testUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      phone: '9876543210',
      role: 'user'
    });

    await testUser.save();
    console.log('✅ Test user created successfully');
    console.log('User ID:', testUser._id);
    console.log('Email:', testUser.email);

    // Create wallet for test user
    const testWallet = new Wallet({
      user: testUser._id,
      balance: 10000, // Give test user some balance
      currency: 'INR'
    });

    await testWallet.save();
    console.log('✅ Test wallet created successfully');
    console.log('Wallet Balance:', testWallet.balance);

  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

createTestUser();