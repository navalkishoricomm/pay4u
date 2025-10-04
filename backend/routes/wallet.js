const express = require('express');
const multer = require('multer');
const path = require('path');
const authController = require('../controllers/authController');
const walletController = require('../controllers/walletController');
const auditMiddleware = require('../middleware/auditMiddleware');

const router = express.Router();

// Configure multer for payment screenshot uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/payment-screenshots/'); // Make sure this directory exists
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'payment-screenshot-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed for payment screenshot upload'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Protect all routes after this middleware
router.use(authController.protect);

// Add audit logging for all wallet transaction routes
router.use(auditMiddleware.addStartTime);
router.use(auditMiddleware.captureAudit);

router.get('/my-wallet', walletController.getMyWallet);
router.get('/balance', walletController.getMyWallet);
router.post('/topup', upload.single('paymentScreenshot'), walletController.topUpWallet);
router.get('/transactions', walletController.getMyTransactions);
router.get('/my-transactions', walletController.getMyTransactions);

module.exports = router;