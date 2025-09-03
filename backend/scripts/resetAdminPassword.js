const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('../models/User');

const resetAdminPassword = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pay4u', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Find admin user
    let adminUser = await User.findOne({ role: 'admin' }).select('+password');

    if (!adminUser) {
      console.log('No admin user found. Creating new admin user...');
      
      // Create new admin user
      const newPassword = 'Admin@123';
      adminUser = new User({
        name: 'Administrator',
        email: 'admin@pay4u.com',
        password: newPassword,
        phone: '9999999999',
        role: 'admin'
      });
      
      await adminUser.save();
      console.log('✅ New admin user created successfully!');
      console.log('📧 Email: admin@pay4u.com');
      console.log('🔑 Password: Admin@123');
    } else {
      console.log('Admin user found. Resetting password...');
      
      // Reset password
      const newPassword = 'Admin@123';
      adminUser.password = newPassword;
      adminUser.passwordChangedAt = undefined; // Reset this field
      
      await adminUser.save();
      console.log('✅ Admin password reset successfully!');
      console.log('📧 Email:', adminUser.email);
      console.log('🔑 New Password: Admin@123');
    }

    console.log('\n⚠️  Please change this password after logging in for security!');
    
  } catch (error) {
    console.error('❌ Error resetting admin password:', error.message);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
    process.exit(0);
  }
};

// Run the script
resetAdminPassword();