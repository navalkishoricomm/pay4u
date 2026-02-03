const express = require('express');
const router = express.Router();
const { protect } = require('../controllers/authController');
const auditMiddleware = require('../middleware/auditMiddleware');
const bbpsController = require('../controllers/bbpsController');

// BBPS bill fetch route
router.post('/bills/fetch', protect, auditMiddleware.captureAudit, bbpsController.fetchBill);

module.exports = router;