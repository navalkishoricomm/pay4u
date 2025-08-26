const express = require('express');
const {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require('../controllers/notificationController');
const authController = require('../controllers/authController');

const router = express.Router();

// Protect all routes after this middleware
router.use(authController.protect);

// Get user's notifications
router.get('/', getMyNotifications);

// Mark notification as read
router.patch('/:id/read', markAsRead);

// Mark all notifications as read
router.patch('/mark-all-read', markAllAsRead);

// Delete notification
router.delete('/:id', deleteNotification);

module.exports = router;