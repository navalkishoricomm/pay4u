const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Wallet = require('./models/Wallet');
require('dotenv').config();

async function fixUserMismatch() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/traepay4u');
    console.log('Connected to MongoDB');
    
    // Check what users exist
    const allUsers = await User.find({}, 'email _id');
    console.log('\n=== All Users in Database ===');
    allUsers.forEach(user => {
      console.log(`Email: ${user.email}, ID: ${user._id.toString()}`);
    });
    
    // Try to login and see what user ID is in the token
    try {
      const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
        email: 'mukgarg11@gmail.com',
        password: 'password123'
      });
      
      const token = loginResponse.data.token;
      const decoded = jwt.decode(token);
      console.log('\n=== Token Analysis ===');
      console.log('Token user ID:', decoded.id);
      
      // Check if this user exists
      const tokenUser = await User.findById(decoded.id);
      if (tokenUser) {
        console.log('✅ Token user exists:', tokenUser.email);
      } else {
        console.log('❌ Token user does not exist in database');
        
        // Find the actual user with this email
        const actualUser = await User.findOne({ email: 'mukgarg11@gmail.com' });
        if (actualUser) {
          console.log('\n🔧 Found actual user with different ID:');
          console.log('Actual user ID:', actualUser._id.toString());
          console.log('Token user ID:', decoded.id);
          
          // The issue might be that the JWT is using a different user ID
          // Let's create a new user with the ID from the token
          console.log('\n🔧 Creating user with token ID...');
          
          const hashedPassword = await bcrypt.hash('password123', 12);
          const newUser = new User({
            _id: decoded.id,
            name: 'Mukesh Garg',
            email: 'mukgarg11@gmail.com',
            password: hashedPassword,
            phone: '9876543210',
            role: 'user'
          });
          
          await newUser.save();
          console.log('✅ User created with token ID');
          
          // Create wallet for this user
          const wallet = new Wallet({
            user: decoded.id,
            balance: 10000
          });
          
          await wallet.save();
          console.log('✅ Wallet created with balance 10000');
        }
      }
      
    } catch (loginError) {
      console.error('❌ Login failed:', loginError.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

fixUserMismatch();