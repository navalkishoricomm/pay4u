const { validationResult } = require('express-validator');
const AppError = require('../utils/appError');

module.exports = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));
    
    // Log validation errors for debugging
    console.log('=== VALIDATION ERRORS ===');
    console.log('Request URL:', req.url);
    console.log('Request Body:', JSON.stringify(req.body, null, 2));
    console.log('Validation Errors:', JSON.stringify(errorMessages, null, 2));
    console.log('========================');
    
    return next(new AppError('Validation failed', 400, errorMessages));
  }
  
  next();
};