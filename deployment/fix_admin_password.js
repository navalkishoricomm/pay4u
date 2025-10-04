const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
require('dotenv').config();

async function fixAdminPassword() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    // Import User model
    const User = require('./models/User');
    
    // Find admin user
    const adminUser = await User.findOne({ email: 'admin@pay4u.co.in' });
    if (!adminUser) {
      console.log('Admin user not found!');
      return;
    }
    
    console.log('Current admin user:', {
      email: adminUser.email,
      role: adminUser.role,
      passwordHash: adminUser.password.substring(0, 20) + '...'
    });
    
    // Hash password with cost factor 12 (same as User model)
    const plainPassword = '12345678';
    const hashedPassword = await bcrypt.hash(plainPassword, 12);
    
    console.log('New hash (first 20 chars):', hashedPassword.substring(0, 20) + '...');
    
    // Update admin password directly in database
    await User.updateOne(
      { email: 'admin@pay4u.co.in' },
      { $set: { password: hashedPassword } }
    );
    
    console.log('✅ Admin password updated successfully!');
    
    // Test the password
    const testResult = await bcrypt.compare(plainPassword, hashedPassword);
    console.log('✅ Password test result:', testResult);
    
    // Verify in database
    const updatedAdmin = await User.findOne({ email: 'admin@pay4u.co.in' });
    const dbTestResult = await bcrypt.compare(plainPassword, updatedAdmin.password);
    console.log('✅ Database verification result:', dbTestResult);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

fixAdminPassword();