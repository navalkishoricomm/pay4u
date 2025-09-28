const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const User = require('./models/User');
const Wallet = require('./models/Wallet');
const Transaction = require('./models/Transaction');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/pay4u', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function checkWalletBalance() {
  try {
    console.log('=== Check Wallet Balance Issue ===');
    
    // Login to get token
    const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'mukgarg11@gmail.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    const decoded = jwt.decode(token);
    const userId = decoded.id;
    
    console.log('User ID:', userId);
    
    // Check wallet directly from database
    console.log('\n=== Direct Database Wallet Check ===');
    const wallet = await Wallet.findOne({ user: userId });
    
    if (wallet) {
      console.log('Wallet found:');
      console.log('- ID:', wallet._id);
      console.log('- User:', wallet.user);
      console.log('- Balance:', wallet.balance);
      console.log('- Created:', wallet.createdAt);
      console.log('- Updated:', wallet.updatedAt);
    } else {
      console.log('No wallet found for user');
    }
    
    // Check wallet via API
    console.log('\n=== API Wallet Check ===');
    try {
      const apiResponse = await axios.get('http://localhost:5001/api/wallet/balance', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('API Response:');
      console.log('- Status:', apiResponse.data.status);
      console.log('- Wallet Balance:', apiResponse.data.data.wallet.balance);
      console.log('- Wallet ID:', apiResponse.data.data.wallet._id);
    } catch (apiError) {
      console.error('API Error:', apiError.response?.data || apiError.message);
    }
    
    // Calculate expected balance based on transactions
    console.log('\n=== Transaction Analysis ===');
    const transactions = await Transaction.find({ wallet: wallet._id }).sort({ createdAt: 1 });
    console.log('Total transactions:', transactions.length);
    
    let calculatedBalance = 0;
    transactions.forEach((tx, index) => {
      if (tx.type === 'credit' || tx.type === 'deposit') {
        calculatedBalance += tx.amount;
      } else if (tx.type === 'debit' || tx.type === 'transfer') {
        calculatedBalance -= tx.amount;
      }
      
      if (index < 5) { // Show first 5 transactions
        console.log(`Transaction ${index + 1}:`, {
          type: tx.type,
          amount: tx.amount,
          balance_after: calculatedBalance,
          date: tx.createdAt
        });
      }
    });
    
    console.log('\n=== Balance Comparison ===');
    console.log('Database wallet balance:', wallet.balance);
    console.log('Calculated from transactions:', calculatedBalance);
    console.log('Difference:', wallet.balance - calculatedBalance);
    
    // Check if there are any recent failed saves
    console.log('\n=== Recent Transfer Transactions ===');
    const recentTransfers = await Transaction.find({ 
      wallet: wallet._id, 
      type: 'transfer' 
    }).sort({ createdAt: -1 }).limit(3);
    
    recentTransfers.forEach((tx, index) => {
      console.log(`Recent Transfer ${index + 1}:`, {
        amount: tx.amount,
        description: tx.description,
        status: tx.status,
        createdAt: tx.createdAt
      });
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

checkWalletBalance();