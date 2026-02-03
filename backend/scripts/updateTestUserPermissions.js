const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function updateTestUserPermissions() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pay4u');
    console.log('Connected to MongoDB');

    // Find test user
    const email = 'test@example.com';
    const user = await User.findOne({ email });

    if (!user) {
      console.log('Test user not found');
      return;
    }

    // Update permissions to match new user defaults
    user.featurePermissions = {
      showRecharges: true,
      showBillPayments: false,
      showMoneyTransfer: false,
      showAEPS: false,
      showVouchers: true
    };

    await user.save();
    console.log(`✅ Permissions updated for ${email}`);
    console.log('New Permissions:', user.featurePermissions);

  } catch (error) {
    console.error('❌ Error updating user:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

updateTestUserPermissions();