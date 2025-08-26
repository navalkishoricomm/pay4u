const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    wallet: {
      type: mongoose.Schema.ObjectId,
      ref: 'Wallet',
      required: [true, 'Transaction must belong to a wallet'],
    },
    amount: {
      type: Number,
      required: [true, 'Transaction must have an amount'],
    },
    type: {
      type: String,
      required: [true, 'Transaction must have a type'],
      enum: ['topup', 'mobile-recharge', 'dth-recharge', 'bill-payment', 'transfer', 'refund', 'voucher_purchase'],
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'cancelled', 'awaiting_approval', 'approved', 'rejected'],
      default: 'pending',
    },
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
    description: {
      type: String,
      trim: true,
    },
    metadata: {
      // For storing additional information based on transaction type
      // e.g., mobile number for recharge, bill details for bill payment
      type: mongoose.Schema.Types.Mixed,
    },
    reference: {
      // For storing external reference IDs (e.g., payment gateway transaction ID)
      type: String,
      trim: true,
    },
    transactionId: {
      // For storing manual transaction ID provided by admin during approval
      type: String,
      trim: true,
      default: null,
    },
    failureReason: {
      // For storing failure reason when transaction is rejected
      type: String,
      trim: true,
      default: null,
    },
    operator: {
      // Operator name for commission calculation
      type: String,
      trim: true,
    },
    commissionAmount: {
      // Calculated commission amount
      type: Number,
      default: 0,
      min: [0, 'Commission amount cannot be negative'],
    },
    commissionType: {
      // Type of commission applied
      type: String,
      enum: ['percentage', 'fixed', 'none'],
      default: 'none',
    },
    commissionRate: {
      // Commission rate/value used for calculation
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Middleware to populate wallet when finding a transaction
transactionSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'wallet',
    select: 'user balance',
  });
  next();
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;