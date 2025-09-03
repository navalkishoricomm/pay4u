const mongoose = require('mongoose');

const transactionAuditSchema = new mongoose.Schema({
  // Transaction Reference
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  transactionType: {
    type: String,
    required: true,
    enum: ['DMT', 'AEPS', 'RECHARGE', 'VOUCHER', 'WALLET'],
    index: true
  },
  transactionReference: {
    type: String,
    required: true,
    index: true
  },
  
  // User Information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  userMobile: {
    type: String,
    required: true,
    index: true
  },
  
  // Network & Device Information
  ipAddress: {
    type: String,
    required: true,
    index: true
  },
  userAgent: {
    type: String,
    required: true
  },
  deviceFingerprint: {
    type: String,
    index: true
  },
  macAddress: {
    type: String,
    index: true
  },
  
  // Location Information
  location: {
    latitude: {
      type: Number,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180
    },
    accuracy: Number,
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      postalCode: String
    },
    timezone: String
  },
  
  // Browser & System Information
  browserInfo: {
    name: String,
    version: String,
    platform: String,
    language: String,
    cookieEnabled: Boolean,
    javaEnabled: Boolean,
    screenResolution: String,
    colorDepth: Number,
    timezone: String
  },
  
  // Security Flags
  securityFlags: {
    isVpnDetected: {
      type: Boolean,
      default: false
    },
    isProxyDetected: {
      type: Boolean,
      default: false
    },
    isTorDetected: {
      type: Boolean,
      default: false
    },
    riskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    fraudFlags: [String]
  },
  
  // Transaction Details
  transactionAmount: {
    type: Number,
    required: true
  },
  transactionStatus: {
    type: String,
    required: true,
    enum: ['SUCCESS', 'FAILED', 'PENDING', 'CANCELLED']
  },
  
  // Session Information
  sessionId: String,
  sessionDuration: Number, // in seconds
  
  // API Information
  apiEndpoint: {
    type: String,
    required: true
  },
  requestMethod: {
    type: String,
    required: true,
    enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
  },
  responseTime: Number, // in milliseconds
  
  // Additional Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'transactionaudits'
});

// Indexes for efficient querying
transactionAuditSchema.index({ userId: 1, createdAt: -1 });
transactionAuditSchema.index({ ipAddress: 1, createdAt: -1 });
transactionAuditSchema.index({ transactionType: 1, transactionStatus: 1 });
transactionAuditSchema.index({ 'securityFlags.riskScore': -1 });
transactionAuditSchema.index({ userMobile: 1, createdAt: -1 });
transactionAuditSchema.index({ deviceFingerprint: 1, createdAt: -1 });

// Static methods for analytics
transactionAuditSchema.statics.getHighRiskTransactions = function(riskThreshold = 70) {
  return this.find({
    'securityFlags.riskScore': { $gte: riskThreshold }
  }).sort({ createdAt: -1 });
};

transactionAuditSchema.statics.getTransactionsByIP = function(ipAddress, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.find({
    ipAddress: ipAddress,
    createdAt: { $gte: startDate }
  }).sort({ createdAt: -1 });
};

transactionAuditSchema.statics.getTransactionsByDevice = function(deviceFingerprint, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.find({
    deviceFingerprint: deviceFingerprint,
    createdAt: { $gte: startDate }
  }).sort({ createdAt: -1 });
};

transactionAuditSchema.statics.getFraudAnalytics = function(days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: null,
        totalTransactions: { $sum: 1 },
        highRiskTransactions: {
          $sum: {
            $cond: [{ $gte: ['$securityFlags.riskScore', 70] }, 1, 0]
          }
        },
        vpnTransactions: {
          $sum: {
            $cond: ['$securityFlags.isVpnDetected', 1, 0]
          }
        },
        proxyTransactions: {
          $sum: {
            $cond: ['$securityFlags.isProxyDetected', 1, 0]
          }
        },
        averageRiskScore: { $avg: '$securityFlags.riskScore' },
        totalAmount: { $sum: '$transactionAmount' }
      }
    }
  ]);
};

module.exports = mongoose.model('TransactionAudit', transactionAuditSchema);