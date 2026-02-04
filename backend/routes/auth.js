const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.patch('/reset-password/:token', authController.resetPassword);
router.post('/password-otp', authController.protect, authController.requestPasswordOtp);
router.post('/change-password-with-otp', authController.protect, authController.changePasswordWithOtp);
router.post('/test-email', authController.protect, authController.testEmail);

// Protected routes
router.use(authController.protect);
router.get('/me', authController.getMe);

// Admin only routes
router.post('/admin/reset-password', authController.restrictTo('admin'), authController.adminResetPassword);
router.get('/admin/users', authController.restrictTo('admin'), authController.getAllUsers);
router.patch('/admin/users/:id/feature-permissions', authController.restrictTo('admin'), authController.updateUserFeaturePermissions);

module.exports = router;
