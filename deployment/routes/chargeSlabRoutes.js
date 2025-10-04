const express = require('express');
const { body, param, query } = require('express-validator');
const {
  getAllChargeSlabs,
  getChargeSlab,
  createChargeSlab,
  updateChargeSlab,
  deleteChargeSlab,
  calculateCharge,
  bulkCreateChargeSlabs
} = require('../controllers/chargeSlabController');
const authController = require('../controllers/authController');
const adminController = require('../controllers/adminController');
const handleValidationErrors = require('../middleware/validate');

const router = express.Router();

// Protect all routes - admin only
router.use(authController.protect);
router.use(adminController.restrictToAdmin);

// Validation rules
const chargeSlabValidation = [
  body('minAmount')
    .isNumeric()
    .withMessage('Minimum amount must be a number')
    .isFloat({ min: 0 })
    .withMessage('Minimum amount must be greater than or equal to 0'),
  body('maxAmount')
    .isNumeric()
    .withMessage('Maximum amount must be a number')
    .isFloat({ min: 1 })
    .withMessage('Maximum amount must be greater than 0'),
  body('charge')
    .isNumeric()
    .withMessage('Charge must be a number')
    .isFloat({ min: 0 })
    .withMessage('Charge must be greater than or equal to 0'),
  body('transferMode')
    .optional()
    .isIn(['IMPS', 'NEFT'])
    .withMessage('Transfer mode must be either IMPS or NEFT')
];

const calculateChargeValidation = [
  body('amount')
    .isNumeric()
    .withMessage('Amount must be a number')
    .isFloat({ min: 1 })
    .withMessage('Amount must be greater than 0'),
  body('transferMode')
    .optional()
    .isIn(['IMPS', 'NEFT'])
    .withMessage('Transfer mode must be either IMPS or NEFT')
];

const bulkCreateValidation = [
  body('slabs')
    .isArray({ min: 1 })
    .withMessage('Slabs must be a non-empty array'),
  body('slabs.*.minAmount')
    .isNumeric()
    .withMessage('Each slab must have a valid minimum amount')
    .isFloat({ min: 0 })
    .withMessage('Minimum amount must be greater than or equal to 0'),
  body('slabs.*.maxAmount')
    .isNumeric()
    .withMessage('Each slab must have a valid maximum amount')
    .isFloat({ min: 1 })
    .withMessage('Maximum amount must be greater than 0'),
  body('slabs.*.charge')
    .isNumeric()
    .withMessage('Each slab must have a valid charge')
    .isFloat({ min: 0 })
    .withMessage('Charge must be greater than or equal to 0'),
  body('slabs.*.transferMode')
    .optional()
    .isIn(['IMPS', 'NEFT'])
    .withMessage('Transfer mode must be either IMPS or NEFT')
];

// Routes
router.route('/')
  .get(
    [
      query('transferMode').optional().isIn(['IMPS', 'NEFT']).withMessage('Invalid transfer mode'),
      query('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
    ],
    handleValidationErrors,
    getAllChargeSlabs
  )
  .post(
    chargeSlabValidation,
    handleValidationErrors,
    createChargeSlab
  );

router.post('/bulk',
  bulkCreateValidation,
  handleValidationErrors,
  bulkCreateChargeSlabs
);

router.post('/calculate',
  calculateChargeValidation,
  handleValidationErrors,
  calculateCharge
);

router.route('/:id')
  .get(
    [
      param('id').isMongoId().withMessage('Invalid charge slab ID')
    ],
    handleValidationErrors,
    getChargeSlab
  )
  .put(
    [
      param('id').isMongoId().withMessage('Invalid charge slab ID'),
      body('minAmount').optional().isNumeric().isFloat({ min: 0 }).withMessage('Invalid minimum amount'),
      body('maxAmount').optional().isNumeric().isFloat({ min: 1 }).withMessage('Invalid maximum amount'),
      body('charge').optional().isNumeric().isFloat({ min: 0 }).withMessage('Invalid charge'),
      body('transferMode').optional().isIn(['IMPS', 'NEFT']).withMessage('Invalid transfer mode'),
      body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
    ],
    handleValidationErrors,
    updateChargeSlab
  )
  .delete(
    [
      param('id').isMongoId().withMessage('Invalid charge slab ID')
    ],
    handleValidationErrors,
    deleteChargeSlab
  );

module.exports = router;