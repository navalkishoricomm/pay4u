const mongoose = require('mongoose');

const voucherOrderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required']
  },
  brandVoucher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BrandVoucher',
    required: [true, 'Brand voucher reference is required']
  },
  voucherDenomination: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VoucherDenomination',
    required: [true, 'Voucher denomination reference is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  originalPrice: {
    type: Number,
    required: [true, 'Original price is required'],
    min: [0, 'Original price cannot be negative']
  },
  discountAmount: {
    type: Number,
    required: [true, 'Discount amount is required'],
    min: [0, 'Discount amount cannot be negative']
  },
  finalAmount: {
    type: Number,
    required: [true, 'Final amount is required'],
    min: [0, 'Final amount cannot be negative']
  },
  paymentMethod: {
    type: String,
    enum: ['wallet'],
    default: 'wallet'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  // Manual approval workflow fields
  customerEmail: {
    type: String,
    required: [true, 'Customer email is required for voucher delivery'],
    validate: {
      validator: function(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      },
      message: 'Please provide a valid email address'
    }
  },
  approvalStatus: {
    type: String,
    enum: ['pending_approval', 'approved', 'rejected'],
    default: 'pending_approval'
  },
  voucherFilePath: {
    type: String,
    default: null
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  rejectionReason: {
    type: String,
    maxlength: [500, 'Rejection reason cannot exceed 500 characters']
  },
  voucherCodes: [{
    code: {
      type: String,
      required: true
    },
    isUsed: {
      type: Boolean,
      default: false
    },
    usedAt: {
      type: Date
    },
    expiresAt: {
      type: Date,
      required: true
    }
  }],
  walletTransaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  purchaseDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    required: true
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Index for better query performance
voucherOrderSchema.index({ user: 1, createdAt: -1 });
voucherOrderSchema.index({ orderNumber: 1 });
voucherOrderSchema.index({ status: 1 });
voucherOrderSchema.index({ brandVoucher: 1 });
voucherOrderSchema.index({ expiryDate: 1 });
voucherOrderSchema.index({ approvalStatus: 1 });
voucherOrderSchema.index({ customerEmail: 1 });

// Virtual for total savings
voucherOrderSchema.virtual('totalSavings').get(function() {
  return this.discountAmount;
});

// Virtual for checking if order is expired
voucherOrderSchema.virtual('isExpired').get(function() {
  return new Date() > this.expiryDate;
});

// Virtual for active voucher codes count
voucherOrderSchema.virtual('activeVouchersCount').get(function() {
  return this.voucherCodes.filter(code => !code.isUsed && new Date() < code.expiresAt).length;
});

// Pre-save middleware to generate order number
voucherOrderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.orderNumber = `VO${timestamp}${random}`;
  }
  next();
});

// Pre-save middleware to generate voucher codes
voucherOrderSchema.pre('save', async function(next) {
  if (this.isNew && this.voucherCodes.length === 0) {
    const codes = [];
    for (let i = 0; i < this.quantity; i++) {
      const code = generateVoucherCode();
      codes.push({
        code: code,
        isUsed: false,
        expiresAt: this.expiryDate
      });
    }
    this.voucherCodes = codes;
  }
  next();
});

// Method to mark voucher as used
voucherOrderSchema.methods.useVoucher = function(voucherCode) {
  const voucher = this.voucherCodes.find(v => v.code === voucherCode && !v.isUsed);
  if (voucher && new Date() < voucher.expiresAt) {
    voucher.isUsed = true;
    voucher.usedAt = new Date();
    return this.save();
  }
  throw new Error('Invalid or expired voucher code');
};

// Method to get available vouchers
voucherOrderSchema.methods.getAvailableVouchers = function() {
  return this.voucherCodes.filter(code => !code.isUsed && new Date() < code.expiresAt);
};

// Static method to get user's voucher purchase count for a specific denomination
voucherOrderSchema.statics.getUserPurchaseCount = async function(userId, denominationId) {
  const result = await this.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        voucherDenomination: new mongoose.Types.ObjectId(denominationId),
        status: { $in: ['completed', 'pending'] }
      }
    },
    {
      $group: {
        _id: null,
        totalQuantity: { $sum: '$quantity' }
      }
    }
  ]);
  
  return result.length > 0 ? result[0].totalQuantity : 0;
};

// Function to generate unique voucher codes
function generateVoucherCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 12; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Ensure virtual fields are serialized
voucherOrderSchema.set('toJSON', { virtuals: true });
voucherOrderSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('VoucherOrder', voucherOrderSchema);