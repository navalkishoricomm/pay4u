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
    const targetEmail = 'admin@pay4u.co.in';
    const existingAdmin = await User.findOne({ email: targetEmail });
    
    if (existingAdmin) {
      console.log('⚠️  Admin user found, updating password...');
      existingAdmin.password = 'Radhey@6615';
      existingAdmin.role = 'admin'; // Ensure role is admin
      await existingAdmin.save();
      console.log('✅ Admin password updated successfully!');
    } else {
      // Admin user details
      const adminData = {
        name: 'Admin User',
        email: targetEmail,
        password: 'Radhey@6615',
        phone: '9999999999',
        role: 'admin'
      };

      // Create admin user
      const adminUser = await User.create(adminData);
      console.log('✅ Admin user created successfully!');
      
      // Create wallet for admin user
      const adminWallet = await Wallet.create({
        user: adminUser._id,
        balance: 0,
        transactions: []
      });
      console.log('💰 Admin wallet created with ID:', adminWallet._id);
    }
    
    console.log('📧 Email:', targetEmail);
    console.log('🔑 Password: Radhey@6615');

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
  console.log('   Email: admin@pay4u.co.in');
  console.log('   Password: Radhey@6615');
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