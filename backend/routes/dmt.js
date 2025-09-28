const express = require('express');
const router = express.Router();
const {
  registerRemitter,
  performRemitterKyc,
  registerBeneficiary,
  verifyBeneficiary,
  processTransaction,
  getTransactionStatus,
  getRemitterBeneficiaries,
  getUserTransactions,
  getTransactionStats,
  deleteBeneficiary,
  calculateCharges,
  fixBeneficiaries,
  getTransactionReceipt
} = require('../controllers/dmtController');
const authController = require('../controllers/authController');
const auditMiddleware = require('../middleware/auditMiddleware');
const { body, param, query, validationResult } = require('express-validator');

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array());
    console.log('Request body:', req.body);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Remitter registration validation
const remitterRegistrationValidation = [
  body('mobile')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Invalid mobile number format'),
  body('firstName')
    .notEmpty()
    .withMessage('First name is required'),
  body('lastName')
    .notEmpty()
    .withMessage('Last name is required'),
  body('address')
    .notEmpty()
    .withMessage('Address is required'),
  body('pincode')
    .matches(/^\d{6}$/)
    .withMessage('Invalid pincode format'),
  body('dateOfBirth')
    .notEmpty()
    .withMessage('Date of birth is required'),
  body('gstState')
    .optional()
];

// Remitter KYC validation
const remitterKycValidation = [
  body('kycType')
    .isIn(['iris', 'face_auth', 'fingerprint'])
    .withMessage('Invalid KYC type'),
  body('piddata')
    .notEmpty()
    .withMessage('PID data is required'),
  body('wadh')
    .optional()
    .isString()
    .withMessage('WADH must be a string')
];

// Beneficiary registration validation
const beneficiaryRegistrationValidation = [
  body('accountNumber')
    .isLength({ min: 9, max: 18 })
    .isNumeric()
    .withMessage('Invalid account number format'),
  body('ifscCode')
    .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/)
    .withMessage('Invalid IFSC code format'),
  body('accountHolderName')
    .isLength({ min: 2, max: 100 })
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Invalid account holder name'),
  body('bankName')
    .isLength({ min: 2, max: 100 })
    .withMessage('Bank name must be 2-100 characters'),
  body('mobile')
    .optional()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Invalid mobile number format')
];

// Transaction validation
const transactionValidation = [
  body('beneficiaryId')
    .isMongoId()
    .withMessage('Invalid beneficiary ID'),
  body('amount')
    .isNumeric()
    .isFloat({ min: 100, max: 25000 })
    .withMessage('Amount must be between ₹100 and ₹25,000'),
  body('transferMode')
    .optional()
    .isIn(['IMPS', 'NEFT'])
    .withMessage('Transfer mode must be IMPS or NEFT')
];

// Routes

// Protected routes - Apply authentication to all routes
router.use(authController.protect);

// Add audit logging for all DMT transaction routes
router.use(auditMiddleware.addStartTime);
router.use(auditMiddleware.captureAudit);

// @route   POST /api/dmt/remitter/register
// @desc    Register or verify remitter
// @access  Private
router.post('/remitter/register', (req, res, next) => {
  console.log('=== REMITTER REGISTRATION REQUEST ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('Request headers:', req.headers);
  console.log('User from auth:', req.user);
  next();
}, remitterRegistrationValidation, handleValidationErrors, registerRemitter);

// @route   POST /api/dmt/remitter/verify-mobile
// @desc    Check if remitter exists by mobile number
// @access  Private
router.post('/remitter/verify-mobile', [
  body('mobile')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Invalid mobile number format'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { mobile } = req.body;
    const DmtRemitter = require('../models/DmtRemitter');
    const remitter = await DmtRemitter.findByMobile(mobile);
    
    if (remitter) {
      // Allow any user to use any verified remitter number
      return res.status(200).json({
        success: true,
        data: {
          exists: true,
          canUse: true,
          remitter: {
            id: remitter._id,
            remitterId: remitter._id,
            mobile: remitter.mobile,
            firstName: remitter.firstName,
            lastName: remitter.lastName,
            kycStatus: remitter.kycStatus,
            monthlyLimit: remitter.monthlyLimit,
            monthlyUsed: remitter.monthlyUsed,
            remainingLimit: remitter.getRemainingMonthlyLimit(),
            isOwner: remitter.userId.toString() === req.user.id
          }
        }
      });
    } else {
      return res.status(200).json({
        success: true,
        data: {
          exists: false,
          message: 'Mobile number not registered. Please register as remitter.'
        }
      });
    }
  } catch (error) {
    console.error('Error verifying mobile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/dmt/remitter/status
// @desc    Get remitter status for authenticated user
// @access  Private
router.get('/remitter/status', async (req, res) => {
  try {
    const userId = req.user.id;
    const DmtRemitter = require('../models/DmtRemitter');
    const remitter = await DmtRemitter.findOne({ userId });
    
    if (!remitter) {
      return res.status(404).json({
        success: false,
        message: 'Remitter not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        remitter: {
          id: remitter._id,
          remitterId: remitter._id,
          mobile: remitter.mobile,
          firstName: remitter.firstName,
          lastName: remitter.lastName,
          kycStatus: remitter.kycStatus,
          monthlyLimit: remitter.monthlyLimit,
          monthlyUsed: remitter.monthlyUsed,
          remainingLimit: remitter.getRemainingMonthlyLimit()
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});



// @route   POST /api/dmt/remitter/:remitterId/kyc
// @desc    Perform remitter KYC
// @access  Private
router.post('/remitter/:remitterId/kyc', [
  param('remitterId').isMongoId().withMessage('Invalid remitter ID'),
  ...remitterKycValidation
], handleValidationErrors, performRemitterKyc);

// @route   POST /api/dmt/beneficiary/register
// @desc    Register beneficiary
// @access  Private
router.post('/beneficiary/register', [
  body('remitterId').optional().isMongoId().withMessage('Invalid remitter ID'),
  ...beneficiaryRegistrationValidation
], handleValidationErrors, registerBeneficiary);

// @route   POST /api/dmt/beneficiary/:beneficiaryId/verify
// @desc    Verify beneficiary account (Penny Drop)
// @access  Private
router.post('/beneficiary/:beneficiaryId/verify', [
  param('beneficiaryId').isMongoId().withMessage('Invalid beneficiary ID')
], handleValidationErrors, verifyBeneficiary);

// @route   DELETE /api/dmt/beneficiary/:beneficiaryId
// @desc    Delete beneficiary
// @access  Private
router.delete('/beneficiary/:beneficiaryId', [
  param('beneficiaryId').isMongoId().withMessage('Invalid beneficiary ID')
], handleValidationErrors, deleteBeneficiary);

// @route   POST /api/dmt/transaction
// @desc    Process money transfer transaction
// @access  Private
router.post('/transaction', [
  body('remitterId').isMongoId().withMessage('Invalid remitter ID'),
  ...transactionValidation
], handleValidationErrors, processTransaction);

// @route   GET /api/dmt/transaction/:transactionId/status
// @desc    Get transaction status
// @access  Private
router.get('/transaction/:transactionId/status', [
  param('transactionId').notEmpty().withMessage('Transaction ID is required')
], handleValidationErrors, getTransactionStatus);

// @route   GET /api/dmt/remitter/:remitterId/beneficiaries
// @desc    Get remitter beneficiaries
// @access  Private
router.get('/remitter/:remitterId/beneficiaries', [
  param('remitterId').isMongoId().withMessage('Invalid remitter ID')
], handleValidationErrors, getRemitterBeneficiaries);

// @route   GET /api/dmt/transactions
// @desc    Get user transactions
// @access  Private
router.get('/transactions', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('status').optional().isIn(['pending', 'processing', 'success', 'failed', 'refunded']).withMessage('Invalid status'),
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format')
], handleValidationErrors, getUserTransactions);

// @route   GET /api/dmt/stats
// @desc    Get transaction statistics
// @access  Private
router.get('/stats', [
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format')
], handleValidationErrors, getTransactionStats);

// @route   POST /api/dmt/calculate-charges
// @desc    Calculate charges for money transfer
// @access  Private
router.post('/calculate-charges', [
  body('amount').isNumeric().withMessage('Amount must be a number').isFloat({ min: 1 }).withMessage('Amount must be greater than 0'),
  body('transferMode').optional().isIn(['IMPS', 'NEFT']).withMessage('Transfer mode must be either IMPS or NEFT')
], handleValidationErrors, calculateCharges);

// @route   POST /api/dmt/fix-beneficiaries
// @desc    Fix beneficiaries missing paysprintBeneficiaryId
// @access  Private
router.post('/fix-beneficiaries', authController.protect, fixBeneficiaries);

// @route   GET /api/dmt/transaction/:transactionId/receipt
// @desc    Get transaction receipt
// @access  Private
router.get('/transaction/:transactionId/receipt', [
  param('transactionId').notEmpty().withMessage('Transaction ID is required')
], handleValidationErrors, authController.protect, getTransactionReceipt);

module.exports = router;