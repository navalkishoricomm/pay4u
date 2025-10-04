const express = require('express');
const {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getAllNotifications,
  createSingleNotification,
  sendBulkNotifications,
  getNotificationStats,
  getUsers,
  deleteNotificationAdmin
} = require('../controllers/notificationController');
const authController = require('../controllers/authController');

const router = express.Router();

// Protect all routes after this middleware
router.use(authController.protect);

// USER ROUTES
// Get user's notifications
router.get('/', getMyNotifications);

// Mark notification as read
router.patch('/:id/read', markAsRead);

// Mark all notifications as read
router.patch('/mark-all-read', markAllAsRead);

// Delete notification
router.delete('/:id', deleteNotification);

// ADMIN ONLY ROUTES
// Restrict to admin only
router.use(authController.restrictTo('admin'));

// Get all notifications (admin)
router.get('/admin/all', getAllNotifications);

// Get notification statistics (admin)
router.get('/admin/stats', getNotificationStats);

// Get users for targeting (admin)
router.get('/admin/users', getUsers);

// Create single notification (admin)
router.post('/admin/create', createSingleNotification);

// Send bulk notifications (admin)
router.post('/admin/bulk', sendBulkNotifications);

// Delete notification (admin)
router.delete('/admin/:id', deleteNotificationAdmin);

module.exports = router;