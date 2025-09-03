const mongoose = require('mongoose');

const apiProviderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'API provider name is required'],
    unique: true,
    trim: true,
    maxlength: [50, 'API provider name cannot exceed 50 characters']
  },
  displayName: {
    type: String,
    required: [true, 'Display name is required'],
    trim: true,
    maxlength: [100, 'Display name cannot exceed 100 characters']
  },
  baseUrl: {
    type: String,
    required: [true, 'Base URL is required'],
    trim: true,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Base URL must be a valid HTTP/HTTPS URL'
    }
  },
  apiKey: {
    type: String,
    required: [true, 'API key is required'],
    trim: true
  },
  apiSecret: {
    type: String,
    trim: true
  },
  authType: {
    type: String,
    enum: ['bearer', 'basic', 'api_key', 'custom'],
    default: 'bearer'
  },
  headers: {
    type: Map,
    of: String,
    default: new Map()
  },
  endpoints: {
    mobileRecharge: {
      type: String,
      required: function() {
        return this.supportedServices && this.supportedServices.includes('mobile');
      },
      trim: true
    },
    dthRecharge: {
      type: String,
      required: function() {
        return this.supportedServices && this.supportedServices.includes('dth');
      },
      trim: true
    },
    checkStatus: {
      type: String,
      required: function() {
        return this.supportedServices && (this.supportedServices.includes('mobile') || this.supportedServices.includes('dth'));
      },
      trim: true
    },
    getOperators: {
      type: String,
      trim: true
    },
    // DMT endpoints
    dmtRemitterRegistration: {
      type: String,
      trim: true
    },
    dmtRemitterKyc: {
      type: String,
      trim: true
    },
    dmtBeneficiaryRegistration: {
      type: String,
      trim: true
    },
    dmtBeneficiaryVerification: {
      type: String,
      trim: true
    },
    dmtTransaction: {
      type: String,
      trim: true
    },
    dmtTransactionStatus: {
      type: String,
      trim: true
    },
    dmtRefund: {
      type: String,
      trim: true
    }
  },
  requestFormat: {
    type: String,
    enum: ['json', 'form', 'xml'],
    default: 'json'
  },
  responseFormat: {
    type: String,
    enum: ['json', 'xml', 'text'],
    default: 'json'
  },
  timeout: {
    type: Number,
    default: 30000,
    min: [5000, 'Timeout must be at least 5 seconds'],
    max: [120000, 'Timeout cannot exceed 2 minutes']
  },
  retryAttempts: {
    type: Number,
    default: 3,
    min: [0, 'Retry attempts cannot be negative'],
    max: [5, 'Retry attempts cannot exceed 5']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  priority: {
    type: Number,
    default: 1,
    min: [1, 'Priority must be at least 1'],
    max: [10, 'Priority cannot exceed 10']
  },
  successCodes: {
    type: [String],
    default: ['200', 'SUCCESS', 'ACCEPTED']
  },
  failureCodes: {
    type: [String],
    default: ['FAILED', 'ERROR', 'REJECTED']
  },
  pendingCodes: {
    type: [String],
    default: ['PENDING', 'PROCESSING', 'IN_PROGRESS']
  },
  commission: {
    type: Number,
    default: 0,
    min: [0, 'Commission cannot be negative'],
    max: [100, 'Commission cannot exceed 100%']
  },
  minAmount: {
    type: Number,
    default: 10
  },
  maxAmount: {
    type: Number,
    default: 10000
  },
  supportedServices: {
    type: [String],
    enum: ['mobile', 'dth', 'electricity', 'gas', 'water', 'broadband', 'dmt'],
    default: ['mobile', 'dth']
  },
  testMode: {
    type: Boolean,
    default: false
  },
  testCredentials: {
    apiKey: String,
    apiSecret: String,
    baseUrl: String
  },
  lastUsed: {
    type: Date
  },
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
  totalAmount: {
    type: Number,
    default: 0
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
apiProviderSchema.index({ name: 1 });
apiProviderSchema.index({ isActive: 1, priority: -1 });
apiProviderSchema.index({ supportedServices: 1 });

// Virtual for success rate
apiProviderSchema.virtual('successRate').get(function() {
  if (this.totalTransactions === 0) return 0;
  return ((this.successfulTransactions / this.totalTransactions) * 100).toFixed(2);
});

// Virtual for failure rate
apiProviderSchema.virtual('failureRate').get(function() {
  if (this.totalTransactions === 0) return 0;
  return ((this.failedTransactions / this.totalTransactions) * 100).toFixed(2);
});

// Methods
apiProviderSchema.methods.updateStats = function(success, amount) {
  this.totalTransactions += 1;
  this.totalAmount += amount;
  this.lastUsed = new Date();
  
  if (success) {
    this.successfulTransactions += 1;
  } else {
    this.failedTransactions += 1;
  }
  
  return this.save();
};

apiProviderSchema.methods.getCredentials = function() {
  if (this.testMode && this.testCredentials.apiKey) {
    return {
      apiKey: this.testCredentials.apiKey,
      apiSecret: this.testCredentials.apiSecret,
      baseUrl: this.testCredentials.baseUrl || this.baseUrl
    };
  }
  
  return {
    apiKey: this.apiKey,
    apiSecret: this.apiSecret,
    baseUrl: this.baseUrl
  };
};

apiProviderSchema.methods.isServiceSupported = function(service) {
  return this.supportedServices.includes(service);
};

// Static methods
apiProviderSchema.statics.getActiveProviders = function(service) {
  return this.find({
    isActive: true,
    supportedServices: service
  }).sort({ priority: -1, successRate: -1 });
};

apiProviderSchema.statics.getBestProvider = function(service) {
  return this.findOne({
    isActive: true,
    supportedServices: service
  }).sort({ priority: -1, successRate: -1 });
};

module.exports = mongoose.model('ApiProvider', apiProviderSchema);