const UPIBarcode = require('../models/UPIBarcode');
const fs = require('fs').promises;
const path = require('path');

// Get all UPI barcodes (Admin only)
exports.getAllBarcodes = async (req, res) => {
  try {
    const barcodes = await UPIBarcode.find()
      .populate('uploadedBy', 'name email')
      .sort({ isDefault: -1, createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: barcodes.length,
      data: {
        barcodes
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Get active UPI barcodes (Public - for users)
exports.getActiveBarcodes = async (req, res) => {
  try {
    const barcodes = await UPIBarcode.getActiveBarcodes();

    res.status(200).json({
      status: 'success',
      results: barcodes.length,
      data: {
        barcodes
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Get default UPI barcode (Public - for users)
exports.getDefaultBarcode = async (req, res) => {
  try {
    const barcode = await UPIBarcode.getDefaultBarcode();

    if (!barcode) {
      return res.status(404).json({
        status: 'fail',
        message: 'No default UPI barcode found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        barcode
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Upload new UPI barcode (Admin only)
exports.uploadBarcode = async (req, res) => {
  try {
    const { name, upiId, description, isDefault } = req.body;

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please upload a barcode image'
      });
    }

    // Validate required fields
    if (!name || !upiId) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide name and UPI ID'
      });
    }

    // Check if UPI ID already exists
    const existingBarcode = await UPIBarcode.findOne({ upiId, isActive: true });
    if (existingBarcode) {
      return res.status(400).json({
        status: 'fail',
        message: 'UPI ID already exists'
      });
    }

    // Create new barcode record
    const newBarcode = await UPIBarcode.create({
      name,
      upiId,
      description,
      isDefault: isDefault === 'true' || isDefault === true,
      barcodeImage: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        size: req.file.size,
        mimetype: req.file.mimetype
      },
      uploadedBy: req.user.id
    });

    // Populate the uploadedBy field for response
    await newBarcode.populate('uploadedBy', 'name email');

    res.status(201).json({
      status: 'success',
      message: 'UPI barcode uploaded successfully',
      data: {
        barcode: newBarcode
      }
    });
  } catch (error) {
    // Delete uploaded file if database operation fails
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }

    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Update UPI barcode (Admin only)
exports.updateBarcode = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, upiId, description, isActive, isDefault } = req.body;

    const barcode = await UPIBarcode.findById(id);
    if (!barcode) {
      return res.status(404).json({
        status: 'fail',
        message: 'UPI barcode not found'
      });
    }

    // Check if UPI ID already exists (excluding current barcode)
    if (upiId && upiId !== barcode.upiId) {
      const existingBarcode = await UPIBarcode.findOne({ 
        upiId, 
        isActive: true, 
        _id: { $ne: id } 
      });
      if (existingBarcode) {
        return res.status(400).json({
          status: 'fail',
          message: 'UPI ID already exists'
        });
      }
    }

    // Update fields
    if (name) barcode.name = name;
    if (upiId) barcode.upiId = upiId;
    if (description !== undefined) barcode.description = description;
    if (isActive !== undefined) barcode.isActive = isActive;
    if (isDefault !== undefined) barcode.isDefault = isDefault;

    await barcode.save();
    await barcode.populate('uploadedBy', 'name email');

    res.status(200).json({
      status: 'success',
      message: 'UPI barcode updated successfully',
      data: {
        barcode
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Delete UPI barcode (Admin only)
exports.deleteBarcode = async (req, res) => {
  try {
    const { id } = req.params;

    const barcode = await UPIBarcode.findById(id);
    if (!barcode) {
      return res.status(404).json({
        status: 'fail',
        message: 'UPI barcode not found'
      });
    }

    // Delete the image file
    try {
      await fs.unlink(barcode.barcodeImage.path);
    } catch (fileError) {
      console.error('Error deleting barcode file:', fileError);
    }

    // Delete from database
    await UPIBarcode.findByIdAndDelete(id);

    res.status(200).json({
      status: 'success',
      message: 'UPI barcode deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Set default barcode (Admin only)
exports.setDefaultBarcode = async (req, res) => {
  try {
    const { id } = req.params;

    const barcode = await UPIBarcode.findById(id);
    if (!barcode) {
      return res.status(404).json({
        status: 'fail',
        message: 'UPI barcode not found'
      });
    }

    if (!barcode.isActive) {
      return res.status(400).json({
        status: 'fail',
        message: 'Cannot set inactive barcode as default'
      });
    }

    // Set as default (pre-save middleware will handle removing default from others)
    barcode.isDefault = true;
    await barcode.save();
    await barcode.populate('uploadedBy', 'name email');

    res.status(200).json({
      status: 'success',
      message: 'Default UPI barcode updated successfully',
      data: {
        barcode
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Get barcode usage statistics (Admin only)
exports.getBarcodeStats = async (req, res) => {
  try {
    const stats = await UPIBarcode.aggregate([
      {
        $group: {
          _id: null,
          totalBarcodes: { $sum: 1 },
          activeBarcodes: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          },
          totalUsage: { $sum: '$usageCount' },
          avgUsage: { $avg: '$usageCount' }
        }
      }
    ]);

    const topUsed = await UPIBarcode.find({ isActive: true })
      .sort({ usageCount: -1 })
      .limit(5)
      .select('name upiId usageCount lastUsed');

    res.status(200).json({
      status: 'success',
      data: {
        stats: stats[0] || {
          totalBarcodes: 0,
          activeBarcodes: 0,
          totalUsage: 0,
          avgUsage: 0
        },
        topUsed
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'fail',
      message: error.message
    });
  }
};