const mongoose = require('mongoose');

const dmtRemitterSchema = new mongoose.Schema({
  // Basic remitter information
  mobile: {
    type: String,
    required: true,
    unique: true,
    match: /^[6-9]\d{9}$/,
    index: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  address: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  pincode: {
    type: String,
    required: true,
    match: /^\d{6}$/
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  gstState: {
    type: String,
    trim: true,
    maxlength: 50
  },
  
  // KYC and verification status
  kycStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  kycType: {
    type: String,
    enum: ['iris', 'face_auth', 'finger', 'otp'],
    default: 'otp'
  },
  kycAttempts: {
    type: Number,
    default: 0,
    max: 2
  },
  lastKycAttempt: {
    type: Date
  },
  kycExpiryTime: {
    type: Date
  },
  
  // Paysprint specific fields
  paysprintRemitterId: {
    type: String,
    sparse: true,
    index: true
  },
  
  // Transaction limits and tracking
  monthlyLimit: {
    type: Number,
    default: 25000 // Rs 25K per month as per Paysprint
  },
  monthlyUsed: {
    type: Number,
    default: 0
  },
  currentMonth: {
    type: String, // Format: YYYY-MM
    default: () => new Date().toISOString().slice(0, 7)
  },
  
  // Status and metadata
  isActive: {
    type: Boolean,
    default: true
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  lastTransactionDate: {
    type: Date
  },
  
  // User association
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
dmtRemitterSchema.index({ userId: 1, mobile: 1 });
dmtRemitterSchema.index({ paysprintRemitterId: 1 }, { sparse: true });
dmtRemitterSchema.index({ kycStatus: 1, isActive: 1 });

// Methods
dmtRemitterSchema.methods.canPerformKyc = function() {
  const now = new Date();
  const today = now.toDateString();
  const lastAttemptDate = this.lastKycAttempt ? this.lastKycAttempt.toDateString() : null;
  
  // Reset attempts if it's a new day
  if (lastAttemptDate !== today) {
    this.kycAttempts = 0;
  }
  
  return this.kycAttempts < 2;
};

dmtRemitterSchema.methods.updateMonthlyUsage = function(amount) {
  const currentMonth = new Date().toISOString().slice(0, 7);
  
  // Reset monthly usage if it's a new month
  if (this.currentMonth !== currentMonth) {
    this.monthlyUsed = 0;
    this.currentMonth = currentMonth;
  }
  
  this.monthlyUsed += amount;
  this.lastTransactionDate = new Date();
};

dmtRemitterSchema.methods.getRemainingMonthlyLimit = function() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  
  // Reset if it's a new month
  if (this.currentMonth !== currentMonth) {
    return this.monthlyLimit;
  }
  
  return Math.max(0, this.monthlyLimit - this.monthlyUsed);
};

dmtRemitterSchema.methods.canTransact = function(amount) {
  if (!this.isActive || this.kycStatus !== 'verified') {
    return { allowed: false, reason: 'Remitter not active or KYC not verified' };
  }
  
  const remainingLimit = this.getRemainingMonthlyLimit();
  if (amount > remainingLimit) {
    return { allowed: false, reason: 'Monthly limit exceeded' };
  }
  
  if (amount > 5000) { // Max transaction limit as per Paysprint
    return { allowed: false, reason: 'Transaction amount exceeds maximum limit of Rs 5000' };
  }
  
  return { allowed: true };
};

// Static methods
dmtRemitterSchema.statics.findByMobile = function(mobile) {
  return this.findOne({ mobile, isActive: true });
};

dmtRemitterSchema.statics.findByPaysprintId = function(paysprintRemitterId) {
  return this.findOne({ paysprintRemitterId, isActive: true });
};

module.exports = mongoose.models.DmtRemitter || mongoose.model('DmtRemitter', dmtRemitterSchema);