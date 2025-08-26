const mongoose = require('mongoose');

const commissionSchemeSchema = new mongoose.Schema(
  {
    schemeName: {
      type: String,
      required: [true, 'Scheme name is required'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    commissions: [
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
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Scheme must be created by an admin'],
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

// Ensure only one default scheme exists
commissionSchemeSchema.pre('save', async function(next) {
  if (this.isDefault && this.isModified('isDefault')) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

// Method to calculate commission for a specific operator and transaction type
commissionSchemeSchema.methods.calculateCommission = function(operator, transactionType, transactionAmount) {
  const commissionRule = this.commissions.find(
    (c) => c.operator === operator && c.transactionType === transactionType
  );
  
  if (!commissionRule) {
    return 0;
  }
  
  let commission = 0;
  
  if (commissionRule.commissionType === 'percentage') {
    commission = (transactionAmount * commissionRule.commissionValue) / 100;
  } else if (commissionRule.commissionType === 'fixed') {
    commission = commissionRule.commissionValue;
  }
  
  // Apply minimum commission
  if (commissionRule.minCommission && commission < commissionRule.minCommission) {
    commission = commissionRule.minCommission;
  }
  
  // Apply maximum commission
  if (commissionRule.maxCommission && commission > commissionRule.maxCommission) {
    commission = commissionRule.maxCommission;
  }
  
  return Math.round(commission * 100) / 100; // Round to 2 decimal places
};

// Static method to get default scheme
commissionSchemeSchema.statics.getDefaultScheme = async function() {
  return await this.findOne({ isDefault: true, isActive: true });
};

// Static method to apply scheme to user
commissionSchemeSchema.statics.applySchemeToUser = async function(schemeId, userId) {
  const User = mongoose.model('User');
  const UserCommission = mongoose.model('UserCommission');
  
  const scheme = await this.findById(schemeId);
  if (!scheme) {
    throw new Error('Commission scheme not found');
  }
  
  // Remove existing user commissions
  await UserCommission.deleteMany({ userId });
  
  // Create new user commissions based on scheme
  const userCommissions = scheme.commissions.map(commission => ({
    userId,
    operator: commission.operator,
    transactionType: commission.transactionType,
    commissionType: commission.commissionType,
    commissionValue: commission.commissionValue,
    minCommission: commission.minCommission,
    maxCommission: commission.maxCommission,
    schemeId: schemeId,
    isActive: true,
  }));
  
  await UserCommission.insertMany(userCommissions);
  
  return userCommissions;
};

const CommissionScheme = mongoose.model('CommissionScheme', commissionSchemeSchema);

module.exports = CommissionScheme;