const ChargeSlab = require('../models/ChargeSlab');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// @desc    Get all charge slabs
// @route   GET /api/admin/charge-slabs
// @access  Private (Admin only)
exports.getAllChargeSlabs = catchAsync(async (req, res, next) => {
  const { transferMode, isActive } = req.query;
  
  const filter = {};
  if (transferMode) filter.transferMode = transferMode;
  if (isActive !== undefined) filter.isActive = isActive === 'true';
  
  const chargeSlabs = await ChargeSlab.find(filter)
    .populate('createdBy', 'name email')
    .sort({ transferMode: 1, minAmount: 1 });
  
  res.status(200).json({
    status: 'success',
    results: chargeSlabs.length,
    data: {
      chargeSlabs
    }
  });
});

// @desc    Get charge slab by ID
// @route   GET /api/admin/charge-slabs/:id
// @access  Private (Admin only)
exports.getChargeSlab = catchAsync(async (req, res, next) => {
  const chargeSlab = await ChargeSlab.findById(req.params.id)
    .populate('createdBy', 'name email');
  
  if (!chargeSlab) {
    return next(new AppError('Charge slab not found', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      chargeSlab
    }
  });
});

// @desc    Create new charge slab
// @route   POST /api/admin/charge-slabs
// @access  Private (Admin only)
exports.createChargeSlab = catchAsync(async (req, res, next) => {
  const { minAmount, maxAmount, charge, transferMode } = req.body;
  
  // Check for overlapping slabs
  const overlappingSlab = await ChargeSlab.findOne({
    transferMode,
    isActive: true,
    $or: [
      {
        minAmount: { $lte: minAmount },
        maxAmount: { $gte: minAmount }
      },
      {
        minAmount: { $lte: maxAmount },
        maxAmount: { $gte: maxAmount }
      },
      {
        minAmount: { $gte: minAmount },
        maxAmount: { $lte: maxAmount }
      }
    ]
  });
  
  if (overlappingSlab) {
    return next(new AppError(
      `Overlapping charge slab exists for ${transferMode}: ₹${overlappingSlab.minAmount} - ₹${overlappingSlab.maxAmount}`,
      400
    ));
  }
  
  const chargeSlab = await ChargeSlab.create({
    minAmount,
    maxAmount,
    charge,
    transferMode,
    createdBy: req.user.id
  });
  
  res.status(201).json({
    status: 'success',
    data: {
      chargeSlab
    }
  });
});

// @desc    Update charge slab
// @route   PUT /api/admin/charge-slabs/:id
// @access  Private (Admin only)
exports.updateChargeSlab = catchAsync(async (req, res, next) => {
  const { minAmount, maxAmount, charge, transferMode, isActive } = req.body;
  
  const chargeSlab = await ChargeSlab.findById(req.params.id);
  
  if (!chargeSlab) {
    return next(new AppError('Charge slab not found', 404));
  }
  
  // Check for overlapping slabs (excluding current slab)
  if (minAmount !== undefined && maxAmount !== undefined && transferMode !== undefined) {
    const overlappingSlab = await ChargeSlab.findOne({
      _id: { $ne: req.params.id },
      transferMode,
      isActive: true,
      $or: [
        {
          minAmount: { $lte: minAmount },
          maxAmount: { $gte: minAmount }
        },
        {
          minAmount: { $lte: maxAmount },
          maxAmount: { $gte: maxAmount }
        },
        {
          minAmount: { $gte: minAmount },
          maxAmount: { $lte: maxAmount }
        }
      ]
    });
    
    if (overlappingSlab) {
      return next(new AppError(
        `Overlapping charge slab exists for ${transferMode}: ₹${overlappingSlab.minAmount} - ₹${overlappingSlab.maxAmount}`,
        400
      ));
    }
  }
  
  // Update fields
  if (minAmount !== undefined) chargeSlab.minAmount = minAmount;
  if (maxAmount !== undefined) chargeSlab.maxAmount = maxAmount;
  if (charge !== undefined) chargeSlab.charge = charge;
  if (transferMode !== undefined) chargeSlab.transferMode = transferMode;
  if (isActive !== undefined) chargeSlab.isActive = isActive;
  
  await chargeSlab.save();
  
  res.status(200).json({
    status: 'success',
    data: {
      chargeSlab
    }
  });
});

// @desc    Delete charge slab
// @route   DELETE /api/admin/charge-slabs/:id
// @access  Private (Admin only)
exports.deleteChargeSlab = catchAsync(async (req, res, next) => {
  const chargeSlab = await ChargeSlab.findById(req.params.id);
  
  if (!chargeSlab) {
    return next(new AppError('Charge slab not found', 404));
  }
  
  await ChargeSlab.findByIdAndDelete(req.params.id);
  
  res.status(204).json({
    status: 'success',
    data: null
  });
});

// @desc    Get charge for specific amount
// @route   POST /api/admin/charge-slabs/calculate
// @access  Private (Admin only)
exports.calculateCharge = catchAsync(async (req, res, next) => {
  const { amount, transferMode = 'IMPS' } = req.body;
  
  if (!amount || amount <= 0) {
    return next(new AppError('Valid amount is required', 400));
  }
  
  const charge = await ChargeSlab.findChargeForAmount(amount, transferMode);
  
  res.status(200).json({
    status: 'success',
    data: {
      amount,
      transferMode,
      charge,
      totalAmount: amount + charge
    }
  });
});

// @desc    Bulk create charge slabs
// @route   POST /api/admin/charge-slabs/bulk
// @access  Private (Admin only)
exports.bulkCreateChargeSlabs = catchAsync(async (req, res, next) => {
  const { slabs } = req.body;
  
  if (!Array.isArray(slabs) || slabs.length === 0) {
    return next(new AppError('Slabs array is required', 400));
  }
  
  // Add createdBy to each slab
  const slabsWithCreator = slabs.map(slab => ({
    ...slab,
    createdBy: req.user.id
  }));
  
  try {
    const createdSlabs = await ChargeSlab.insertMany(slabsWithCreator, { ordered: false });
    
    res.status(201).json({
      status: 'success',
      results: createdSlabs.length,
      data: {
        chargeSlabs: createdSlabs
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(new AppError('Duplicate or overlapping charge slabs detected', 400));
    }
    throw error;
  }
});