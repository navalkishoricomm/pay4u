const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const walletRoutes = require('./routes/wallet');
const transactionRoutes = require('./routes/transaction');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notifications');
const commissionRoutes = require('./routes/commissionRoutes');
const commissionSchemeRoutes = require('./routes/commissionSchemeRoutes');
const voucherRoutes = require('./routes/voucherRoutes');
const rechargeRoutes = require('./routes/recharge');
const adminRechargeRoutes = require('./routes/adminRecharge');

// Initialize express app
const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/commissions', commissionRoutes);
app.use('/api/commission-schemes', commissionSchemeRoutes);
app.use('/api/vouchers', voucherRoutes);
app.use('/api/recharge', rechargeRoutes);
app.use('/api/admin/recharge', adminRechargeRoutes);

// Default route
app.get('/', (req, res) => {
  res.send('Pay4U API is running');
});

// Global flag to track database type
global.useInMemoryDB = false;

// Connect to MongoDB
const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pay4u', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    });
    
    console.log('MongoDB connected successfully');
    global.useInMemoryDB = false;
  } catch (err) {
    console.warn('MongoDB connection failed, falling back to in-memory database');
    console.log('Error details:', err.message);
    
    // Initialize in-memory database
    const inMemoryDB = require('./utils/inMemoryDB');
    global.useInMemoryDB = true;
    global.inMemoryDB = inMemoryDB;
    
    console.log('In-memory database initialized successfully');
  }
};

// Initialize database connection
connectDB();

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});