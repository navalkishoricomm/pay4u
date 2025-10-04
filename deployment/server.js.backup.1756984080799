const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
const jobScheduler = require('./utils/jobScheduler');
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
const dmtRoutes = require('./routes/dmt');
const aepsRoutes = require('./routes/aepsRoutes');
const chargeSlabRoutes = require('./routes/chargeSlabRoutes');
const auditRoutes = require('./routes/auditRoutes');
const auditMiddleware = require('./middleware/auditMiddleware');

// Initialize express app
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Make io available globally
global.io = io;

// Middleware
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

// Add audit middleware to capture transaction data
app.use(auditMiddleware.addStartTime);

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
app.use('/api/dmt', dmtRoutes);
app.use('/api/aeps', aepsRoutes);
app.use('/api/admin/dmt', require('./routes/adminDMT'));
app.use('/api/admin/charge-slabs', chargeSlabRoutes);
app.use('/api/admin/audit', auditRoutes);

// Default route
app.get('/', (req, res) => {
  res.send('Pay4U API is running');
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Pay4U API is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
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

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Join user to their personal room for targeted notifications
  socket.on('join', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined their notification room`);
  });
  
  // Handle admin joining admin room
  socket.on('join_admin', (adminId) => {
    socket.join('admin_room');
    console.log(`Admin ${adminId} joined admin room`);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Socket.IO server initialized');
  
  // Start background jobs
  jobScheduler.startAll();
});

// Export io for use in other modules
module.exports = { app, io };