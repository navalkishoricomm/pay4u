const mongoose = require('mongoose');

const voucherDenominationSchema = new mongoose.Schema({
  brandVoucher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BrandVoucher',
    required: [true, 'Brand voucher reference is required']
  },
  denomination: {
    type: Number,
    required: [true, 'Denomination value is required'],
    min: [1, 'Denomination must be at least 1'],
    validate: {
      validator: function(value) {
        return Number.isInteger(value);
      },
      message: 'Denomination must be a whole number'
    }
  },
  discountPercentage: {
    type: Number,
    required: [true, 'Discount percentage is required'],
    min: [0, 'Discount cannot be negative'],
    max: [100, 'Discount cannot exceed 100%'],
    default: 0
  },
  maxQuantityPerUser: {
    type: Number,
    required: [true, 'Maximum quantity per user is required'],
    min: [1, 'Maximum quantity must be at least 1'],
    default: 5
  },
  totalAvailableQuantity: {
    type: Number,
    required: [true, 'Total available quantity is required'],
    min: [0, 'Total quantity cannot be negative'],
    default: 1000
  },
  soldQuantity: {
    type: Number,
    default: 0,
    min: [0, 'Sold quantity cannot be negative']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Compound index to ensure unique denomination per brand voucher
voucherDenominationSchema.index({ brandVoucher: 1, denomination: 1 }, { unique: true });

// Index for better query performance
voucherDenominationSchema.index({ isActive: 1 });
voucherDenominationSchema.index({ brandVoucher: 1, isActive: 1 });

// Virtual for remaining quantity
voucherDenominationSchema.virtual('remainingQuantity').get(function() {
  return Math.max(0, this.totalAvailableQuantity - this.soldQuantity);
});

// Virtual for discounted price
voucherDenominationSchema.virtual('discountedPrice').get(function() {
  const discountAmount = (this.denomination * this.discountPercentage) / 100;
  return this.denomination - discountAmount;
});

// Virtual for discount amount
voucherDenominationSchema.virtual('discountAmount').get(function() {
  return (this.denomination * this.discountPercentage) / 100;
});

// Method to check if quantity is available
voucherDenominationSchema.methods.isQuantityAvailable = function(requestedQuantity = 1) {
  return this.remainingQuantity >= requestedQuantity;
};

// Method to check if user can purchase more
voucherDenominationSchema.methods.canUserPurchase = function(userPurchasedQuantity, requestedQuantity = 1) {
  return (userPurchasedQuantity + requestedQuantity) <= this.maxQuantityPerUser;
};

// Pre-save middleware to validate sold quantity doesn't exceed total
voucherDenominationSchema.pre('save', function(next) {
  if (this.soldQuantity > this.totalAvailableQuantity) {
    return next(new Error('Sold quantity cannot exceed total available quantity'));
  }
  next();
});

// Ensure virtual fields are serialized
voucherDenominationSchema.set('toJSON', { virtuals: true });
voucherDenominationSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('VoucherDenomination', voucherDenominationSchema);