const mongoose = require('mongoose');
const User = require('./models/User');
const Wallet = require('./models/Wallet');
require('dotenv').config();

async function checkAllUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/traepay4u');
    console.log('Connected to MongoDB');
    
    // Find all users
    const users = await User.find({}).populate('wallet');
    console.log('\n=== All Users ===');
    console.log('Found', users.length, 'users');
    
    users.forEach((user, index) => {
      console.log(`\nUser ${index + 1}:`);
      console.log('  ID:', user._id.toString());
      console.log('  Email:', user.email);
      console.log('  Name:', user.firstName, user.lastName);
      console.log('  Role:', user.role);
      console.log('  Wallet:', user.wallet ? `ID: ${user.wallet._id}, Balance: ${user.wallet.balance}` : 'No wallet');
    });
    
    // Check if test user exists
    const testUser = await User.findOne({ email: 'mukgarg11@gmail.com' });
    if (!testUser) {
      console.log('\n❌ Test user mukgarg11@gmail.com not found');
      console.log('Creating test user...');
      
      // Create test user
      const newUser = new User({
        email: 'mukgarg11@gmail.com',
        password: 'password123',
        name: 'Mukesh Garg',
        phone: '9876543210',
        role: 'user'
      });
      
      await newUser.save();
      console.log('✅ Test user created with ID:', newUser._id);
      
      // Create wallet for test user
      const wallet = new Wallet({
        user: newUser._id,
        balance: 10000, // Give 10000 balance for testing
        currency: 'INR'
      });
      
      await wallet.save();
      console.log('✅ Wallet created with balance:', wallet.balance);
      
      // Update user with wallet reference
      newUser.wallet = wallet._id;
      await newUser.save();
      console.log('✅ User updated with wallet reference');
    } else {
      console.log('\n✅ Test user found:', testUser.email);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

checkAllUsers();