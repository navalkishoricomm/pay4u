const express = require('express');
const router = express.Router();
const enkashController = require('../controllers/enkashController');
const authController = require('../controllers/authController');

// Protect routes
router.use(authController.protect);
// Restrict to admin for now, or open to specific roles
// router.use(authController.restrictTo('admin')); 

router.post('/cards/balance', enkashController.getCardBalance);
router.post('/cards/create', enkashController.createCard);
router.get('/cards', enkashController.getAllCards);

router.post('/rewards/issue', enkashController.issueReward);
router.get('/rewards', enkashController.getAllRewards);

module.exports = router;
