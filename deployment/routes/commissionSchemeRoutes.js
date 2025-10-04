const express = require('express');
const { body } = require('express-validator');
const commissionSchemeController = require('../controllers/commissionSchemeController');
const { protect, restrictTo } = require('../controllers/authController');

const router = express.Router();

// Protect all routes - only authenticated users
router.use(protect);

// Restrict all routes to admin only
router.use(restrictTo('admin'));

// Commission scheme validation middleware
const validateCommissionScheme = [
  body('schemeName')
    .notEmpty()
    .withMessage('Scheme name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Scheme name must be between 2 and 100 characters'),
  body('commissions')
    .isArray({ min: 1 })
    .withMessage('At least one commission rule is required'),
  body('commissions.*.operator')
    .notEmpty()
    .withMessage('Operator is required for each commission rule'),
  body('commissions.*.transactionType')
    .isIn(['mobile-recharge', 'dth-recharge', 'bill-payment'])
    .withMessage('Invalid transaction type'),
  body('commissions.*.commissionType')
    .isIn(['percentage', 'fixed'])
    .withMessage('Commission type must be percentage or fixed'),
  body('commissions.*.commissionValue')
    .isFloat({ min: 0 })
    .withMessage('Commission value must be a positive number'),
  body('commissions.*.minCommission')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum commission must be a positive number'),
  body('commissions.*.maxCommission')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum commission must be a positive number'),
];

// User commission validation middleware
const validateUserCommission = [
  body('commissionType')
    .isIn(['percentage', 'fixed'])
    .withMessage('Commission type must be percentage or fixed'),
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
];

// Commission scheme routes
router
  .route('/')
  .get(commissionSchemeController.getAllCommissionSchemes)
  .post(validateCommissionScheme, commissionSchemeController.createCommissionScheme);

router
  .route('/:id')
  .get(commissionSchemeController.getCommissionScheme)
  .patch(commissionSchemeController.updateCommissionScheme)
  .delete(commissionSchemeController.deleteCommissionScheme);

// Set default scheme
router.patch('/:id/set-default', commissionSchemeController.setDefaultScheme);

// Apply scheme to user
router.post('/:id/apply-to-user', commissionSchemeController.applySchemeToUser);

// User commission management routes
router.get('/users/:userId/commissions', commissionSchemeController.getUserCommissions);

router
  .route('/users/:userId/commissions')
  .post(validateUserCommission, commissionSchemeController.addUserCommission);

router
  .route('/users/:userId/commissions/:commissionId')
  .patch(validateUserCommission, commissionSchemeController.updateUserCommission)
  .delete(commissionSchemeController.removeUserCommission);

// Commission preview routes
router.get('/preview/user', commissionSchemeController.getUserCommissionPreview);

module.exports = router;