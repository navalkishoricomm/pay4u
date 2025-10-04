const express = require('express');
const router = express.Router();
const DmtTransaction = require('../models/DmtTransaction');
const User = require('../models/User');
const DmtRemitter = require('../models/DmtRemitter');
const DmtBeneficiary = require('../models/DmtBeneficiary');
const dmtService = require('../services/dmtService');
const authController = require('../controllers/authController');
const mongoose = require('mongoose');

// Apply authentication and admin middleware to all routes
router.use(authController.protect);
router.use(authController.restrictTo('admin'));

// Get DMT statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await DmtTransaction.aggregate([
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          successfulTransactions: {
            $sum: {
              $cond: [{ $eq: ['$status', 'SUCCESS'] }, 1, 0]
            }
          },
          pendingTransactions: {
            $sum: {
              $cond: [{ $in: ['$status', ['PENDING', 'PROCESSING', 'INITIATED']] }, 1, 0]
            }
          },
          failedTransactions: {
            $sum: {
              $cond: [{ $eq: ['$status', 'FAILED'] }, 1, 0]
            }
          },
          totalAmount: { $sum: '$amount' },
          totalCharges: { $sum: '$charges' }
        }
      }
    ]);

    const result = stats[0] || {
      totalTransactions: 0,
      successfulTransactions: 0,
      pendingTransactions: 0,
      failedTransactions: 0,
      totalAmount: 0,
      totalCharges: 0
    };

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching DMT stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch DMT statistics'
    });
  }
});

// Get all DMT transactions with filters and pagination
router.get('/transactions', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      userId,
      userName,
      userEmail,
      remitterMobile,
      beneficiaryName,
      transferMode,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
      }
    }

    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) {
        filter.amount.$gte = parseFloat(minAmount);
      }
      if (maxAmount) {
        filter.amount.$lte = parseFloat(maxAmount);
      }
    }

    if (transferMode) {
      filter.transferMode = transferMode;
    }

    // Build aggregation pipeline
    const pipeline = [
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $lookup: {
          from: 'dmtremitters',
          localField: 'remitter',
          foreignField: '_id',
          as: 'remitter'
        }
      },
      {
        $lookup: {
          from: 'dmtbeneficiaries',
          localField: 'beneficiary',
          foreignField: '_id',
          as: 'beneficiary'
        }
      },
      {
        $unwind: { path: '$user', preserveNullAndEmptyArrays: true }
      },
      {
        $unwind: { path: '$remitter', preserveNullAndEmptyArrays: true }
      },
      {
        $unwind: { path: '$beneficiary', preserveNullAndEmptyArrays: true }
      }
    ];

    // Add additional filters based on populated data
    const additionalFilters = {};

    if (userId) {
      additionalFilters['user._id'] = new mongoose.Types.ObjectId(userId);
    }

    if (userName) {
      additionalFilters['user.name'] = { $regex: userName, $options: 'i' };
    }

    if (userEmail) {
      additionalFilters['user.email'] = { $regex: userEmail, $options: 'i' };
    }

    if (remitterMobile) {
      additionalFilters['remitter.mobile'] = { $regex: remitterMobile, $options: 'i' };
    }

    if (beneficiaryName) {
      additionalFilters['beneficiary.accountHolderName'] = { $regex: beneficiaryName, $options: 'i' };
    }

    // Combine filters
    const combinedFilter = { ...filter, ...additionalFilters };

    if (Object.keys(combinedFilter).length > 0) {
      pipeline.push({ $match: combinedFilter });
    }

    // Add sorting
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;
    pipeline.push({ $sort: sortObj });

    // Get total count
    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await DmtTransaction.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    // Add pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: parseInt(limit) });

    // Execute query
    const transactions = await DmtTransaction.aggregate(pipeline);

    const pages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: {
        transactions
      },
      pagination: {
        page: parseInt(page),
        pages,
        total,
        results: transactions.length
      }
    });
  } catch (error) {
    console.error('Error fetching DMT transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch DMT transactions'
    });
  }
});

// Check single transaction status
router.post('/transaction/:transactionId/check-status', async (req, res) => {
  try {
    const { transactionId } = req.params;

    const transaction = await DmtTransaction.findOne({ transactionId });
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Check status using DMT service
    const updatedTransaction = await dmtService.checkTransactionStatus(transactionId);

    res.json({
      success: true,
      message: 'Transaction status updated',
      data: updatedTransaction
    });
  } catch (error) {
    console.error('Error checking transaction status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check transaction status'
    });
  }
});

// Bulk check transaction status
router.post('/transactions/bulk-check-status', async (req, res) => {
  try {
    const { transactionIds } = req.body;

    if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Transaction IDs are required'
      });
    }

    const transactions = await DmtTransaction.find({
      _id: { $in: transactionIds }
    });

    if (transactions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No transactions found'
      });
    }

    const results = [];
    const errors = [];

    // Process transactions in batches to avoid overwhelming the API
    for (const transaction of transactions) {
      try {
        const updatedTransaction = await dmtService.checkTransactionStatus(transaction.transactionId);
        results.push(updatedTransaction);
      } catch (error) {
        console.error(`Error checking status for transaction ${transaction.transactionId}:`, error);
        errors.push({
          transactionId: transaction.transactionId,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Status checked for ${results.length} transactions`,
      data: {
        updated: results.length,
        errors: errors.length,
        errorDetails: errors
      }
    });
  } catch (error) {
    console.error('Error in bulk status check:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check transaction statuses'
    });
  }
});

// Export transactions to CSV
router.get('/transactions/export', async (req, res) => {
  try {
    const {
      status,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      userId,
      userName,
      userEmail,
      remitterMobile,
      beneficiaryName,
      transferMode
    } = req.query;

    // Build filter object (same as in get transactions)
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
      }
    }

    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) {
        filter.amount.$gte = parseFloat(minAmount);
      }
      if (maxAmount) {
        filter.amount.$lte = parseFloat(maxAmount);
      }
    }

    if (transferMode) {
      filter.transferMode = transferMode;
    }

    // Build aggregation pipeline
    const pipeline = [
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $lookup: {
          from: 'dmtremitters',
          localField: 'remitter',
          foreignField: '_id',
          as: 'remitter'
        }
      },
      {
        $lookup: {
          from: 'dmtbeneficiaries',
          localField: 'beneficiary',
          foreignField: '_id',
          as: 'beneficiary'
        }
      },
      {
        $unwind: { path: '$user', preserveNullAndEmptyArrays: true }
      },
      {
        $unwind: { path: '$remitter', preserveNullAndEmptyArrays: true }
      },
      {
        $unwind: { path: '$beneficiary', preserveNullAndEmptyArrays: true }
      }
    ];

    // Add additional filters
    const additionalFilters = {};

    if (userId) {
      additionalFilters['user._id'] = new mongoose.Types.ObjectId(userId);
    }

    if (userName) {
      additionalFilters['user.name'] = { $regex: userName, $options: 'i' };
    }

    if (userEmail) {
      additionalFilters['user.email'] = { $regex: userEmail, $options: 'i' };
    }

    if (remitterMobile) {
      additionalFilters['remitter.mobile'] = { $regex: remitterMobile, $options: 'i' };
    }

    if (beneficiaryName) {
      additionalFilters['beneficiary.accountHolderName'] = { $regex: beneficiaryName, $options: 'i' };
    }

    const combinedFilter = { ...filter, ...additionalFilters };

    if (Object.keys(combinedFilter).length > 0) {
      pipeline.push({ $match: combinedFilter });
    }

    // Add sorting
    pipeline.push({ $sort: { createdAt: -1 } });

    // Limit to prevent memory issues
    pipeline.push({ $limit: 10000 });

    const transactions = await DmtTransaction.aggregate(pipeline);

    // Generate CSV
    const csvHeaders = [
      'Transaction ID',
      'Date',
      'User Name',
      'User Email',
      'Remitter Name',
      'Remitter Mobile',
      'Beneficiary Name',
      'Account Number',
      'Bank Name',
      'IFSC Code',
      'Amount',
      'Charges',
      'Total Amount',
      'Transfer Mode',
      'Status',
      'Bank Reference',
      'Purpose',
      'Created At',
      'Updated At'
    ];

    const csvRows = transactions.map(transaction => [
      transaction.transactionId || '',
      transaction.createdAt ? new Date(transaction.createdAt).toLocaleString('en-IN') : '',
      transaction.user?.name || '',
      transaction.user?.email || '',
      transaction.remitter?.name || '',
      transaction.remitter?.mobile || '',
      transaction.beneficiary?.accountHolderName || '',
      transaction.beneficiary?.accountNumber || '',
      transaction.beneficiary?.bankName || '',
      transaction.beneficiary?.ifscCode || '',
      transaction.amount || 0,
      transaction.charges || 0,
      transaction.totalAmount || 0,
      transaction.transferMode || '',
      transaction.status || '',
      transaction.bankReferenceNumber || '',
      transaction.purpose || '',
      transaction.createdAt ? new Date(transaction.createdAt).toLocaleString('en-IN') : '',
      transaction.updatedAt ? new Date(transaction.updatedAt).toLocaleString('en-IN') : ''
    ]);

    // Convert to CSV format
    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="dmt-transactions-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting DMT transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export transactions'
    });
  }
});

// Get remitter details
router.get('/remitter/:remitterId', async (req, res) => {
  try {
    const { remitterId } = req.params;

    const remitter = await DmtRemitter.findById(remitterId)
      .populate('user', 'name email mobile')
      .populate('beneficiaries');

    if (!remitter) {
      return res.status(404).json({
        success: false,
        message: 'Remitter not found'
      });
    }

    res.json({
      success: true,
      data: remitter
    });
  } catch (error) {
    console.error('Error fetching remitter details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch remitter details'
    });
  }
});

// Get all remitters with pagination
router.get('/remitters', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } }
      ];
    }

    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [remitters, total] = await Promise.all([
      DmtRemitter.find(filter)
        .populate('user', 'name email mobile')
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit)),
      DmtRemitter.countDocuments(filter)
    ]);

    const pages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: {
        remitters
      },
      pagination: {
        page: parseInt(page),
        pages,
        total,
        results: remitters.length
      }
    });
  } catch (error) {
    console.error('Error fetching remitters:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch remitters'
    });
  }
});

module.exports = router;