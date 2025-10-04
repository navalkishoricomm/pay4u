const mongoose = require('mongoose');
  const User = require('./models/User');
  require('dotenv').config();

  async function ensureAdminUser() {
    try {
      // Check for MongoDB URI in different environment variable names
      const mongoUri = process.env.DATABASE_URI || 
                      process.env.MONGODB_URI || 
                      process.env.MONGO_URI ||
                      process.env.DB_URI ||
                      'mongodb://localhost:27017/pay4u'; // fallback for local testing
      
      console.log('Attempting to connect to MongoDB...');
      console.log('Using URI:', mongoUri.replace(/\/\/.*@/, '//***:***@')); // Hide credentials in log
      
      await mongoose.connect(mongoUri);
      console.log('Connected to MongoDB successfully');
      
      // Check if admin user exists
      let admin = await User.findOne({ role: 'admin' });
      
      if (!admin) {
      // Create new admin user
      const adminData = {
        name: 'Admin User',
        email: 'admin@pay4u.com',
        password: 'admin123456',
        phone: '9999999999',
        role: 'admin'
      };
      
      console.log('Creating admin with data:', JSON.stringify(adminData, null, 2));
      admin = await User.create(adminData);
      console.log('✅ Admin user created successfully!');
      console.log('Created admin:', JSON.stringify(admin.toObject(), null, 2));
      } else {
        // Reset existing admin password
        admin.password = 'admin123456';
        await admin.save();
        console.log('✅ Admin password reset successfully!');
      }
      
      console.log('\n📧 Admin Login Credentials:');
      console.log('Email:', admin.email);
      console.log('Password: admin123456');
      console.log('Role:', admin.role);
      console.log('\n⚠️  Please change this password after first login for security.');
      
    } catch (error) {
      console.error('❌ Error:', error.message);
      
      if (error.message.includes('uri')) {
        console.error('\n🔧 Fix: Set your MongoDB connection string in environment variables:');
        console.error('   DATABASE_URI=mongodb://username:password@host:port/database');
        console.error('   or MONGODB_URI=mongodb://username:password@host:port/database');
      }
    } finally {
      if (mongoose.connection.readyState === 1) {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
      }
    }
  }

  ensureAdminUser();