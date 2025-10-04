const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/traepay4u')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const BASE_URL = 'http://localhost:5000/api';

// Test data
const testUser = {
  email: 'testuser@pay4u.com',
  password: 'testpass123'
};

const testRemitter = {
    firstName: 'John',
    lastName: 'Doe',
    mobile: '9876543210',
    address: '123 Test Street, Test City, Test State',
    pincode: '110001',
    dateOfBirth: '1990-01-01',
    occupation: 'Business'
  };

const testBeneficiary = {
  beneficiaryName: 'Jane Doe',
  mobile: '9876543211',
  ifscCode: 'SBIN0000123',
  accountNumber: '1234567890',
  bankName: 'State Bank of India',
  accountHolderName: 'JANE DOE'
};

let authToken = '';
let remitterId = '';
let beneficiaryId = '';

async function login() {
  try {
    console.log('\n=== Testing User Login ===');
    const response = await axios.post(`${BASE_URL}/auth/login`, testUser);
    authToken = response.data.token;
    console.log('✅ Login successful');
    console.log('Token:', authToken.substring(0, 20) + '...');
    return true;
  } catch (error) {
    console.log('❌ Login failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testRemitterRegistration() {
  try {
    console.log('\n=== Testing Remitter Registration ===');
    const response = await axios.post(
      `${BASE_URL}/dmt/remitter/register`,
      testRemitter,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Remitter registration successful');
    console.log('Response:', response.data);
    remitterId = response.data.data?.remitter?.id || response.data.data?.id || response.data.remitterId;
    const result = response.data.data || response.data;
    result.remitterId = remitterId;
    return result;
  } catch (error) {
    console.log('❌ Remitter registration failed:', error.response?.data?.message || error.message);
    console.log('Status:', error.response?.status);
    console.log('Data:', error.response?.data);
    return null;
  }
}

async function testBeneficiaryRegistration(remitterData) {
  try {
    console.log('\n=== Testing Beneficiary Registration ===');
    const beneficiaryData = { ...testBeneficiary };
    if (remitterData && remitterData.remitterId) {
      beneficiaryData.remitterId = remitterData.remitterId;
    }
    
    const response = await axios.post(
      `${BASE_URL}/dmt/beneficiary/register`,
      beneficiaryData,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Beneficiary registration successful');
    console.log('Response:', response.data);
    beneficiaryId = response.data.data?.beneficiaryId || response.data.beneficiaryId;
    return true;
  } catch (error) {
    console.log('❌ Beneficiary registration failed:', error.response?.data?.message || error.message);
    console.log('Status:', error.response?.status);
    console.log('Data:', error.response?.data);
    return false;
  }
}

async function testGetBeneficiaries(remitterResult) {
  try {
    console.log('\n=== Testing Get Beneficiaries ===');
    const response = await axios.get(
      `${BASE_URL}/dmt/remitter/${remitterResult.remitterId}/beneficiaries`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );
    
    console.log('✅ Get beneficiaries successful');
    console.log('Response:', response.data);
    return true;
  } catch (error) {
    console.log('❌ Get beneficiaries failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testTransactionHistory() {
  try {
    console.log('\n=== Testing Transaction History ===');
    const response = await axios.get(
      `${BASE_URL}/dmt/transactions`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );
    
    console.log('✅ Get transaction history successful');
    console.log('Response:', response.data);
    return true;
  } catch (error) {
    console.log('❌ Get transaction history failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting DMT API Endpoint Tests...');
  
  // Test login first
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('\n❌ Cannot proceed without authentication');
    process.exit(1);
  }
  
  // Test DMT endpoints
  const remitterResult = await testRemitterRegistration();
  if (remitterResult && remitterResult.remitterId) {
    await testBeneficiaryRegistration(remitterResult);
    await testGetBeneficiaries(remitterResult);
  } else {
    console.log('⚠️ Skipping beneficiary tests due to remitter registration failure');
  }
  await testTransactionHistory();
  
  console.log('\n🎉 DMT API endpoint tests completed!');
  
  // Close MongoDB connection
  await mongoose.connection.close();
  process.exit(0);
}

// Handle errors
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
  process.exit(1);
});

// Run tests
runTests();