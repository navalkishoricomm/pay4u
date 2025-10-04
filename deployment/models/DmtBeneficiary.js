const mongoose = require('mongoose');

const dmtBeneficiarySchema = new mongoose.Schema({
  // Remitter association
  remitterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DmtRemitter',
    required: true,
    index: true
  },
  remitterMobile: {
    type: String,
    required: true,
    match: /^[6-9]\d{9}$/,
    index: true
  },
  
  // Beneficiary bank details
  accountNumber: {
    type: String,
    required: true,
    trim: true,
    minlength: 9,
    maxlength: 18
  },
  ifscCode: {
    type: String,
    required: true,
    uppercase: true,
    match: /^[A-Z]{4}0[A-Z0-9]{6}$/
  },
  accountHolderName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  bankName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  
  // Beneficiary personal details
  mobile: {
    type: String,
    match: /^[6-9]\d{9}$/,
    sparse: true
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    sparse: true
  },
  
  // Verification status
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'failed'],
    default: 'pending'
  },
  verificationMethod: {
    type: String,
    enum: ['penny_drop', 'name_match', 'manual'],
    default: 'penny_drop'
  },
  verificationDate: {
    type: Date
  },
  verificationResponse: {
    type: mongoose.Schema.Types.Mixed // Store API response
  },
  
  // Paysprint specific fields
  paysprintBeneficiaryId: {
    type: String,
    sparse: true,
    index: true
  },
  
  // Transaction limits and tracking
  monthlyLimit: {
    type: Number,
    default: 500000 // Rs 5 lacs per month as per Paysprint
  },
  monthlyReceived: {
    type: Number,
    default: 0
  },
  currentMonth: {
    type: String, // Format: YYYY-MM
    default: () => new Date().toISOString().slice(0, 7)
  },
  totalTransactions: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    default: 0
  },
  lastTransactionDate: {
    type: Date
  },
  
  // Status and metadata
  isActive: {
    type: Boolean,
    default: true
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  blockReason: {
    type: String,
    trim: true
  },
  registrationDate: {
    type: Date,
    default: Date.now
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

// Compound indexes for better performance
dmtBeneficiarySchema.index({ remitterId: 1, accountNumber: 1 }, { unique: true });
dmtBeneficiarySchema.index({ remitterMobile: 1, isActive: 1 });
dmtBeneficiarySchema.index({ paysprintBeneficiaryId: 1 }, { sparse: true });
dmtBeneficiarySchema.index({ userId: 1, isActive: 1 });
dmtBeneficiarySchema.index({ verificationStatus: 1, isActive: 1 });

// Virtual for full name
dmtBeneficiarySchema.virtual('displayName').get(function() {
  return this.accountHolderName;
});

// Methods
dmtBeneficiarySchema.methods.updateMonthlyReceived = function(amount) {
  const currentMonth = new Date().toISOString().slice(0, 7);
  
  // Reset monthly received if it's a new month
  if (this.currentMonth !== currentMonth) {
    this.monthlyReceived = 0;
    this.currentMonth = currentMonth;
  }
  
  this.monthlyReceived += amount;
  this.totalAmount += amount;
  this.totalTransactions += 1;
  this.lastTransactionDate = new Date();
};

dmtBeneficiarySchema.methods.getRemainingMonthlyLimit = function() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  
  // Reset if it's a new month
  if (this.currentMonth !== currentMonth) {
    return this.monthlyLimit;
  }
  
  return Math.max(0, this.monthlyLimit - this.monthlyReceived);
};

dmtBeneficiarySchema.methods.canReceive = function(amount) {
  if (!this.isActive || this.isBlocked) {
    return { allowed: false, reason: 'Beneficiary not active or blocked' };
  }
  
  if (this.verificationStatus !== 'verified') {
    return { allowed: false, reason: 'Beneficiary not verified' };
  }
  
  const remainingLimit = this.getRemainingMonthlyLimit();
  if (amount > remainingLimit) {
    return { allowed: false, reason: 'Monthly receiving limit exceeded' };
  }
  
  return { allowed: true };
};

dmtBeneficiarySchema.methods.markVerified = function(verificationData = {}) {
  this.verificationStatus = 'verified';
  this.verificationDate = new Date();
  if (verificationData.accountHolderName) {
    this.accountHolderName = verificationData.accountHolderName;
  }
  if (verificationData.response) {
    this.verificationResponse = verificationData.response;
  }
};

dmtBeneficiarySchema.methods.markFailed = function(reason, response = null) {
  this.verificationStatus = 'failed';
  this.verificationDate = new Date();
  if (response) {
    this.verificationResponse = response;
  }
};

dmtBeneficiarySchema.methods.block = function(reason) {
  this.isBlocked = true;
  this.blockReason = reason;
};

dmtBeneficiarySchema.methods.unblock = function() {
  this.isBlocked = false;
  this.blockReason = undefined;
};

// Static methods
dmtBeneficiarySchema.statics.findByRemitter = function(remitterId, activeOnly = true) {
  const query = { remitterId };
  if (activeOnly) {
    query.isActive = true;
    query.isBlocked = false;
  }
  return this.find(query).sort({ createdAt: -1 });
};

dmtBeneficiarySchema.statics.findByRemitterMobile = function(mobile, activeOnly = true) {
  const query = { remitterMobile: mobile };
  if (activeOnly) {
    query.isActive = true;
    query.isBlocked = false;
  }
  return this.find(query).sort({ createdAt: -1 });
};

dmtBeneficiarySchema.statics.findByAccount = function(accountNumber, ifscCode) {
  return this.findOne({ 
    accountNumber, 
    ifscCode, 
    isActive: true 
  });
};

dmtBeneficiarySchema.statics.findByPaysprintId = function(paysprintBeneficiaryId) {
  return this.findOne({ paysprintBeneficiaryId, isActive: true });
};

// Pre-save middleware
dmtBeneficiarySchema.pre('save', function(next) {
  // Uppercase IFSC code
  if (this.ifscCode) {
    this.ifscCode = this.ifscCode.toUpperCase();
  }
  
  // Trim account number
  if (this.accountNumber) {
    this.accountNumber = this.accountNumber.trim();
  }
  
  next();
});

// Static methods
dmtBeneficiarySchema.statics.findByRemitter = function(remitterId) {
  return this.find({ remitterId, isBlocked: false }).sort({ createdAt: -1 });
};

// Export model
module.exports = mongoose.models.DmtBeneficiary || mongoose.model('DmtBeneficiary', dmtBeneficiarySchema);