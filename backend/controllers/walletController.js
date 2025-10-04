const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

// Get wallet details for the logged-in user
exports.getMyWallet = async (req, res) => {
  try {
    console.log(`Fetching wallet for user: ${req.user.id}`);
    
    // Find the user's wallet
    const wallet = await Wallet.findOne({ user: req.user.id });
    
    if (!wallet) {
      return res.status(404).json({
        status: 'fail',
        message: 'Wallet not found',
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        wallet,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Top up wallet with UPI barcode upload
exports.topUpWallet = async (req, res) => {
  try {
    const { amount, paymentMethod } = req.body;
    const barcodeFile = req.file; // Multer file upload

    if (!amount || amount <= 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide a valid amount',
      });
    }

    // Validate UPI payment method
    if (paymentMethod !== 'upi') {
      return res.status(400).json({
        status: 'fail',
        message: 'Only UPI payments are supported',
      });
    }

    // Validate barcode upload for UPI
    if (!barcodeFile) {
      return res.status(400).json({
        status: 'fail',
        message: 'UPI barcode/screenshot is required',
      });
    }

    console.log(`Processing UPI wallet top-up for user: ${req.user.id}, amount: ${amount}`);
    
    // Find the user's wallet
    const wallet = await Wallet.findOne({ user: req.user.id });
    
    if (!wallet) {
      return res.status(404).json({
        status: 'fail',
        message: 'Wallet not found',
      });
    }
    
    // Generate unique transaction ID
    const transactionId = `UPI-TOPUP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create a transaction record (awaiting approval for top-ups)
    const transaction = await Transaction.create({
      transactionId: transactionId,
      userId: req.user.id,
      wallet: wallet._id,
      amount: parseFloat(amount),
      type: 'topup',
      status: 'awaiting_approval',
      description: req.body.description || 'UPI Wallet top-up',
      metadata: {
        paymentMethod: 'upi',
        barcodeFileName: barcodeFile.filename,
        barcodePath: barcodeFile.path,
        barcodeOriginalName: barcodeFile.originalname,
        barcodeSize: barcodeFile.size,
        uploadedAt: new Date()
      },
      reference: transactionId,
    });

    console.log(`UPI top-up of ${amount} with barcode submitted for approval`);

    // Since the transaction is awaiting approval, don't update the balance yet
    res.status(200).json({
      status: 'success',
      message: 'Your UPI top-up request with barcode has been submitted for approval',
      data: {
        transaction,
        currentBalance: wallet.balance,
        barcodeUploaded: true
      },
    });
  } catch (error) {
    console.error('UPI top-up request failed:', error.message);
    
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Get transaction history for the logged-in user's wallet
exports.getMyTransactions = async (req, res) => {
  try {
    console.log(`Fetching transaction history for user: ${req.user.id}`);
    
    // Find the user's wallet
    const wallet = await Wallet.findOne({ user: req.user.id });
    
    if (!wallet) {
      return res.status(404).json({
        status: 'fail',
        message: 'Wallet not found',
      });
    }
    
    // Get transactions for this wallet
    const transactions = await Transaction.find({ wallet: wallet._id })
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
    console.error('Failed to fetch transactions:', error.message);
    
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};