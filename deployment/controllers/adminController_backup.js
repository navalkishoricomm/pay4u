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
    const { 
      type, 
      status, 
      startDate, 
      endDate, 
      minAmount, 
      maxAmount,
      userId,
      userName,
      userEmail,
      operator,
      apiProvider,
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    console.log(`Filter params: type=${type}, status=${status}, userId=${userId}, operator=${operator}, apiProvider=${apiProvider}`);
    
    // Build query filter
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (operator) filter.operator = operator;
    if (apiProvider) filter['metadata.apiProvider'] = apiProvider;
    
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
    
    // Build population pipeline for user filtering
    const populateOptions = {
      path: 'wallet',
      populate: {
        path: 'user',
        select: 'name email phone'
      }
    };
    
    // If filtering by user, we need to use aggregation
    let query;
    if (userId || userName || userEmail) {
      const userFilter = {};
      if (userId) userFilter._id = new mongoose.Types.ObjectId(userId);
      if (userName) userFilter.name = new RegExp(userName, 'i');
      if (userEmail) userFilter.email = new RegExp(userEmail, 'i');
      
      query = Transaction.aggregate([
        {
          $lookup: {
            from: 'wallets',
            localField: 'wallet',
            foreignField: '_id',
            as: 'wallet'
          }
        },
        { $unwind: '$wallet' },
        {
          $lookup: {
            from: 'users',
            localField: 'wallet.user',
            foreignField: '_id',
            as: 'wallet.user'
          }
        },
        { $unwind: '$wallet.user' },
        {
          $match: {
            ...filter,
            'wallet.user': userFilter
          }
        },
        {
          $project: {
            _id: 1,
            amount: 1,
            type: 1,
            status: 1,
            description: 1,
            reference: 1,
            operator: 1,
            metadata: 1,
            createdAt: 1,
            updatedAt: 1,
            approvedBy: 1,
            approvalDate: 1,
            approvalNotes: 1,
            transactionId: 1,
            failureReason: 1,
            'wallet._id': 1,
            'wallet.balance': 1,
            'wallet.user._id': 1,
            'wallet.user.name': 1,
            'wallet.user.email': 1,
            'wallet.user.phone': 1
          }
        },
        { $sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 } },
        { $skip: (page - 1) * parseInt(limit) },
        { $limit: parseInt(limit) }
      ]);
    } else {
      query = Transaction.find(filter)
        .populate(populateOptions)
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip((page - 1) * parseInt(limit))
        .limit(parseInt(limit));
    }
    
    const [transactions, totalCount] = await Promise.all([
      query,
      userId || userName || userEmail 
        ? Transaction.aggregate([
            {
              $lookup: {
                from: 'wallets',
                localField: 'wallet',
                foreignField: '_id',
                as: 'wallet'
              }
            },
            { $unwind: '$wallet' },
            {
              $lookup: {
                from: 'users',
                localField: 'wallet.user',
                foreignField: '_id',
                as: 'wallet.user'
              }
            },
            { $unwind: '$wallet.user' },
            {
              $match: {
                ...filter,
                'wallet.user': {
                  ...(userId && { _id: new mongoose.Types.ObjectId(userId) }),
                  ...(userName && { name: new RegExp(userName, 'i') }),
                  ...(userEmail && { email: new RegExp(userEmail, 'i') })
                }
              }
            },
            { $count: 'total' }
          ]).then(result => result[0]?.total || 0)
        : Transaction.countDocuments(filter)
    ]);
    
    console.log(`Returning ${transactions.length} transactions out of ${totalCount} total`);
    
    res.status(200).json({
      status: 'success',
      results: transactions.length,
      total: totalCount,
      page: parseInt(page),
      pages: Math.ceil(totalCount / parseInt(limit)),
      data: {
        transactions,
      },
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
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
      }
    }

    // Send notification to user
    if (transaction.wallet && transaction.wallet.user && transaction.wallet.user._id) {
      let message = '';
      if (status === 'approved') {
        if (transaction.type === 'topup') {
          message = `Your top-up of ₹${transaction.amount} has been approved and added to your wallet.`;
        } else {
          message = `Your ${transaction.type.replace('-', ' ')} of ₹${transaction.amount} has been processed successfully.`;
        }
      } else {
        message = `Your ${transaction.type === 'topup' ? 'top-up' : transaction.type.replace('-', ' ')} request of ₹${transaction.amount} has been rejected.`;
        if (failureReason) {
          message += ` Reason: ${failureReason}`;
        }
      }
      
      await createNotification(
        transaction.wallet.user._id,
        status === 'approved' ? 'Transaction Approved' : 'Transaction Rejected',
        message,
        status === 'approved' ? 'transaction_approved' : 'transaction_rejected',
        transaction._id,
        'high'
      );
    }

    res.status(200).json({
      status: 'success',
      data: {
        transaction,
      },
    });
  } catch (error) {
    console.error('Error updating transaction status:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Bulk approve transactions
exports.bulkApproveTransactions = async (req, res) => {
  try {
    const { transactionIds, notes } = req.body;
    
    if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'Transaction IDs array is required'
      });
    }
    
    console.log(`Bulk approving ${transactionIds.length} transactions by admin ${req.user.id}`);
    
    const results = {
      approved: [],
      failed: [],
      skipped: []
    };
    
    for (const transactionId of transactionIds) {
      try {
        const transaction = await Transaction.findById(transactionId).populate({
          path: 'wallet',
          populate: {
            path: 'user'
          }
        });
        
        if (!transaction) {
          results.failed.push({ id: transactionId, reason: 'Transaction not found' });
          continue;
        }
        
        if (transaction.status !== 'awaiting_approval') {
          results.skipped.push({ id: transactionId, reason: 'Transaction already processed' });
          continue;
        }
        
        // Update transaction
        transaction.status = 'approved';
        transaction.approvedBy = req.user.id;
        transaction.approvalDate = new Date();
        transaction.approvalNotes = notes || '';
        
        await transaction.save();
        
        // Handle wallet balance updates
        const wallet = await Wallet.findById(transaction.wallet._id);
        if (wallet && transaction.type === 'topup') {
          wallet.balance += transaction.amount;
          await wallet.save();
        }
        
        // Send notification
        if (transaction.wallet && transaction.wallet.user && transaction.wallet.user._id) {
          let message = '';
          if (transaction.type === 'topup') {
            message = `Your top-up of ₹${transaction.amount} has been approved and added to your wallet.`;
          } else {
            message = `Your ${transaction.type.replace('-', ' ')} of ₹${transaction.amount} has been processed successfully.`;
          }
          
          await createNotification(
            transaction.wallet.user._id,
            'Transaction Approved',
            message,
            'transaction_approved',
            transaction._id,
            'high'
          );
        }
        
        results.approved.push({ id: transactionId, amount: transaction.amount });
        
      } catch (error) {
        console.error(`Error approving transaction ${transactionId}:`, error);
        results.failed.push({ id: transactionId, reason: error.message });
      }
    }
    
    console.log(`Bulk approval completed: ${results.approved.length} approved, ${results.failed.length} failed, ${results.skipped.length} skipped`);
    
    res.status(200).json({
      status: 'success',
      message: `Bulk approval completed: ${results.approved.length} approved, ${results.failed.length} failed, ${results.skipped.length} skipped`,
      data: results
    });
    
  } catch (error) {
    console.error('Bulk approve failed:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Bulk reject transactions
exports.bulkRejectTransactions = async (req, res) => {
  try {
    const { transactionIds, notes, failureReason } = req.body;
    
    if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'Transaction IDs array is required'
      });
    }
    
    console.log(`Bulk rejecting ${transactionIds.length} transactions by admin ${req.user.id}`);
    
    const results = {
      rejected: [],
      failed: [],
      skipped: []
    };
    
    for (const transactionId of transactionIds) {
      try {
        const transaction = await Transaction.findById(transactionId).populate({
          path: 'wallet',
          populate: {
            path: 'user'
          }
        });
        
        if (!transaction) {
          results.failed.push({ id: transactionId, reason: 'Transaction not found' });
          continue;
        }
        
        if (transaction.status !== 'awaiting_approval') {
          results.skipped.push({ id: transactionId, reason: 'Transaction already processed' });
          continue;
        }
        
        // Update transaction
        transaction.status = 'rejected';
        transaction.approvedBy = req.user.id;
        transaction.approvalDate = new Date();
        transaction.approvalNotes = notes || '';
        transaction.failureReason = failureReason || '';
        
        await transaction.save();
        
        // Handle refunds for rejected recharge/bill payment transactions
        if (['mobile-recharge', 'dth-recharge', 'bill-payment'].includes(transaction.type)) {
          const wallet = await Wallet.findById(transaction.wallet._id);
          if (wallet) {
            wallet.balance += transaction.amount;
            await wallet.save();
          }
        }
        
        // Send notification
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
        }
        
        results.rejected.push({ id: transactionId, amount: transaction.amount });
        
      } catch (error) {
        console.error(`Error rejecting transaction ${transactionId}:`, error);
        results.failed.push({ id: transactionId, reason: error.message });
      }
    }
    
    console.log(`Bulk rejection completed: ${results.rejected.length} rejected, ${results.failed.length} failed, ${results.skipped.length} skipped`);
    
    res.status(200).json({
      status: 'success',
      message: `Bulk rejection completed: ${results.rejected.length} rejected, ${results.failed.length} failed, ${results.skipped.length} skipped`,
      data: results
    });
    
  } catch (error) {
    console.error('Bulk reject failed:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    
    res.status(200).json({
      status: 'success',
      results: users.length,
      data: {
        users,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Get admin dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    // Note: For recharge/bill payment transactions, money is already deducted when transaction was created
    // No balance changes needed on approval
    const totalUsers = await User.countDocuments();
    const totalTransactions = await Transaction.countDocuments();
    
    // Mock stats for now - replace with actual calculations
    const stats = {
      totalUsers,
      totalTransactions,
      totalRevenue: 50000,
      pendingApprovals: await Transaction.countDocuments({ status: 'awaiting_approval' }),
      transactionsByStatus: {
        completed: await Transaction.countDocuments({ status: 'completed' }),
        pending: await Transaction.countDocuments({ status: 'pending' }),
        failed: await Transaction.countDocuments({ status: 'failed' }),
        'awaiting_approval': await Transaction.countDocuments({ status: 'awaiting_approval' }),
        approved: await Transaction.countDocuments({ status: 'approved' }),
        rejected: await Transaction.countDocuments({ status: 'rejected' })
      },
      recentTransactions: await Transaction.find()
        .populate({
          path: 'wallet',
          populate: {
            path: 'user',
            select: 'name email'
          }
        })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('type amount status createdAt')
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