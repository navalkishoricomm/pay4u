const express = require('express');
const { body } = require('express-validator');
const commissionController = require('../controllers/commissionController');
const { protect, restrictTo } = require('../controllers/authController');

const router = express.Router();

// Validation middleware for commission creation/update
const commissionValidation = [
  body('operator')
    .notEmpty()
    .withMessage('Operator name is required')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Operator name must be between 2 and 50 characters'),
  
  body('transactionType')
    .isIn(['mobile-recharge', 'dth-recharge', 'bill-payment'])
    .withMessage('Invalid transaction type'),
  
  body('commissionType')
    .isIn(['percentage', 'fixed'])
    .withMessage('Commission type must be either percentage or fixed'),
  
  body('commissionValue')
    .isFloat({ min: 0 })
    .withMessage('Commission value must be a positive number'),
  
  body('minCommission')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum commission must be a positive number'),
  
  body('maxCommission')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum commission must be a positive number'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description cannot exceed 200 characters'),
];

// Protect all routes - require authentication
router.use(protect);

// Public routes for all authenticated users
router.get('/preview', commissionController.getCommissionPreview);
router.get('/operators', commissionController.getOperators);

// Admin-only routes
router.use(restrictTo('admin'));

router
  .route('/')
  .get(commissionController.getAllCommissions)
  .post(commissionValidation, commissionController.createCommission);

router
  .route('/:id')
  .get(commissionController.getCommission)
  .patch(commissionValidation, commissionController.updateCommission)
  .delete(commissionController.deleteCommission);

router.patch('/:id/toggle-status', commissionController.toggleCommissionStatus);

module.exports = router;