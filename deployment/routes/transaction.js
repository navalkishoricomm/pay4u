const express = require('express');
const authController = require('../controllers/authController');
const transactionController = require('../controllers/transactionController');
const auditMiddleware = require('../middleware/auditMiddleware');

const router = express.Router();

// Protect all routes after this middleware
router.use(authController.protect);

// Add audit logging for all transaction routes
router.use(auditMiddleware.addStartTime);
router.use(auditMiddleware.captureAudit);

router.get('/', transactionController.getUserTransactions);
router.post('/process', transactionController.processTransactionRequest);
router.post('/mobile-recharge', transactionController.mobileRecharge);
router.post('/dth-recharge', transactionController.dthRecharge);
router.post('/bill-payment', transactionController.billPayment);
router.get('/status-updates', transactionController.getStatusUpdates);
router.get('/:id', transactionController.getTransaction);

module.exports = router;