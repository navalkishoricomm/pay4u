const mongoose = require('mongoose');

const operatorConfigSchema = new mongoose.Schema({
  operatorCode: {
    type: String,
    required: [true, 'Operator code is required'],
    unique: true,
    trim: true,
    uppercase: true,
    maxlength: [20, 'Operator code cannot exceed 20 characters']
  },
  operatorName: {
    type: String,
    required: [true, 'Operator name is required'],
    trim: true,
    maxlength: [100, 'Operator name cannot exceed 100 characters']
  },
  serviceType: {
    type: String,
    required: [true, 'Service type is required'],
    enum: ['mobile', 'dth', 'electricity', 'gas', 'water', 'broadband'],
    lowercase: true
  },
  processingMode: {
    type: String,
    required: [true, 'Processing mode is required'],
    enum: ['api', 'manual', 'disabled'],
    default: 'api'
  },
  primaryApiProvider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ApiProvider',
    required: function() {
      return this.processingMode === 'api';
    }
  },
  fallbackApiProviders: [{
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ApiProvider'
    },
    priority: {
      type: Number,
      default: 1
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  commission: {
    type: Number,
    default: 0,
    min: [0, 'Commission cannot be negative'],
    max: [100, 'Commission cannot exceed 100%']
  },
  minAmount: {
    type: Number,
    required: [true, 'Minimum amount is required'],
    min: [1, 'Minimum amount must be at least 1']
  },
  maxAmount: {
    type: Number,
    required: [true, 'Maximum amount is required'],
    min: [1, 'Maximum amount must be at least 1']
  },
  allowedAmounts: {
    type: [Number],
    default: []
  },
  circles: [{
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  validationRules: {
    mobileNumber: {
      pattern: {
        type: String,
        default: '^[6-9]\\d{9}$'
      },
      message: {
        type: String,
        default: 'Please enter a valid 10-digit mobile number'
      }
    },
    customerNumber: {
      pattern: {
        type: String,
        default: '^\\d{8,15}$'
      },
      message: {
        type: String,
        default: 'Please enter a valid customer number'
      }
    }
  },
  manualProcessing: {
    requiresApproval: {
      type: Boolean,
      default: true
    },
    approvalTimeout: {
      type: Number,
      default: 24, // hours
      min: [1, 'Approval timeout must be at least 1 hour'],
      max: [168, 'Approval timeout cannot exceed 7 days']
    },
    autoApproveAmount: {
      type: Number,
      default: 0,
      min: [0, 'Auto approve amount cannot be negative']
    },
    instructions: {
      type: String,
      maxlength: [1000, 'Instructions cannot exceed 1000 characters']
    }
  },
  apiMapping: {
    operatorId: {
      type: String,
      trim: true
    },
    operatorName: {
      type: String,
      trim: true
    },
    circleMapping: {
      type: Map,
      of: String,
      default: new Map()
    },
    customFields: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: new Map()
    }
  },
  statistics: {
    totalTransactions: {
      type: Number,
      default: 0
    },
    successfulTransactions: {
      type: Number,
      default: 0
    },
    failedTransactions: {
      type: Number,
      default: 0
    },
    pendingTransactions: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      default: 0
    },
    lastTransaction: {
      type: Date
    },
    averageProcessingTime: {
      type: Number,
      default: 0 // in seconds
    }
  },
  maintenanceMode: {
    isEnabled: {
      type: Boolean,
      default: false
    },
    message: {
      type: String,
      maxlength: [200, 'Maintenance message cannot exceed 200 characters']
    },
    startTime: {
      type: Date
    },
    endTime: {
      type: Date
    }
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
operatorConfigSchema.index({ operatorCode: 1 });
operatorConfigSchema.index({ serviceType: 1, isActive: 1 });
operatorConfigSchema.index({ processingMode: 1 });
operatorConfigSchema.index({ primaryApiProvider: 1 });

// Virtual for success rate
operatorConfigSchema.virtual('successRate').get(function() {
  if (this.statistics.totalTransactions === 0) return 0;
  return ((this.statistics.successfulTransactions / this.statistics.totalTransactions) * 100).toFixed(2);
});

// Virtual for failure rate
operatorConfigSchema.virtual('failureRate').get(function() {
  if (this.statistics.totalTransactions === 0) return 0;
  return ((this.statistics.failedTransactions / this.statistics.totalTransactions) * 100).toFixed(2);
});

// Virtual for pending rate
operatorConfigSchema.virtual('pendingRate').get(function() {
  if (this.statistics.totalTransactions === 0) return 0;
  return ((this.statistics.pendingTransactions / this.statistics.totalTransactions) * 100).toFixed(2);
});

// Methods
operatorConfigSchema.methods.updateStats = function(status, amount, processingTime) {
  this.statistics.totalTransactions += 1;
  this.statistics.totalAmount += amount;
  this.statistics.lastTransaction = new Date();
  
  if (processingTime) {
    const currentAvg = this.statistics.averageProcessingTime;
    const totalTxns = this.statistics.totalTransactions;
    this.statistics.averageProcessingTime = ((currentAvg * (totalTxns - 1)) + processingTime) / totalTxns;
  }
  
  switch (status) {
    case 'success':
      this.statistics.successfulTransactions += 1;
      break;
    case 'failed':
      this.statistics.failedTransactions += 1;
      break;
    case 'pending':
      this.statistics.pendingTransactions += 1;
      break;
  }
  
  return this.save();
};

operatorConfigSchema.methods.isAmountValid = function(amount) {
  // Allow any amount between 1 to 10000
  if (amount < 1 || amount > 10000) {
    return false;
  }
  
  return true;
};

operatorConfigSchema.methods.getCircleByCode = function(circleCode) {
  return this.circles.find(circle => circle.code === circleCode && circle.isActive);
};

operatorConfigSchema.methods.isInMaintenance = function() {
  if (!this.maintenanceMode.isEnabled) return false;
  
  const now = new Date();
  const start = this.maintenanceMode.startTime;
  const end = this.maintenanceMode.endTime;
  
  if (start && end) {
    return now >= start && now <= end;
  }
  
  return this.maintenanceMode.isEnabled;
};

operatorConfigSchema.methods.requiresManualApproval = function(amount) {
  if (this.processingMode !== 'manual') return false;
  
  if (this.manualProcessing.autoApproveAmount > 0) {
    return amount > this.manualProcessing.autoApproveAmount;
  }
  
  return this.manualProcessing.requiresApproval;
};

// Static methods
operatorConfigSchema.statics.getActiveOperators = function(serviceType) {
  return this.find({
    serviceType: serviceType,
    isActive: true,
    'maintenanceMode.isEnabled': false
  }).populate('primaryApiProvider fallbackApiProviders.provider');
};

operatorConfigSchema.statics.getOperatorByCode = function(operatorCode) {
  return this.findOne({
    operatorCode: operatorCode.toUpperCase(),
    isActive: true
  }).populate('primaryApiProvider fallbackApiProviders.provider');
};

operatorConfigSchema.statics.getManualOperators = function(serviceType) {
  return this.find({
    serviceType: serviceType,
    processingMode: 'manual',
    isActive: true
  });
};

module.exports = mongoose.model('OperatorConfig', operatorConfigSchema);