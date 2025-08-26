const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');
const VoucherOrder = require('../models/VoucherOrder');
const { createNotification } = require('./notificationController');
const mongoose = require('mongoose');

// Middleware to restrict access to admin only
exports.restrictToAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      status: 'fail',
      message: 'You do not have permission to perform this action',
    });
  }
  next();
};

// Get all pending transactions that need approval
exports.getPendingTransactions = async (req, res) => {
  try {
    console.log('Fetching pending transactions for admin approval');
    
    // Get actual pending transactions from the database
    const pendingTransactions = await Transaction.find({ 
      status: 'awaiting_approval' 
    })
    .populate({
      path: 'wallet',
      populate: {
        path: 'user',
        select: 'name email phone'
      }
    })
    .sort({ createdAt: -1 });
    
    console.log(`Returning ${pendingTransactions.length} pending transactions`);
    
    res.status(200).json({
      status: 'success',
      results: pendingTransactions.length,
      data: {
        transactions: pendingTransactions,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Voucher Order Management Functions
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/voucher-files';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'voucher-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Accept only Excel files
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Get pending voucher orders
exports.getPendingVoucherOrders = async (req, res) => {
  try {
    const { status = 'pending_approval', page = 1, limit = 10 } = req.query;
    const filter = { approvalStatus: status };
    
    const skip = (page - 1) * limit;
    
    const orders = await VoucherOrder.find(filter)
      .populate('user', 'name email phone')
      .populate('brandVoucher', 'brandName image category')
      .populate('voucherDenomination', 'denomination discountPercentage')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await VoucherOrder.countDocuments(filter);
    
    res.status(200).json({
      status: 'success',
      results: orders.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: {
        orders
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get single voucher order
exports.getVoucherOrder = async (req, res) => {
  try {
    const order = await VoucherOrder.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('brandVoucher', 'brandName image category description')
      .populate('voucherDenomination', 'denomination discountPercentage originalPrice')
      .populate('approvedBy', 'name email')
      .populate('walletTransaction');
    
    if (!order) {
      return res.status(404).json({
        status: 'fail',
        message: 'Voucher order not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        order
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Approve voucher order
exports.approveVoucherOrder = async (req, res) => {
  try {
    const order = await VoucherOrder.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        status: 'fail',
        message: 'Voucher order not found'
      });
    }
    
    if (order.approvalStatus !== 'pending_approval') {
      return res.status(400).json({
        status: 'fail',
        message: 'Order has already been processed'
      });
    }
    
    order.approvalStatus = 'approved';
    order.approvedBy = req.user._id;
    order.approvedAt = new Date();
    
    await order.save();
    
    // Populate the response
    await order.populate([
      { path: 'user', select: 'name email phone' },
      { path: 'brandVoucher', select: 'brandName image category' },
      { path: 'voucherDenomination', select: 'denomination discountPercentage' },
      { path: 'approvedBy', select: 'name email' }
    ]);
    
    res.status(200).json({
      status: 'success',
      message: 'Voucher order approved successfully',
      data: {
        order
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Reject voucher order
exports.rejectVoucherOrder = async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    
    if (!rejectionReason) {
      return res.status(400).json({
        status: 'fail',
        message: 'Rejection reason is required'
      });
    }
    
    const order = await VoucherOrder.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        status: 'fail',
        message: 'Voucher order not found'
      });
    }
    
    if (order.approvalStatus !== 'pending_approval') {
      return res.status(400).json({
        status: 'fail',
        message: 'Order has already been processed'
      });
    }
    
    order.approvalStatus = 'rejected';
    order.approvedBy = req.user._id;
    order.approvedAt = new Date();
    order.rejectionReason = rejectionReason;
    
    await order.save();
    
    // TODO: Refund the amount to user's wallet
    const Wallet = require('../models/Wallet');
    const Transaction = require('../models/Transaction');
    
    const wallet = await Wallet.findOne({ user: order.user });
    if (wallet) {
      wallet.balance += order.finalAmount;
      await wallet.save();
      
      // Create refund transaction
      const refundTransaction = new Transaction({
        wallet: wallet._id,
        type: 'voucher_refund',
        amount: order.finalAmount,
        status: 'completed',
        description: `Refund for rejected voucher order ${order.orderNumber}`,
        metadata: {
          voucherOrderId: order._id,
          rejectionReason
        }
      });
      
      await refundTransaction.save();
    }
    
    // Populate the response
    await order.populate([
      { path: 'user', select: 'name email phone' },
      { path: 'brandVoucher', select: 'brandName image category' },
      { path: 'voucherDenomination', select: 'denomination discountPercentage' },
      { path: 'approvedBy', select: 'name email' }
    ]);
    
    res.status(200).json({
      status: 'success',
      message: 'Voucher order rejected successfully',
      data: {
        order
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Upload voucher file
exports.uploadVoucherFile = async (req, res) => {
  try {
    // Use multer middleware
    upload.single('voucherFile')(req, res, async function (err) {
      if (err) {
        return res.status(400).json({
          status: 'fail',
          message: err.message
        });
      }
      
      if (!req.file) {
        return res.status(400).json({
          status: 'fail',
          message: 'No file uploaded'
        });
      }
      
      const order = await VoucherOrder.findById(req.params.id);
      
      if (!order) {
        // Delete uploaded file if order not found
        fs.unlinkSync(req.file.path);
        return res.status(404).json({
          status: 'fail',
          message: 'Voucher order not found'
        });
      }
      
      if (order.approvalStatus !== 'approved') {
        // Delete uploaded file if order not approved
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
          status: 'fail',
          message: 'Can only upload files for approved orders'
        });
      }
      
      // Delete old file if exists
      if (order.voucherFilePath && fs.existsSync(order.voucherFilePath)) {
        fs.unlinkSync(order.voucherFilePath);
      }
      
      order.voucherFilePath = req.file.path;
      await order.save();
      
      res.status(200).json({
        status: 'success',
        message: 'Voucher file uploaded successfully',
        data: {
          fileName: req.file.filename,
          filePath: req.file.path
        }
      });
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Download voucher file
exports.downloadVoucherFile = async (req, res) => {
  try {
    const order = await VoucherOrder.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        status: 'fail',
        message: 'Voucher order not found'
      });
    }
    
    if (!order.voucherFilePath || !fs.existsSync(order.voucherFilePath)) {
      return res.status(404).json({
        status: 'fail',
        message: 'Voucher file not found'
      });
    }
    
    const fileName = path.basename(order.voucherFilePath);
    const originalName = `voucher-${order.orderNumber}.xlsx`;
    
    res.setHeader('Content-Disposition', `attachment; filename="${originalName}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    
    const fileStream = fs.createReadStream(order.voucherFilePath);
    fileStream.pipe(res);
    
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get all transactions (with filtering options)
exports.getAllTransactions = async (req, res) => {
  try {
    console.log('Fetching all transactions for admin');
    
    // Parse query parameters for filtering
    const { type, status, startDate, endDate, minAmount, maxAmount } = req.query;
    
    console.log(`Filter params: type=${type}, status=${status}, date range=${startDate}-${endDate}, amount range=${minAmount}-${maxAmount}`);
    
    // Build query filter
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) filter.amount.$gte = parseFloat(minAmount);
      if (maxAmount) filter.amount.$lte = parseFloat(maxAmount);
    }
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    
    // Get all transactions from the database
    const allTransactions = await Transaction.find(filter)
      .populate({
        path: 'wallet',
        populate: {
          path: 'user',
          select: 'name email phone'
        }
      })
      .sort({ createdAt: -1 })
      .limit(100); // Limit to prevent overwhelming response
    
    console.log(`Returning ${allTransactions.length} transactions`);
    
    res.status(200).json({
      status: 'success',
      results: allTransactions.length,
      data: {
        transactions: allTransactions,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Approve or reject a transaction
exports.updateTransactionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, transactionId, failureReason } = req.body;
    
    console.log(`${status} transaction ${id} by admin ${req.user.id}`);
    
    // Validate status
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Status must be either approved or rejected',
      });
    }
    
    // Find and update the transaction in the database
    const transaction = await Transaction.findById(id).populate({
      path: 'wallet',
      populate: {
        path: 'user'
      }
    });
    
    if (!transaction) {
      return res.status(404).json({
        status: 'fail',
        message: 'Transaction not found',
      });
    }
    
    // Update transaction status and admin metadata
    transaction.status = status;
    transaction.approvedBy = req.user.id;
    transaction.approvalDate = new Date();
    transaction.approvalNotes = notes || '';
    
    // Handle manual processing fields
    if (status === 'approved' && transactionId) {
      transaction.transactionId = transactionId;
    }
    if (status === 'rejected' && failureReason) {
      transaction.failureReason = failureReason;
    }
    
    await transaction.save();
    
    console.log(`Transaction ${id} ${status} successfully`);
    
    // Handle wallet balance updates based on transaction type and status
    if (status === 'approved') {
      const wallet = await Wallet.findById(transaction.wallet._id);
      if (wallet) {
        if (transaction.type === 'topup') {
          // Add money for top-up
          wallet.balance += transaction.amount;
          console.log(`Wallet balance updated: +${transaction.amount}`);
          await wallet.save();
        }
        // Note: For recharge/bill payment transactions, money is already deducted when transaction was created
        // No balance changes needed on approval
      } else {
        throw new Error('Wallet not found for approved transaction');
      }
      
      // Create approval notification
      if (transaction.wallet && transaction.wallet.user && transaction.wallet.user._id) {
        let message = '';
        if (transaction.type === 'topup') {
          message = `Your top-up of ₹${transaction.amount} has been approved and added to your wallet.`;
        } else {
          message = `Your ${transaction.type.replace('-', ' ')} of ₹${transaction.amount} has been processed successfully.${transactionId ? ` Transaction ID: ${transactionId}` : ''}`;
        }
        
        await createNotification(
          transaction.wallet.user._id,
          'Transaction Approved',
          message,
          'transaction_approved',
          transaction._id,
          'high'
        );
        console.log(`Approval notification sent to user ${transaction.wallet.user._id}`);
      }
    } else if (status === 'rejected') {
      // Refund money for rejected recharge/bill payment transactions
      if (['mobile-recharge', 'dth-recharge', 'bill-payment'].includes(transaction.type)) {
        const wallet = await Wallet.findById(transaction.wallet._id);
        if (wallet) {
          wallet.balance += transaction.amount;
          await wallet.save();
          console.log(`Refunded ${transaction.amount} to wallet. New balance: ${wallet.balance}`);
        }
      }
      
      // Create rejection notification
      if (transaction.wallet && transaction.wallet.user && transaction.wallet.user._id) {
        let rejectionMessage = `Your ${transaction.type === 'topup' ? 'top-up' : transaction.type.replace('-', ' ')} request of ₹${transaction.amount} has been rejected.`;
        
        if (['mobile-recharge', 'dth-recharge', 'bill-payment'].includes(transaction.type)) {
          rejectionMessage += ` The amount has been refunded to your wallet.`;
        }
        
        if (failureReason) {
          rejectionMessage += ` Reason: ${failureReason}`;
        } else if (notes) {
          rejectionMessage += ` Reason: ${notes}`;
        }
        
        await createNotification(
          transaction.wallet.user._id,
          'Transaction Rejected',
          rejectionMessage,
          'transaction_rejected',
          transaction._id,
          'high'
        );
        console.log(`Rejection notification sent to user ${transaction.wallet.user._id}`);
      }
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        transaction,
      },
    });
  } catch (error) {
    console.error('Transaction update failed:', error.message);
    
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Send notification to a user
exports.sendUserNotification = async (req, res) => {
  try {
    const { userId, message, type, transactionId } = req.body;
    
    if (!userId || !message) {
      return res.status(400).json({
        status: 'fail',
        message: 'User ID and notification message are required',
      });
    }
    
    console.log(`Simulating sending notification to user ${userId}: ${message}`);
    
    // In development mode, create a mock notification
    const notification = {
      _id: `notification-${Date.now()}`,
      userId,
      message,
      type: type || 'info',
      transactionId,
      read: false,
      createdAt: new Date()
    };
    
    // In a real implementation, this would save to a notifications collection
    // and potentially trigger a real-time notification via WebSockets
    
    res.status(200).json({
      status: 'success',
      data: {
        notification,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Get all users for admin management
exports.getAllUsers = async (req, res) => {
  try {
    console.log('Fetching all users for admin');
    
    const users = await User.find()
      .select('name email phone role isActive createdAt')
      .sort({ createdAt: -1 });
    
    console.log(`Returning ${users.length} users`);
    
    res.status(200).json({
      status: 'success',
      results: users.length,
      data: {
        users,
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Get admin dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    console.log('Simulating fetching admin dashboard statistics');
    
    // In development mode, create mock statistics
    const stats = {
      totalUsers: 125,
      activeUsers: 98,
      totalTransactions: 450,
      pendingApprovals: 12,
      totalTransactionAmount: 125000,
      transactionsByType: {
        topup: 150,
        'mobile-recharge': 180,
        'dth-recharge': 70,
        'bill-payment': 50
      },
      transactionsByStatus: {
        completed: 380,
        pending: 25,
        failed: 15,
        'awaiting_approval': 12,
        approved: 10,
        rejected: 8
      },
      recentTransactions: [
        {
          _id: 'mock-recent-1',
          type: 'topup',
          amount: 500,
          status: 'awaiting_approval',
          userName: 'John Doe',
          createdAt: new Date(Date.now() - 1800000) // 30 minutes ago
        },
        {
          _id: 'mock-recent-2',
          type: 'mobile-recharge',
          amount: 100,
          status: 'completed',
          userName: 'Jane Smith',
          createdAt: new Date(Date.now() - 3600000) // 1 hour ago
        },
        {
          _id: 'mock-recent-3',
          type: 'bill-payment',
          amount: 250,
          status: 'completed',
          userName: 'Mike Johnson',
          createdAt: new Date(Date.now() - 7200000) // 2 hours ago
        }
      ]
    };
    
    res.status(200).json({
      status: 'success',
      data: {
        stats,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};