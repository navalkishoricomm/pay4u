const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const adminController = require('../controllers/adminController');
const authController = require('../controllers/authController');

const router = express.Router();

// Configure multer for KYC uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/kyc/';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)){
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'kyc-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept images and PDFs
  if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only image and PDF files are allowed for KYC documents'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Protect all routes after this middleware - requires authentication
router.use(authController.protect);

// Restrict all routes to admin only
router.use(adminController.restrictToAdmin);

// Admin dashboard statistics
router.get('/dashboard-stats', adminController.getDashboardStats);

// Transaction management routes
router.get('/transactions', adminController.getAllTransactions);
router.get('/transactions/pending', adminController.getPendingTransactions);
router.patch('/transactions/bulk-approve', adminController.bulkApproveTransactions);
router.patch('/transactions/bulk-reject', adminController.bulkRejectTransactions);
router.patch('/transactions/:id', adminController.updateTransactionStatus);

// User management routes
router.get('/users', adminController.getAllUsers);
router.post('/users/create', upload.fields([
  { name: 'panImage', maxCount: 1 },
  { name: 'aadharFrontImage', maxCount: 1 },
  { name: 'aadharBackImage', maxCount: 1 }
]), adminController.createUser);

router.patch('/users/:id/kyc', upload.fields([
  { name: 'panImage', maxCount: 1 },
  { name: 'aadharFrontImage', maxCount: 1 },
  { name: 'aadharBackImage', maxCount: 1 }
]), adminController.updateUserKyc);


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