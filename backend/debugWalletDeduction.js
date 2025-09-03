const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const User = require('./models/User');
const Wallet = require('./models/Wallet');
const Transaction = require('./models/Transaction');
const DmtTransaction = require('./models/DmtTransaction');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/pay4u', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const BASE_URL = 'http://localhost:5000/api';
let authToken = '';

async function debugWalletDeduction() {
  try {
    console.log('=== Debug Wallet Deduction ===');
    
    // Login to get token
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'mukgarg11@gmail.com',
      password: 'password123'
    });
    
    authToken = loginResponse.data.token;
    const decoded = jwt.decode(authToken);
    const userId = decoded.id;
    
    console.log('User ID:', userId);
    
    // Check wallet balance before transaction
    console.log('\n=== Wallet Balance Before Transaction ===');
    const walletBefore = await Wallet.findOne({ user: userId });
    console.log('Balance before:', walletBefore ? walletBefore.balance : 'Wallet not found');
    
    // Check recent DMT transactions
    console.log('\n=== Recent DMT Transactions ===');
    const dmtTransactions = await DmtTransaction.find({ userId }).sort({ createdAt: -1 }).limit(5);
    console.log('Found', dmtTransactions.length, 'DMT transactions');
    
    dmtTransactions.forEach((tx, index) => {
      console.log(`DMT Transaction ${index + 1}:`, {
        transactionId: tx.transactionId,
        amount: tx.amount,
        charges: tx.charges,
        totalAmount: tx.totalAmount,
        status: tx.status,
        createdAt: tx.createdAt
      });
    });
    
    // Check recent wallet transactions
    console.log('\n=== Recent Wallet Transactions ===');
    const walletTransactions = await Transaction.find({ wallet: walletBefore._id }).sort({ createdAt: -1 }).limit(5);
    console.log('Found', walletTransactions.length, 'wallet transactions');
    
    walletTransactions.forEach((tx, index) => {
      console.log(`Wallet Transaction ${index + 1}:`, {
        type: tx.type,
        amount: tx.amount,
        description: tx.description,
        status: tx.status,
        createdAt: tx.createdAt
      });
    });
    
    // Perform a test transaction
    console.log('\n=== Performing Test Transaction ===');
    const testTransaction = {
      remitterId: '68b2cff230906ef156ed8c8b',
      beneficiaryId: '68b2d43e1393cd7acc2946ae',
      amount: 50, // Smaller amount for testing
      transferMode: 'IMPS'
    };
    
    try {
      const transferResponse = await axios.post(
        `${BASE_URL}/dmt/transaction`,
        testTransaction,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Transaction successful:', transferResponse.data.status === 'success');
      console.log('Transaction ID:', transferResponse.data.data.transactionId);
      console.log('Total amount:', transferResponse.data.data.totalAmount);
      
      // Wait a moment for database updates
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check wallet balance after transaction
      console.log('\n=== Wallet Balance After Transaction ===');
      const walletAfter = await Wallet.findOne({ user: userId });
      console.log('Balance after:', walletAfter ? walletAfter.balance : 'Wallet not found');
      
      if (walletBefore && walletAfter) {
        const balanceChange = walletBefore.balance - walletAfter.balance;
        console.log('Balance change:', balanceChange);
        console.log('Expected deduction:', transferResponse.data.data.totalAmount);
        console.log('Deduction working:', balanceChange === transferResponse.data.data.totalAmount);
      }
      
      // Check if new wallet transaction was created
      console.log('\n=== New Wallet Transactions ===');
      const newWalletTransactions = await Transaction.find({ 
        wallet: walletBefore._id,
        createdAt: { $gte: new Date(Date.now() - 60000) } // Last minute
      }).sort({ createdAt: -1 });
      
      console.log('New wallet transactions:', newWalletTransactions.length);
      newWalletTransactions.forEach((tx, index) => {
        console.log(`New Transaction ${index + 1}:`, {
          type: tx.type,
          amount: tx.amount,
          description: tx.description,
          status: tx.status,
          createdAt: tx.createdAt
        });
      });
      
    } catch (transferError) {
      console.error('Transaction failed:', transferError.response?.data || transferError.message);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

debugWalletDeduction();