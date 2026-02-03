const express = require('express');
const router = express.Router();
const {
  mobileRecharge,
  dthRecharge,
  billPayment,
  getRechargeHistory,
  getRechargeStatus,
  getOperators,
  getCircles
} = require('../controllers/rechargeController');
const authController = require('../controllers/authController');
const { body, param, query, validationResult } = require('express-validator');
const auditMiddleware = require('../middleware/auditMiddleware');

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Mobile recharge validation
const mobileRechargeValidation = [
  body('mobileNumber')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Invalid mobile number format'),
  body('operator')
    .notEmpty()
    .withMessage('Operator is required'),
  body('amount')
    .isNumeric()
    .isFloat({ min: 1 })
    .withMessage('Amount must be a positive number'),
  body('circle')
    .notEmpty()
    .withMessage('Circle is required')
];

// DTH recharge validation
const dthRechargeValidation = [
  body('customerNumber')
    .isLength({ min: 8, max: 15 })
    .withMessage('Customer number must be 8-15 characters'),
  body('operator')
    .notEmpty()
    .withMessage('Operator is required'),
  body('amount')
    .isNumeric()
    .isFloat({ min: 1 })
    .withMessage('Amount must be a positive number')
];

// Bill payment validation
const validServiceTypes = ['electricity', 'water', 'gas', 'broadband', 'loan', 'insurance', 'landline', 'creditcard', 'postpaid', 'cylinder'];
const billPaymentValidation = [
  body('serviceType')
    .isIn(validServiceTypes)
    .withMessage('Invalid service type'),
  body('customerNumber')
    .isLength({ min: 4, max: 20 })
    .withMessage('Customer number must be 4-20 characters'),
  body('operator')
    .notEmpty()
    .withMessage('Operator is required'),
  body('amount')
    .isNumeric()
    .isFloat({ min: 50, max: 50000 })
    .withMessage('Amount must be between ₹50 and ₹50,000')
];

// Routes

// Protected routes
router.use(authController.protect);

// Add audit logging for all recharge transaction routes
router.use(auditMiddleware.addStartTime);
router.use(auditMiddleware.captureAudit);

// @route   POST /api/recharge/mobile
// @desc    Process mobile recharge
// @access  Private
router.post('/mobile', mobileRechargeValidation, handleValidationErrors, mobileRecharge);

// @route   POST /api/recharge/dth
// @desc    Process DTH recharge
// @access  Private
router.post('/dth', dthRechargeValidation, handleValidationErrors, dthRecharge);

// @route   POST /api/recharge/bill-payment
// @desc    Process bill payment for utilities and other services
// @access  Private
router.post('/bill-payment', billPaymentValidation, handleValidationErrors, billPayment);

// @route   GET /api/recharge/history
// @desc    Get recharge history
// @access  Private
router.get('/history', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('type').optional().isIn(['mobile', 'dth']).withMessage('Type must be mobile or dth')
], handleValidationErrors, getRechargeHistory);

// @route   GET /api/recharge/status/:transactionId
// @desc    Get recharge transaction status
// @access  Private
router.get('/status/:transactionId', [
  param('transactionId').notEmpty().withMessage('Transaction ID is required')
], handleValidationErrors, getRechargeStatus);

// @route   GET /api/recharge/operators
// @desc    Get list of operators
// @access  Private
router.get('/operators', [
  query('type').optional().isIn(['mobile', 'dth', 'electricity', 'water', 'gas', 'broadband', 'landline', 'postpaid', 'creditcard', 'loan', 'insurance', 'cylinder']).withMessage('Invalid type')
], handleValidationErrors, getOperators);

// @route   GET /api/recharge/circles
// @desc    Get list of circles for mobile operators
// @access  Private
router.get('/circles', getCircles);

module.exports = router;