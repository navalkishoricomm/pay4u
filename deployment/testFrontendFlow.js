const mongoose = require('mongoose');
const User = require('./models/User');
const DmtRemitter = require('./models/DmtRemitter');
const DmtBeneficiary = require('./models/DmtBeneficiary');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testFrontendFlow() {
  try {
    console.log('=== Testing Frontend Flow ===');
    
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/pay4u');
    console.log('Connected to MongoDB');
    
    // Find the test user
    const user = await User.findOne({ email: 'mukgarg11@gmail.com' });
    if (!user) {
      console.log('Test user not found');
      return;
    }
    console.log('Found user:', user.email);
    
    // Find remitter for this user
    const remitter = await DmtRemitter.findOne({ userId: user._id });
    if (!remitter) {
      console.log('No remitter found for user');
      return;
    }
    console.log('Found remitter:', {
      _id: remitter._id,
      mobile: remitter.mobile,
      firstName: remitter.firstName,
      lastName: remitter.lastName
    });
    
    // Find beneficiaries for this remitter
    const beneficiaries = await DmtBeneficiary.find({ remitterId: remitter._id });
    console.log(`\nFound ${beneficiaries.length} beneficiaries in database:`);
    beneficiaries.forEach((ben, index) => {
      console.log(`${index + 1}. ${ben.accountHolderName} - ${ben.accountNumber} (ID: ${ben._id})`);
    });
    
    // Test frontend API calls
    console.log('\n=== Testing Frontend API Calls ===');
    
    // 1. Login
    console.log('1. Testing login...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'mukgarg11@gmail.com',
        password: '12345678'
      })
    });
    
    const loginData = await loginResponse.json();
    if (!loginResponse.ok) {
      console.error('Login failed:', loginData);
      return;
    }
    
    const token = loginData.token;
    console.log('✓ Login successful');
    
    // 2. Get remitter status
    console.log('2. Testing get remitter status...');
    const remitterResponse = await fetch('http://localhost:5000/api/dmt/remitter/status', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const remitterData = await remitterResponse.json();
    console.log('Remitter status response:', JSON.stringify(remitterData, null, 2));
    
    // 3. Get beneficiaries using remitter._id as remitterId
    console.log('3. Testing get beneficiaries...');
    const getBeneficiariesResponse = await fetch(`http://localhost:5000/api/dmt/remitter/${remitter._id}/beneficiaries`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const beneficiariesData = await getBeneficiariesResponse.json();
    console.log('Get beneficiaries response status:', getBeneficiariesResponse.status);
    console.log('Get beneficiaries response:', JSON.stringify(beneficiariesData, null, 2));
    
    if (beneficiariesData.data && beneficiariesData.data.beneficiaries) {
      console.log(`\n✓ Frontend API returned ${beneficiariesData.data.beneficiaries.length} beneficiaries`);
      beneficiariesData.data.beneficiaries.forEach((ben, index) => {
        console.log(`${index + 1}. ${ben.accountHolderName} - ${ben.accountNumber} (ID: ${ben._id})`);
      });
    } else {
      console.log('❌ No beneficiaries returned by frontend API');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testFrontendFlow();