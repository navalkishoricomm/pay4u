const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.patch('/reset-password/:token', authController.resetPassword);

// Protected routes
router.use(authController.protect);
router.get('/me', authController.getMe);

// Admin only routes
router.post('/admin/reset-password', authController.restrictTo('admin'), authController.adminResetPassword);
router.get('/admin/users', authController.restrictTo('admin'), authController.getAllUsers);

module.exports = router;