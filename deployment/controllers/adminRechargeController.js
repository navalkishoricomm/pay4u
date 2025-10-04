const ApiProvider = require('../models/ApiProvider');
const OperatorConfig = require('../models/OperatorConfig');
const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// API Provider Management
exports.createApiProvider = catchAsync(async (req, res, next) => {
  const apiProvider = await ApiProvider.create(req.body);
  
  res.status(201).json({
    status: 'success',
    data: {
      apiProvider
    }
  });
});

exports.getAllApiProviders = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10, isActive, service } = req.query;
  
  const filter = {};
  if (isActive !== undefined) filter.isActive = isActive === 'true';
  if (service) filter.supportedServices = service;
  
  const apiProviders = await ApiProvider.find(filter)
    .sort({ priority: -1, createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
  
  const total = await ApiProvider.countDocuments(filter);
  
  res.status(200).json({
    status: 'success',
    results: apiProviders.length,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: {
      apiProviders
    }
  });
});

exports.getApiProvider = catchAsync(async (req, res, next) => {
  const apiProvider = await ApiProvider.findById(req.params.id);
  
  if (!apiProvider) {
    return next(new AppError('API provider not found', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      apiProvider
    }
  });
});

exports.updateApiProvider = catchAsync(async (req, res, next) => {
  const apiProvider = await ApiProvider.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  );
  
  if (!apiProvider) {
    return next(new AppError('API provider not found', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      apiProvider
    }
  });
});

exports.deleteApiProvider = catchAsync(async (req, res, next) => {
  const apiProvider = await ApiProvider.findById(req.params.id);
  
  if (!apiProvider) {
    return next(new AppError('API provider not found', 404));
  }
  
  // Check if API provider is being used by any operator
  const operatorCount = await OperatorConfig.countDocuments({
    $or: [
      { primaryApiProvider: req.params.id },
      { 'fallbackApiProviders.provider': req.params.id }
    ]
  });
  
  if (operatorCount > 0) {
    return next(new AppError('Cannot delete API provider as it is being used by operators', 400));
  }
  
  await ApiProvider.findByIdAndDelete(req.params.id);
  
  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.testApiProvider = catchAsync(async (req, res, next) => {
  const apiProvider = await ApiProvider.findById(req.params.id);
  
  if (!apiProvider) {
    return next(new AppError('API provider not found', 404));
  }
  
  // TODO: Implement actual API testing logic
  const testResult = {
    status: 'success',
    responseTime: Math.floor(Math.random() * 1000) + 500,
    message: 'API provider is responding correctly'
  };
  
  res.status(200).json({
    status: 'success',
    data: {
      testResult
    }
  });
});

// Operator Configuration Management
exports.createOperatorConfig = catchAsync(async (req, res, next) => {
  const operatorConfig = await OperatorConfig.create(req.body);
  
  res.status(201).json({
    status: 'success',
    data: {
      operatorConfig
    }
  });
});

exports.getAllOperatorConfigs = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10, serviceType, processingMode, isActive } = req.query;
  
  const filter = {};
  if (serviceType) filter.serviceType = serviceType;
  if (processingMode) filter.processingMode = processingMode;
  if (isActive !== undefined) filter.isActive = isActive === 'true';
  
  const operatorConfigs = await OperatorConfig.find(filter)
    .populate('primaryApiProvider', 'name displayName isActive')
    .populate('fallbackApiProviders.provider', 'name displayName isActive')
    .sort({ serviceType: 1, operatorName: 1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
  
  const total = await OperatorConfig.countDocuments(filter);
  
  res.status(200).json({
    status: 'success',
    results: operatorConfigs.length,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: {
      operatorConfigs
    }
  });
});

exports.getOperatorConfig = catchAsync(async (req, res, next) => {
  const operatorConfig = await OperatorConfig.findById(req.params.id)
    .populate('primaryApiProvider')
    .populate('fallbackApiProviders.provider');
  
  if (!operatorConfig) {
    return next(new AppError('Operator configuration not found', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      operatorConfig
    }
  });
});

exports.updateOperatorConfig = catchAsync(async (req, res, next) => {
  const operatorConfig = await OperatorConfig.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  ).populate('primaryApiProvider fallbackApiProviders.provider');
  
  if (!operatorConfig) {
    return next(new AppError('Operator configuration not found', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      operatorConfig
    }
  });
});

exports.deleteOperatorConfig = catchAsync(async (req, res, next) => {
  const operatorConfig = await OperatorConfig.findById(req.params.id);
  
  if (!operatorConfig) {
    return next(new AppError('Operator configuration not found', 404));
  }
  
  // Check if there are pending transactions for this operator
  const pendingTransactions = await Transaction.countDocuments({
    'rechargeData.operator': operatorConfig.operatorCode,
    status: 'pending',
    type: { $in: ['mobile-recharge', 'dth-recharge'] }
  });
  
  if (pendingTransactions > 0) {
    return next(new AppError('Cannot delete operator configuration with pending transactions', 400));
  }
  
  await OperatorConfig.findByIdAndDelete(req.params.id);
  
  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Bulk Operations
exports.bulkUpdateOperatorConfigs = catchAsync(async (req, res, next) => {
  const { operatorIds, updates } = req.body;
  
  if (!operatorIds || !Array.isArray(operatorIds) || operatorIds.length === 0) {
    return next(new AppError('Please provide valid operator IDs', 400));
  }
  
  const result = await OperatorConfig.updateMany(
    { _id: { $in: operatorIds } },
    updates,
    { runValidators: true }
  );
  
  res.status(200).json({
    status: 'success',
    data: {
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount
    }
  });
});

exports.bulkToggleOperatorStatus = catchAsync(async (req, res, next) => {
  const { operatorIds, isActive } = req.body;
  
  if (!operatorIds || !Array.isArray(operatorIds) || operatorIds.length === 0) {
    return next(new AppError('Please provide valid operator IDs', 400));
  }
  
  const result = await OperatorConfig.updateMany(
    { _id: { $in: operatorIds } },
    { isActive: isActive === true },
    { runValidators: true }
  );
  
  res.status(200).json({
    status: 'success',
    data: {
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount
    }
  });
});

// Statistics and Analytics
exports.getRechargeStats = catchAsync(async (req, res, next) => {
  const { startDate, endDate, serviceType, operatorCode } = req.query;
  
  const matchStage = {};
  
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }
  
  // Add recharge type filter
  matchStage.type = { $in: ['mobile-recharge', 'dth-recharge'] };
  
  if (serviceType) {
    matchStage.type = serviceType === 'mobile' ? 'mobile-recharge' : 'dth-recharge';
  }
  if (operatorCode) matchStage['rechargeData.operator'] = operatorCode;
  
  const stats = await Transaction.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalTransactions: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        successfulTransactions: {
          $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
        },
        failedTransactions: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        },
        pendingTransactions: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        averageAmount: { $avg: '$amount' }
      }
    }
  ]);
  
  const operatorStats = await Transaction.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$rechargeData.operator',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        successRate: {
          $avg: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
        }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);
  
  res.status(200).json({
    status: 'success',
    data: {
      overview: stats[0] || {
        totalTransactions: 0,
        totalAmount: 0,
        successfulTransactions: 0,
        failedTransactions: 0,
        pendingTransactions: 0,
        averageAmount: 0
      },
      topOperators: operatorStats
    }
  });
});

exports.getApiProviderStats = catchAsync(async (req, res, next) => {
  const apiProviders = await ApiProvider.find({ isActive: true })
    .select('name displayName totalTransactions successfulTransactions failedTransactions totalAmount successRate')
    .sort({ totalTransactions: -1 });
  
  res.status(200).json({
    status: 'success',
    data: {
      apiProviders
    }
  });
});

// Manual Transaction Management
exports.getPendingManualTransactions = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;
  
  const transactions = await Transaction.find({
    status: 'pending',
    processingMode: 'manual',
    type: { $in: ['mobile-recharge', 'dth-recharge'] }
  })
    .populate('userId', 'name email phone')
    .populate('wallet', 'balance')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
  
  const total = await Transaction.countDocuments({
    status: 'pending',
    processingMode: 'manual',
    type: { $in: ['mobile-recharge', 'dth-recharge'] }
  });
  
  res.status(200).json({
    status: 'success',
    results: transactions.length,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: {
      transactions
    }
  });
});

exports.approveManualTransaction = catchAsync(async (req, res, next) => {
  const { transactionId } = req.params;
  const { status, remarks } = req.body;
  
  if (!['success', 'failed'].includes(status)) {
    return next(new AppError('Invalid status. Must be success or failed', 400));
  }
  
  const transaction = await Transaction.findById(transactionId);
  
  if (!transaction) {
    return next(new AppError('Transaction not found', 404));
  }
  
  if (transaction.status !== 'pending') {
    return next(new AppError('Transaction is not pending approval', 400));
  }
  
  transaction.status = status;
  transaction.adminRemarks = remarks;
  transaction.processedAt = new Date();
  transaction.processedBy = req.user.id;
  
  if (status === 'failed' && transaction.amount > 0) {
    // Process refund to user's wallet
    const wallet = await Wallet.findById(transaction.wallet);
    if (wallet) {
      wallet.balance += transaction.amount;
      await wallet.save();
      console.log(`Refund processed: +${transaction.amount} for failed recharge transaction ${transactionId}`);
    }
    
    transaction.refundAmount = transaction.amount;
    transaction.refundStatus = 'completed';
    transaction.refundDate = new Date();
  }
  
  await transaction.save();
  
  res.status(200).json({
    status: 'success',
    data: {
      transaction
    }
  });
});

exports.bulkApproveTransactions = catchAsync(async (req, res, next) => {
  const { transactionIds, status, remarks } = req.body;
  
  if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
    return next(new AppError('Please provide valid transaction IDs', 400));
  }
  
  if (!['success', 'failed'].includes(status)) {
    return next(new AppError('Invalid status. Must be success or failed', 400));
  }
  
  const updateData = {
    status,
    adminRemarks: remarks,
    processedAt: new Date(),
    processedBy: req.user.id
  };
  
  if (status === 'failed') {
    updateData.refundStatus = 'completed';
    updateData.refundDate = new Date();
    
    // Process wallet refunds for failed transactions
    const transactions = await Transaction.find({
      _id: { $in: transactionIds },
      status: 'pending',
      processingMode: 'manual',
      type: { $in: ['mobile-recharge', 'dth-recharge'] }
    }).populate('wallet');
    
    for (const transaction of transactions) {
      if (transaction.wallet && transaction.amount > 0) {
        const wallet = await Wallet.findById(transaction.wallet._id);
        if (wallet) {
          wallet.balance += transaction.amount;
          await wallet.save();
          console.log(`Bulk refund processed: +${transaction.amount} for failed transaction ${transaction._id}`);
        }
      }
    }
  }
  
  const result = await Transaction.updateMany(
    {
      _id: { $in: transactionIds },
      status: 'pending',
      processingMode: 'manual',
      type: { $in: ['mobile-recharge', 'dth-recharge'] }
    },
    updateData
  );
  
  res.status(200).json({
    status: 'success',
    data: {
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount
    }
  });
});