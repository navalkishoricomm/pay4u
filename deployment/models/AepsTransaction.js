const mongoose = require('mongoose');

const aepsTransactionSchema = new mongoose.Schema({
  // Transaction identification
  transactionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  referenceId: {
    type: String,
    required: true,
    unique: true,
    maxlength: 20, // As per Paysprint requirement
    index: true
  },
  
  // User details
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Customer/Aadhaar holder details
  aadhaarNumber: {
    type: String,
    required: true,
    match: /^\d{12}$/,
    index: true
  },
  customerMobile: {
    type: String,
    required: true,
    match: /^[6-9]\d{9}$/
  },
  customerName: {
    type: String,
    trim: true
  },
  
  // Transaction details
  transactionType: {
    type: String,
    enum: ['balance_inquiry', 'cash_withdrawal', 'cash_deposit', 'mini_statement'],
    required: true,
    index: true
  },
  amount: {
    type: Number,
    min: 0,
    max: 10000, // Max AEPS transaction limit
    required: function() {
      return ['cash_withdrawal', 'cash_deposit'].includes(this.transactionType);
    }
  },
  charges: {
    type: Number,
    min: 0,
    default: 0
  },
  totalAmount: {
    type: Number,
    min: 0 // amount + charges
  },
  
  // Bank details
  bankIin: {
    type: String,
    required: true,
    match: /^\d{6}$/
  },
  bankName: {
    type: String,
    required: true,
    trim: true
  },
  
  // Biometric authentication details
  biometricType: {
    type: String,
    enum: ['fingerprint', 'iris', 'face_auth'],
    required: true
  },
  pidData: {
    type: String,
    required: true // Encrypted biometric data
  },
  wadh: {
    type: String // Aadhaar hash (optional)
  },
  
  // Merchant/Terminal details
  merchantId: {
    type: String,
    required: true
  },
  terminalId: {
    type: String,
    required: true
  },
  
  // Transaction status
  status: {
    type: String,
    enum: ['pending', 'processing', 'success', 'failed', 'timeout'],
    default: 'pending',
    index: true
  },
  
  // Paysprint specific fields
  paysprintTransactionId: {
    type: String,
    sparse: true,
    index: true
  },
  paysprintStatus: {
    type: String,
    sparse: true
  },
  paysprintStatusDescription: {
    type: String,
    trim: true
  },
  paysprintResponseCode: {
    type: String,
    sparse: true
  },
  paysprintResponse: {
    type: mongoose.Schema.Types.Mixed // Store full API response
  },
  
  // AEPS specific response data
  balanceAmount: {
    type: Number,
    sparse: true // For balance inquiry transactions
  },
  bankReferenceNumber: {
    type: String,
    sparse: true
  },
  rrn: {
    type: String,
    sparse: true,
    index: true // Retrieval Reference Number
  },
  
  // Mini statement data (for mini_statement transactions)
  miniStatement: [{
    date: String,
    txnType: String,
    amount: Number,
    narration: String,
    balance: Number
  }],
  
  // Timestamps
  initiatedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  processedAt: {
    type: Date,
    sparse: true
  },
  completedAt: {
    type: Date,
    sparse: true
  },
  
  // Status tracking
  statusHistory: [{
    status: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    reason: String,
    updatedBy: String
  }],
  
  // Error handling
  errorCode: {
    type: String,
    sparse: true
  },
  errorMessage: {
    type: String,
    sparse: true
  },
  
  // Audit fields
  ipAddress: {
    type: String,
    sparse: true
  },
  userAgent: {
    type: String,
    sparse: true
  },
  
  // Additional metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  collection: 'aeps_transactions'
});

// Indexes for better query performance
aepsTransactionSchema.index({ userId: 1, createdAt: -1 });
aepsTransactionSchema.index({ aadhaarNumber: 1, createdAt: -1 });
aepsTransactionSchema.index({ transactionType: 1, status: 1 });
aepsTransactionSchema.index({ paysprintTransactionId: 1 }, { sparse: true });
aepsTransactionSchema.index({ rrn: 1 }, { sparse: true });
aepsTransactionSchema.index({ createdAt: -1 });

// Virtual for transaction age
aepsTransactionSchema.virtual('transactionAge').get(function() {
  return Date.now() - this.initiatedAt;
});

// Method to check if transaction is expired (30 minutes timeout)
aepsTransactionSchema.methods.isExpired = function() {
  const TIMEOUT_MINUTES = 30;
  const timeoutMs = TIMEOUT_MINUTES * 60 * 1000;
  return (Date.now() - this.initiatedAt) > timeoutMs;
};

// Method to update status with history tracking
aepsTransactionSchema.methods.updateStatus = function(newStatus, reason = '', updatedBy = 'system') {
  this.statusHistory.push({
    status: this.status,
    timestamp: new Date(),
    reason: reason,
    updatedBy: updatedBy
  });
  
  this.status = newStatus;
  
  if (newStatus === 'processing') {
    this.processedAt = new Date();
  } else if (['success', 'failed', 'timeout'].includes(newStatus)) {
    this.completedAt = new Date();
  }
  
  return this.save();
};

// Method to get transaction summary
aepsTransactionSchema.methods.getSummary = function() {
  return {
    transactionId: this.transactionId,
    transactionType: this.transactionType,
    amount: this.amount,
    status: this.status,
    aadhaarNumber: this.aadhaarNumber.replace(/\d(?=\d{4})/g, 'X'), // Mask Aadhaar
    bankName: this.bankName,
    initiatedAt: this.initiatedAt,
    completedAt: this.completedAt
  };
};

// Static method to get transaction statistics
aepsTransactionSchema.statics.getStats = async function(userId, startDate, endDate) {
  const matchStage = {
    userId: new mongoose.Types.ObjectId(userId),
    initiatedAt: {
      $gte: startDate,
      $lte: endDate
    }
  };
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$transactionType',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        successCount: {
          $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
        },
        failedCount: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        }
      }
    }
  ]);
};

// Pre-save middleware
aepsTransactionSchema.pre('save', function(next) {
  // Calculate total amount if not set
  if (this.amount && this.charges !== undefined && !this.totalAmount) {
    this.totalAmount = this.amount + this.charges;
  }
  
  // Add initial status to history if new document
  if (this.isNew && this.statusHistory.length === 0) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      reason: 'Transaction initiated',
      updatedBy: 'system'
    });
  }
  
  next();
});

module.exports = mongoose.model('AepsTransaction', aepsTransactionSchema);