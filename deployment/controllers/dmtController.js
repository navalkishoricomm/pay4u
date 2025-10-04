const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const DmtRemitter = require('../models/DmtRemitter');
const DmtBeneficiary = require('../models/DmtBeneficiary');
const DmtTransaction = require('../models/DmtTransaction');
const dmtService = require('../services/dmtService');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Register Remitter
exports.registerRemitter = catchAsync(async (req, res, next) => {
  const { mobile, firstName, lastName, address, pincode, dateOfBirth, gstState } = req.body;
  const userId = req.user.id;

  try {
    const result = await dmtService.registerRemitter({
      mobile,
      firstName,
      lastName,
      address,
      pincode,
      dateOfBirth,
      gstState,
      userId
    });

    res.status(200).json({
      status: 'success',
      data: {
        remitter: {
          id: result.remitter._id,
          remitterId: result.remitter._id,
          mobile: result.remitter.mobile,
          firstName: result.remitter.firstName,
          lastName: result.remitter.lastName,
          kycStatus: result.remitter.kycStatus,
          monthlyLimit: result.remitter.monthlyLimit,
          monthlyUsed: result.remitter.monthlyUsed,
          remainingLimit: result.remitter.getRemainingMonthlyLimit()
        },
        message: result.message
      }
    });
  } catch (error) {
    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      let message = 'Duplicate entry detected';
      
      if (field === 'accountNumber' || error.keyPattern?.accountNumber) {
        message = 'A beneficiary with this account number already exists for this remitter';
      }
      
      return res.status(400).json({
        status: 'fail',
        message: message,
        error: 'DUPLICATE_BENEFICIARY'
      });
    }
    
    // Handle other validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        status: 'fail',
        message: error.message,
        error: 'VALIDATION_ERROR'
      });
    }
    
    // Handle general errors
    return res.status(400).json({
      status: 'fail',
      message: error.message || 'An error occurred while registering beneficiary',
      error: 'REGISTRATION_ERROR'
    });
  }
});

// Perform Remitter KYC
exports.performRemitterKyc = catchAsync(async (req, res, next) => {
  const { remitterId } = req.params;
  const { kycType, piddata, wadh } = req.body;
  const userId = req.user.id;

  // Verify remitter exists (allow any user to perform KYC for any remitter)
  const remitter = await DmtRemitter.findOne({ _id: remitterId });
  if (!remitter) {
    return next(new AppError('Remitter not found', 404));
  }

  try {
    const result = await dmtService.performRemitterKyc(remitterId, {
      kycType,
      piddata,
      wadh
    });

    res.status(200).json({
      status: 'success',
      data: {
        remitter: {
          id: result.remitter._id,
          remitterId: result.remitter._id,
          mobile: result.remitter.mobile,
          firstName: result.remitter.firstName,
          lastName: result.remitter.lastName,
          kycStatus: result.remitter.kycStatus,
          kycExpiryTime: result.remitter.kycExpiryTime,
          kycAttempts: result.remitter.kycAttempts,
          remainingLimit: result.remitter.getRemainingMonthlyLimit()
        },
        response: result.response,
        message: result.message
      }
    });
  } catch (error) {
    return next(new AppError(error.message, 400));
  }
});

// @desc    Calculate charges for money transfer
// @route   POST /api/dmt/calculate-charges
// @access  Private
exports.calculateCharges = catchAsync(async (req, res, next) => {
  const { amount, transferMode = 'IMPS' } = req.body;
  
  if (!amount || amount <= 0) {
    return next(new AppError('Valid amount is required', 400));
  }
  
  try {
    const charges = await dmtService.calculateCharges(amount, transferMode);
    const totalAmount = amount + charges;
    
    res.status(200).json({
      status: 'success',
      data: {
        amount,
        transferMode,
        charges,
        totalAmount
      }
    });
  } catch (error) {
    return next(new AppError('Error calculating charges', 500));
  }
});

// Register Beneficiary
exports.registerBeneficiary = catchAsync(async (req, res, next) => {
  const { remitterId, accountNumber, ifscCode, accountHolderName, bankName, mobile } = req.body;
  const userId = req.user.id;

  // Find remitter - either by provided ID or user's default remitter
  let remitter;
  if (remitterId) {
    remitter = await DmtRemitter.findOne({ _id: remitterId });
  } else {
    // Find user's remitter automatically (still check userId for default remitter)
    remitter = await DmtRemitter.findOne({ userId });
  }
  
  // If no remitter exists, create one automatically using user's information
  if (!remitter) {
    const user = req.user;
    const nameParts = user.name.split(' ');
    const firstName = nameParts[0] || user.name;
    const lastName = nameParts.slice(1).join(' ') || '';
    
    const remitterData = {
      mobile: user.phone,
      firstName,
      lastName,
      address: 'Default Address', // You may want to add address field to User model
      pincode: '110001', // Default pincode, should be updated by user
      dateOfBirth: new Date('1990-01-01'), // Default DOB, should be updated by user
      gstState: 'DELHI', // Default state, should be updated by user
      userId
    };
    
    const remitterResult = await dmtService.registerRemitter(remitterData);
    remitter = remitterResult.remitter;
  }

  try {
    const result = await dmtService.registerBeneficiary({
      remitterId: remitter._id,
      accountNumber,
      ifscCode,
      accountHolderName,
      bankName,
      mobile,
      userId
    });

    // Handle duplicate beneficiary case
    if (result.error === 'DUPLICATE_BENEFICIARY') {
      return res.status(400).json({
        status: 'fail',
        message: result.message,
        error: 'DUPLICATE_BENEFICIARY',
        data: {
          beneficiary: {
            id: result.beneficiary._id,
            accountNumber: result.beneficiary.accountNumber,
            ifscCode: result.beneficiary.ifscCode,
            accountHolderName: result.beneficiary.accountHolderName,
            bankName: result.beneficiary.bankName,
            verificationStatus: result.beneficiary.verificationStatus,
            monthlyLimit: result.beneficiary.monthlyLimit,
            monthlyReceived: result.beneficiary.monthlyReceived,
            remainingLimit: result.beneficiary.getRemainingMonthlyLimit()
          }
        }
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        beneficiary: {
          id: result.beneficiary._id,
          accountNumber: result.beneficiary.accountNumber,
          ifscCode: result.beneficiary.ifscCode,
          accountHolderName: result.beneficiary.accountHolderName,
          bankName: result.beneficiary.bankName,
          verificationStatus: result.beneficiary.verificationStatus,
          monthlyLimit: result.beneficiary.monthlyLimit,
          monthlyReceived: result.beneficiary.monthlyReceived,
          remainingLimit: result.beneficiary.getRemainingMonthlyLimit()
        },
        response: result.response,
        message: result.message
      }
    });
  } catch (error) {
    return next(new AppError(error.message, 400));
  }
});

// Verify Beneficiary (Penny Drop)
exports.verifyBeneficiary = catchAsync(async (req, res, next) => {
  const { beneficiaryId } = req.params;
  const userId = req.user.id;

  // Verify beneficiary exists (allow any user to verify any beneficiary)
  const beneficiary = await DmtBeneficiary.findOne({ _id: beneficiaryId });
  if (!beneficiary) {
    return next(new AppError('Beneficiary not found', 404));
  }

  try {
    const result = await dmtService.verifyBeneficiary(beneficiaryId);

    res.status(200).json({
      status: 'success',
      data: {
        beneficiary: {
          id: result.beneficiary._id,
          accountNumber: result.beneficiary.accountNumber,
          ifscCode: result.beneficiary.ifscCode,
          accountHolderName: result.beneficiary.accountHolderName,
          verificationStatus: result.beneficiary.verificationStatus,
          verificationDate: result.beneficiary.verificationDate
        },
        response: result.response,
        message: result.message
      }
    });
  } catch (error) {
    return next(new AppError(error.message, 400));
  }
});

// Delete Beneficiary
exports.deleteBeneficiary = catchAsync(async (req, res, next) => {
  const { beneficiaryId } = req.params;
  const userId = req.user.id;

  // Verify beneficiary exists (allow any user to delete any beneficiary)
  const beneficiary = await DmtBeneficiary.findOne({ _id: beneficiaryId });
  if (!beneficiary) {
    return next(new AppError('Beneficiary not found', 404));
  }

  // Check if beneficiary has any pending transactions
  const pendingTransactions = await DmtTransaction.countDocuments({
    beneficiaryId,
    status: { $in: ['pending', 'processing'] }
  });

  if (pendingTransactions > 0) {
    return next(new AppError('Cannot delete beneficiary with pending transactions', 400));
  }

  // Mark beneficiary as deleted (soft delete)
  beneficiary.isBlocked = true;
  beneficiary.blockReason = 'Deleted by user';
  await beneficiary.save();

  res.status(200).json({
    status: 'success',
    message: 'Beneficiary deleted successfully'
  });
});

// Process Transaction
exports.processTransaction = catchAsync(async (req, res, next) => {
  console.log('=== DMT CONTROLLER PROCESS TRANSACTION CALLED ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('User ID:', req.user.id);
  
  const { remitterId, beneficiaryId, amount, transferMode = 'IMPS' } = req.body;
  const userId = req.user.id;
  const ipAddress = req.ip;
  const userAgent = req.get('User-Agent');

  // Verify remitter exists (allow any user to use any remitter)
  const remitter = await DmtRemitter.findOne({ _id: remitterId });
  if (!remitter) {
    return next(new AppError('Remitter not found', 404));
  }

  // Verify beneficiary exists (allow any user to use any beneficiary)
  const beneficiary = await DmtBeneficiary.findOne({ _id: beneficiaryId });
  if (!beneficiary) {
    return next(new AppError('Beneficiary not found', 404));
  }

  // Check user balance
  const user = await User.findById(userId).populate('wallet');
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Get user's wallet
  const wallet = await Wallet.findOne({ user: userId });
  if (!wallet) {
    return next(new AppError('User wallet not found', 404));
  }

  // Calculate total amount including charges
  const charges = await dmtService.calculateCharges(amount, transferMode);
  const totalAmount = amount + charges;

  if (wallet.balance < totalAmount) {
    return next(new AppError(`Insufficient wallet balance. Required: ₹${totalAmount} (Amount: ₹${amount} + Charges: ₹${charges})`, 400));
  }

  try {
    const result = await dmtService.processTransaction({
      remitterId,
      beneficiaryId,
      amount,
      transferMode,
      userId,
      ipAddress,
      userAgent
    });

    // Deduct amount from user wallet if transaction is initiated
    if (result.success) {
      try {
        // Double-check wallet balance before deduction
        if (wallet.balance < totalAmount) {
          throw new Error('Insufficient wallet balance');
        }
        
        wallet.balance -= totalAmount;
        await wallet.save();
      } catch (walletError) {
        throw new Error(`Failed to update wallet balance: ${walletError.message}`);
      }

      // Create wallet transaction record
      const walletTransaction = new Transaction({
        wallet: wallet._id,
        type: 'transfer',
        amount: totalAmount,
        description: `DMT transfer to ${beneficiary.accountHolderName} (${beneficiary.accountNumber})`,
        metadata: {
          category: 'dmt',
          beneficiaryName: beneficiary.accountHolderName,
          accountNumber: beneficiary.accountNumber,
          transferMode
        },
        status: 'completed',
        reference: result.transaction._id
      });
      await walletTransaction.save();
    }

    // Use the already updated wallet for response
    
    res.status(200).json({
      status: 'success',
      data: {
        transactionId: result.transaction.transactionId,
        amount,
        charges,
        totalAmount,
        beneficiary: {
          accountNumber: beneficiary.accountNumber,
          accountHolderName: beneficiary.accountHolderName,
          bankName: beneficiary.bankName
        },
        transferMode,
        status: result.transaction.status,
        message: result.message,
        remainingBalance: wallet?.balance || 0
      }
    });
  } catch (error) {
    return next(new AppError(error.message, 400));
  }
});

// Get Transaction Status
exports.getTransactionStatus = catchAsync(async (req, res, next) => {
  const { transactionId } = req.params;
  const userId = req.user.id;

  // Find transaction and verify it belongs to user
  const transaction = await DmtTransaction.findOne({ transactionId, userId });
  if (!transaction) {
    return next(new AppError('Transaction not found or access denied', 404));
  }

  try {
    const result = await dmtService.checkTransactionStatus(transactionId);

    res.status(200).json({
      status: 'success',
      data: {
        transaction: {
          transactionId: result.transaction.transactionId,
          amount: result.transaction.amount,
          charges: result.transaction.charges,
          totalAmount: result.transaction.totalAmount,
          status: result.transaction.status,
          transferMode: result.transaction.transferMode,
          beneficiaryName: result.transaction.beneficiaryName,
          beneficiaryAccountNumber: result.transaction.beneficiaryAccountNumber,
          bankReferenceNumber: result.transaction.bankReferenceNumber,
          createdAt: result.transaction.createdAt,
          updatedAt: result.transaction.updatedAt
        },
        response: result.response,
        message: result.message
      }
    });
  } catch (error) {
    return next(new AppError(error.message, 400));
  }
});

// Get Remitter Beneficiaries
exports.getRemitterBeneficiaries = catchAsync(async (req, res, next) => {
  const { remitterId } = req.params;
  const userId = req.user.id;

  // Verify remitter exists (allow any user to access any remitter's beneficiaries)
  const remitter = await DmtRemitter.findOne({ _id: remitterId });
  if (!remitter) {
    return next(new AppError('Remitter not found', 404));
  }

  try {
    const beneficiaries = await dmtService.getRemitterBeneficiaries(remitterId);

    const formattedBeneficiaries = beneficiaries.map(beneficiary => {
      const formatted = {
        _id: beneficiary._id.toString(),
        id: beneficiary._id.toString(),
        accountNumber: beneficiary.accountNumber,
        ifscCode: beneficiary.ifscCode,
        accountHolderName: beneficiary.accountHolderName,
        bankName: beneficiary.bankName,
        mobile: beneficiary.mobile,
        verificationStatus: beneficiary.verificationStatus,
        isVerified: beneficiary.verificationStatus === 'verified',
        isActive: beneficiary.isActive,
        monthlyLimit: beneficiary.monthlyLimit,
        monthlyReceived: beneficiary.monthlyReceived,
        remainingLimit: beneficiary.getRemainingMonthlyLimit(),
        createdAt: beneficiary.createdAt
      };
      console.log('Formatted beneficiary:', formatted);
      return formatted;
    });

    res.status(200).json({
      status: 'success',
      results: formattedBeneficiaries.length,
      data: {
        beneficiaries: formattedBeneficiaries
      }
    });
  } catch (error) {
    return next(new AppError(error.message, 400));
  }
});

// Get User Transactions
exports.getUserTransactions = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { page = 1, limit = 20, status, startDate, endDate } = req.query;

  try {
    const skip = (page - 1) * limit;
    const query = { userId };

    // Add filters
    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    const transactions = await DmtTransaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('beneficiaryId', 'accountHolderName accountNumber bankName');

    const total = await DmtTransaction.countDocuments(query);

    const formattedTransactions = transactions.map(transaction => ({
      transactionId: transaction.transactionId,
      amount: transaction.amount,
      charges: transaction.charges,
      totalAmount: transaction.totalAmount,
      status: transaction.status,
      transferMode: transaction.transferMode,
      beneficiary: transaction.beneficiaryId ? {
        name: transaction.beneficiaryId.accountHolderName,
        accountNumber: transaction.beneficiaryId.accountNumber,
        bankName: transaction.beneficiaryId.bankName
      } : {
        name: transaction.beneficiaryName,
        accountNumber: transaction.beneficiaryAccountNumber,
        bankName: transaction.beneficiaryBankName
      },
      bankReferenceNumber: transaction.bankReferenceNumber,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt
    }));

    res.status(200).json({
      status: 'success',
      results: formattedTransactions.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      data: {
        transactions: formattedTransactions
      }
    });
  } catch (error) {
    return next(new AppError(error.message, 400));
  }
});

// Get Transaction Statistics
exports.getTransactionStats = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { startDate, endDate } = req.query;

  try {
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date();

    const stats = await dmtService.getTransactionStats(userId, start, end);

    res.status(200).json({
      status: 'success',
      data: {
        stats,
        period: {
          startDate: start,
          endDate: end
        }
      }
    });
  } catch (error) {
    return next(new AppError(error.message, 400));
  }
});

// Get Beneficiaries
exports.getBeneficiaries = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  
  const beneficiaries = await DmtBeneficiary.find({ userId, isActive: true })
    .populate('remitterId', 'firstName lastName mobile')
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    data: {
      beneficiaries
    }
  });
});

// Fix Beneficiaries - Re-register beneficiaries missing paysprintBeneficiaryId
exports.fixBeneficiaries = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  
  // Find beneficiaries without paysprintBeneficiaryId
  const brokenBeneficiaries = await DmtBeneficiary.find({ 
    userId, 
    isActive: true, 
    verificationStatus: 'verified',
    $or: [
      { paysprintBeneficiaryId: { $exists: false } },
      { paysprintBeneficiaryId: null },
      { paysprintBeneficiaryId: '' }
    ]
  });

  if (brokenBeneficiaries.length === 0) {
    return res.status(200).json({
      status: 'success',
      message: 'All beneficiaries are properly registered',
      data: { fixed: 0, total: 0 }
    });
  }

  let fixedCount = 0;
  const results = [];

  for (const beneficiary of brokenBeneficiaries) {
    try {
      // Get the remitter for this beneficiary
      const remitter = await DmtRemitter.findById(beneficiary.remitterId);
      if (!remitter) {
        results.push({
          beneficiary: beneficiary.accountHolderName,
          status: 'error',
          error: 'Remitter not found'
        });
        continue;
      }

      // Call Paysprint API directly to register beneficiary
      const endpoint = 'dmt/beneficiary/registerbeneficiary';
      const requestData = {
        mobile: remitter.mobile,
        benename: beneficiary.accountHolderName,
        bankid: beneficiary.ifscCode.substring(0, 4),
        accno: beneficiary.accountNumber,
        ifsccode: beneficiary.ifscCode,
        verified: 1,
        gst_state: remitter.gstState || 'DELHI',
        dob: remitter.dateOfBirth.toISOString().split('T')[0]
      };
      
      const response = await dmtService.makeApiRequest(endpoint, requestData);
      
      if (response.success && response.data.response_code === 1) {
        // Update the existing beneficiary with the new paysprintBeneficiaryId
        beneficiary.paysprintBeneficiaryId = response.data.beneid;
        beneficiary.verificationStatus = 'verified';
        beneficiary.verificationDate = new Date();
        await beneficiary.save();
        
        fixedCount++;
        results.push({
          beneficiary: beneficiary.accountHolderName,
          status: 'fixed',
          paysprintBeneficiaryId: beneficiary.paysprintBeneficiaryId
        });
      } else {
        results.push({
          beneficiary: beneficiary.accountHolderName,
          status: 'failed',
          error: response.data?.message || 'API registration failed'
        });
      }
    } catch (error) {
      results.push({
        beneficiary: beneficiary.accountHolderName,
        status: 'error',
        error: error.message
      });
    }
  }

  res.status(200).json({
    status: 'success',
    message: `Fixed ${fixedCount} out of ${brokenBeneficiaries.length} beneficiaries`,
    data: {
      fixed: fixedCount,
      total: brokenBeneficiaries.length,
      results
    }
  });
});

// Get Transaction Receipt
exports.getTransactionReceipt = catchAsync(async (req, res, next) => {
  const { transactionId } = req.params;
  const userId = req.user.id;

  try {
    // Find the DMT transaction
    const dmtTransaction = await DmtTransaction.findOne({
      transactionId,
      userId
    });

    if (!dmtTransaction) {
      return next(new AppError('Transaction not found', 404));
    }

    // Find the beneficiary details
    const beneficiary = await DmtBeneficiary.findById(dmtTransaction.beneficiaryId);
    
    // Find the remitter details
    const remitter = await DmtRemitter.findById(dmtTransaction.remitterId);

    // Find the wallet transaction record
    const walletTransaction = await Transaction.findOne({
      reference: dmtTransaction._id
    });

    // Prepare receipt data
    const receiptData = {
      transactionId: dmtTransaction.transactionId,
      referenceId: dmtTransaction.referenceId,
      paysprintTransactionId: dmtTransaction.paysprintTransactionId,
      date: dmtTransaction.createdAt,
      status: dmtTransaction.status,
      
      // Amount details
      amount: dmtTransaction.amount,
      charges: dmtTransaction.charges,
      totalAmount: dmtTransaction.totalAmount,
      
      // Sender details
      sender: {
        name: dmtTransaction.remitterName,
        mobile: dmtTransaction.remitterMobile
      },
      
      // Beneficiary details
      beneficiary: {
        name: dmtTransaction.beneficiaryName,
        accountNumber: dmtTransaction.beneficiaryAccountNumber,
        ifscCode: dmtTransaction.beneficiaryIfscCode,
        bankName: dmtTransaction.beneficiaryBankName
      },
      
      // Transfer details
      transferMode: dmtTransaction.transferMode,
      
      // API response details (if available)
      apiResponse: dmtTransaction.paysprintResponse,
      
      // Timestamps
      initiatedAt: dmtTransaction.createdAt,
      completedAt: dmtTransaction.updatedAt
    };

    res.status(200).json({
      status: 'success',
      data: {
        receipt: receiptData
      }
    });
  } catch (error) {
    return next(new AppError(error.message, 400));
  }
});