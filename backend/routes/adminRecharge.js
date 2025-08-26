const express = require('express');
const adminRechargeController = require('../controllers/adminRechargeController');
const authController = require('../controllers/authController');
const { body, param, query } = require('express-validator');
const validate = require('../middleware/validate');

const router = express.Router();

// Protect all routes - only authenticated users
router.use(authController.protect);

// Restrict all routes to admin only
router.use(authController.restrictTo('admin'));

// API Provider Routes
router.route('/api-providers')
  .get(
    [
      query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
      query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
      query('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
      query('service').optional().isIn(['mobile', 'dth', 'electricity', 'gas', 'water', 'broadband']).withMessage('Invalid service type')
    ],
    validate,
    adminRechargeController.getAllApiProviders
  )
  .post(
    [
      body('name')
        .notEmpty()
        .withMessage('API provider name is required')
        .isLength({ max: 50 })
        .withMessage('Name cannot exceed 50 characters')
        .matches(/^[a-zA-Z0-9_-]+$/)
        .withMessage('Name can only contain letters, numbers, hyphens, and underscores'),
      body('displayName')
        .notEmpty()
        .withMessage('Display name is required')
        .isLength({ max: 100 })
        .withMessage('Display name cannot exceed 100 characters'),
      body('baseUrl')
        .notEmpty()
        .withMessage('Base URL is required')
        .isURL()
        .withMessage('Base URL must be a valid URL'),
      body('apiKey')
        .notEmpty()
        .withMessage('API key is required'),
      body('authType')
        .optional()
        .isIn(['bearer', 'basic', 'api_key', 'custom'])
        .withMessage('Invalid auth type'),
      body('endpoints.mobileRecharge')
        .notEmpty()
        .withMessage('Mobile recharge endpoint is required'),
      body('endpoints.dthRecharge')
        .notEmpty()
        .withMessage('DTH recharge endpoint is required'),
      body('endpoints.checkStatus')
        .notEmpty()
        .withMessage('Status check endpoint is required'),
      body('requestFormat')
        .optional()
        .isIn(['json', 'form', 'xml'])
        .withMessage('Invalid request format'),
      body('responseFormat')
        .optional()
        .isIn(['json', 'xml', 'text'])
        .withMessage('Invalid response format'),
      body('timeout')
        .optional()
        .isInt({ min: 5000, max: 120000 })
        .withMessage('Timeout must be between 5000 and 120000 milliseconds'),
      body('retryAttempts')
        .optional()
        .isInt({ min: 0, max: 5 })
        .withMessage('Retry attempts must be between 0 and 5'),
      body('priority')
        .optional()
        .isInt({ min: 1, max: 10 })
        .withMessage('Priority must be between 1 and 10'),
      body('commission')
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage('Commission must be between 0 and 100'),
      body('minAmount')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Minimum amount must be positive'),
      body('maxAmount')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Maximum amount must be positive'),
      body('supportedServices')
        .optional()
        .isArray()
        .withMessage('Supported services must be an array'),
      body('supportedServices.*')
        .optional()
        .isIn(['mobile', 'dth', 'electricity', 'gas', 'water', 'broadband'])
        .withMessage('Invalid service type')
    ],
    validate,
    adminRechargeController.createApiProvider
  );

router.route('/api-providers/:id')
  .get(
    [
      param('id').isMongoId().withMessage('Invalid API provider ID')
    ],
    validate,
    adminRechargeController.getApiProvider
  )
  .patch(
    [
      param('id').isMongoId().withMessage('Invalid API provider ID'),
      body('name')
        .optional()
        .isLength({ max: 50 })
        .withMessage('Name cannot exceed 50 characters')
        .matches(/^[a-zA-Z0-9_-]+$/)
        .withMessage('Name can only contain letters, numbers, hyphens, and underscores'),
      body('displayName')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Display name cannot exceed 100 characters'),
      body('baseUrl')
        .optional()
        .isURL()
        .withMessage('Base URL must be a valid URL'),
      body('authType')
        .optional()
        .isIn(['bearer', 'basic', 'api_key', 'custom'])
        .withMessage('Invalid auth type'),
      body('requestFormat')
        .optional()
        .isIn(['json', 'form', 'xml'])
        .withMessage('Invalid request format'),
      body('responseFormat')
        .optional()
        .isIn(['json', 'xml', 'text'])
        .withMessage('Invalid response format'),
      body('timeout')
        .optional()
        .isInt({ min: 5000, max: 120000 })
        .withMessage('Timeout must be between 5000 and 120000 milliseconds'),
      body('retryAttempts')
        .optional()
        .isInt({ min: 0, max: 5 })
        .withMessage('Retry attempts must be between 0 and 5'),
      body('priority')
        .optional()
        .isInt({ min: 1, max: 10 })
        .withMessage('Priority must be between 1 and 10'),
      body('commission')
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage('Commission must be between 0 and 100'),
      body('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive must be a boolean')
    ],
    validate,
    adminRechargeController.updateApiProvider
  )
  .delete(
    [
      param('id').isMongoId().withMessage('Invalid API provider ID')
    ],
    validate,
    adminRechargeController.deleteApiProvider
  );

router.post('/api-providers/:id/test',
  [
    param('id').isMongoId().withMessage('Invalid API provider ID')
  ],
  validate,
  adminRechargeController.testApiProvider
);

// Operator Configuration Routes
router.route('/operator-configs')
  .get(
    [
      query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
      query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
      query('serviceType').optional().isIn(['mobile', 'dth', 'electricity', 'gas', 'water', 'broadband']).withMessage('Invalid service type'),
      query('processingMode').optional().isIn(['api', 'manual', 'disabled']).withMessage('Invalid processing mode'),
      query('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
    ],
    validate,
    adminRechargeController.getAllOperatorConfigs
  )
  .post(
    [
      body('operatorCode')
        .notEmpty()
        .withMessage('Operator code is required')
        .isLength({ max: 20 })
        .withMessage('Operator code cannot exceed 20 characters')
        .matches(/^[A-Z0-9_-]+$/)
        .withMessage('Operator code can only contain uppercase letters, numbers, hyphens, and underscores'),
      body('operatorName')
        .notEmpty()
        .withMessage('Operator name is required')
        .isLength({ max: 100 })
        .withMessage('Operator name cannot exceed 100 characters'),
      body('serviceType')
        .notEmpty()
        .withMessage('Service type is required')
        .isIn(['mobile', 'dth', 'electricity', 'gas', 'water', 'broadband'])
        .withMessage('Invalid service type'),
      body('processingMode')
        .notEmpty()
        .withMessage('Processing mode is required')
        .isIn(['api', 'manual', 'disabled'])
        .withMessage('Invalid processing mode'),
      body('primaryApiProvider')
        .if(body('processingMode').equals('api'))
        .notEmpty()
        .withMessage('Primary API provider is required for API processing mode')
        .isMongoId()
        .withMessage('Invalid API provider ID'),
      body('minAmount')
        .notEmpty()
        .withMessage('Minimum amount is required')
        .isFloat({ min: 1 })
        .withMessage('Minimum amount must be at least 1'),
      body('maxAmount')
        .notEmpty()
        .withMessage('Maximum amount is required')
        .isFloat({ min: 1 })
        .withMessage('Maximum amount must be at least 1'),
      body('commission')
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage('Commission must be between 0 and 100')
    ],
    validate,
    adminRechargeController.createOperatorConfig
  );

router.route('/operator-configs/:id')
  .get(
    [
      param('id').isMongoId().withMessage('Invalid operator configuration ID')
    ],
    validate,
    adminRechargeController.getOperatorConfig
  )
  .patch(
    [
      param('id').isMongoId().withMessage('Invalid operator configuration ID'),
      body('operatorCode')
        .optional()
        .isLength({ max: 20 })
        .withMessage('Operator code cannot exceed 20 characters')
        .matches(/^[A-Z0-9_-]+$/)
        .withMessage('Operator code can only contain uppercase letters, numbers, hyphens, and underscores'),
      body('operatorName')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Operator name cannot exceed 100 characters'),
      body('serviceType')
        .optional()
        .isIn(['mobile', 'dth', 'electricity', 'gas', 'water', 'broadband'])
        .withMessage('Invalid service type'),
      body('processingMode')
        .optional()
        .isIn(['api', 'manual', 'disabled'])
        .withMessage('Invalid processing mode'),
      body('primaryApiProvider')
        .optional()
        .isMongoId()
        .withMessage('Invalid API provider ID'),
      body('minAmount')
        .optional()
        .isFloat({ min: 1 })
        .withMessage('Minimum amount must be at least 1'),
      body('maxAmount')
        .optional()
        .isFloat({ min: 1 })
        .withMessage('Maximum amount must be at least 1'),
      body('commission')
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage('Commission must be between 0 and 100'),
      body('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive must be a boolean')
    ],
    validate,
    adminRechargeController.updateOperatorConfig
  )
  .delete(
    [
      param('id').isMongoId().withMessage('Invalid operator configuration ID')
    ],
    validate,
    adminRechargeController.deleteOperatorConfig
  );

// Bulk Operations
router.patch('/operator-configs/bulk-update',
  [
    body('operatorIds')
      .isArray({ min: 1 })
      .withMessage('Operator IDs must be a non-empty array'),
    body('operatorIds.*')
      .isMongoId()
      .withMessage('Invalid operator ID'),
    body('updates')
      .isObject()
      .withMessage('Updates must be an object')
  ],
  validate,
  adminRechargeController.bulkUpdateOperatorConfigs
);

router.patch('/operator-configs/bulk-toggle-status',
  [
    body('operatorIds')
      .isArray({ min: 1 })
      .withMessage('Operator IDs must be a non-empty array'),
    body('operatorIds.*')
      .isMongoId()
      .withMessage('Invalid operator ID'),
    body('isActive')
      .isBoolean()
      .withMessage('isActive must be a boolean')
  ],
  validate,
  adminRechargeController.bulkToggleOperatorStatus
);

// Statistics and Analytics
router.get('/stats/recharge',
  [
    query('startDate').optional().isISO8601().withMessage('Invalid start date'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date'),
    query('serviceType').optional().isIn(['mobile', 'dth']).withMessage('Invalid service type'),
    query('operatorCode').optional().isString().withMessage('Operator code must be a string')
  ],
  validate,
  adminRechargeController.getRechargeStats
);

router.get('/stats/api-providers',
  adminRechargeController.getApiProviderStats
);

// Manual Transaction Management
router.get('/manual-transactions/pending',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ],
  validate,
  adminRechargeController.getPendingManualTransactions
);

router.patch('/manual-transactions/:transactionId/approve',
  [
    param('transactionId').isMongoId().withMessage('Invalid transaction ID'),
    body('status')
      .notEmpty()
      .withMessage('Status is required')
      .isIn(['success', 'failed'])
      .withMessage('Status must be success or failed'),
    body('remarks')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Remarks cannot exceed 500 characters')
  ],
  validate,
  adminRechargeController.approveManualTransaction
);

router.patch('/manual-transactions/bulk-approve',
  [
    body('transactionIds')
      .isArray({ min: 1 })
      .withMessage('Transaction IDs must be a non-empty array'),
    body('transactionIds.*')
      .isMongoId()
      .withMessage('Invalid transaction ID'),
    body('status')
      .notEmpty()
      .withMessage('Status is required')
      .isIn(['success', 'failed'])
      .withMessage('Status must be success or failed'),
    body('remarks')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Remarks cannot exceed 500 characters')
  ],
  validate,
  adminRechargeController.bulkApproveTransactions
);

module.exports = router;