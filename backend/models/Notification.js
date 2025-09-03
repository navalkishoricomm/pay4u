const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
    maxlength: 100,
  },
  message: {
    type: String,
    required: true,
    maxlength: 500,
  },
  type: {
    type: String,
    enum: ['transaction_approved', 'transaction_rejected', 'system', 'general', 'announcement', 'warning', 'info'],
    default: 'general',
  },
  relatedTransaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    default: null,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  readAt: {
    type: Date,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    default: null,
  },
  metadata: {
    actionUrl: String,
    actionText: String,
    category: String,
    data: Object,
  },
  expiresAt: {
    type: Date,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for efficient queries
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ sender: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Method to mark notification as read
notificationSchema.methods.markAsRead = function() {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Static method to get notifications for a user
notificationSchema.statics.getForUser = function(userId, options = {}) {
  const { page = 1, limit = 20, unreadOnly = false } = options;
  const skip = (page - 1) * limit;
  
  const query = {
    user: userId,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } }
    ]
  };
  
  if (unreadOnly) {
    query.isRead = false;
  }
  
  return this.find(query)
    .populate('sender', 'name email')
    .populate('relatedTransaction')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to get unread count for a user
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    user: userId,
    isRead: false,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } }
    ]
  });
};

// Static method to create bulk notifications
notificationSchema.statics.createBulkNotifications = async function(notificationData, userIds) {
  const notifications = userIds.map(userId => ({
    ...notificationData,
    user: userId
  }));
  
  return this.insertMany(notifications);
};

module.exports = mongoose.model('Notification', notificationSchema);