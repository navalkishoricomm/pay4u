const mongoose = require('mongoose');

const brandVoucherSchema = new mongoose.Schema({
  brandName: {
    type: String,
    required: [true, 'Brand name is required'],
    trim: true,
    maxlength: [100, 'Brand name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  image: {
    type: String,
    required: [true, 'Brand image is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Food & Dining', 'Shopping', 'Entertainment', 'Travel', 'Health & Beauty', 'Electronics', 'Other'],
    default: 'Other'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  termsAndConditions: {
    type: String,
    trim: true,
    maxlength: [1000, 'Terms and conditions cannot exceed 1000 characters']
  },
  validityPeriod: {
    type: Number,
    required: [true, 'Validity period is required'],
    min: [1, 'Validity period must be at least 1 day'],
    default: 365 // days
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for better query performance
brandVoucherSchema.index({ brandName: 1 });
brandVoucherSchema.index({ category: 1 });
brandVoucherSchema.index({ isActive: 1 });

// Virtual for getting active denominations
brandVoucherSchema.virtual('denominations', {
  ref: 'VoucherDenomination',
  localField: '_id',
  foreignField: 'brandVoucher'
});

// Ensure virtual fields are serialized
brandVoucherSchema.set('toJSON', { virtuals: true });
brandVoucherSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('BrandVoucher', brandVoucherSchema);