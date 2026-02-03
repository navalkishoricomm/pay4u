const Notification = require('../models/Notification');
const User = require('../models/User');
const mongoose = require('mongoose');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Create a new notification
exports.createNotification = async (userId, title, message, type = 'general', relatedTransaction = null, priority = 'medium', sender = null) => {
  try {
    // Check if MongoDB connection is ready
    if (mongoose.connection.readyState !== 1) {
      console.warn('MongoDB not connected, skipping notification creation');
      return null;
    }

    const notification = await Notification.create({
      user: userId,
      title,
      message,
      type,
      relatedTransaction,
      priority,
      sender,
    });
    
    console.log(`Notification created for user ${userId}: ${title}`);
    
    // Emit real-time notification if Socket.IO is available
    if (global.io) {
      try {
        const populatedNotification = await Notification.findById(notification._id)
          .populate('relatedTransaction', 'amount type status reference');
        
        const unreadCount = await Notification.countDocuments({ user: userId, isRead: false });
        
        // Check if user is connected to their room
        const userRoom = `user_${userId}`;
        const connectedSockets = await global.io.in(userRoom).fetchSockets();
        
        if (connectedSockets.length > 0) {
          // Emit to specific user room
          global.io.to(userRoom).emit('new_notification', {
            notification: populatedNotification,
            unreadCount: unreadCount
          });
          console.log(`✓ Real-time notification sent to user ${userId} (${connectedSockets.length} connected sockets)`);
        } else {
          console.log(`⚠ User ${userId} not connected to Socket.IO, notification saved to database only`);
        }
        
        // Also emit to admin room for monitoring
        global.io.to('admin_room').emit('notification_created', {
          userId: userId,
          title: title,
          message: message,
          type: type,
          timestamp: new Date()
        });
        
      } catch (socketError) {
        console.error('❌ Failed to send real-time notification:', socketError.message);
        console.error('Socket error stack:', socketError.stack);
        // Don't throw error for socket issues, notification was still created
      }
    } else {
      console.warn('⚠ Socket.IO not available, notification saved to database only');
    }
    
    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error.message);
    // Don't throw error to prevent breaking the main flow
    return null;
  }
};

// Get notifications for the logged-in user
exports.getMyNotifications = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 20, unreadOnly = false } = req.query;
  
  const query = { user: req.user.id };
  if (unreadOnly === 'true') {
    query.isRead = false;
  }
  
  const notifications = await Notification.find(query)
    .populate('relatedTransaction', 'amount type status reference')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
  
  const totalNotifications = await Notification.countDocuments(query);
  const unreadCount = await Notification.countDocuments({ 
    user: req.user.id, 
    isRead: false 
  });
  
  res.status(200).json({
    status: 'success',
    results: notifications.length,
    totalNotifications,
    unreadCount,
    currentPage: parseInt(page),
    totalPages: Math.ceil(totalNotifications / limit),
    data: {
      notifications,
    },
  });
});

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await Notification.findOne({
      _id: id,
      user: req.user.id,
    });
    
    if (!notification) {
      return res.status(404).json({
        status: 'fail',
        message: 'Notification not found',
      });
    }
    
    notification.isRead = true;
    await notification.save();
    
    res.status(200).json({
      status: 'success',
      data: {
        notification,
      },
    });
  } catch (error) {
    console.error('Failed to mark notification as read:', error.message);
    
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Mark all notifications as read for the user
exports.markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { user: req.user.id, isRead: false },
      { isRead: true }
    );
    
    res.status(200).json({
      status: 'success',
      message: `Marked ${result.modifiedCount} notifications as read`,
      data: {
        modifiedCount: result.modifiedCount,
      },
    });
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error.message);
    
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Delete a notification
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await Notification.findOneAndDelete({
      _id: id,
      user: req.user.id,
    });
    
    if (!notification) {
      return res.status(404).json({
        status: 'fail',
        message: 'Notification not found',
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete notification:', error.message);
    
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// ADMIN ONLY ROUTES

// Get all notifications (admin)
exports.getAllNotifications = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 20, type, priority, sender } = req.query;
  const skip = (page - 1) * limit;
  
  const query = {};
  if (type) query.type = type;
  if (priority) query.priority = priority;
  if (sender) query.sender = sender;
  
  const notifications = await Notification.find(query)
    .populate('user', 'name email')
    .populate('sender', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));
  
  const total = await Notification.countDocuments(query);
  
  res.status(200).json({
    status: 'success',
    results: notifications.length,
    total,
    data: {
      notifications
    }
  });
});

// Create single notification (admin)
exports.createSingleNotification = catchAsync(async (req, res, next) => {
  const { userId, title, message, type, priority, metadata, expiresAt } = req.body;
  
  if (!userId || !title || !message) {
    return next(new AppError('User ID, title, and message are required', 400));
  }

  // Check if MongoDB connection is ready
  if (mongoose.connection.readyState !== 1) {
    return next(new AppError('Database connection not available', 503));
  }
  
  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  
  const notification = await Notification.create({
    user: userId,
    title,
    message,
    type: type || 'general',
    priority: priority || 'medium',
    sender: req.user.id,
    metadata: metadata || {},
    expiresAt
  });
  
  await notification.populate('user', 'name email');
  await notification.populate('sender', 'name email');

  // Emit real-time notification if Socket.IO is available
  if (global.io) {
    try {
      const unreadCount = await Notification.countDocuments({ user: userId, isRead: false });
      const userRoom = `user_${userId}`;
      const connectedSockets = await global.io.in(userRoom).fetchSockets();
      
      if (connectedSockets.length > 0) {
        global.io.to(userRoom).emit('new_notification', {
          notification,
          unreadCount: unreadCount
        });
        console.log(`✓ Admin notification sent to user ${userId} (${connectedSockets.length} connected sockets)`);
      } else {
        console.log(`⚠ User ${userId} not connected to Socket.IO for admin notification`);
      }
      
      // Emit to admin room for monitoring
      global.io.to('admin_room').emit('admin_notification_sent', {
        userId: userId,
        title: title,
        message: message,
        sender: req.user.name || req.user.email,
        timestamp: new Date()
      });
      
    } catch (socketError) {
      console.error('❌ Failed to send admin real-time notification:', socketError.message);
      console.error('Socket error stack:', socketError.stack);
    }
  } else {
    console.warn('⚠ Socket.IO not available for admin notification');
  }
  
  res.status(201).json({
    status: 'success',
    data: {
      notification
    }
  });
});

// Send bulk notifications (admin)
exports.sendBulkNotifications = catchAsync(async (req, res, next) => {
  const { 
    title, 
    message, 
    type, 
    priority, 
    metadata, 
    expiresAt,
    recipients,
    sendToAll = false,
    userRole = null
  } = req.body;
  
  if (!title || !message) {
    return next(new AppError('Title and message are required', 400));
  }

  // Check if MongoDB connection is ready
  if (mongoose.connection.readyState !== 1) {
    return next(new AppError('Database connection not available', 503));
  }
  
  let userIds = [];
  
  if (sendToAll) {
    // Send to all users
    const query = userRole ? { role: userRole } : {};
    const users = await User.find(query).select('_id');
    userIds = users.map(user => user._id);
  } else if (recipients && recipients.length > 0) {
    // Send to specific users
    userIds = recipients;
    
    // Validate all user IDs exist
    const users = await User.find({ _id: { $in: userIds } });
    if (users.length !== userIds.length) {
      return next(new AppError('Some user IDs are invalid', 400));
    }
  } else {
    return next(new AppError('Recipients are required when not sending to all users', 400));
  }
  
  if (userIds.length === 0) {
    return next(new AppError('No recipients found', 400));
  }
  
  const notificationData = {
    title,
    message,
    type: type || 'general',
    priority: priority || 'medium',
    sender: req.user.id,
    metadata: metadata || {},
    expiresAt
  };
  
  const notifications = await Notification.createBulkNotifications(notificationData, userIds);
  
  res.status(201).json({
    status: 'success',
    message: `Successfully sent ${notifications.length} notifications`,
    data: {
      count: notifications.length,
      recipients: userIds.length
    }
  });
});

// Get notification statistics (admin)
exports.getNotificationStats = catchAsync(async (req, res, next) => {
  const stats = await Notification.aggregate([
    {
      $group: {
        _id: null,
        totalNotifications: { $sum: 1 },
        readNotifications: {
          $sum: { $cond: [{ $eq: ['$isRead', true] }, 1, 0] }
        },
        unreadNotifications: {
          $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] }
        }
      }
    }
  ]);
  
  const typeStats = await Notification.aggregate([
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const priorityStats = await Notification.aggregate([
    {
      $group: {
        _id: '$priority',
        count: { $sum: 1 }
      }
    }
  ]);
  
  res.status(200).json({
    status: 'success',
    data: {
      overview: stats[0] || {
        totalNotifications: 0,
        readNotifications: 0,
        unreadNotifications: 0
      },
      byType: typeStats,
      byPriority: priorityStats
    }
  });
});

// Get users for notification targeting (admin)
exports.getUsers = catchAsync(async (req, res, next) => {
  const { search, role, page = 1, limit = 50 } = req.query;
  const skip = (page - 1) * limit;
  
  const query = {};
  if (role) query.role = role;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }
  
  const users = await User.find(query)
    .select('name email role active')
    .sort({ name: 1 })
    .skip(skip)
    .limit(parseInt(limit));
  
  const total = await User.countDocuments(query);
  
  res.status(200).json({
    status: 'success',
    results: users.length,
    total,
    data: {
      users
    }
  });
});

// Delete notification (admin)
exports.deleteNotificationAdmin = catchAsync(async (req, res, next) => {
  const notification = await Notification.findByIdAndDelete(req.params.id);
  
  if (!notification) {
    return next(new AppError('Notification not found', 404));
  }
  
  res.status(204).json({
    status: 'success',
    data: null
  });
});