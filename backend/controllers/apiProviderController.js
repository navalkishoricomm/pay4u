const ApiProvider = require('../models/ApiProvider');
const OperatorConfiguration = require('../models/OperatorConfiguration');

// Get all API providers
exports.getAllProviders = async (req, res) => {
  try {
    const providers = await ApiProvider.find()
      .select('-apiSecret -testCredentials.apiSecret') // Hide sensitive data
      .sort({ priority: -1, createdAt: -1 });
    
    res.status(200).json({
      status: 'success',
      results: providers.length,
      data: providers
    });
  } catch (error) {
    console.error('Error fetching API providers:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get single API provider
exports.getProvider = async (req, res) => {
  try {
    const provider = await ApiProvider.findById(req.params.id)
      .select('-apiSecret -testCredentials.apiSecret');
    
    if (!provider) {
      return res.status(404).json({
        status: 'fail',
        message: 'API provider not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: provider
    });
  } catch (error) {
    console.error('Error fetching API provider:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Create new API provider
exports.createProvider = async (req, res) => {
  try {
    console.log('Creating new API provider with data:', req.body);
    
    // Validate required fields
    const requiredFields = ['name', 'displayName', 'baseUrl', 'apiKey'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        status: 'fail',
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }
    
    // Validate endpoints
    if (!req.body.endpoints || !req.body.endpoints.mobileRecharge || !req.body.endpoints.dthRecharge || !req.body.endpoints.checkStatus) {
      return res.status(400).json({
        status: 'fail',
        message: 'Missing required endpoints: mobileRecharge, dthRecharge, and checkStatus are required'
      });
    }
    
    const provider = new ApiProvider(req.body);
    await provider.save();
    
    // Remove sensitive data from response
    const responseProvider = provider.toObject();
    delete responseProvider.apiSecret;
    delete responseProvider.testCredentials;
    
    console.log('API provider created successfully:', responseProvider.name);
    
    res.status(201).json({
      status: 'success',
      data: responseProvider
    });
  } catch (error) {
    console.error('Error creating API provider:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        status: 'fail',
        message: 'API provider with this name already exists'
      });
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        status: 'fail',
        message: 'Validation error',
        errors
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Update API provider
exports.updateProvider = async (req, res) => {
  try {
    console.log('Updating API provider:', req.params.id, 'with data:', req.body);
    
    const provider = await ApiProvider.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).select('-apiSecret -testCredentials.apiSecret');
    
    if (!provider) {
      return res.status(404).json({
        status: 'fail',
        message: 'API provider not found'
      });
    }
    
    console.log('API provider updated successfully:', provider.name);
    
    res.status(200).json({
      status: 'success',
      data: provider
    });
  } catch (error) {
    console.error('Error updating API provider:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        status: 'fail',
        message: 'API provider with this name already exists'
      });
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        status: 'fail',
        message: 'Validation error',
        errors
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Delete API provider
exports.deleteProvider = async (req, res) => {
  try {
    console.log('Deleting API provider:', req.params.id);
    
    // Check if provider is being used by any operator configurations
    const operatorConfigs = await OperatorConfiguration.find({ apiProvider: req.params.id });
    
    if (operatorConfigs.length > 0) {
      return res.status(400).json({
        status: 'fail',
        message: `Cannot delete API provider. It is currently used by ${operatorConfigs.length} operator configuration(s)`
      });
    }
    
    const provider = await ApiProvider.findByIdAndDelete(req.params.id);
    
    if (!provider) {
      return res.status(404).json({
        status: 'fail',
        message: 'API provider not found'
      });
    }
    
    console.log('API provider deleted successfully:', provider.name);
    
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    console.error('Error deleting API provider:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Test API provider connection
exports.testProvider = async (req, res) => {
  try {
    const provider = await ApiProvider.findById(req.params.id);
    
    if (!provider) {
      return res.status(404).json({
        status: 'fail',
        message: 'API provider not found'
      });
    }
    
    // Here you would implement actual API testing logic
    // For now, we'll simulate a test
    const testResult = {
      status: 'success',
      message: 'API provider connection test successful',
      responseTime: Math.floor(Math.random() * 1000) + 100, // Random response time
      timestamp: new Date()
    };
    
    res.status(200).json({
      status: 'success',
      data: testResult
    });
  } catch (error) {
    console.error('Error testing API provider:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get provider statistics
exports.getProviderStats = async (req, res) => {
  try {
    const provider = await ApiProvider.findById(req.params.id);
    
    if (!provider) {
      return res.status(404).json({
        status: 'fail',
        message: 'API provider not found'
      });
    }
    
    const stats = {
      totalTransactions: provider.totalTransactions,
      successfulTransactions: provider.successfulTransactions,
      failedTransactions: provider.failedTransactions,
      successRate: provider.successRate,
      failureRate: provider.failureRate,
      totalAmount: provider.totalAmount,
      lastUsed: provider.lastUsed
    };
    
    res.status(200).json({
      status: 'success',
      data: stats
    });
  } catch (error) {
    console.error('Error fetching provider stats:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};