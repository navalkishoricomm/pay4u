const express = require('express');
const router = express.Router();
const TransactionAudit = require('../models/TransactionAudit');
const { protect } = require('../controllers/authController');
const adminAuth = require('../middleware/adminAuth');

// Middleware to ensure only admins can access audit data
const requireAdmin = [protect, adminAuth];

// Get all transaction audits with pagination and filters
router.get('/transactions', requireAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      transactionType,
      transactionStatus,
      userId,
      userMobile,
      ipAddress,
      deviceFingerprint,
      minAmount,
      maxAmount,
      minRiskScore,
      maxRiskScore,
      startDate,
      endDate,
      country,
      city,
      hasVpn,
      hasProxy,
      hasTor,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (transactionType) filter.transactionType = transactionType;
    if (transactionStatus) filter.transactionStatus = transactionStatus;
    if (userId) filter.userId = userId;
    if (userMobile) filter.userMobile = new RegExp(userMobile, 'i');
    if (ipAddress) filter.ipAddress = ipAddress;
    if (deviceFingerprint) filter.deviceFingerprint = deviceFingerprint;
    if (country) filter['location.address.country'] = country;
    if (city) filter['location.address.city'] = new RegExp(city, 'i');
    
    // Amount range filter
    if (minAmount || maxAmount) {
      filter.transactionAmount = {};
      if (minAmount) filter.transactionAmount.$gte = parseFloat(minAmount);
      if (maxAmount) filter.transactionAmount.$lte = parseFloat(maxAmount);
    }
    
    // Risk score filter
    if (minRiskScore || maxRiskScore) {
      filter['securityFlags.riskScore'] = {};
      if (minRiskScore) filter['securityFlags.riskScore'].$gte = parseInt(minRiskScore);
      if (maxRiskScore) filter['securityFlags.riskScore'].$lte = parseInt(maxRiskScore);
    }
    
    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    
    // Security flags filter
    if (hasVpn === 'true') filter['securityFlags.isVpnDetected'] = true;
    if (hasVpn === 'false') filter['securityFlags.isVpnDetected'] = false;
    if (hasProxy === 'true') filter['securityFlags.isProxyDetected'] = true;
    if (hasProxy === 'false') filter['securityFlags.isProxyDetected'] = false;
    if (hasTor === 'true') filter['securityFlags.isTorDetected'] = true;
    if (hasTor === 'false') filter['securityFlags.isTorDetected'] = false;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const [transactions, totalCount] = await Promise.all([
      TransactionAudit.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('userId', 'name email phone')
        .lean(),
      TransactionAudit.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
          hasNext: skip + parseInt(limit) < totalCount,
          hasPrev: parseInt(page) > 1
        },
        filters: {
          transactionType,
          transactionStatus,
          userId,
          userMobile,
          ipAddress,
          deviceFingerprint,
          minAmount,
          maxAmount,
          minRiskScore,
          maxRiskScore,
          startDate,
          endDate,
          country,
          city,
          hasVpn,
          hasProxy,
          hasTor
        }
      }
    });
  } catch (error) {
    console.error('Error fetching transaction audits:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching transaction audit data',
      error: error.message
    });
  }
});

// Get transaction audit by ID
router.get('/transactions/:id', requireAdmin, async (req, res) => {
  try {
    const transaction = await TransactionAudit.findById(req.params.id)
      .populate('userId', 'name email phone')
      .lean();

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction audit not found'
      });
    }

    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Error fetching transaction audit:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching transaction audit',
      error: error.message
    });
  }
});

// Get high-risk transactions
router.get('/high-risk', requireAdmin, async (req, res) => {
  try {
    const { riskThreshold = 70, limit = 100 } = req.query;
    
    const transactions = await TransactionAudit.getHighRiskTransactions(parseInt(riskThreshold))
      .limit(parseInt(limit))
      .populate('userId', 'name email mobile')
      .lean();

    res.json({
      success: true,
      data: transactions
    });
  } catch (error) {
    console.error('Error fetching high-risk transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching high-risk transactions',
      error: error.message
    });
  }
});

// Get transactions by IP address
router.get('/by-ip/:ipAddress', requireAdmin, async (req, res) => {
  try {
    const { ipAddress } = req.params;
    const { days = 30 } = req.query;
    
    const transactions = await TransactionAudit.getTransactionsByIP(ipAddress, parseInt(days))
      .populate('userId', 'name email mobile')
      .lean();

    res.json({
      success: true,
      data: {
        ipAddress,
        days: parseInt(days),
        transactions
      }
    });
  } catch (error) {
    console.error('Error fetching transactions by IP:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching transactions by IP',
      error: error.message
    });
  }
});

// Get transactions by device fingerprint
router.get('/by-device/:deviceFingerprint', requireAdmin, async (req, res) => {
  try {
    const { deviceFingerprint } = req.params;
    const { days = 30 } = req.query;
    
    const transactions = await TransactionAudit.getTransactionsByDevice(deviceFingerprint, parseInt(days))
      .populate('userId', 'name email mobile')
      .lean();

    res.json({
      success: true,
      data: {
        deviceFingerprint,
        days: parseInt(days),
        transactions
      }
    });
  } catch (error) {
    console.error('Error fetching transactions by device:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching transactions by device',
      error: error.message
    });
  }
});

// Get fraud analytics
router.get('/analytics/fraud', requireAdmin, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const analytics = await TransactionAudit.getFraudAnalytics(parseInt(days));

    res.json({
      success: true,
      data: {
        period: `${days} days`,
        analytics: analytics[0] || {
          totalTransactions: 0,
          highRiskTransactions: 0,
          vpnTransactions: 0,
          proxyTransactions: 0,
          averageRiskScore: 0,
          totalAmount: 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching fraud analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching fraud analytics',
      error: error.message
    });
  }
});

// Get transaction statistics
router.get('/analytics/stats', requireAdmin, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const stats = await TransactionAudit.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalAmount: { $sum: '$transactionAmount' },
          avgAmount: { $avg: '$transactionAmount' },
          avgRiskScore: { $avg: '$securityFlags.riskScore' },
          uniqueUsers: { $addToSet: '$userId' },
          uniqueIPs: { $addToSet: '$ipAddress' },
          uniqueDevices: { $addToSet: '$deviceFingerprint' },
          transactionsByType: {
            $push: '$transactionType'
          },
          transactionsByStatus: {
            $push: '$transactionStatus'
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalTransactions: 1,
          totalAmount: 1,
          avgAmount: { $round: ['$avgAmount', 2] },
          avgRiskScore: { $round: ['$avgRiskScore', 2] },
          uniqueUsers: { $size: '$uniqueUsers' },
          uniqueIPs: { $size: '$uniqueIPs' },
          uniqueDevices: { $size: '$uniqueDevices' },
          transactionsByType: 1,
          transactionsByStatus: 1
        }
      }
    ]);

    // Process transaction type and status counts
    const result = stats[0] || {};
    if (result.transactionsByType) {
      const typeCounts = {};
      result.transactionsByType.forEach(type => {
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      });
      result.transactionsByType = typeCounts;
    }

    if (result.transactionsByStatus) {
      const statusCounts = {};
      result.transactionsByStatus.forEach(status => {
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      result.transactionsByStatus = statusCounts;
    }

    res.json({
      success: true,
      data: {
        period: `${days} days`,
        stats: result
      }
    });
  } catch (error) {
    console.error('Error fetching transaction statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching transaction statistics',
      error: error.message
    });
  }
});

// Get location-based analytics
router.get('/analytics/location', requireAdmin, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const locationStats = await TransactionAudit.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            country: '$location.address.country',
            state: '$location.address.state',
            city: '$location.address.city'
          },
          transactionCount: { $sum: 1 },
          totalAmount: { $sum: '$transactionAmount' },
          avgRiskScore: { $avg: '$securityFlags.riskScore' },
          uniqueUsers: { $addToSet: '$userId' },
          uniqueIPs: { $addToSet: '$ipAddress' }
        }
      },
      {
        $project: {
          _id: 0,
          location: '$_id',
          transactionCount: 1,
          totalAmount: 1,
          avgRiskScore: { $round: ['$avgRiskScore', 2] },
          uniqueUsers: { $size: '$uniqueUsers' },
          uniqueIPs: { $size: '$uniqueIPs' }
        }
      },
      { $sort: { transactionCount: -1 } },
      { $limit: 50 }
    ]);

    res.json({
      success: true,
      data: {
        period: `${days} days`,
        locationStats
      }
    });
  } catch (error) {
    console.error('Error fetching location analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching location analytics',
      error: error.message
    });
  }
});

// Export transaction audit data (CSV format)
router.get('/export/csv', requireAdmin, async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      transactionType,
      minRiskScore = 0
    } = req.query;

    const filter = {
      'securityFlags.riskScore': { $gte: parseInt(minRiskScore) }
    };
    
    if (transactionType) filter.transactionType = transactionType;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const transactions = await TransactionAudit.find(filter)
      .populate('userId', 'name email mobile')
      .sort({ createdAt: -1 })
      .limit(10000) // Limit for performance
      .lean();

    // Convert to CSV format
    const csvHeaders = [
      'Transaction ID',
      'Type',
      'Reference',
      'User Mobile',
      'Amount',
      'Status',
      'IP Address',
      'Device Fingerprint',
      'Location',
      'Risk Score',
      'VPN Detected',
      'Proxy Detected',
      'Fraud Flags',
      'Created At'
    ];

    const csvRows = transactions.map(tx => [
      tx.transactionId,
      tx.transactionType,
      tx.transactionReference,
      tx.userMobile,
      tx.transactionAmount,
      tx.transactionStatus,
      tx.ipAddress,
      tx.deviceFingerprint || 'N/A',
      `${tx.location?.address?.city || 'N/A'}, ${tx.location?.address?.country || 'N/A'}`,
      tx.securityFlags?.riskScore || 0,
      tx.securityFlags?.isVpnDetected ? 'Yes' : 'No',
      tx.securityFlags?.isProxyDetected ? 'Yes' : 'No',
      tx.securityFlags?.fraudFlags?.join(', ') || 'None',
      tx.createdAt.toISOString()
    ]);

    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="transaction-audit-${Date.now()}.csv"`);
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting transaction audit data:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting transaction audit data',
      error: error.message
    });
  }
});

module.exports = router;