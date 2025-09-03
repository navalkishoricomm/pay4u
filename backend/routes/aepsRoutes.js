const express = require('express');
const aepsController = require('../controllers/aepsController');
const authController = require('../controllers/authController');
const { body, param, query } = require('express-validator');
const validate = require('../middleware/validate');
const auditMiddleware = require('../middleware/auditMiddleware');

const router = express.Router();

// Protect all routes after this middleware
router.use(authController.protect);

// Add audit logging for all AEPS transaction routes
router.use(auditMiddleware.addStartTime);
router.use(auditMiddleware.captureAudit);

// Common validation rules
const aadhaarValidation = body('aadhaarNumber')
  .isLength({ min: 12, max: 12 })
  .isNumeric()
  .withMessage('Aadhaar number must be exactly 12 digits');

const mobileValidation = body('customerMobile')
  .isMobilePhone('en-IN')
  .withMessage('Please provide a valid Indian mobile number');

const bankValidation = [
  body('bankIin')
    .notEmpty()
    .withMessage('Bank IIN is required'),
  body('bankName')
    .notEmpty()
    .withMessage('Bank name is required')
];

const biometricValidation = [
  body('biometricType')
    .isIn(['fingerprint', 'iris', 'face_auth'])
    .withMessage('Biometric type must be fingerprint, iris, or face_auth'),
  body('pidData')
    .notEmpty()
    .withMessage('PID data is required for biometric authentication'),
  body('wadh')
    .notEmpty()
    .withMessage('WADH is required for biometric authentication')
];

const merchantValidation = [
  body('merchantId')
    .optional()
    .isAlphanumeric()
    .withMessage('Merchant ID must be alphanumeric'),
  body('terminalId')
    .optional()
    .isAlphanumeric()
    .withMessage('Terminal ID must be alphanumeric')
];

// Balance Inquiry Route
router.post('/balance-inquiry', [
  aadhaarValidation,
  mobileValidation,
  ...bankValidation,
  ...biometricValidation,
  ...merchantValidation,
  validate
], aepsController.balanceInquiry);

// Cash Withdrawal Route
router.post('/cash-withdrawal', [
  aadhaarValidation,
  mobileValidation,
  body('amount')
    .isFloat({ min: 50, max: 10000 })
    .withMessage('Withdrawal amount must be between ₹50 and ₹10,000')
    .custom((value) => {
      if (value % 50 !== 0) {
        throw new Error('Withdrawal amount must be in multiples of ₹50');
      }
      return true;
    }),
  ...bankValidation,
  ...biometricValidation,
  ...merchantValidation,
  validate
], aepsController.cashWithdrawal);

// Cash Deposit Route
router.post('/cash-deposit', [
  aadhaarValidation,
  mobileValidation,
  body('amount')
    .isFloat({ min: 1, max: 50000 })
    .withMessage('Deposit amount must be between ₹1 and ₹50,000'),
  ...bankValidation,
  ...biometricValidation,
  ...merchantValidation,
  validate
], aepsController.cashDeposit);

// Mini Statement Route
router.post('/mini-statement', [
  aadhaarValidation,
  mobileValidation,
  ...bankValidation,
  ...biometricValidation,
  ...merchantValidation,
  validate
], aepsController.miniStatement);

// Get Transaction Status Route
router.get('/transaction/:transactionId', [
  param('transactionId')
    .notEmpty()
    .withMessage('Transaction ID is required'),
  validate
], aepsController.getTransactionStatus);

// Get User Transactions Route
router.get('/transactions', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('transactionType')
    .optional()
    .isIn(['balance_inquiry', 'cash_withdrawal', 'cash_deposit', 'mini_statement'])
    .withMessage('Invalid transaction type'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be in ISO 8601 format'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be in ISO 8601 format'),
  validate
], aepsController.getUserTransactions);

// Get AEPS Statistics Route
router.get('/stats', [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be in ISO 8601 format'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be in ISO 8601 format'),
  validate
], aepsController.getAepsStats);

// Get Bank List Route
router.get('/banks', aepsController.getBankList);

// Check Service Status Route
router.get('/service-status', aepsController.checkServiceStatus);

// Validate Aadhaar Route
router.post('/validate-aadhaar', [
  aadhaarValidation,
  validate
], aepsController.validateAadhaar);

// Get Wallet Balance Route
router.get('/wallet-balance', aepsController.getWalletBalance);

// Additional validation middleware for specific routes
router.use('/cash-withdrawal', (req, res, next) => {
  const { amount } = req.body;
  const withdrawalAmount = parseFloat(amount);
  
  // Additional business logic validation
  if (withdrawalAmount > 2000) {
    // For amounts above ₹2000, additional verification might be needed
    req.requiresAdditionalVerification = true;
  }
  
  next();
});

router.use('/cash-deposit', (req, res, next) => {
  const { amount } = req.body;
  const depositAmount = parseFloat(amount);
  
  // Additional business logic validation
  if (depositAmount > 10000) {
    // For amounts above ₹10000, additional verification might be needed
    req.requiresAdditionalVerification = true;
  }
  
  next();
});

// Error handling middleware for AEPS routes
router.use((error, req, res, next) => {
  console.error('AEPS Route Error:', error);
  
  // Handle specific AEPS errors
  if (error.message.includes('biometric')) {
    return res.status(400).json({
      status: 'error',
      message: 'Biometric authentication failed. Please try again.',
      error: error.message
    });
  }
  
  if (error.message.includes('Aadhaar')) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid Aadhaar number. Please check and try again.',
      error: error.message
    });
  }
  
  if (error.message.includes('amount')) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid transaction amount. Please check the limits.',
      error: error.message
    });
  }
  
  // Generic error response
  res.status(500).json({
    status: 'error',
    message: 'An error occurred while processing your AEPS request.',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
  });
});

module.exports = router;

// Route Documentation
/*
AEPS Routes:

1. POST /api/v1/aeps/balance-inquiry
   - Purpose: Check account balance using Aadhaar and biometric authentication
   - Required: aadhaarNumber, customerMobile, bankIin, bankName, biometricType, pidData, wadh
   - Optional: merchantId, terminalId

2. POST /api/v1/aeps/cash-withdrawal
   - Purpose: Withdraw cash from customer's account
   - Required: aadhaarNumber, customerMobile, amount, bankIin, bankName, biometricType, pidData, wadh
   - Optional: merchantId, terminalId
   - Limits: ₹50 - ₹10,000 (multiples of ₹50)

3. POST /api/v1/aeps/cash-deposit
   - Purpose: Deposit cash to customer's account
   - Required: aadhaarNumber, customerMobile, amount, bankIin, bankName, biometricType, pidData, wadh
   - Optional: merchantId, terminalId
   - Limits: ₹1 - ₹50,000

4. POST /api/v1/aeps/mini-statement
   - Purpose: Get mini statement of customer's account
   - Required: aadhaarNumber, customerMobile, bankIin, bankName, biometricType, pidData, wadh
   - Optional: merchantId, terminalId

5. GET /api/v1/aeps/transaction/:transactionId
   - Purpose: Get status of a specific transaction
   - Required: transactionId (URL parameter)

6. GET /api/v1/aeps/transactions
   - Purpose: Get user's AEPS transaction history
   - Optional: page, limit, transactionType, startDate, endDate

7. GET /api/v1/aeps/stats
   - Purpose: Get AEPS statistics for the user
   - Optional: startDate, endDate

8. GET /api/v1/aeps/banks
   - Purpose: Get list of supported banks for AEPS

9. GET /api/v1/aeps/service-status
   - Purpose: Check if AEPS service is active

10. POST /api/v1/aeps/validate-aadhaar
    - Purpose: Validate Aadhaar number format and checksum
    - Required: aadhaarNumber

11. GET /api/v1/aeps/wallet-balance
    - Purpose: Get user's wallet balance for AEPS charges

All routes require authentication (JWT token).
Biometric data (pidData, wadh) should be encrypted and properly formatted.
*/