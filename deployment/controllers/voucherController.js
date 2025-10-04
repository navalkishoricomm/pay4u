const BrandVoucher = require('../models/BrandVoucher');
const VoucherDenomination = require('../models/VoucherDenomination');
const VoucherOrder = require('../models/VoucherOrder');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');
const mongoose = require('mongoose');

// @desc    Get all brand vouchers
// @route   GET /api/vouchers/brands
// @access  Public
exports.getAllBrandVouchers = async (req, res) => {
  try {
    const { category, isActive = true } = req.query;
    const filter = { isActive };
    
    if (category && category !== 'all') {
      filter.category = category;
    }

    const vouchers = await BrandVoucher.find(filter)
      .populate('denominations')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: vouchers.length,
      data: vouchers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching brand vouchers',
      error: error.message
    });
  }
};

// @desc    Get single brand voucher
// @route   GET /api/vouchers/brands/:id
// @access  Public
exports.getBrandVoucher = async (req, res) => {
  try {
    const voucher = await BrandVoucher.findById(req.params.id)
      .populate({
        path: 'denominations',
        match: { isActive: true },
        options: { sort: { denomination: 1 } }
      });

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Brand voucher not found'
      });
    }

    res.status(200).json({
      success: true,
      data: voucher
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching brand voucher',
      error: error.message
    });
  }
};

// @desc    Create brand voucher
// @route   POST /api/vouchers/brands
// @access  Private/Admin
exports.createBrandVoucher = async (req, res) => {
  try {
    console.log('Creating brand voucher with data:', req.body);
    console.log('User ID:', req.user._id);
    
    const voucherData = {
      ...req.body,
      createdBy: req.user._id
    };

    const voucher = await BrandVoucher.create(voucherData);

    res.status(201).json({
      success: true,
      message: 'Brand voucher created successfully',
      data: voucher
    });
  } catch (error) {
    console.error('Error creating brand voucher:', error);
    res.status(400).json({
      success: false,
      message: 'Error creating brand voucher',
      error: error.message
    });
  }
};

// @desc    Update brand voucher
// @route   PUT /api/vouchers/brands/:id
// @access  Private/Admin
exports.updateBrandVoucher = async (req, res) => {
  try {
    const voucher = await BrandVoucher.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Brand voucher not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Brand voucher updated successfully',
      data: voucher
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating brand voucher',
      error: error.message
    });
  }
};

// @desc    Delete brand voucher
// @route   DELETE /api/vouchers/brands/:id
// @access  Private/Admin
exports.deleteBrandVoucher = async (req, res) => {
  try {
    const voucher = await BrandVoucher.findById(req.params.id);

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Brand voucher not found'
      });
    }

    // Check if there are any active orders for this voucher
    const activeOrders = await VoucherOrder.countDocuments({
      brandVoucher: req.params.id,
      status: { $in: ['pending', 'completed'] }
    });

    if (activeOrders > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete voucher with active orders. Deactivate instead.'
      });
    }

    // Delete associated denominations
    await VoucherDenomination.deleteMany({ brandVoucher: req.params.id });
    
    // Delete the voucher
    await BrandVoucher.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Brand voucher deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting brand voucher',
      error: error.message
    });
  }
};

// @desc    Get voucher denominations
// @route   GET /api/vouchers/brands/:id/denominations
// @access  Public
exports.getVoucherDenominations = async (req, res) => {
  try {
    const denominations = await VoucherDenomination.find({
      brandVoucher: req.params.id,
      isActive: true
    }).sort({ denomination: 1 });

    res.status(200).json({
      success: true,
      count: denominations.length,
      data: denominations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching voucher denominations',
      error: error.message
    });
  }
};

// @desc    Create voucher denomination
// @route   POST /api/vouchers/brands/:id/denominations
// @access  Private/Admin
exports.createVoucherDenomination = async (req, res) => {
  try {
    const brandVoucher = await BrandVoucher.findById(req.params.id);
    
    if (!brandVoucher) {
      return res.status(404).json({
        success: false,
        message: 'Brand voucher not found'
      });
    }

    const denominationData = {
      ...req.body,
      brandVoucher: req.params.id,
      createdBy: req.user._id
    };

    const denomination = await VoucherDenomination.create(denominationData);

    res.status(201).json({
      success: true,
      message: 'Voucher denomination created successfully',
      data: denomination
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Denomination already exists for this voucher'
      });
    }
    
    res.status(400).json({
      success: false,
      message: 'Error creating voucher denomination',
      error: error.message
    });
  }
};

// @desc    Update voucher denomination
// @route   PUT /api/vouchers/denominations/:id
// @access  Private/Admin
exports.updateVoucherDenomination = async (req, res) => {
  try {
    const denomination = await VoucherDenomination.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!denomination) {
      return res.status(404).json({
        success: false,
        message: 'Voucher denomination not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Voucher denomination updated successfully',
      data: denomination
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating voucher denomination',
      error: error.message
    });
  }
};

// @desc    Delete voucher denomination
// @route   DELETE /api/vouchers/denominations/:id
// @access  Private/Admin
exports.deleteVoucherDenomination = async (req, res) => {
  try {
    const denomination = await VoucherDenomination.findById(req.params.id);

    if (!denomination) {
      return res.status(404).json({
        success: false,
        message: 'Voucher denomination not found'
      });
    }

    // Check if there are any orders for this denomination
    const orders = await VoucherOrder.countDocuments({
      voucherDenomination: req.params.id,
      status: { $in: ['pending', 'completed'] }
    });

    if (orders > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete denomination with existing orders. Deactivate instead.'
      });
    }

    await VoucherDenomination.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Voucher denomination deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting voucher denomination',
      error: error.message
    });
  }
};

// @desc    Purchase voucher
// @route   POST /api/vouchers/purchase
// @access  Private
exports.purchaseVoucher = async (req, res) => {
  try {
    const { denominationId, quantity = 1, customerEmail } = req.body;
    const userId = req.user._id;

    // Validate input
    if (!denominationId || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid denomination or quantity'
      });
    }

    // Validate customer email
    if (!customerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Valid customer email is required for voucher delivery'
      });
    }

    // Get denomination with brand voucher details
    const denomination = await VoucherDenomination.findById(denominationId)
      .populate('brandVoucher');

    if (!denomination || !denomination.isActive || !denomination.brandVoucher.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Voucher not available'
      });
    }

    // Check quantity availability
    if (!denomination.isQuantityAvailable(quantity)) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient voucher quantity available'
      });
    }

    // Check user purchase limit
    const userPurchasedQuantity = await VoucherOrder.getUserPurchaseCount(userId, denominationId);
    if (!denomination.canUserPurchase(userPurchasedQuantity, quantity)) {
      return res.status(400).json({
        success: false,
        message: `Maximum ${denomination.maxQuantityPerUser} vouchers allowed per user`
      });
    }

    // Calculate amounts
    const originalPrice = denomination.denomination * quantity;
    const discountAmount = denomination.discountAmount * quantity;
    const finalAmount = denomination.discountedPrice * quantity;

    // Check wallet balance
    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet || wallet.balance < finalAmount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient wallet balance'
      });
    }

    // Calculate expiry date
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + denomination.brandVoucher.validityPeriod);

    // Create voucher order
    const voucherOrder = new VoucherOrder({
      user: userId,
      brandVoucher: denomination.brandVoucher._id,
      voucherDenomination: denominationId,
      quantity,
      originalPrice,
      discountAmount,
      finalAmount,
      customerEmail,
      expiryDate,
      status: 'pending'
    });

    await voucherOrder.save();

    // Create wallet transaction
    const transaction = new Transaction({
      wallet: wallet._id,
      type: 'voucher_purchase',
      amount: finalAmount,
      status: 'completed',
      description: `Purchase of ${quantity}x ${denomination.brandVoucher.brandName} voucher(s)`,
      metadata: {
        voucherOrderId: voucherOrder._id,
        brandName: denomination.brandVoucher.brandName,
        denomination: denomination.denomination,
        quantity,
        discountAmount
      }
    });

    await transaction.save();

    // Update wallet balance
    wallet.balance -= finalAmount;
    await wallet.save();

    // Update denomination sold quantity
    denomination.soldQuantity += quantity;
    await denomination.save();

    // Update voucher order status and link transaction
    voucherOrder.status = 'completed';
    voucherOrder.walletTransaction = transaction._id;
    await voucherOrder.save();

    // Populate the response
    await voucherOrder.populate([
      { path: 'brandVoucher', select: 'brandName image category' },
      { path: 'voucherDenomination', select: 'denomination discountPercentage' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Voucher purchased successfully',
      data: {
        order: voucherOrder,
        walletBalance: wallet.balance
      }
    });

  } catch (error) {
    console.error('Voucher purchase error:', error);
    res.status(500).json({
      success: false,
      message: 'Error purchasing voucher',
      error: error.message
    });
  }
};

// @desc    Get user's voucher orders
// @route   GET /api/vouchers/my-orders
// @access  Private
exports.getUserVoucherOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = { user: req.user._id };
    
    if (status && status !== 'all') {
      filter.status = status;
    }

    const skip = (page - 1) * limit;

    const orders = await VoucherOrder.find(filter)
      .populate('brandVoucher', 'brandName image category')
      .populate('voucherDenomination', 'denomination discountPercentage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await VoucherOrder.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching voucher orders',
      error: error.message
    });
  }
};

// @desc    Get single voucher order
// @route   GET /api/vouchers/orders/:id
// @access  Private
exports.getVoucherOrder = async (req, res) => {
  try {
    const order = await VoucherOrder.findOne({
      _id: req.params.id,
      user: req.user._id
    })
    .populate('brandVoucher')
    .populate('voucherDenomination')
    .populate('walletTransaction');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Voucher order not found'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching voucher order',
      error: error.message
    });
  }
};

// @desc    Use voucher code
// @route   POST /api/vouchers/use-code
// @access  Private
exports.useVoucherCode = async (req, res) => {
  try {
    const { voucherCode } = req.body;
    const userId = req.user._id;

    if (!voucherCode) {
      return res.status(400).json({
        success: false,
        message: 'Voucher code is required'
      });
    }

    // Find the order containing this voucher code
    const order = await VoucherOrder.findOne({
      user: userId,
      'voucherCodes.code': voucherCode,
      status: 'completed'
    }).populate('brandVoucher');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Invalid voucher code'
      });
    }

    // Use the voucher
    await order.useVoucher(voucherCode);

    res.status(200).json({
      success: true,
      message: 'Voucher code used successfully',
      data: {
        brandName: order.brandVoucher.brandName,
        usedAt: new Date()
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Download user's voucher file
// @route   GET /api/vouchers/orders/:id/download-file
// @access  Private
exports.downloadUserVoucherFile = async (req, res) => {
  try {
    const order = await VoucherOrder.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Voucher order not found'
      });
    }
    
    if (order.approvalStatus !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Voucher order is not approved yet'
      });
    }
    
    if (!order.voucherFilePath) {
      return res.status(404).json({
        success: false,
        message: 'Voucher file not available yet'
      });
    }
    
    const fs = require('fs');
    const path = require('path');
    
    if (!fs.existsSync(order.voucherFilePath)) {
      return res.status(404).json({
        success: false,
        message: 'Voucher file not found'
      });
    }
    
    const originalName = `voucher-${order.orderNumber}.xlsx`;
    
    res.setHeader('Content-Disposition', `attachment; filename="${originalName}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    
    const fileStream = fs.createReadStream(order.voucherFilePath);
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('Download voucher file error:', error);
    res.status(500).json({
      success: false,
      message: 'Error downloading voucher file',
      error: error.message
    });
  }
};

// @desc    Get voucher categories
// @route   GET /api/vouchers/categories
// @access  Public
exports.getVoucherCategories = async (req, res) => {
  try {
    const categories = [
      'Food & Dining',
      'Shopping',
      'Entertainment',
      'Travel',
      'Health & Beauty',
      'Electronics',
      'Other'
    ];

    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
};