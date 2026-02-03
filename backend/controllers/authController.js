const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Wallet = require('../models/Wallet');

// Helper function to sign JWT token
const signToken = (id) => {
  // Handle different JWT expiration formats
  let expiresIn = process.env.JWT_EXPIRES_IN || process.env.JWT_EXPIRE || '604800';
  
  // Convert string numbers to actual numbers for JWT library compatibility
  if (/^\d+$/.test(expiresIn)) {
    expiresIn = parseInt(expiresIn, 10);
  }
  
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: expiresIn,
  });
};

// Helper function to create and send token
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

// Register a new user
exports.signup = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: 'fail',
        message: 'User with this email already exists'
      });
    }

    // Create new user with vouchers-only default feature permissions
    const newUser = await User.create({
      name,
      email,
      password,
      phone,
      role: 'user',
      featurePermissions: {
        showRecharges: true,
        showBillPayments: false,
        showMoneyTransfer: false,
        showAEPS: false,
        showVouchers: true
      }
    });

    // Create wallet for the new user
    await Wallet.create({
      user: newUser._id,
      balance: 0
    });

    console.log('User and wallet created successfully');

    // Generate JWT token and send response
    createSendToken(newUser, 201, res);
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message,
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if email and password exist
    if (!email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide email and password',
      });
    }

    // Check if user exists and password is correct
    const user = await User.findOne({ email }).select('+password');
    
    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({
        status: 'fail',
        message: 'Incorrect email or password',
      });
    }

    // If everything is ok, send token to client
    createSendToken(user, 200, res);
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message,
    });
  }
};

// Protect routes - middleware to check if user is logged in
exports.protect = async (req, res, next) => {
  try {
    console.log('=== AUTHENTICATION CHECK ===');
    console.log('Request URL:', req.originalUrl);
    console.log('Request method:', req.method);
    console.log('Authorization header:', req.headers.authorization);
    
    // 1) Get token and check if it exists
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      console.log('No token found in request');
      return res.status(401).json({
        status: 'fail',
        message: 'You are not logged in! Please log in to get access.',
      });
    }
    
    console.log('Token found:', token.substring(0, 20) + '...');

    // 2) Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({
        status: 'fail',
        message: 'The user belonging to this token no longer exists.',
      });
    }

    // 4) Check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter && currentUser.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        status: 'fail',
        message: 'User recently changed password! Please log in again.',
      });
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser;
    console.log('Authentication successful for user:', currentUser.email);
    console.log('User ID:', currentUser._id);
    next();
  } catch (error) {
    console.log('Authentication error:', error.message);
    console.log('Error stack:', error.stack);
    res.status(401).json({
      status: 'fail',
      message: 'Authentication failed. Please log in again.',
    });
  }
};

// Restrict to certain roles
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'fail',
        message: 'You do not have permission to perform this action',
      });
    }
    next();
  };
};

// Get current user information
exports.getMe = (req, res, next) => {
  try {
    // User is already available on req.user from the protect middleware
    res.status(200).json({
      status: 'success',
      data: {
        user: req.user
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Admin reset user password
exports.adminResetPassword = async (req, res) => {
  try {
    const { userId, newPassword } = req.body;

    // Check if the requesting user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'fail',
        message: 'Only admins can reset user passwords'
      });
    }

    // Validate input
    if (!userId || !newPassword) {
      return res.status(400).json({
        status: 'fail',
        message: 'User ID and new password are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        status: 'fail',
        message: 'Password must be at least 8 characters long'
      });
    }

    // Find the user to reset password for
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }

    // Update the user's password
    user.password = newPassword;
    user.passwordChangedAt = Date.now();
    await user.save();

    res.status(200).json({
      status: 'success',
      message: `Password reset successfully for user: ${user.name} (${user.email})`
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Get all users for admin
exports.getAllUsers = async (req, res) => {
  try {
    // Check if the requesting user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'fail',
        message: 'Only admins can view all users'
      });
    }

    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    
    res.status(200).json({
      status: 'success',
      results: users.length,
      data: {
        users
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Admin: update per-user feature permissions
exports.updateUserFeaturePermissions = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'fail',
        message: 'Only admins can update user feature permissions'
      });
    }

    const { id } = req.params;
    const allowedKeys = ['showRecharges', 'showBillPayments', 'showMoneyTransfer', 'showAEPS', 'showVouchers'];
    const updates = req.body || {};

    // Normalize boolean-like values to actual booleans
    const coerceBool = (val) => {
      if (val === undefined || val === null) return val;
      if (typeof val === 'string') {
        const s = val.trim().toLowerCase();
        if (s === 'true') return true;
        if (s === 'false') return false;
      }
      return !!val;
    };

    // Validate keys
    const invalid = Object.keys(updates).filter(k => !allowedKeys.includes(k));
    if (invalid.length > 0) {
      return res.status(400).json({
        status: 'fail',
        message: `Invalid permission keys: ${invalid.join(', ')}`
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }

    const nextPerms = { ...(user.featurePermissions || {}) };
    for (const key of allowedKeys) {
      if (updates.hasOwnProperty(key)) {
        nextPerms[key] = coerceBool(updates[key]);
      }
    }
    user.featurePermissions = nextPerms;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Feature permissions updated successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Error updating feature permissions:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Forgot password
exports.forgotPassword = async (req, res) => {
  try {
    // 1) Get user based on POSTed email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'There is no user with that email address.'
      });
    }

    // 2) Generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // 3) Send it to user's email
    try {
      const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
      
      const Email = require('../utils/email');
      await new Email(user, resetURL).sendPasswordReset();

      res.status(200).json({
        status: 'success',
        message: 'Token sent to email!'
      });
    } catch (err) {
      console.error('Email sending error:', err);
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        status: 'error',
        message: 'There was an error sending the email. Try again later.'
      });
    }
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    // 1) Get user based on the token
    const hashedToken = require('crypto')
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    // 2) If token has not expired, and there is user, set the new password
    if (!user) {
      return res.status(400).json({
        status: 'fail',
        message: 'Token is invalid or has expired'
      });
    }

    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // 3) Update changedPasswordAt property for the user (done in pre-save middleware)

    // 4) Log the user in, send JWT
    createSendToken(user, 200, res);
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};