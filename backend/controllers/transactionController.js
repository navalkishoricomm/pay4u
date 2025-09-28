const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const Commission = require('../models/Commission');

// Process transaction request for manual approval
exports.processTransactionRequest = async (req, res) => {
  try {
    const { type, amount, metadata } = req.body;
    
    if (!type || !amount || amount <= 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide transaction type and valid amount',
      });
    }

    console.log(`Creating ${type} transaction request for user: ${req.user.id}`);
    
    // Find the user's wallet
    const wallet = await Wallet.findOne({ user: req.user.id });
    
    if (!wallet) {
      return res.status(404).json({
        status: 'fail',
        message: 'Wallet not found',
      });
    }

    // Check if user has sufficient balance for recharge/bill payment transactions
    if (['mobile-recharge', 'dth-recharge', 'bill-payment'].includes(type)) {
      console.log(`Balance validation: Current balance: ₹${wallet.balance}, Required: ₹${amount}, Type: ${typeof wallet.balance}, Amount Type: ${typeof amount}`);
      
      const requiredAmount = parseFloat(amount);
      
      if (wallet.balance < requiredAmount) {
        console.log(`INSUFFICIENT BALANCE DETECTED: ${wallet.balance} < ${requiredAmount}`);
        return res.status(400).json({
          status: 'fail',
          message: `Insufficient wallet balance. Current balance: ₹${wallet.balance.toFixed(2)}, Required: ₹${requiredAmount.toFixed(2)}`,
        });
      }
      
      console.log(`Balance sufficient, proceeding with deduction`);
      
      // Use atomic operation to prevent race conditions
      const updatedWallet = await Wallet.findOneAndUpdate(
        { 
          user: req.user.id, 
          balance: { $gte: requiredAmount } // Ensure balance is still sufficient
        },
        { 
          $inc: { balance: -requiredAmount } // Atomic decrement
        },
        { 
          new: true, // Return updated document
          runValidators: true
        }
      );
      
      if (!updatedWallet) {
        console.log(`RACE CONDITION DETECTED: Insufficient balance during atomic update`);
        return res.status(400).json({
          status: 'fail',
          message: `Insufficient wallet balance. Please try again.`,
        });
      }
      
      console.log(`Wallet balance deducted atomically: -${requiredAmount}, New balance: ${updatedWallet.balance}`);
      
      // Update the wallet object for further use
      wallet.balance = updatedWallet.balance;
    }

    // Create description based on transaction type
    let description = '';
    
    switch (type) {
      case 'mobile-recharge':
        description = `Mobile recharge for ${metadata?.mobileNumber || 'N/A'}`;
        break;
      case 'dth-recharge':
        description = `DTH recharge for ${metadata?.subscriberId || 'N/A'}`;
        break;
      case 'bill-payment':
        description = `Bill payment for ${metadata?.billType || 'N/A'}`;
        break;
      default:
        description = `${type} transaction`;
    }

    // Calculate commission if operator is provided (with user-specific priority)
    let commissionAmount = 0;
    let commissionType = 'none';
    let commissionRate = 0;
    const operator = metadata?.operator;
    
    if (operator && ['mobile-recharge', 'dth-recharge', 'bill-payment'].includes(type)) {
      try {
        // Use new user-specific commission calculation
        commissionAmount = await Commission.calculateCommissionAmount(operator, type, parseFloat(amount), req.user.id);
        
        // Get commission hierarchy to determine which commission was applied
        const commissionHierarchy = await Commission.getCommissionHierarchy(req.user.id, operator, type);
        
        if (commissionHierarchy.activeCommission) {
          commissionType = commissionHierarchy.activeCommission.commissionType;
          commissionRate = commissionHierarchy.activeCommission.commissionValue;
          
          let source = 'global';
          if (commissionHierarchy.userSpecific) source = 'user-specific';
          else if (commissionHierarchy.defaultScheme) source = 'default scheme';
          
          console.log(`Commission calculated for ${operator} ${type}: ₹${commissionAmount} (${commissionType}: ${commissionRate}) - Source: ${source}`);
        }
      } catch (error) {
        console.error('Error calculating commission:', error);
        // Continue without commission if calculation fails
      }
    }

    // Generate unique transaction ID
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    // Create transaction with awaiting_approval status
    const transaction = new Transaction({
      transactionId,
      userId: req.user.id,
      wallet: wallet._id,
      type,
      amount: parseFloat(amount),
      description,
      status: 'awaiting_approval',
      metadata: metadata || {},
      paymentMethod: 'wallet',
      operator: operator || null,
      commissionAmount,
      commissionType,
      commissionRate,
    });

    await transaction.save();

    console.log(`Transaction request created: ${transaction._id}`);

    res.status(201).json({
      status: 'success',
      message: 'Transaction request submitted for approval',
      data: {
        transaction,
      },
    });
  } catch (error) {
    console.error('Error creating transaction request:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Helper function to process transactions
const processTransaction = async (req, res, type) => {
  try {
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide a valid amount',
      });
    }

    console.log(`Processing ${type} transaction for user: ${req.user.id}`);
    
    // Find the user's wallet
    const wallet = await Wallet.findOne({ user: req.user.id });
    
    if (!wallet) {
      return res.status(404).json({
        status: 'fail',
        message: 'Wallet not found',
      });
    }

    // Check if wallet has sufficient balance
    if (wallet.balance < amount) {
      return res.status(400).json({
        status: 'fail',
        message: 'Insufficient wallet balance',
      });
    }

    // Create metadata based on transaction type
    let metadata = {};
    let description = '';
    
    switch (type) {
      case 'mobile-recharge':
        if (!req.body.mobileNumber || !req.body.operator) {
          return res.status(400).json({
            status: 'fail',
            message: 'Please provide mobile number and operator',
          });
        }
        metadata = {
          mobileNumber: req.body.mobileNumber,
          operator: req.body.operator,
          plan: req.body.plan || 'Default',
        };
        description = `Mobile recharge for ${req.body.mobileNumber}`;
        break;
        
      case 'dth-recharge':
        if (!req.body.subscriberId || !req.body.operator) {
          return res.status(400).json({
            status: 'fail',
            message: 'Please provide subscriber ID and operator',
          });
        }
        metadata = {
          subscriberId: req.body.subscriberId,
          operator: req.body.operator,
          plan: req.body.plan || 'Default',
        };
        description = `DTH recharge for ${req.body.subscriberId}`;
        break;
        
      case 'bill-payment':
        if (!req.body.billerId || !req.body.consumerNumber) {
          return res.status(400).json({
            status: 'fail',
            message: 'Please provide biller ID and consumer number',
          });
        }
        metadata = {
          billerId: req.body.billerId,
          consumerNumber: req.body.consumerNumber,
          billNumber: req.body.billNumber,
          billType: req.body.billType || 'Utility',
        };
        description = `Bill payment for ${req.body.billType || 'Utility'}`;
        break;
        
      default:
        return res.status(400).json({
          status: 'fail',
          message: 'Invalid transaction type',
        });
    }

    // Generate unique transaction ID
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    // Create transaction record
    const transaction = await Transaction.create({
      transactionId,
      userId: req.user.id,
      wallet: wallet._id,
      amount: parseFloat(amount),
      type,
      status: 'awaiting_approval', // Manual processing - requires admin approval
      description,
      metadata,
      reference: `${type.toUpperCase()}-${Date.now()}`
    });

    console.log(`${type} transaction of ${amount} submitted for approval`);

    res.status(200).json({
      status: 'success',
      message: `Your ${type.replace('-', ' ')} request has been submitted for approval`,
      data: {
        transaction,
        currentBalance: wallet.balance,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Get user transactions
exports.getUserTransactions = async (req, res) => {
  try {
    console.log(`Fetching transactions for user: ${req.user.id}`);
    
    // Parse query parameters for filtering
    const { type, status } = req.query;
    console.log(`Filter params: type=${type}, status=${status}`);
    
    // Find the user's wallet
    const wallet = await Wallet.findOne({ user: req.user.id });
    
    if (!wallet) {
      return res.status(404).json({
        status: 'fail',
        message: 'Wallet not found',
      });
    }
    
    // Build query for transactions
    let query = { wallet: wallet._id };
    
    if (type) {
      query.type = type;
    }
    
    if (status) {
      query.status = status;
    }
    
    // Get transactions with filtering
    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .limit(50); // Limit to last 50 transactions
    
    res.status(200).json({
      status: 'success',
      results: transactions.length,
      data: {
        transactions,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Get transaction by ID
exports.getTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Fetching transaction: ${id} for user: ${req.user.id}`);
    
    // Find the user's wallet first
    const wallet = await Wallet.findOne({ user: req.user.id });
    
    if (!wallet) {
      return res.status(404).json({
        status: 'fail',
        message: 'Wallet not found',
      });
    }
    
    // Find the transaction that belongs to this user's wallet
    const transaction = await Transaction.findOne({ 
      _id: id, 
      wallet: wallet._id 
    });
    
    if (!transaction) {
      return res.status(404).json({
        status: 'fail',
        message: 'Transaction not found',
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        transaction,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};



// Mobile recharge
exports.mobileRecharge = async (req, res) => {
  await processTransaction(req, res, 'mobile-recharge');
};

// DTH recharge
exports.dthRecharge = async (req, res) => {
  await processTransaction(req, res, 'dth-recharge');
};

// Bill payment
exports.billPayment = async (req, res) => {
  await processTransaction(req, res, 'bill-payment');
};

// Get transaction status updates
exports.getStatusUpdates = async (req, res) => {
  try {
    console.log(`Fetching recent transaction status updates for user: ${req.user.id}`);
    
    // Get user's wallet to find their transactions
    const wallet = await Wallet.findOne({ user: req.user.id });
    if (!wallet) {
      return res.status(404).json({
        status: 'error',
        message: 'Wallet not found'
      });
    }
    
    // Fetch recent transactions for this user (last 10 transactions)
    const statusUpdates = await Transaction.find({ 
      wallet: wallet._id 
    })
    .sort({ updatedAt: -1 })
    .limit(10)
    .select('_id transactionId userId status amount type description createdAt updatedAt notes')
    .lean();
    
    console.log(`Returning ${statusUpdates.length} recent transaction status updates`);
    
    res.status(200).json({
      status: 'success',
      results: statusUpdates.length,
      data: {
        statusUpdates,
      },
    });
  } catch (error) {
    console.error('Error fetching transaction status updates:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Get transaction details
exports.getTransaction = async (req, res) => {
  try {
    console.log(`Simulating fetching transaction with ID: ${req.params.id}`);
    
    // Create a mock transaction for development
    const transaction = {
      _id: req.params.id,
      wallet: {
        _id: '60d0fe4f5311236168a109cb',
        user: {
          id: req.user.id
        }
      },
      amount: 100,
      type: 'mobile-recharge',
      status: 'completed',
      description: 'Mobile recharge transaction',
      metadata: {
        mobileNumber: '9876543210',
        operator: 'Sample Operator',
        plan: 'Default'
      },
      reference: `MOBILE-RECHARGE-${Date.now()}`,
      createdAt: new Date()
    };
    
    // For development purposes, always return the mock transaction
    // In production, we would check if the transaction exists and belongs to the user

    res.status(200).json({
      status: 'success',
      data: {
        transaction,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};