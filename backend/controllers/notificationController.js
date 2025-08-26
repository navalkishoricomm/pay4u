const Notification = require('../models/Notification');
const mongoose = require('mongoose');

// Create a new notification
exports.createNotification = async (userId, title, message, type = 'general', relatedTransaction = null, priority = 'medium') => {
  try {
    const notification = await Notification.create({
      user: userId,
      title,
      message,
      type,
      relatedTransaction,
      priority,
    });
    
    console.log(`Notification created for user ${userId}: ${title}`);
    
    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error.message);
    throw error;
  }
};

// Get notifications for the logged-in user
exports.getMyNotifications = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Failed to fetch notifications:', error.message);
    
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

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