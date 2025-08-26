const mongoose = require('mongoose');

const commissionSchema = new mongoose.Schema(
  {
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
    isActive: {
      type: Boolean,
      default: true,
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

// Compound index to ensure unique commission structure per operator and transaction type
commissionSchema.index({ operator: 1, transactionType: 1 }, { unique: true });

// Method to calculate commission amount
commissionSchema.methods.calculateCommission = function(transactionAmount) {
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

// Static method to get commission for specific operator and transaction type
commissionSchema.statics.getCommissionRate = async function(operator, transactionType) {
  const commission = await this.findOne({
    operator: operator,
    transactionType: transactionType,
    isActive: true
  });
  
  return commission;
};

// Static method to calculate commission amount with user priority
commissionSchema.statics.calculateCommissionAmount = async function(operator, transactionType, amount, userId = null) {
  // If userId is provided, check user-specific commissions first
  if (userId) {
    const UserCommission = mongoose.model('UserCommission');
    return await UserCommission.calculateUserCommissionAmount(userId, operator, transactionType, amount);
  }
  
  // Fall back to global commission structure
  const commission = await this.getCommissionRate(operator, transactionType);
  
  if (!commission) {
    return 0; // No commission structure found
  }
  
  return commission.calculateCommission(amount);
};

// Static method to get commission hierarchy for user
commissionSchema.statics.getCommissionHierarchy = async function(userId, operator, transactionType) {
  const UserCommission = mongoose.model('UserCommission');
  const CommissionScheme = mongoose.model('CommissionScheme');
  
  const result = {
    userSpecific: null,
    defaultScheme: null,
    global: null,
    activeCommission: null
  };
  
  // Check user-specific commission
  if (userId) {
    result.userSpecific = await UserCommission.getUserCommissionRate(userId, operator, transactionType);
    if (result.userSpecific) {
      result.activeCommission = result.userSpecific;
      return result;
    }
  }
  
  // Check default scheme
  const defaultScheme = await CommissionScheme.getDefaultScheme();
  if (defaultScheme) {
    const schemeCommission = defaultScheme.commissions.find(
      c => c.operator === operator && c.transactionType === transactionType
    );
    if (schemeCommission) {
      result.defaultScheme = schemeCommission;
      result.activeCommission = schemeCommission;
      return result;
    }
  }
  
  // Check global commission
  result.global = await this.getCommissionRate(operator, transactionType);
  if (result.global) {
    result.activeCommission = result.global;
  }
  
  return result;
};

const Commission = mongoose.model('Commission', commissionSchema);

module.exports = Commission;