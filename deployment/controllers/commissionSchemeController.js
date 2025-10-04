const CommissionScheme = require('../models/CommissionScheme');
const UserCommission = require('../models/UserCommission');
const User = require('../models/User');

// Get all commission schemes
exports.getAllCommissionSchemes = async (req, res) => {
  try {
    const schemes = await CommissionScheme.find()
      .populate('createdBy updatedBy', 'name email')
      .sort({ isDefault: -1, schemeName: 1 });

    res.status(200).json({
      status: 'success',
      results: schemes.length,
      data: {
        schemes,
      },
    });
  } catch (error) {
    console.error('Error fetching commission schemes:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Get commission scheme by ID
exports.getCommissionScheme = async (req, res) => {
  try {
    const scheme = await CommissionScheme.findById(req.params.id)
      .populate('createdBy updatedBy', 'name email');

    if (!scheme) {
      return res.status(404).json({
        status: 'fail',
        message: 'Commission scheme not found',
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        scheme,
      },
    });
  } catch (error) {
    console.error('Error fetching commission scheme:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Create new commission scheme
exports.createCommissionScheme = async (req, res) => {
  try {
    const { schemeName, description, commissions, isDefault } = req.body;

    if (!schemeName || !commissions || !Array.isArray(commissions)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide scheme name and commissions array',
      });
    }

    const scheme = new CommissionScheme({
      schemeName,
      description,
      commissions,
      isDefault: isDefault || false,
      createdBy: req.user.id,
    });

    await scheme.save();
    await scheme.populate('createdBy', 'name email');

    console.log(`Commission scheme created: ${scheme.schemeName} by ${req.user.name}`);

    res.status(201).json({
      status: 'success',
      message: 'Commission scheme created successfully',
      data: {
        scheme,
      },
    });
  } catch (error) {
    console.error('Error creating commission scheme:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        status: 'fail',
        message: 'A commission scheme with this name already exists',
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Update commission scheme
exports.updateCommissionScheme = async (req, res) => {
  try {
    const { schemeName, description, commissions, isDefault, isActive } = req.body;

    const scheme = await CommissionScheme.findById(req.params.id);

    if (!scheme) {
      return res.status(404).json({
        status: 'fail',
        message: 'Commission scheme not found',
      });
    }

    // Update fields
    if (schemeName !== undefined) scheme.schemeName = schemeName;
    if (description !== undefined) scheme.description = description;
    if (commissions !== undefined) scheme.commissions = commissions;
    if (isDefault !== undefined) scheme.isDefault = isDefault;
    if (isActive !== undefined) scheme.isActive = isActive;
    
    scheme.updatedBy = req.user.id;

    await scheme.save();
    await scheme.populate('createdBy updatedBy', 'name email');

    console.log(`Commission scheme updated: ${scheme.schemeName} by ${req.user.name}`);

    res.status(200).json({
      status: 'success',
      message: 'Commission scheme updated successfully',
      data: {
        scheme,
      },
    });
  } catch (error) {
    console.error('Error updating commission scheme:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        status: 'fail',
        message: 'A commission scheme with this name already exists',
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Delete commission scheme
exports.deleteCommissionScheme = async (req, res) => {
  try {
    const scheme = await CommissionScheme.findById(req.params.id);

    if (!scheme) {
      return res.status(404).json({
        status: 'fail',
        message: 'Commission scheme not found',
      });
    }

    // Check if scheme is being used by any users
    const usersUsingScheme = await UserCommission.countDocuments({ schemeId: scheme._id });
    
    if (usersUsingScheme > 0) {
      return res.status(400).json({
        status: 'fail',
        message: `Cannot delete scheme. It is currently assigned to ${usersUsingScheme} user(s)`,
      });
    }

    await CommissionScheme.findByIdAndDelete(req.params.id);

    console.log(`Commission scheme deleted: ${scheme.schemeName} by ${req.user.name}`);

    res.status(200).json({
      status: 'success',
      message: 'Commission scheme deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting commission scheme:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Set default commission scheme
exports.setDefaultScheme = async (req, res) => {
  try {
    const scheme = await CommissionScheme.findById(req.params.id);

    if (!scheme) {
      return res.status(404).json({
        status: 'fail',
        message: 'Commission scheme not found',
      });
    }

    scheme.isDefault = true;
    scheme.updatedBy = req.user.id;
    await scheme.save();

    console.log(`Default commission scheme set: ${scheme.schemeName} by ${req.user.name}`);

    res.status(200).json({
      status: 'success',
      message: 'Default commission scheme updated successfully',
      data: {
        scheme,
      },
    });
  } catch (error) {
    console.error('Error setting default scheme:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Apply scheme to user
exports.applySchemeToUser = async (req, res) => {
  try {
    const { userId } = req.body;
    const schemeId = req.params.id;

    if (!userId) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide user ID',
      });
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found',
      });
    }

    // Apply scheme to user
    const userCommissions = await CommissionScheme.applySchemeToUser(schemeId, userId);

    console.log(`Commission scheme applied to user: ${user.name} (${user.email}) by ${req.user.name}`);

    res.status(200).json({
      status: 'success',
      message: 'Commission scheme applied to user successfully',
      data: {
        userCommissions,
      },
    });
  } catch (error) {
    console.error('Error applying scheme to user:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Get user commissions
exports.getUserCommissions = async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify user exists
    const user = await User.findById(userId).select('name email');
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found',
      });
    }

    const userCommissions = await UserCommission.getUserCommissions(userId);

    res.status(200).json({
      status: 'success',
      data: {
        user,
        commissions: userCommissions,
      },
    });
  } catch (error) {
    console.error('Error fetching user commissions:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Add user-specific commission
exports.addUserCommission = async (req, res) => {
  try {
    const { userId } = req.params;
    const { operator, transactionType, commissionType, commissionValue, minCommission, maxCommission, description } = req.body;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found',
      });
    }

    // Check if commission already exists for this operator and transaction type
    const existingCommission = await UserCommission.findOne({
      userId,
      operator,
      transactionType,
    });

    if (existingCommission) {
      return res.status(400).json({
        status: 'fail',
        message: 'Commission already exists for this operator and transaction type',
      });
    }

    // Create new user commission
    const userCommission = await UserCommission.create({
      userId,
      operator,
      transactionType,
      commissionType,
      commissionValue,
      minCommission: minCommission || 0,
      maxCommission: maxCommission || null,
      isCustom: true,
      description,
      createdBy: req.user.id,
    });

    res.status(201).json({
      status: 'success',
      data: {
        commission: userCommission,
      },
    });
  } catch (error) {
    console.error('Error adding user commission:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Update user-specific commission
exports.updateUserCommission = async (req, res) => {
  try {
    const { userId, commissionId } = req.params;
    const { commissionType, commissionValue, minCommission, maxCommission, description } = req.body;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found',
      });
    }

    // Find user commission
    const userCommission = await UserCommission.findOne({
      _id: commissionId,
      userId,
    });

    if (!userCommission) {
      return res.status(404).json({
        status: 'fail',
        message: 'User commission not found',
      });
    }

    // Update commission
    userCommission.commissionType = commissionType;
    userCommission.commissionValue = commissionValue;
    userCommission.minCommission = minCommission || 0;
    userCommission.maxCommission = maxCommission || null;
    userCommission.isCustom = true;
    userCommission.schemeId = null; // Remove scheme reference for custom commission
    userCommission.description = description;
    userCommission.updatedBy = req.user.id;

    await userCommission.save();
    await userCommission.populate('schemeId', 'schemeName');

    console.log(`User commission updated: ${user.name} - ${userCommission.operator} ${userCommission.transactionType} by ${req.user.name}`);

    res.status(200).json({
      status: 'success',
      message: 'User commission updated successfully',
      data: {
        userCommission,
      },
    });
  } catch (error) {
    console.error('Error updating user commission:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Remove user commission (revert to scheme/default)
exports.removeUserCommission = async (req, res) => {
  try {
    const { userId, commissionId } = req.params;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found',
      });
    }

    const result = await UserCommission.findOneAndDelete({
      _id: commissionId,
      userId,
    });

    if (!result) {
      return res.status(404).json({
        status: 'fail',
        message: 'User commission not found',
      });
    }

    console.log(`User commission removed: ${userId} - ${result.operator} ${result.transactionType} by ${req.user.name}`);

    res.status(200).json({
      status: 'success',
      message: 'User commission removed successfully. User will now use scheme or default commission.',
    });
  } catch (error) {
    console.error('Error removing user commission:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Get commission preview for user
exports.getUserCommissionPreview = async (req, res) => {
  try {
    const { userId, operator, transactionType, amount } = req.query;

    if (!userId || !operator || !transactionType || !amount) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide userId, operator, transactionType, and amount',
      });
    }

    const transactionAmount = parseFloat(amount);

    if (isNaN(transactionAmount) || transactionAmount <= 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide a valid amount',
      });
    }

    // Get commission hierarchy
    const Commission = require('../models/Commission');
    const commissionHierarchy = await Commission.getCommissionHierarchy(userId, operator, transactionType);
    
    // Calculate commission amount
    const commissionAmount = await UserCommission.calculateUserCommissionAmount(
      userId,
      operator,
      transactionType,
      transactionAmount
    );

    let source = 'none';
    if (commissionHierarchy.userSpecific) source = 'user-specific';
    else if (commissionHierarchy.defaultScheme) source = 'default-scheme';
    else if (commissionHierarchy.global) source = 'global';

    res.status(200).json({
      status: 'success',
      data: {
        userId,
        operator,
        transactionType,
        transactionAmount,
        commissionAmount,
        commissionSource: source,
        commissionHierarchy,
      },
    });
  } catch (error) {
    console.error('Error calculating user commission preview:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};