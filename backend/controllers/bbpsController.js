const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const OperatorConfig = require('../models/OperatorConfig');
const bbpsService = require('../services/bbpsService');

exports.fetchBill = catchAsync(async (req, res, next) => {
  const { serviceType, operatorCode, customerNumber, additionalParams } = req.body;

  if (!serviceType || !operatorCode || !customerNumber) {
    return next(new AppError('Missing required fields: serviceType, operatorCode, customerNumber', 400));
  }

  // Ensure operator exists and supports bill fetch
  const operatorConfig = await OperatorConfig.getOperatorByCode(operatorCode);
  if (!operatorConfig || operatorConfig.serviceType !== serviceType) {
    return next(new AppError('Invalid operator or service type', 404));
  }

  if (!operatorConfig.bbps || !operatorConfig.bbps.supportsBillFetch) {
    return next(new AppError('Bill fetch not supported for this operator', 400));
  }

  // Perform bill fetch
  const result = await bbpsService.fetchBill({
    serviceType,
    operatorCode,
    customerNumber,
    additionalParams
  });

  return res.status(200).json({
    status: 'success',
    data: result
  });
});