const mongoose = require('mongoose');
const User = require('../models/User');
const Wallet = require('../models/Wallet');

async function createFreshTestUser() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/pay4u');
    console.log('Connected to MongoDB');

    // Delete existing test user if exists
    await User.deleteOne({ email: 'testuser@pay4u.com' });
    console.log('Deleted any existing test user');

    // Create new test user
    const userData = {
      name: 'Test User',
      email: 'testuser@pay4u.com',
      password: 'testpass123',
      phone: '9876543210',
      active: true
    };

    const user = new User(userData);
    await user.save();
    console.log('Test user created successfully');
    console.log('User ID:', user._id);
    console.log('Email:', user.email);

    // Create wallet for the user
    const wallet = new Wallet({
      user: user._id,
      balance: 10000
    });
    await wallet.save();
    console.log('Wallet created with balance:', wallet.balance);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    await mongoose.disconnect();
  }
}

createFreshTestUser();