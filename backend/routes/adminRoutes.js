const express = require('express');
const adminController = require('../controllers/adminController');
const authController = require('../controllers/authController');

const router = express.Router();

// Protect all routes after this middleware - requires authentication
router.use(authController.protect);

// Restrict all routes to admin only
router.use(adminController.restrictToAdmin);

// Admin dashboard statistics
router.get('/dashboard-stats', adminController.getDashboardStats);

// Transaction management routes
router.get('/transactions', adminController.getAllTransactions);
router.get('/transactions/pending', adminController.getPendingTransactions);
router.patch('/transactions/:id', adminController.updateTransactionStatus);
router.patch('/transactions/bulk-approve', adminController.bulkApproveTransactions);
router.patch('/transactions/bulk-reject', adminController.bulkRejectTransactions);

// User management routes
router.get('/users', adminController.getAllUsers);

// Notification routes
router.post('/notifications/send', adminController.sendUserNotification);

// Voucher order management routes
router.get('/voucher-orders', adminController.getPendingVoucherOrders);
router.get('/voucher-orders/:id', adminController.getVoucherOrder);
router.patch('/voucher-orders/:id/approve', adminController.approveVoucherOrder);
router.patch('/voucher-orders/:id/reject', adminController.rejectVoucherOrder);
router.post('/voucher-orders/:id/upload-file', adminController.uploadVoucherFile);
router.get('/voucher-orders/:id/download-file', adminController.downloadVoucherFile);

module.exports = router;