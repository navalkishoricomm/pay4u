const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Wallet must belong to a user'],
      unique: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: [0, 'Wallet balance cannot be negative'],
    },
    currency: {
      type: String,
      default: 'INR',
      enum: ['INR', 'USD'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual populate for transactions
walletSchema.virtual('transactions', {
  ref: 'Transaction',
  foreignField: 'wallet',
  localField: '_id',
});

// Middleware to populate user when finding a wallet
walletSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'user',
    select: 'name email phone',
  });
  next();
});

const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet;