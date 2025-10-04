const mongoose = require('mongoose');

const chargeSlabSchema = new mongoose.Schema({
  minAmount: {
    type: Number,
    required: true,
    min: 0
  },
  maxAmount: {
    type: Number,
    required: true,
    min: 0
  },
  charge: {
    type: Number,
    required: true,
    min: 0
  },
  transferMode: {
    type: String,
    enum: ['IMPS', 'NEFT'],
    default: 'IMPS'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure no overlapping slabs for the same transfer mode
chargeSlabSchema.index({ minAmount: 1, maxAmount: 1, transferMode: 1 }, { unique: true });

// Validation to ensure minAmount is less than maxAmount
chargeSlabSchema.pre('save', function(next) {
  if (this.minAmount >= this.maxAmount) {
    return next(new Error('Minimum amount must be less than maximum amount'));
  }
  this.updatedAt = Date.now();
  next();
});

// Static method to find applicable charge for an amount
chargeSlabSchema.statics.findChargeForAmount = async function(amount, transferMode = 'IMPS') {
  const slab = await this.findOne({
    minAmount: { $lte: amount },
    maxAmount: { $gte: amount },
    transferMode: transferMode,
    isActive: true
  }).sort({ minAmount: 1 });
  
  return slab ? slab.charge : 0;
};

// Static method to get all active slabs for a transfer mode
chargeSlabSchema.statics.getActiveSlabs = async function(transferMode = 'IMPS') {
  return await this.find({
    transferMode: transferMode,
    isActive: true
  }).sort({ minAmount: 1 });
};

module.exports = mongoose.model('ChargeSlab', chargeSlabSchema);