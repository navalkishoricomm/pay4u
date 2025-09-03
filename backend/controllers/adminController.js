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

// Get all transactions with enhanced filtering
exports.getAllTransactions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      type,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      startDate,
      endDate,
      minAmount,
      maxAmount,
      operator,
      userId,
      userName,
      userEmail,
      apiProvider
    } = req.query;

    console.log('Fetching all transactions with filters:', {
      page, limit, status, type, sortBy, sortOrder,
      startDate, endDate, minAmount, maxAmount,
      operator, userId, userName, userEmail, apiProvider
    });

    // Build filter object
    const filter = {};
    
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (operator) filter.operator = new RegExp(operator, 'i');
    if (apiProvider) filter.apiProvider = new RegExp(apiProvider, 'i');
    
    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    
    // Amount range filter
    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) filter.amount.$gte = parseFloat(minAmount);
      if (maxAmount) filter.amount.$lte = parseFloat(maxAmount);
    }

    const populateOptions = {
      path: 'wallet',
      populate: {
        path: 'user',
        select: 'name email phone'
      }
    };

    let query;
    
    // If filtering by user details, use aggregation
    if (userId || userName || userEmail) {
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
            'wallet.user': {
              ...(userId && { _id: new mongoose.Types.ObjectId(userId) }),
              ...(userName && { name: new RegExp(userName, 'i') }),
              ...(userEmail && { email: new RegExp(userEmail, 'i') })
            }
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
    if (status === 'approved' && transactionId && transactionId.trim()) {
      transaction.transactionId = transactionId.trim();
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
        'high',
        req.user.id // Add sender (admin user ID)
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
            'high',
            req.user.id // Add sender (admin user ID)
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
            'high',
            req.user.id // Add sender (admin user ID)
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
    const totalUsers = await User.countDocuments();
    const totalTransactions = await Transaction.countDocuments();
    
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

// Send notification to user
exports.sendUserNotification = async (req, res) => {
  try {
    const { userId, title, message, type = 'info', priority = 'medium' } = req.body;
    
    if (!userId || !title || !message) {
      return res.status(400).json({
        status: 'fail',
        message: 'User ID, title, and message are required'
      });
    }
    
    await createNotification(userId, title, message, type, null, priority, req.user.id);
    
    res.status(200).json({
      status: 'success',
      message: 'Notification sent successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Voucher order management functions (placeholders)
exports.getPendingVoucherOrders = async (req, res) => {
  try {
    res.status(200).json({
      status: 'success',
      data: { voucherOrders: [] }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.getVoucherOrder = async (req, res) => {
  try {
    res.status(404).json({
      status: 'fail',
      message: 'Voucher order not found'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.approveVoucherOrder = async (req, res) => {
  try {
    res.status(200).json({
      status: 'success',
      message: 'Voucher order approved'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.rejectVoucherOrder = async (req, res) => {
  try {
    res.status(200).json({
      status: 'success',
      message: 'Voucher order rejected'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.uploadVoucherFile = async (req, res) => {
  try {
    res.status(200).json({
      status: 'success',
      message: 'File uploaded successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.downloadVoucherFile = async (req, res) => {
  try {
    res.status(404).json({
      status: 'fail',
      message: 'File not found'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};