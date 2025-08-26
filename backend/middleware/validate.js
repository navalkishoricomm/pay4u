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
    
    return next(new AppError('Validation failed', 400, errorMessages));
  }
  
  next();
};