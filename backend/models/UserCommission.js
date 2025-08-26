const mongoose = require('mongoose');

const userCommissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    operator: {
      type: String,
      required: [true, 'Operator name is required'],
      trim: true,
    },
    transactionType: {
      type: String,
      required: [true, 'Transaction type is required'],
      enum: ['mobile-recharge', 'dth-recharge', 'bill-payment'],
    },
    commissionType: {
      type: String,
      required: [true, 'Commission type is required'],
      enum: ['percentage', 'fixed'],
      default: 'percentage',
    },
    commissionValue: {
      type: Number,
      required: [true, 'Commission value is required'],
      min: [0, 'Commission value cannot be negative'],
    },
    minCommission: {
      type: Number,
      default: 0,
      min: [0, 'Minimum commission cannot be negative'],
    },
    maxCommission: {
      type: Number,
      default: null,
      min: [0, 'Maximum commission cannot be negative'],
    },
    schemeId: {
      type: mongoose.Schema.ObjectId,
      ref: 'CommissionScheme',
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isCustom: {
      type: Boolean,
      default: false, // true if manually set, false if from scheme
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Commission must be created by an admin'],
    },
    updatedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure unique commission structure per user, operator and transaction type
userCommissionSchema.index({ userId: 1, operator: 1, transactionType: 1 }, { unique: true });

// Method to calculate commission amount
userCommissionSchema.methods.calculateCommission = function(transactionAmount) {
  let commission = 0;
  
  if (this.commissionType === 'percentage') {
    commission = (transactionAmount * this.commissionValue) / 100;
  } else if (this.commissionType === 'fixed') {
    commission = this.commissionValue;
  }
  
  // Apply minimum commission
  if (this.minCommission && commission < this.minCommission) {
    commission = this.minCommission;
  }
  
  // Apply maximum commission
  if (this.maxCommission && commission > this.maxCommission) {
    commission = this.maxCommission;
  }
  
  return Math.round(commission * 100) / 100; // Round to 2 decimal places
};

// Static method to get user-specific commission rate
userCommissionSchema.statics.getUserCommissionRate = async function(userId, operator, transactionType) {
  const commission = await this.findOne({
    userId: userId,
    operator: operator,
    transactionType: transactionType,
    isActive: true
  });
  
  return commission;
};

// Static method to calculate commission amount for a user
userCommissionSchema.statics.calculateUserCommissionAmount = async function(userId, operator, transactionType, amount) {
  const Commission = mongoose.model('Commission');
  const CommissionScheme = mongoose.model('CommissionScheme');
  
  // First, check for user-specific commission
  let commission = await this.getUserCommissionRate(userId, operator, transactionType);
  
  if (commission) {
    return commission.calculateCommission(amount);
  }
  
  // If no user-specific commission, check default scheme
  const defaultScheme = await CommissionScheme.getDefaultScheme();
  if (defaultScheme) {
    return defaultScheme.calculateCommission(operator, transactionType, amount);
  }
  
  // Finally, fall back to global commission structure
  const globalCommission = await Commission.getCommissionRate(operator, transactionType);
  if (globalCommission) {
    return globalCommission.calculateCommission(amount);
  }
  
  return 0; // No commission structure found
};

// Static method to get all commissions for a user
userCommissionSchema.statics.getUserCommissions = async function(userId) {
  return await this.find({ userId: userId, isActive: true })
    .populate('schemeId', 'schemeName')
    .sort({ operator: 1, transactionType: 1 });
};

const UserCommission = mongoose.model('UserCommission', userCommissionSchema);

module.exports = UserCommission;