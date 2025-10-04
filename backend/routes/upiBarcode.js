const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const upiBarcodeController = require('../controllers/upiBarcodeController');
const authController = require('../controllers/authController');
const auditMiddleware = require('../middleware/auditMiddleware');

const router = express.Router();

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', 'uploads', 'admin-barcodes');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for barcode uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, 'admin-barcode-' + uniqueSuffix + extension);
  }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and GIF images are allowed.'), false);
  }
};

// Configure multer upload
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Middleware to check admin role
const restrictToAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      status: 'fail',
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
};

// Public routes (for users to get barcodes)
router.get('/active', upiBarcodeController.getActiveBarcodes);
router.get('/default', upiBarcodeController.getDefaultBarcode);

// Protected admin routes
router.use(authController.protect); // Protect all routes below

// Admin-only routes
router.use(restrictToAdmin); // Restrict to admin only
router.use(auditMiddleware.captureAudit); // Add audit logging

// CRUD operations for admin
router
  .route('/')
  .get(upiBarcodeController.getAllBarcodes)
  .post(upload.single('barcodeImage'), upiBarcodeController.uploadBarcode);

router
  .route('/:id')
  .patch(upiBarcodeController.updateBarcode)
  .delete(upiBarcodeController.deleteBarcode);

// Special admin operations
router.patch('/:id/set-default', upiBarcodeController.setDefaultBarcode);
router.get('/admin/stats', upiBarcodeController.getBarcodeStats);

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        status: 'fail',
        message: 'File size too large. Maximum size is 5MB.'
      });
    }
    return res.status(400).json({
      status: 'fail',
      message: 'File upload error: ' + error.message
    });
  }
  
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
  
  next(error);
});

module.exports = router;