const mongoose = require('mongoose');

const upiBarcodeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name for the UPI barcode'],
      trim: true,
    },
    upiId: {
      type: String,
      required: [true, 'Please provide the UPI ID'],
      trim: true,
      validate: {
        validator: function(v) {
          // Basic UPI ID validation (format: user@bank or phone@bank)
          return /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(v);
        },
        message: 'Please provide a valid UPI ID'
      }
    },
    barcodeImage: {
      filename: {
        type: String,
        required: [true, 'Barcode image filename is required']
      },
      originalName: {
        type: String,
        required: [true, 'Original filename is required']
      },
      path: {
        type: String,
        required: [true, 'File path is required']
      },
      size: {
        type: Number,
        required: [true, 'File size is required']
      },
      mimetype: {
        type: String,
        required: [true, 'File mimetype is required'],
        enum: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
      }
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    uploadedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Uploaded by admin is required']
    },
    usageCount: {
      type: Number,
      default: 0
    },
    lastUsed: {
      type: Date
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for faster queries
upiBarcodeSchema.index({ isActive: 1, isDefault: 1 });
upiBarcodeSchema.index({ uploadedBy: 1 });

// Ensure only one default barcode at a time
upiBarcodeSchema.pre('save', async function(next) {
  if (this.isDefault && this.isModified('isDefault')) {
    // Remove default status from other barcodes
    await this.constructor.updateMany(
      { _id: { $ne: this._id }, isDefault: true },
      { isDefault: false }
    );
  }
  next();
});

// Virtual for barcode URL
upiBarcodeSchema.virtual('barcodeUrl').get(function() {
  if (this.barcodeImage && this.barcodeImage.path) {
    return `/uploads/admin-barcodes/${this.barcodeImage.filename}`;
  }
  return null;
});

// Static method to get active default barcode
upiBarcodeSchema.statics.getDefaultBarcode = function() {
  return this.findOne({ isActive: true, isDefault: true });
};

// Static method to get all active barcodes
upiBarcodeSchema.statics.getActiveBarcodes = function() {
  return this.find({ isActive: true }).sort({ isDefault: -1, createdAt: -1 });
};

// Instance method to increment usage count
upiBarcodeSchema.methods.incrementUsage = function() {
  this.usageCount += 1;
  this.lastUsed = new Date();
  return this.save();
};

const UPIBarcode = mongoose.model('UPIBarcode', upiBarcodeSchema);

module.exports = UPIBarcode;