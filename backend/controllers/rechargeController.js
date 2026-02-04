const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const OperatorConfig = require('../models/OperatorConfig');
const rechargeService = require('../services/rechargeService');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Mobile Recharge
exports.mobileRecharge = catchAsync(async (req, res, next) => {
  const { mobileNumber, operator, amount, circle } = req.body;
  const userId = req.user.id;

  // Validate input
  if (!mobileNumber || !operator || !amount || !circle) {
    return next(new AppError('All fields are required: mobileNumber, operator, amount, circle', 400));
  }

  // Validate mobile number format
  const mobileRegex = /^[6-9]\d{9}$/;
  if (!mobileRegex.test(mobileNumber)) {
    return next(new AppError('Invalid mobile number format', 400));
  }

  // Check user and wallet balance
  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  const wallet = await Wallet.findOne({ user: userId });
  if (!wallet) {
    return next(new AppError('Wallet not found', 404));
  }

  if (wallet.balance < amount) {
    return next(new AppError('Insufficient wallet balance', 400));
  }

  try {
    // Process recharge using the new service
    const result = await rechargeService.processRecharge({
      userId,
      serviceType: 'mobile',
      operatorCode: operator,
      mobileNumber,
      amount,
      circle
    });

    // Deduct amount from wallet if successful, pending, or awaiting approval
    if (result.status === 'success' || result.status === 'pending' || result.status === 'awaiting_approval') {
      wallet.balance -= amount;
      await wallet.save();
    }

    res.status(200).json({
      status: 'success',
      data: {
        transactionId: result.transaction.transactionId,
        amount,
        mobileNumber,
        operator,
        status: result.status,
        message: result.message,
        requiresApproval: result.requiresApproval,
        remainingBalance: wallet.balance
      }
    });
  } catch (error) {
    return next(error);
  }
});

// DTH Recharge
exports.dthRecharge = catchAsync(async (req, res, next) => {
  const { customerNumber, operator, amount } = req.body;
  const userId = req.user.id;

  // Validate input
  if (!customerNumber || !operator || !amount) {
    return next(new AppError('All fields are required: customerNumber, operator, amount', 400));
  }

  // Check user and wallet balance
  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  const wallet = await Wallet.findOne({ user: userId });
  if (!wallet) {
    return next(new AppError('Wallet not found', 404));
  }

  if (wallet.balance < amount) {
    return next(new AppError('Insufficient wallet balance', 400));
  }

  try {
    // Process recharge using the new service
    const result = await rechargeService.processRecharge({
      userId,
      serviceType: 'dth',
      operatorCode: operator,
      customerNumber,
      amount
    });

    // Deduct amount from wallet if successful or pending
    if (result.status === 'success' || result.status === 'pending') {
      wallet.balance -= amount;
      await wallet.save();
    }

    res.status(200).json({
      status: 'success',
      data: {
        transactionId: result.transaction.transactionId,
        amount,
        customerNumber,
        operator,
        status: result.status,
        message: result.message,
        requiresApproval: result.requiresApproval,
        remainingBalance: wallet.balance
      }
    });
  } catch (error) {
    return next(error);
  }
});



// Get recharge history
exports.getRechargeHistory = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { page = 1, limit = 10, type } = req.query;

  const query = { 
    userId,
    type: { $in: ['mobile-recharge', 'dth-recharge'] }
  };
  
  if (type && ['mobile', 'dth'].includes(type)) {
    query.type = type === 'mobile' ? 'mobile-recharge' : 'dth-recharge';
  }

  const recharges = await Transaction.find(query)
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .select('-__v')
    .populate('wallet', 'balance');

  const total = await Transaction.countDocuments(query);

  res.status(200).json({
    status: 'success',
    data: {
      recharges,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    }
  });
});

// Get recharge status
exports.getRechargeStatus = catchAsync(async (req, res, next) => {
  const { transactionId } = req.params;
  const userId = req.user.id;

  const recharge = await Transaction.findOne({
    transactionId,
    userId,
    type: { $in: ['mobile-recharge', 'dth-recharge'] }
  }).select('-__v').populate('wallet', 'balance');

  if (!recharge) {
    return next(new AppError('Recharge transaction not found', 404));
  }

  // Check for status updates from API if transaction is pending
  if (recharge.status === 'pending' && recharge.apiTransactionId) {
    try {
      const statusUpdate = await rechargeService.checkTransactionStatus(
        recharge.apiTransactionId,
        recharge.operatorCode
      );
      
      if (statusUpdate && statusUpdate.status !== recharge.status) {
        recharge.status = statusUpdate.status;
        recharge.failureReason = statusUpdate.failureReason;
        await recharge.save();
      }
    } catch (error) {
      // Continue with existing status if API check fails
    }
  }

  res.status(200).json({
    status: 'success',
    data: recharge
  });
});

// Get operators list
exports.getOperators = catchAsync(async (req, res, next) => {
  const { type } = req.query; // service type filter

  const validServiceTypes = ['mobile', 'dth', 'electricity', 'gas', 'water', 'broadband', 'loan', 'insurance', 'landline', 'creditcard', 'postpaid', 'cylinder'];
  
  const query = { isActive: true };
  if (type && validServiceTypes.includes(type)) {
    query.serviceType = type;
  }

  const operators = await OperatorConfig.find(query)
    .select('operatorCode operatorName serviceType processingMode isActive minAmount maxAmount allowedAmounts circles bbps.supportsBillFetch')
    .sort({ operatorName: 1 });

  // Group by service type if no specific type requested
  if (!type) {
    const groupedOperators = operators.reduce((acc, operator) => {
      if (!acc[operator.serviceType]) {
        acc[operator.serviceType] = [];
      }
      acc[operator.serviceType].push({
        code: operator.operatorCode,
        name: operator.operatorName,
        processingMode: operator.processingMode,
        minAmount: operator.minAmount,
        maxAmount: operator.maxAmount,
        allowedAmounts: operator.allowedAmounts,
        circles: operator.circles,
        supportsBillFetch: !!(operator.bbps && operator.bbps.supportsBillFetch)
      });
      return acc;
    }, {});

    return res.status(200).json({
      status: 'success',
      data: groupedOperators
    });
  }

  // Return operators for specific type
  const formattedOperators = operators.map(operator => ({
    code: operator.operatorCode,
    name: operator.operatorName,
    processingMode: operator.processingMode,
    minAmount: operator.minAmount,
    maxAmount: operator.maxAmount,
    allowedAmounts: operator.allowedAmounts,
    circles: operator.circles,
    supportsBillFetch: !!(operator.bbps && operator.bbps.supportsBillFetch)
  }));

  res.status(200).json({
    status: 'success',
    data: formattedOperators
  });
});

// Get circles list for mobile operators
exports.getCircles = catchAsync(async (req, res, next) => {
  const circles = [
    { code: 'ANDHRA_PRADESH', name: 'Andhra Pradesh' },
    { code: 'ASSAM', name: 'Assam' },
    { code: 'BIHAR_JHARKHAND', name: 'Bihar & Jharkhand' },
    { code: 'CHENNAI', name: 'Chennai' },
    { code: 'DELHI', name: 'Delhi' },
    { code: 'GUJARAT', name: 'Gujarat' },
    { code: 'HARYANA', name: 'Haryana' },
    { code: 'HIMACHAL_PRADESH', name: 'Himachal Pradesh' },
    { code: 'JAMMU_KASHMIR', name: 'Jammu & Kashmir' },
    { code: 'KARNATAKA', name: 'Karnataka' },
    { code: 'KERALA', name: 'Kerala' },
    { code: 'KOLKATA', name: 'Kolkata' },
    { code: 'MADHYA_PRADESH', name: 'Madhya Pradesh & Chhattisgarh' },
    { code: 'MAHARASHTRA', name: 'Maharashtra & Goa' },
    { code: 'MUMBAI', name: 'Mumbai' },
    { code: 'NORTH_EAST', name: 'North East' },
    { code: 'ORISSA', name: 'Orissa' },
    { code: 'PUNJAB', name: 'Punjab' },
    { code: 'RAJASTHAN', name: 'Rajasthan' },
    { code: 'TAMIL_NADU', name: 'Tamil Nadu' },
    { code: 'UP_EAST', name: 'UP East' },
    { code: 'UP_WEST', name: 'UP West & Uttarakhand' },
    { code: 'WEST_BENGAL', name: 'West Bengal' }
  ];

  res.status(200).json({
    status: 'success',
    data: circles
  });
});

// Bill payment for other services (electricity, water, gas, broadband, etc.)
exports.billPayment = catchAsync(async (req, res, next) => {
  const { serviceType, customerNumber, operator, amount, registeredMobile } = req.body;
  const userId = req.user.id;

  // Validate input
  if (!serviceType || !customerNumber || !operator || !amount) {
    return next(new AppError('All fields are required', 400));
  }

  // Validate registered mobile for credit card payments
  if (serviceType === 'creditcard' && !registeredMobile) {
    return next(new AppError('Registered mobile number is required for credit card payments', 400));
  }

  // Validate service type
  const validServiceTypes = ['electricity', 'water', 'gas', 'broadband', 'loan', 'insurance', 'landline', 'creditcard', 'postpaid', 'cylinder'];
  if (!validServiceTypes.includes(serviceType)) {
    return next(new AppError('Invalid service type', 400));
  }

  // Validate amount
  if (amount < 50 || amount > 50000) {
    return next(new AppError('Amount must be between ₹50 and ₹50,000', 400));
  }

  // Get user and check wallet balance
  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  if (user.walletBalance < amount) {
    return next(new AppError('Insufficient wallet balance', 400));
  }

  // Get operator configuration
  const operatorConfig = await OperatorConfig.findOne({ 
    operatorCode: operator, 
    serviceType: serviceType,
    isActive: true 
  });

  if (!operatorConfig) {
    return next(new AppError('Operator not found or inactive', 404));
  }

  // Validate amount against operator limits
  if (amount < operatorConfig.minAmount || amount > operatorConfig.maxAmount) {
    return next(new AppError(
      `Amount must be between ₹${operatorConfig.minAmount} and ₹${operatorConfig.maxAmount} for this operator`, 
      400
    ));
  }

  try {
    // Process bill payment
    const result = await rechargeService.processBillPayment({
      userId,
      serviceType,
      customerNumber,
      operator: operatorConfig,
      amount,
      userWalletBalance: user.walletBalance,
      registeredMobile
    });

    res.status(200).json({
      status: 'success',
      message: `${serviceType.charAt(0).toUpperCase() + serviceType.slice(1)} bill payment initiated successfully`,
      data: {
        transactionId: result.transactionId,
        status: result.status,
        amount: result.amount,
        operator: operatorConfig.operatorName,
        customerNumber: result.customerNumber,
        processingMode: result.processingMode
      }
    });
  } catch (error) {
    console.error('Bill payment error:', error);
    return next(new AppError(error.message || 'Bill payment failed', 500));
  }
});