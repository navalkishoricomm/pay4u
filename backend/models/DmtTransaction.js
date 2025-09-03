const mongoose = require('mongoose');

const dmtTransactionSchema = new mongoose.Schema({
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
  
  // Remitter details
  remitterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DmtRemitter',
    required: true,
    index: true
  },
  remitterMobile: {
    type: String,
    required: true,
    match: /^[6-9]\d{9}$/
  },
  remitterName: {
    type: String,
    required: true,
    trim: true
  },
  
  // Beneficiary details
  beneficiaryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DmtBeneficiary',
    required: true,
    index: true
  },
  beneficiaryAccountNumber: {
    type: String,
    required: true
  },
  beneficiaryIfscCode: {
    type: String,
    required: true,
    uppercase: true
  },
  beneficiaryName: {
    type: String,
    required: true,
    trim: true
  },
  beneficiaryBankName: {
    type: String,
    required: true,
    trim: true
  },
  
  // Transaction details
  amount: {
    type: Number,
    required: true,
    min: 1,
    max: 5000 // Max transaction limit as per Paysprint
  },
  charges: {
    type: Number,
    required: true,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true // amount + charges
  },
  
  // Transfer mode and type
  transferMode: {
    type: String,
    enum: ['IMPS', 'NEFT'],
    required: true,
    default: 'IMPS'
  },
  purpose: {
    type: String,
    default: 'Money Transfer'
  },
  
  // Transaction status
  status: {
    type: String,
    enum: ['pending', 'processing', 'success', 'failed', 'hold', 'refunded'],
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
    enum: ['0', '1', '2', '3', '4', '5'], // As per Paysprint API
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
  
  // Bank reference details
  bankReferenceNumber: {
    type: String,
    sparse: true
  },
  utrNumber: {
    type: String,
    sparse: true,
    index: true
  },
  
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
    reason: {
      type: String,
      trim: true
    },
    response: {
      type: mongoose.Schema.Types.Mixed
    }
  }],
  
  // Retry and error handling
  retryCount: {
    type: Number,
    default: 0,
    max: 3
  },
  lastRetryAt: {
    type: Date,
    sparse: true
  },
  errorMessage: {
    type: String,
    trim: true
  },
  
  // Refund details
  refundStatus: {
    type: String,
    enum: ['not_applicable', 'pending', 'processed', 'failed'],
    default: 'not_applicable'
  },
  refundAmount: {
    type: Number,
    min: 0
  },
  refundDate: {
    type: Date,
    sparse: true
  },
  refundReferenceId: {
    type: String,
    sparse: true
  },
  
  // User and system tracking
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  apiProvider: {
    type: String,
    default: 'paysprint'
  },
  ipAddress: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  },
  
  // Additional metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Indexes for better performance
dmtTransactionSchema.index({ userId: 1, status: 1, createdAt: -1 });
dmtTransactionSchema.index({ remitterId: 1, createdAt: -1 });
dmtTransactionSchema.index({ beneficiaryId: 1, createdAt: -1 });
dmtTransactionSchema.index({ status: 1, createdAt: -1 });
dmtTransactionSchema.index({ paysprintTransactionId: 1 }, { sparse: true });
dmtTransactionSchema.index({ utrNumber: 1 }, { sparse: true });
dmtTransactionSchema.index({ initiatedAt: -1 });

// Virtual for transaction age
dmtTransactionSchema.virtual('ageInMinutes').get(function() {
  return Math.floor((new Date() - this.initiatedAt) / (1000 * 60));
});

// Virtual for is successful
dmtTransactionSchema.virtual('isSuccessful').get(function() {
  return this.status === 'success';
});

// Virtual for is pending
dmtTransactionSchema.virtual('isPending').get(function() {
  return ['pending', 'processing', 'hold'].includes(this.status);
});

// Methods
dmtTransactionSchema.methods.updateStatus = function(newStatus, reason = null, response = null) {
  const oldStatus = this.status;
  this.status = newStatus;
  
  // Add to status history
  this.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    reason: reason,
    response: response
  });
  
  // Update timestamps based on status
  const now = new Date();
  switch (newStatus) {
    case 'processing':
      if (!this.processedAt) this.processedAt = now;
      break;
    case 'success':
    case 'failed':
    case 'refunded':
      if (!this.processedAt) this.processedAt = now;
      this.completedAt = now;
      break;
  }
  
  return { oldStatus, newStatus };
};

dmtTransactionSchema.methods.updatePaysprintResponse = function(response) {
  this.paysprintResponse = response;
  
  if (response.txn_status !== undefined) {
    this.paysprintStatus = response.txn_status.toString();
  }
  
  if (response.response_code) {
    this.paysprintResponseCode = response.response_code.toString();
  }
  
  if (response.message) {
    this.paysprintStatusDescription = response.message;
  }
  
  if (response.utr) {
    this.utrNumber = response.utr;
  }
  
  if (response.bank_ref_num) {
    this.bankReferenceNumber = response.bank_ref_num;
  }
  
  // Map Paysprint status to our status
  const statusMapping = {
    '0': 'refunded',    // Failed and Refunded
    '1': 'success',     // Transaction Successful
    '2': 'processing',  // Transaction In Process
    '3': 'processing',  // Transaction Sent To Bank
    '4': 'hold',        // Transaction on Hold
    '5': 'failed'       // Transaction Failed
  };
  
  if (response.txn_status !== undefined && statusMapping[response.txn_status.toString()]) {
    const newStatus = statusMapping[response.txn_status.toString()];
    this.updateStatus(newStatus, 'Paysprint API response', response);
  }
};

dmtTransactionSchema.methods.canRetry = function() {
  return this.retryCount < 3 && ['failed', 'hold'].includes(this.status);
};

dmtTransactionSchema.methods.incrementRetry = function() {
  this.retryCount += 1;
  this.lastRetryAt = new Date();
};

dmtTransactionSchema.methods.markForRefund = function(amount = null) {
  this.refundStatus = 'pending';
  this.refundAmount = amount || this.totalAmount;
};

dmtTransactionSchema.methods.processRefund = function(referenceId) {
  this.refundStatus = 'processed';
  this.refundDate = new Date();
  this.refundReferenceId = referenceId;
  this.updateStatus('refunded', 'Refund processed');
};

// Static methods
dmtTransactionSchema.statics.findByUser = function(userId, limit = 50) {
  return this.find({ userId })
    .populate('remitterId', 'firstName lastName mobile')
    .populate('beneficiaryId', 'accountHolderName accountNumber bankName')
    .sort({ createdAt: -1 })
    .limit(limit);
};

dmtTransactionSchema.statics.findByRemitter = function(remitterId, limit = 50) {
  return this.find({ remitterId })
    .populate('beneficiaryId', 'accountHolderName accountNumber bankName')
    .sort({ createdAt: -1 })
    .limit(limit);
};

dmtTransactionSchema.statics.findPendingTransactions = function(olderThanMinutes = 30) {
  const cutoffTime = new Date(Date.now() - olderThanMinutes * 60 * 1000);
  return this.find({
    status: { $in: ['pending', 'processing', 'hold'] },
    initiatedAt: { $lt: cutoffTime }
  });
};

dmtTransactionSchema.statics.getTransactionStats = function(userId, startDate, endDate) {
  const matchStage = { userId };
  if (startDate && endDate) {
    matchStage.createdAt = { $gte: startDate, $lte: endDate };
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        totalCharges: { $sum: '$charges' }
      }
    }
  ]);
};

// Pre-save middleware
dmtTransactionSchema.pre('save', function(next) {
  // Ensure totalAmount is calculated
  if (this.isModified('amount') || this.isModified('charges')) {
    this.totalAmount = this.amount + this.charges;
  }
  
  // Uppercase IFSC code
  if (this.beneficiaryIfscCode) {
    this.beneficiaryIfscCode = this.beneficiaryIfscCode.toUpperCase();
  }
  
  next();
});

// Additional static methods
dmtTransactionSchema.statics.findByUser = function(userId, limit = 50) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('beneficiaryId', 'accountHolderName accountNumber bankName');
};

dmtTransactionSchema.statics.findPendingTransactions = function(minutesOld = 30) {
  const cutoffTime = new Date(Date.now() - minutesOld * 60 * 1000);
  return this.find({
    status: { $in: ['pending', 'processing'] },
    createdAt: { $lte: cutoffTime }
  }).sort({ createdAt: 1 });
};

dmtTransactionSchema.statics.getTransactionStats = async function(userId, startDate, endDate) {
  const matchQuery = {
    userId,
    createdAt: {
      $gte: startDate,
      $lte: endDate
    }
  };

  const stats = await this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalTransactions: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        totalCharges: { $sum: '$charges' },
        successfulTransactions: {
          $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
        },
        failedTransactions: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        },
        pendingTransactions: {
          $sum: { $cond: [{ $in: ['$status', ['pending', 'processing']] }, 1, 0] }
        }
      }
    }
  ]);

  return stats[0] || {
    totalTransactions: 0,
    totalAmount: 0,
    totalCharges: 0,
    successfulTransactions: 0,
    failedTransactions: 0,
    pendingTransactions: 0
  };
};

module.exports = mongoose.models.DmtTransaction || mongoose.model('DmtTransaction', dmtTransactionSchema);