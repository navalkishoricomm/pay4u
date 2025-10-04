const User = require('../models/User');
const Wallet = require('../models/Wallet');
const AepsTransaction = require('../models/AepsTransaction');
const aepsService = require('../services/aepsService');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Balance Inquiry
exports.balanceInquiry = catchAsync(async (req, res, next) => {
  const {
    aadhaarNumber,
    customerMobile,
    bankIin,
    bankName,
    biometricType,
    pidData,
    wadh,
    merchantId,
    terminalId
  } = req.body;
  const userId = req.user.id;

  try {
    // Initialize AEPS service
    await aepsService.initialize();

    const result = await aepsService.balanceInquiry({
      userId,
      aadhaarNumber,
      customerMobile,
      bankIin,
      biometricType,
      pidData,
      wadh,
      merchantId,
      terminalId
    });

    res.status(200).json({
      status: 'success',
      data: {
        transaction: result.transaction,
        balance: result.balance,
        rrn: result.rrn,
        message: result.message
      }
    });
  } catch (error) {
    console.error('Balance inquiry controller error:', error);
    return next(new AppError(error.message, 400));
  }
});

// Cash Withdrawal
exports.cashWithdrawal = catchAsync(async (req, res, next) => {
  const {
    aadhaarNumber,
    customerMobile,
    amount,
    bankIin,
    bankName,
    biometricType,
    pidData,
    wadh,
    merchantId,
    terminalId
  } = req.body;
  const userId = req.user.id;

  try {
    // Validate amount
    const withdrawalAmount = parseFloat(amount);
    if (!withdrawalAmount || withdrawalAmount <= 0 || withdrawalAmount > 10000) {
      return next(new AppError('Invalid withdrawal amount. Amount must be between ₹1 and ₹10,000', 400));
    }

    // Check if amount is in valid denominations (multiples of 50)
    if (withdrawalAmount % 50 !== 0) {
      return next(new AppError('Withdrawal amount must be in multiples of ₹50', 400));
    }

    // Initialize AEPS service
    await aepsService.initialize();

    const result = await aepsService.cashWithdrawal({
      userId,
      aadhaarNumber,
      customerMobile,
      amount: withdrawalAmount,
      bankIin,
      biometricType,
      pidData,
      wadh,
      merchantId,
      terminalId
    });

    res.status(200).json({
      status: 'success',
      data: {
        transaction: result.transaction,
        amount: result.amount,
        charges: result.charges,
        rrn: result.rrn,
        message: result.message
      }
    });
  } catch (error) {
    console.error('Cash withdrawal controller error:', error);
    return next(new AppError(error.message, 400));
  }
});

// Cash Deposit
exports.cashDeposit = catchAsync(async (req, res, next) => {
  const {
    aadhaarNumber,
    customerMobile,
    amount,
    bankIin,
    bankName,
    biometricType,
    pidData,
    wadh,
    merchantId,
    terminalId
  } = req.body;
  const userId = req.user.id;

  try {
    // Validate amount
    const depositAmount = parseFloat(amount);
    if (!depositAmount || depositAmount <= 0 || depositAmount > 50000) {
      return next(new AppError('Invalid deposit amount. Amount must be between ₹1 and ₹50,000', 400));
    }

    // Initialize AEPS service
    await aepsService.initialize();

    const result = await aepsService.cashDeposit({
      userId,
      aadhaarNumber,
      customerMobile,
      amount: depositAmount,
      bankIin,
      biometricType,
      pidData,
      wadh,
      merchantId,
      terminalId
    });

    res.status(200).json({
      status: 'success',
      data: {
        transaction: result.transaction,
        amount: result.amount,
        charges: result.charges,
        rrn: result.rrn,
        message: result.message
      }
    });
  } catch (error) {
    console.error('Cash deposit controller error:', error);
    return next(new AppError(error.message, 400));
  }
});

// Mini Statement
exports.miniStatement = catchAsync(async (req, res, next) => {
  const {
    aadhaarNumber,
    customerMobile,
    bankIin,
    bankName,
    biometricType,
    pidData,
    wadh,
    merchantId,
    terminalId
  } = req.body;
  const userId = req.user.id;

  try {
    // Initialize AEPS service
    await aepsService.initialize();

    const result = await aepsService.miniStatement({
      userId,
      aadhaarNumber,
      customerMobile,
      bankIin,
      biometricType,
      pidData,
      wadh,
      merchantId,
      terminalId
    });

    res.status(200).json({
      status: 'success',
      data: {
        transaction: result.transaction,
        balance: result.balance,
        miniStatement: result.miniStatement,
        charges: result.charges,
        rrn: result.rrn,
        message: result.message
      }
    });
  } catch (error) {
    console.error('Mini statement controller error:', error);
    return next(new AppError(error.message, 400));
  }
});

// Get Transaction Status
exports.getTransactionStatus = catchAsync(async (req, res, next) => {
  const { transactionId } = req.params;
  const userId = req.user.id;

  try {
    // Verify transaction belongs to user
    const transaction = await AepsTransaction.findOne({ 
      transactionId, 
      userId 
    });
    
    if (!transaction) {
      return next(new AppError('Transaction not found or access denied', 404));
    }

    // Initialize AEPS service
    await aepsService.initialize();

    const result = await aepsService.getTransactionStatus(transactionId);

    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    console.error('Get transaction status controller error:', error);
    return next(new AppError(error.message, 400));
  }
});

// Get User AEPS Transactions
exports.getUserTransactions = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { 
    page = 1, 
    limit = 10, 
    transactionType,
    startDate,
    endDate 
  } = req.query;

  try {
    // Initialize AEPS service
    await aepsService.initialize();

    // Build query filters
    const query = { userId };
    
    if (transactionType && ['balance_inquiry', 'cash_withdrawal', 'cash_deposit', 'mini_statement'].includes(transactionType)) {
      query.transactionType = transactionType;
    }
    
    if (startDate || endDate) {
      query.initiatedAt = {};
      if (startDate) {
        query.initiatedAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.initiatedAt.$lte = new Date(endDate);
      }
    }

    const result = await aepsService.getUserTransactions(
      userId, 
      parseInt(page), 
      parseInt(limit), 
      transactionType
    );

    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    console.error('Get user transactions controller error:', error);
    return next(new AppError(error.message, 400));
  }
});

// Get AEPS Statistics
exports.getAepsStats = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { startDate, endDate } = req.query;

  try {
    // Default to last 30 days if no dates provided
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Initialize AEPS service
    await aepsService.initialize();

    const result = await aepsService.getAepsStats(userId, start, end);

    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    console.error('Get AEPS stats controller error:', error);
    return next(new AppError(error.message, 400));
  }
});

// Get AEPS Bank List (using official Paysprint bank data)
exports.getBankList = catchAsync(async (req, res, next) => {
  try {
    console.log('🏦 Getting AEPS bank list from official data...');

    // Load official Paysprint bank list
    const fs = require('fs');
    const path = require('path');
    const bankListPath = path.join(__dirname, '..', 'paysprint_banks_official.json');
    
    if (!fs.existsSync(bankListPath)) {
      return next(new AppError('Bank list data not found. Please contact administrator.', 500));
    }

    const bankList = JSON.parse(fs.readFileSync(bankListPath, 'utf8'));
    
    // Filter only active banks and format for AEPS
    const activeBanks = bankList
      .filter(bank => bank.active)
      .map(bank => ({
        id: bank.id,
        name: bank.name,
        ifsc: bank.ifsc || null,
        active: bank.active
      }));

    console.log(`✅ Loaded ${activeBanks.length} active banks for AEPS`);

    res.status(200).json({
      status: 'success',
      data: activeBanks,
      message: 'Bank list retrieved successfully',
      count: activeBanks.length
    });

  } catch (error) {
    console.error('Get bank list controller error:', error);
    return next(new AppError('Failed to retrieve bank list', 500));
  }
});

// Check AEPS Service Status
exports.checkServiceStatus = catchAsync(async (req, res, next) => {
  try {
    // Initialize AEPS service
    await aepsService.initialize();

    // Make a test call to check service availability
    const response = await aepsService.makeApiRequest(
      aepsService.paysprintEndpoints.aepsBalance,
      {},
      'GET'
    );

    res.status(200).json({
      status: 'success',
      data: {
        serviceStatus: response.success ? 'active' : 'inactive',
        message: response.success ? 'AEPS service is active' : 'AEPS service is currently unavailable',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Check service status controller error:', error);
    res.status(200).json({
      status: 'success',
      data: {
        serviceStatus: 'inactive',
        message: 'AEPS service is currently unavailable',
        error: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Validate Aadhaar Number (utility endpoint)
exports.validateAadhaar = catchAsync(async (req, res, next) => {
  const { aadhaarNumber } = req.body;

  try {
    // Basic Aadhaar validation
    if (!aadhaarNumber || !/^\d{12}$/.test(aadhaarNumber)) {
      return next(new AppError('Invalid Aadhaar number format. Must be 12 digits', 400));
    }

    // Verhoeff algorithm validation for Aadhaar
    const verhoeffTable = [
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
      [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
      [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
      [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
      [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
      [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
      [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
      [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
      [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
    ];

    const permutationTable = [
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
      [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
      [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
      [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
      [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
      [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
      [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
    ];

    let checksum = 0;
    const digits = aadhaarNumber.split('').map(Number).reverse();

    for (let i = 0; i < digits.length; i++) {
      checksum = verhoeffTable[checksum][permutationTable[i % 8][digits[i]]];
    }

    const isValid = checksum === 0;

    res.status(200).json({
      status: 'success',
      data: {
        aadhaarNumber: aadhaarNumber.replace(/\d(?=\d{4})/g, 'X'), // Mask for security
        isValid,
        message: isValid ? 'Valid Aadhaar number' : 'Invalid Aadhaar number'
      }
    });
  } catch (error) {
    console.error('Validate Aadhaar controller error:', error);
    return next(new AppError(error.message, 400));
  }
});

// Get User Wallet Balance (for AEPS charges)
exports.getWalletBalance = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  try {
    const wallet = await Wallet.findOne({ userId });
    
    if (!wallet) {
      return next(new AppError('Wallet not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        balance: wallet.balance,
        currency: 'INR',
        lastUpdated: wallet.updatedAt
      }
    });
  } catch (error) {
    console.error('Get wallet balance controller error:', error);
    return next(new AppError(error.message, 400));
  }
});