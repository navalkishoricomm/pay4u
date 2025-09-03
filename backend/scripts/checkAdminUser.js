const mongoose = require('mongoose');
require('dotenv').config();

// Import User model
const User = require('../models/User');

const checkAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pay4u', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Find admin user
    const adminUser = await User.findOne({ role: 'admin' });

    if (!adminUser) {
      console.log('❌ No admin user found in the database.');
      console.log('💡 Run "node scripts/resetAdminPassword.js" to create an admin user.');
    } else {
      console.log('✅ Admin user found:');
      console.log('📧 Email:', adminUser.email);
      console.log('👤 Name:', adminUser.name);
      console.log('📱 Phone:', adminUser.phone);
      console.log('🆔 User ID:', adminUser._id);
      console.log('📅 Created:', adminUser.createdAt);
      console.log('📅 Updated:', adminUser.updatedAt);
      console.log('🔐 Password Changed:', adminUser.passwordChangedAt || 'Never');
    }
    
  } catch (error) {
    console.error('❌ Error checking admin user:', error.message);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
    process.exit(0);
  }
};

// Run the script
checkAdminUser();