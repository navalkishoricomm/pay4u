const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    // Core transaction identification
    transactionId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    referenceId: {
      type: String,
      sparse: true,
      index: true
    },
    
    // User and wallet association
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    wallet: {
      type: mongoose.Schema.ObjectId,
      ref: 'Wallet',
      required: function() {
        return ['topup', 'mobile-recharge', 'dth-recharge', 'bill-payment', 'voucher_purchase'].includes(this.type);
      }
    },
    
    // Transaction classification
    type: {
      type: String,
      required: [true, 'Transaction must have a type'],
      enum: [
        // Wallet transactions
        'topup', 'transfer', 'refund',
        // Recharge transactions
        'mobile-recharge', 'dth-recharge', 'bill-payment',
        // DMT transactions
        'dmt-transfer',
        // AEPS transactions
        'aeps-balance-inquiry', 'aeps-cash-withdrawal', 'aeps-cash-deposit', 'aeps-mini-statement',
        // Voucher transactions
        'voucher_purchase'
      ],
      index: true
    },
    subType: {
      type: String,
      // For additional classification (e.g., IMPS/NEFT for DMT, fingerprint/iris for AEPS)
      trim: true
    },
    
    // Amount details
    amount: {
      type: Number,
      required: function() {
        return !['aeps-balance-inquiry', 'aeps-mini-statement'].includes(this.type);
      },
      min: 0
    },
    charges: {
      type: Number,
      default: 0,
      min: 0
    },
    totalAmount: {
      type: Number,
      // amount + charges
      min: 0
    },
    
    // Transaction status
    status: {
      type: String,
      enum: [
        'pending', 'processing', 'success', 'completed', 'failed', 
        'cancelled', 'awaiting_approval', 'approved', 'rejected', 
        'hold', 'refunded', 'timeout'
      ],
      default: 'pending',
      index: true
    },
    
    // Approval workflow
    approvedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      default: null,
    },
    approvalDate: {
      type: Date,
      default: null,
    },
    approvalNotes: {
      type: String,
      trim: true,
      default: '',
    },
    
    // Transaction details
    description: {
      type: String,
      trim: true,
    },
    purpose: {
      type: String,
      trim: true,
      default: function() {
        if (this.type === 'dmt-transfer') return 'Money Transfer';
        return '';
      }
    },
    
    // Service provider details
    operator: {
      type: String,
      trim: true,
    },
    apiProvider: {
      type: String,
      default: 'paysprint'
    },
    
    // Commission details
    commissionAmount: {
      type: Number,
      default: 0,
      min: [0, 'Commission amount cannot be negative'],
    },
    commissionType: {
      type: String,
      enum: ['percentage', 'fixed', 'none'],
      default: 'none',
    },
    commissionRate: {
      type: Number,
      default: 0,
    },
    
    // External references
    reference: {
      type: String,
      trim: true,
    },
    apiTransactionId: {
      type: String,
      sparse: true,
      index: true
    },
    paysprintTransactionId: {
      type: String,
      sparse: true,
      index: true
    },
    bankReferenceNumber: {
      type: String,
      sparse: true
    },
    utrNumber: {
      type: String,
      sparse: true,
      index: true
    },
    rrn: {
      type: String,
      sparse: true,
      index: true
    },
    
    // Error handling
    failureReason: {
      type: String,
      trim: true,
      default: null,
    },
    errorCode: {
      type: String,
      sparse: true
    },
    errorMessage: {
      type: String,
      sparse: true
    },
    
    // API response tracking
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
      type: mongoose.Schema.Types.Mixed
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
    refundedAt: {
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
      },
      updatedBy: {
        type: String,
        trim: true
      }
    }],
    
    // Retry mechanism
    retryCount: {
      type: Number,
      default: 0,
      max: 3
    },
    lastRetryAt: {
      type: Date,
      sparse: true
    },
    
    // Refund details
    refundStatus: {
      type: String,
      enum: ['not_applicable', 'pending', 'processed', 'failed'],
      default: 'not_applicable'
    },
    refundAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    refundReferenceId: {
      type: String,
      sparse: true
    },
    
    // Audit fields
    ipAddress: {
      type: String,
      trim: true
    },
    userAgent: {
      type: String,
      trim: true
    },
    
    // Type-specific data storage
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    
    // Recharge specific fields (when type is mobile-recharge or dth-recharge)
    rechargeData: {
      mobileNumber: {
        type: String,
        validate: {
          validator: function(v) {
            return !['mobile-recharge'].includes(this.type) || /^[6-9]\d{9}$/.test(v);
          },
          message: 'Invalid mobile number format'
        }
      },
      customerNumber: {
        type: String,
        validate: {
          validator: function(v) {
            return !['dth-recharge'].includes(this.type) || (v && v.length >= 8 && v.length <= 15);
          },
          message: 'Invalid customer number format'
        }
      },
      circle: {
        type: String,
        validate: {
          validator: function(v) {
            return !['mobile-recharge'].includes(this.type) || v;
          },
          message: 'Circle is required for mobile recharge'
        }
      }
    },
    
    // DMT specific fields (when type is dmt-transfer)
    dmtData: {
      remitterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DmtRemitter'
      },
      remitterMobile: {
        type: String,
        match: /^[6-9]\d{9}$/
      },
      remitterName: {
        type: String,
        trim: true
      },
      beneficiaryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DmtBeneficiary'
      },
      beneficiaryAccountNumber: {
        type: String
      },
      beneficiaryIfscCode: {
        type: String,
        uppercase: true
      },
      beneficiaryName: {
        type: String,
        trim: true
      },
      beneficiaryBankName: {
        type: String,
        trim: true
      },
      transferMode: {
        type: String,
        enum: ['IMPS', 'NEFT']
      }
    },
    
    // AEPS specific fields (when type starts with aeps-)
    aepsData: {
      aadhaarNumber: {
        type: String,
        match: /^\d{12}$/
      },
      customerMobile: {
        type: String,
        match: /^[6-9]\d{9}$/
      },
      customerName: {
        type: String,
        trim: true
      },
      bankIin: {
        type: String,
        match: /^\d{6}$/
      },
      bankName: {
        type: String,
        trim: true
      },
      biometricType: {
        type: String,
        enum: ['fingerprint', 'iris', 'face_auth']
      },
      pidData: {
        type: String // Encrypted biometric data
      },
      wadh: {
        type: String // Aadhaar hash
      },
      merchantId: {
        type: String
      },
      terminalId: {
        type: String
      },
      balanceAmount: {
        type: Number // For balance inquiry results
      },
      miniStatement: [{
        date: String,
        txnType: String,
        amount: Number,
        narration: String,
        balance: Number
      }]
    }
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
transactionSchema.index({ userId: 1, type: 1, createdAt: -1 });
transactionSchema.index({ status: 1, createdAt: -1 });
transactionSchema.index({ type: 1, status: 1 });
transactionSchema.index({ 'dmtData.remitterId': 1, createdAt: -1 });
transactionSchema.index({ 'dmtData.beneficiaryId': 1, createdAt: -1 });
transactionSchema.index({ 'aepsData.aadhaarNumber': 1, createdAt: -1 });
transactionSchema.index({ 'rechargeData.mobileNumber': 1, createdAt: -1 });
transactionSchema.index({ initiatedAt: -1 });

// Virtual for transaction age
transactionSchema.virtual('transactionAge').get(function() {
  return Date.now() - this.initiatedAt;
});

// Virtual for getting the customer number (mobile/customer/aadhaar based on type)
transactionSchema.virtual('customerNumber').get(function() {
  if (this.type === 'mobile-recharge') {
    return this.rechargeData?.mobileNumber;
  } else if (this.type === 'dth-recharge') {
    return this.rechargeData?.customerNumber;
  } else if (this.type === 'dmt-transfer') {
    return this.dmtData?.remitterMobile;
  } else if (this.type?.startsWith('aeps-')) {
    return this.aepsData?.aadhaarNumber;
  }
  return null;
});

// Method to check if transaction can be refunded
transactionSchema.methods.canRefund = function() {
  return ['failed', 'cancelled'].includes(this.status) && this.refundAmount === 0;
};

// Method to process refund
transactionSchema.methods.processRefund = async function() {
  if (!this.canRefund()) {
    throw new Error('Transaction cannot be refunded');
  }
  
  this.status = 'refunded';
  this.refundStatus = 'processed';
  this.refundAmount = this.amount || 0;
  this.refundedAt = new Date();
  
  // Add to status history
  this.statusHistory.push({
    status: 'refunded',
    timestamp: new Date(),
    reason: 'Refund processed',
    updatedBy: 'system'
  });
  
  return this.save();
};

// Method to check if transaction is expired (30 minutes timeout)
transactionSchema.methods.isExpired = function() {
  const thirtyMinutes = 30 * 60 * 1000;
  return this.status === 'pending' && (Date.now() - this.initiatedAt) > thirtyMinutes;
};

// Method to update status with history tracking
transactionSchema.methods.updateStatus = function(newStatus, reason = '', response = null, updatedBy = 'system') {
  const oldStatus = this.status;
  this.status = newStatus;
  
  // Update relevant timestamps
  if (newStatus === 'processing') {
    this.processedAt = new Date();
  } else if (['success', 'completed', 'failed', 'cancelled'].includes(newStatus)) {
    this.completedAt = new Date();
  }
  
  // Add to status history
  this.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    reason: reason || `Status changed from ${oldStatus} to ${newStatus}`,
    response,
    updatedBy
  });
  
  return this;
};

// Static method to get transaction statistics
transactionSchema.statics.getStats = async function(userId, startDate, endDate, type = null) {
  const matchStage = { userId: mongoose.Types.ObjectId(userId) };
  
  if (type) {
    matchStage.type = type;
  }
  
  if (startDate && endDate) {
    matchStage.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
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

// Pre-save middleware to validate data based on type
transactionSchema.pre('save', function(next) {
  // Calculate total amount if not set
  if (this.amount && this.charges && !this.totalAmount) {
    this.totalAmount = this.amount + this.charges;
  }
  
  // Validate type-specific required fields
  if (this.type === 'mobile-recharge' && !this.rechargeData?.mobileNumber) {
    return next(new Error('Mobile number is required for mobile recharge'));
  }
  
  if (this.type === 'dth-recharge' && !this.rechargeData?.customerNumber) {
    return next(new Error('Customer number is required for DTH recharge'));
  }
  
  if (this.type === 'dmt-transfer') {
    if (!this.dmtData?.remitterId || !this.dmtData?.beneficiaryId) {
      return next(new Error('Remitter and beneficiary are required for DMT transfer'));
    }
  }
  
  if (this.type?.startsWith('aeps-')) {
    if (!this.aepsData?.aadhaarNumber || !this.aepsData?.bankIin) {
      return next(new Error('Aadhaar number and bank IIN are required for AEPS transactions'));
    }
  }
  
  next();
});

// Middleware to populate related data when finding transactions
transactionSchema.pre(/^find/, function(next) {
  // Populate wallet for wallet-based transactions
  if (this.getQuery().type && ['topup', 'mobile-recharge', 'dth-recharge', 'bill-payment', 'voucher_purchase'].includes(this.getQuery().type)) {
    this.populate({
      path: 'wallet',
      select: 'user balance',
    });
  }
  
  // Populate user
  this.populate({
    path: 'userId',
    select: 'name email mobile',
  });
  
  // Populate DMT related data
  this.populate({
    path: 'dmtData.remitterId',
    select: 'firstName lastName mobile',
  });
  
  this.populate({
    path: 'dmtData.beneficiaryId',
    select: 'accountHolderName accountNumber bankName ifscCode',
  });
  
  next();
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;