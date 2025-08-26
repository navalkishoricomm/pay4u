const express = require('express');
const authController = require('../controllers/authController');
const walletController = require('../controllers/walletController');

const router = express.Router();

// Protect all routes after this middleware
router.use(authController.protect);

router.get('/my-wallet', walletController.getMyWallet);
router.get('/balance', walletController.getMyWallet);
router.post('/topup', walletController.topUpWallet);
router.get('/transactions', walletController.getMyTransactions);
router.get('/my-transactions', walletController.getMyTransactions);

module.exports = router;