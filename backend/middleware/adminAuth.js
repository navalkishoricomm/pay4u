const User = require('../models/User');

// Middleware to check if user is admin
const adminAuth = async (req, res, next) => {
  try {
    // Check if user exists from previous auth middleware
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Get user details to check admin status
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required. Insufficient permissions.'
      });
    }

    // Add user details to request for further use
    req.admin = user;
    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during admin authentication',
      error: error.message
    });
  }
};

module.exports = adminAuth;