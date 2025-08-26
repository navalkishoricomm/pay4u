const mongoose = require('mongoose');

const rechargeTransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['mobile', 'dth'],
    required: true
  },
  // For mobile recharge
  mobileNumber: {
    type: String,
    validate: {
      validator: function(v) {
        return this.type !== 'mobile' || /^[6-9]\d{9}$/.test(v);
      },
      message: 'Invalid mobile number format'
    }
  },
  // For DTH recharge
  customerNumber: {
    type: String,
    validate: {
      validator: function(v) {
        return this.type !== 'dth' || (v && v.length >= 8 && v.length <= 15);
      },
      message: 'Invalid customer number format'
    }
  },
  operator: {
    type: String,
    required: true,
    enum: [
      // Mobile operators
      'JIO', 'AIRTEL', 'VI', 'BSNL', 'AIRTEL_POST', 'JIO_POST', 'VI_POST',
      // DTH operators
      'TATA_SKY', 'AIRTEL_DTH', 'DISH_TV', 'VIDEOCON', 'SUN_DIRECT'
    ]
  },
  amount: {
    type: Number,
    required: true,
    min: [1, 'Amount must be at least ₹1'],
    max: [10000, 'Amount cannot exceed ₹10,000']
  },
  circle: {
    type: String,
    validate: {
      validator: function(v) {
        return this.type !== 'mobile' || v;
      },
      message: 'Circle is required for mobile recharge'
    }
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed', 'refunded'],
    default: 'pending'
  },
  apiTransactionId: {
    type: String,
    sparse: true
  },
  failureReason: {
    type: String
  },
  refundAmount: {
    type: Number,
    default: 0
  },
  completedAt: {
    type: Date
  },
  refundedAt: {
    type: Date
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for better query performance
rechargeTransactionSchema.index({ userId: 1, createdAt: -1 });
rechargeTransactionSchema.index({ transactionId: 1 });
rechargeTransactionSchema.index({ status: 1 });
rechargeTransactionSchema.index({ type: 1 });

// Virtual for getting the number (mobile or customer)
rechargeTransactionSchema.virtual('number').get(function() {
  return this.type === 'mobile' ? this.mobileNumber : this.customerNumber;
});

// Method to check if transaction can be refunded
rechargeTransactionSchema.methods.canRefund = function() {
  return this.status === 'failed' && this.refundAmount === 0;
};

// Method to process refund
rechargeTransactionSchema.methods.processRefund = async function() {
  if (!this.canRefund()) {
    throw new Error('Transaction cannot be refunded');
  }
  
  this.status = 'refunded';
  this.refundAmount = this.amount;
  this.refundedAt = new Date();
  
  return this.save();
};

// Static method to get transaction statistics
rechargeTransactionSchema.statics.getStats = async function(userId, startDate, endDate) {
  const matchStage = { userId: mongoose.Types.ObjectId(userId) };
  
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
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);
};

// Pre-save middleware to validate data based on type
rechargeTransactionSchema.pre('save', function(next) {
  if (this.type === 'mobile' && !this.mobileNumber) {
    return next(new Error('Mobile number is required for mobile recharge'));
  }
  
  if (this.type === 'dth' && !this.customerNumber) {
    return next(new Error('Customer number is required for DTH recharge'));
  }
  
  next();
});

module.exports = mongoose.model('RechargeTransaction', rechargeTransactionSchema);