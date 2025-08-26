const Commission = require('../models/Commission');
const { validationResult } = require('express-validator');

// Get all commission structures
exports.getAllCommissions = async (req, res) => {
  try {
    const { operator, transactionType, isActive } = req.query;
    
    // Build filter object
    const filter = {};
    if (operator) filter.operator = operator;
    if (transactionType) filter.transactionType = transactionType;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    const commissions = await Commission.find(filter)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ operator: 1, transactionType: 1 });
    
    res.status(200).json({
      status: 'success',
      results: commissions.length,
      data: {
        commissions,
      },
    });
  } catch (error) {
    console.error('Error fetching commissions:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Get commission by ID
exports.getCommission = async (req, res) => {
  try {
    const commission = await Commission.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');
    
    if (!commission) {
      return res.status(404).json({
        status: 'fail',
        message: 'Commission structure not found',
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        commission,
      },
    });
  } catch (error) {
    console.error('Error fetching commission:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Create new commission structure
exports.createCommission = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'fail',
        message: 'Validation failed',
        errors: errors.array(),
      });
    }
    
    const {
      operator,
      transactionType,
      commissionType,
      commissionValue,
      minCommission,
      maxCommission,
      description,
    } = req.body;
    
    // Check if commission structure already exists for this operator and transaction type
    const existingCommission = await Commission.findOne({
      operator,
      transactionType,
    });
    
    if (existingCommission) {
      return res.status(400).json({
        status: 'fail',
        message: `Commission structure already exists for ${operator} - ${transactionType}`,
      });
    }
    
    const commission = new Commission({
      operator,
      transactionType,
      commissionType,
      commissionValue,
      minCommission: minCommission || 0,
      maxCommission: maxCommission || null,
      description: description || '',
      createdBy: req.user.id,
    });
    
    await commission.save();
    
    // Populate the created commission
    await commission.populate('createdBy', 'name email');
    
    console.log(`Commission structure created for ${operator} - ${transactionType}`);
    
    res.status(201).json({
      status: 'success',
      message: 'Commission structure created successfully',
      data: {
        commission,
      },
    });
  } catch (error) {
    console.error('Error creating commission:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        status: 'fail',
        message: 'Commission structure already exists for this operator and transaction type',
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Update commission structure
exports.updateCommission = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'fail',
        message: 'Validation failed',
        errors: errors.array(),
      });
    }
    
    const updateData = { ...req.body };
    updateData.updatedBy = req.user.id;
    
    const commission = await Commission.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    ).populate('createdBy updatedBy', 'name email');
    
    if (!commission) {
      return res.status(404).json({
        status: 'fail',
        message: 'Commission structure not found',
      });
    }
    
    console.log(`Commission structure updated: ${commission.operator} - ${commission.transactionType}`);
    
    res.status(200).json({
      status: 'success',
      message: 'Commission structure updated successfully',
      data: {
        commission,
      },
    });
  } catch (error) {
    console.error('Error updating commission:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        status: 'fail',
        message: 'Commission structure already exists for this operator and transaction type',
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Delete commission structure
exports.deleteCommission = async (req, res) => {
  try {
    const commission = await Commission.findByIdAndDelete(req.params.id);
    
    if (!commission) {
      return res.status(404).json({
        status: 'fail',
        message: 'Commission structure not found',
      });
    }
    
    console.log(`Commission structure deleted: ${commission.operator} - ${commission.transactionType}`);
    
    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    console.error('Error deleting commission:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Toggle commission active status
exports.toggleCommissionStatus = async (req, res) => {
  try {
    const commission = await Commission.findById(req.params.id);
    
    if (!commission) {
      return res.status(404).json({
        status: 'fail',
        message: 'Commission structure not found',
      });
    }
    
    commission.isActive = !commission.isActive;
    commission.updatedBy = req.user.id;
    await commission.save();
    
    await commission.populate('createdBy updatedBy', 'name email');
    
    console.log(`Commission status toggled: ${commission.operator} - ${commission.transactionType} - Active: ${commission.isActive}`);
    
    res.status(200).json({
      status: 'success',
      message: `Commission structure ${commission.isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        commission,
      },
    });
  } catch (error) {
    console.error('Error toggling commission status:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Get commission calculation preview
exports.getCommissionPreview = async (req, res) => {
  try {
    const { operator, transactionType, amount } = req.query;
    
    if (!operator || !transactionType || !amount) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide operator, transactionType, and amount',
      });
    }
    
    const transactionAmount = parseFloat(amount);
    
    if (isNaN(transactionAmount) || transactionAmount <= 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide a valid amount',
      });
    }
    
    const commissionAmount = await Commission.calculateCommissionAmount(
      operator,
      transactionType,
      transactionAmount
    );
    
    const commission = await Commission.getCommissionRate(operator, transactionType);
    
    res.status(200).json({
      status: 'success',
      data: {
        operator,
        transactionType,
        transactionAmount,
        commissionAmount,
        commissionStructure: commission,
      },
    });
  } catch (error) {
    console.error('Error calculating commission preview:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Get unique operators
exports.getOperators = async (req, res) => {
  try {
    const operators = await Commission.distinct('operator');
    
    res.status(200).json({
      status: 'success',
      data: {
        operators: operators.sort(),
      },
    });
  } catch (error) {
    console.error('Error fetching operators:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};