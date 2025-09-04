const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pay4u_production';
    console.log('Connecting to:', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const createHashedAdmin = async () => {
  try {
    await connectDB();
    
    // Hash the password '12345678'
    const plainPassword = '12345678';
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
    
    console.log('Plain password:', plainPassword);
    console.log('Hashed password:', hashedPassword);
    
    // Check if admin user exists
    const existingAdmin = await User.findOne({ email: 'admin@pay4u.co.in' });
    
    if (existingAdmin) {
      console.log('\nExisting admin user found:');
      console.log('Current password hash:', existingAdmin.password);
      
      // Update with new hashed password
      existingAdmin.password = hashedPassword;
      await existingAdmin.save();
      
      console.log('\nAdmin password updated successfully!');
      console.log('New password hash:', hashedPassword);
    } else {
      // Create new admin user with hashed password
      const adminUser = new User({
        name: 'Admin',
        email: 'admin@pay4u.co.in',
        phone: '8595123439',
        password: hashedPassword,
        role: 'admin',
        isActive: true
      });
      
      await adminUser.save();
      console.log('\nNew admin user created successfully!');
      console.log('Password hash:', hashedPassword);
    }
    
    // Test password verification
    const testVerification = await bcrypt.compare(plainPassword, hashedPassword);
    console.log('\nPassword verification test:', testVerification ? 'PASSED' : 'FAILED');
    
    mongoose.connection.close();
    
  } catch (error) {
    console.error('Error:', error);
    mongoose.connection.close();
    process.exit(1);
  }
};

createHashedAdmin();