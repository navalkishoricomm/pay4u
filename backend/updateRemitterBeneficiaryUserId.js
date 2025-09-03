const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const DmtRemitter = require('./models/DmtRemitter');
const DmtBeneficiary = require('./models/DmtBeneficiary');
const User = require('./models/User');
require('dotenv').config();

async function updateRemitterBeneficiaryUserId() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/traepay4u');
    console.log('Connected to MongoDB');
    
    // Get the correct user ID from JWT token
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'mukgarg11@gmail.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    const decoded = jwt.decode(token);
    const correctUserId = decoded.id;
    
    console.log('\n=== User ID Analysis ===');
    console.log('Token user ID:', correctUserId);
    
    // Find the old user ID
    const oldUser = await User.findOne({ email: 'mukgarg11@gmail.com' });
    const oldUserId = oldUser._id.toString();
    console.log('Database user ID:', oldUserId);
    
    // Update the user document to use the correct ID
    console.log('\n🔧 Updating user ID...');
    
    // First, let's create a new user with the correct ID and delete the old one
    const userData = oldUser.toObject();
    delete userData._id;
    userData._id = correctUserId;
    
    const newUser = new User(userData);
    await newUser.save();
    console.log('✅ New user created with correct ID');
    
    // Update wallet to point to new user
    const Wallet = require('./models/Wallet');
    await Wallet.updateMany({ user: oldUserId }, { user: correctUserId });
    console.log('✅ Wallet updated to new user ID');
    
    // Update remitters to point to new user
    const remitterUpdate = await DmtRemitter.updateMany(
      { userId: oldUserId },
      { userId: correctUserId }
    );
    console.log(`✅ Updated ${remitterUpdate.modifiedCount} remitters`);
    
    // Update beneficiaries to point to new user
    const beneficiaryUpdate = await DmtBeneficiary.updateMany(
      { userId: oldUserId },
      { userId: correctUserId }
    );
    console.log(`✅ Updated ${beneficiaryUpdate.modifiedCount} beneficiaries`);
    
    // Delete the old user
    await User.findByIdAndDelete(oldUserId);
    console.log('✅ Old user deleted');
    
    // Show the updated records
    const remitters = await DmtRemitter.find({ userId: correctUserId });
    const beneficiaries = await DmtBeneficiary.find({ userId: correctUserId });
    
    console.log('\n🎯 Updated Records:');
    console.log('User ID:', correctUserId);
    if (remitters.length > 0) {
      console.log('Remitter ID:', remitters[0]._id.toString());
    }
    if (beneficiaries.length > 0) {
      console.log('Beneficiary ID:', beneficiaries[0]._id.toString());
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    console.error('Full error:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

updateRemitterBeneficiaryUserId();