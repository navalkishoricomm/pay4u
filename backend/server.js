const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
const jobScheduler = require('./utils/jobScheduler');
const Notification = require('./models/Notification');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const walletRoutes = require('./routes/wallet');
const transactionRoutes = require('./routes/transaction');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notifications');
// const commissionRoutes = require('./routes/commissionRoutes');
// const commissionSchemeRoutes = require('./routes/commissionSchemeRoutes');
const voucherRoutes = require('./routes/voucherRoutes');
const auditMiddleware = require('./middleware/auditMiddleware');
const rechargeRoutes = require('./routes/recharge');
const adminRechargeRoutes = require('./routes/adminRecharge');
const dmtRoutes = require('./routes/dmt');
const aepsRoutes = require('./routes/aepsRoutes');
const auditRoutes = require('./routes/auditRoutes');
const upiBarcodeRoutes = require('./routes/upiBarcode');
const bbpsRoutes = require('./routes/bbps');
// const chargeSlabRoutes = require('./routes/chargeSlabRoutes');

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

// Middleware with timeout and size limits
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cors());
app.use(morgan('dev'));

// Set server timeout to 5 minutes
app.use((req, res, next) => {
  req.setTimeout(300000); // 5 minutes
  res.setTimeout(300000); // 5 minutes
  next();
});

// Serve static files with error handling
app.use('/uploads', express.static('uploads'), (req, res) => {
  res.status(404).json({ status: 'error', message: 'File not found' });
});

// Add audit middleware to capture transaction data
app.use(auditMiddleware.addStartTime);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
// app.use('/api/commissions', commissionRoutes);
// app.use('/api/commission-schemes', commissionSchemeRoutes);
app.use('/api/vouchers', voucherRoutes);
app.use('/api/recharge', rechargeRoutes);
app.use('/api/admin/recharge', adminRechargeRoutes);
app.use('/api/dmt', dmtRoutes);
app.use('/api/aeps', aepsRoutes);
app.use('/api/admin/dmt', require('./routes/adminDMT'));
// app.use('/api/admin/charge-slabs', chargeSlabRoutes);
app.use('/api/admin/audit', auditRoutes);
app.use('/api/upi-barcodes', upiBarcodeRoutes);
app.use('/api/bbps', bbpsRoutes);

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
    
    await mongoose.connect(process.env.DATABASE_URI || 'mongodb://localhost:27017/pay4u', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // 30 seconds for server selection
      socketTimeoutMS: 45000, // 45 seconds for socket timeout
      connectTimeoutMS: 30000, // 30 seconds for connection timeout
      maxPoolSize: 10, // Maximum number of connections
      minPoolSize: 5, // Minimum number of connections
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
    });
    
    // Configure mongoose to handle timeouts better
    mongoose.set('bufferCommands', false);
    
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
  console.log('🔌 User connected:', socket.id);
  
  // Join user to their personal room for targeted notifications
  socket.on('join', (userId) => {
    if (!userId) {
      console.error('❌ Invalid userId provided for room join');
      return;
    }
    
    const userRoom = `user_${userId}`;
    socket.join(userRoom);
    console.log(`✓ User ${userId} joined notification room (Socket: ${socket.id})`);
    
    // Send confirmation to client
    socket.emit('joined', { userId, room: userRoom });
    
    // Send any pending notifications count
    Notification.countDocuments({ user: userId, isRead: false })
      .then(unreadCount => {
        if (unreadCount > 0) {
          socket.emit('unread_count', { count: unreadCount });
          console.log(`📬 Sent unread count (${unreadCount}) to user ${userId}`);
        }
      })
      .catch(err => console.error('Error getting unread count:', err.message));
  });
  
  // Handle admin joining admin room
  socket.on('join_admin', (adminId) => {
    if (!adminId) {
      console.error('❌ Invalid adminId provided for admin room join');
      return;
    }
    
    socket.join('admin_room');
    console.log(`👑 Admin ${adminId} joined admin room (Socket: ${socket.id})`);
    
    // Send confirmation to admin client
    socket.emit('admin_joined', { adminId, room: 'admin_room' });
  });
  
  // Handle manual notification test (for debugging)
  socket.on('test_notification', (data) => {
    console.log('🧪 Test notification requested:', data);
    socket.emit('test_response', { 
      message: 'Test notification received', 
      timestamp: new Date(),
      socketId: socket.id 
    });
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 5000;

// Test endpoint for barcode images
app.get('/test-barcode/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'uploads', 'admin-barcodes', filename);
    
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).json({ error: 'Barcode image not found', path: filePath });
    }
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Socket.IO server initialized');
  
  // Set server timeout
  server.timeout = 300000; // 5 minutes
  server.keepAliveTimeout = 65000; // 65 seconds
  server.headersTimeout = 66000; // 66 seconds
  
  // Start background jobs
  jobScheduler.startAll();
});

// Export io for use in other modules
module.exports = { app, io };