const axios = require('axios');
const mongoose = require('mongoose');
const ApiProvider = require('../models/ApiProvider');
const OperatorConfig = require('../models/OperatorConfig');
const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');
const AppError = require('../utils/appError');

class RechargeService {
  constructor() {
    this.defaultTimeout = 30000;
    this.maxRetries = 3;
  }

  /**
   * Process recharge based on operator configuration
   */
  async processRecharge(rechargeData) {
    const { operatorCode, serviceType, amount, userId } = rechargeData;

    // Get operator configuration
    const operatorConfig = await OperatorConfig.getOperatorByCode(operatorCode);
    
    if (!operatorConfig) {
      throw new AppError('Operator not found or not supported', 404);
    }

    if (!operatorConfig.isActive) {
      throw new AppError('Operator is currently inactive', 400);
    }

    if (operatorConfig.isInMaintenance()) {
      throw new AppError(
        operatorConfig.maintenanceMode.message || 'Operator is under maintenance',
        503
      );
    }

    // Validate amount
    if (!operatorConfig.isAmountValid(amount)) {
      throw new AppError(
        `Amount must be between ₹1 and ₹10000`,
        400
      );
    }

    // Create transaction record
    const transaction = await this.createTransaction({
...rechargeData,
      operatorConfig,
      processingMode: operatorConfig.processingMode
    });

    try {
      let result;

      switch (operatorConfig.processingMode) {
        case 'api':
          result = await this.processApiRecharge(transaction, operatorConfig);
          break;
        case 'manual':
          result = await this.processManualRecharge(transaction, operatorConfig);
          break;
        case 'disabled':
          throw new AppError('This operator is currently disabled', 503);
        default:
          throw new AppError('Invalid processing mode', 500);
      }

      // Update operator statistics
      await operatorConfig.updateStats(
        result.status === 'success' ? 'success' : result.status === 'failed' ? 'failed' : 'pending',
        amount,
        result.processingTime
      );

      return result;
    } catch (error) {
      // Update transaction with error
      transaction.status = 'failed';
      transaction.failureReason = error.message;
      await transaction.save();

      // Refund wallet balance on failure
      const wallet = await Wallet.findOne({ user: new mongoose.Types.ObjectId(rechargeData.userId) });
      if (wallet) {
        wallet.balance += amount;
        await wallet.save();
      }

      // Update operator statistics
      await operatorConfig.updateStats('failed', amount);

      throw error;
    }
  }

  /**
   * Process recharge via API
   */
  async processApiRecharge(transaction, operatorConfig) {
    const startTime = Date.now();
    let apiProvider = operatorConfig.primaryApiProvider;
    let lastError;

    // Try primary API provider
    try {
      const result = await this.callApiProvider(transaction, operatorConfig, apiProvider);
      
      if (result.success) {
        await this.updateTransactionSuccess(transaction, result, apiProvider);
        return {
          status: 'success',
          transaction,
          processingTime: (Date.now() - startTime) / 1000
        };
      } else {
        lastError = new Error(result.message || 'Primary API failed');
      }
    } catch (error) {
      lastError = error;
      console.error(`Primary API provider failed for transaction ${transaction.transactionId}:`, error);
    }

    // Try fallback API providers
    if (operatorConfig.fallbackApiProviders && operatorConfig.fallbackApiProviders.length > 0) {
      const sortedFallbacks = operatorConfig.fallbackApiProviders
        .filter(fb => fb.provider && fb.provider.isActive)
        .sort((a, b) => b.priority - a.priority);

      for (const fallback of sortedFallbacks) {
        try {
          const result = await this.callApiProvider(transaction, operatorConfig, fallback.provider);
          
          if (result.success) {
            await this.updateTransactionSuccess(transaction, result, fallback.provider);
            return {
              status: 'success',
              transaction,
              processingTime: (Date.now() - startTime) / 1000
            };
          }
        } catch (error) {
          console.error(`Fallback API provider ${fallback.provider.name} failed:`, error);
          lastError = error;
        }
      }
    }

    // All API providers failed
    transaction.status = 'failed';
    transaction.failureReason = lastError?.message || 'All API providers failed';
    await transaction.save();

    return {
      status: 'failed',
      transaction,
      error: lastError?.message || 'All API providers failed',
      processingTime: (Date.now() - startTime) / 1000
    };
  }

  /**
   * Process manual recharge
   */
  async processManualRecharge(transaction, operatorConfig) {
    const requiresApproval = operatorConfig.requiresManualApproval(transaction.amount);

    if (!requiresApproval) {
      // Auto-approve small amounts
      transaction.status = 'success';
      transaction.completedAt = new Date();
      transaction.adminRemarks = 'Auto-approved based on amount threshold';
    } else {
      // Requires manual approval
      transaction.status = 'awaiting_approval';
      transaction.pendingReason = 'Awaiting manual approval';
      
      // Set approval timeout
      const timeoutHours = operatorConfig.manualProcessing.approvalTimeout || 24;
      transaction.approvalTimeout = new Date(Date.now() + (timeoutHours * 60 * 60 * 1000));
    }

    transaction.processingMode = 'manual';
    await transaction.save();

    return {
      status: transaction.status,
      transaction,
      requiresApproval,
      message: requiresApproval 
        ? 'Transaction submitted for manual approval' 
        : 'Transaction auto-approved'
    };
  }

  /**
   * Call specific API provider
   */
  async callApiProvider(transaction, operatorConfig, apiProvider) {
    if (!apiProvider || !apiProvider.isActive) {
      throw new Error('API provider is not active');
    }

    const credentials = apiProvider.getCredentials();
    const endpoint = this.getEndpoint(apiProvider, operatorConfig.serviceType);
    
    if (!endpoint) {
      throw new Error(`No endpoint configured for ${operatorConfig.serviceType} transaction`);
    }

    const requestData = this.buildRequestData(transaction, operatorConfig, apiProvider);
    const headers = this.buildHeaders(apiProvider, credentials);

    const axiosConfig = {
      method: 'POST',
      url: `${credentials.baseUrl}${endpoint}`,
      headers,
      timeout: apiProvider.timeout || this.defaultTimeout,
      data: requestData
    };

    // Add retry logic
    let lastError;
    const maxRetries = apiProvider.retryAttempts || this.maxRetries;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await axios(axiosConfig);
        const result = this.parseApiResponse(response.data, apiProvider);
        
        // Update API provider statistics
        await apiProvider.updateStats(result.success, transaction.amount);
        
        return result;
      } catch (error) {
        lastError = error;
        console.error(`API call attempt ${attempt} failed:`, error.message);
        
        if (attempt < maxRetries) {
          // Wait before retry (exponential backoff)
          await this.delay(Math.pow(2, attempt) * 1000);
        }
      }
    }

    // Update API provider statistics for failure
    await apiProvider.updateStats(false, transaction.amount);
    throw lastError;
  }

  /**
   * Get appropriate endpoint for service type
   */
  getEndpoint(apiProvider, serviceType) {
    switch (serviceType) {
      case 'mobile':
        return apiProvider.endpoints.mobileRecharge;
      case 'dth':
        return apiProvider.endpoints.dthRecharge;
      default:
        return apiProvider.endpoints.billPayment;
    }
  }

  /**
   * Build request data based on API provider format
   */
  buildRequestData(transaction, operatorConfig, apiProvider) {
    const baseData = {
      transactionId: transaction.transactionId,
      amount: transaction.amount,
      operator: operatorConfig.apiMapping.operatorId || operatorConfig.operatorCode,
      operatorName: operatorConfig.apiMapping.operatorName || operatorConfig.operatorName
    };

    const service = operatorConfig.serviceType;

    if (service === 'mobile') {
      baseData.mobileNumber = transaction.rechargeData?.mobileNumber || transaction.mobileNumber;
      baseData.circle = operatorConfig.apiMapping.circleMapping?.get(transaction.rechargeData?.circle || transaction.circle) || (transaction.rechargeData?.circle || transaction.circle);
    } else if (service === 'dth') {
      baseData.customerNumber = transaction.rechargeData?.customerNumber || transaction.customerNumber;
    } else {
      // Other bill payments (utilities, telecom postpaid, broadband, financial services)
      baseData.customerNumber = transaction.rechargeData?.customerNumber || transaction.customerNumber;
      
      if (transaction.rechargeData?.registeredMobile) {
        baseData.registeredMobile = transaction.rechargeData.registeredMobile;
      }
      // Include any custom fields if configured
    }

    // Add custom fields if configured
    if (operatorConfig.apiMapping.customFields) {
      for (const [key, value] of operatorConfig.apiMapping.customFields) {
        baseData[key] = value;
      }
    }

    return baseData;
  }

  /**
   * Build request headers
   */
  buildHeaders(apiProvider, credentials) {
    const headers = {
      'Content-Type': apiProvider.requestFormat === 'json' ? 'application/json' : 'application/x-www-form-urlencoded'
    };

    // Add authentication headers
    switch (apiProvider.authType) {
      case 'bearer':
        headers.Authorization = `Bearer ${credentials.apiKey}`;
        break;
      case 'basic':
        const basicAuth = Buffer.from(`${credentials.apiKey}:${credentials.apiSecret || ''}`).toString('base64');
        headers.Authorization = `Basic ${basicAuth}`;
        break;
      case 'api_key':
        headers['X-API-Key'] = credentials.apiKey;
        if (credentials.apiSecret) {
          headers['X-API-Secret'] = credentials.apiSecret;
        }
        break;
    }

    // Add custom headers
    if (apiProvider.headers) {
      for (const [key, value] of apiProvider.headers) {
        headers[key] = value;
      }
    }

    return headers;
  }

  /**
   * Parse API response based on provider configuration
   */
  parseApiResponse(responseData, apiProvider) {
    let data = responseData;

    // Parse based on response format
    if (apiProvider.responseFormat === 'json' && typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (error) {
        throw new Error('Invalid JSON response');
      }
    }

    // Determine success/failure based on configured codes
    const status = this.getResponseStatus(data);
    const isSuccess = apiProvider.successCodes.some(code => 
      status && status.toString().toUpperCase().includes(code.toUpperCase())
    );
    const isFailed = apiProvider.failureCodes.some(code => 
      status && status.toString().toUpperCase().includes(code.toUpperCase())
    );
    const isPending = apiProvider.pendingCodes.some(code => 
      status && status.toString().toUpperCase().includes(code.toUpperCase())
    );

    return {
      success: isSuccess,
      pending: isPending,
      failed: isFailed,
      status: status,
      message: this.getResponseMessage(data),
      apiTransactionId: this.getApiTransactionId(data),
      rawResponse: data
    };
  }

  /**
   * Extract status from response
   */
  getResponseStatus(data) {
    if (typeof data === 'object') {
      return data.status || data.code || data.result || data.state;
    }
    return data;
  }

  /**
   * Extract message from response
   */
  getResponseMessage(data) {
    if (typeof data === 'object') {
      return data.message || data.msg || data.description || data.error;
    }
    return data;
  }

  /**
   * Extract API transaction ID from response
   */
  getApiTransactionId(data) {
    if (typeof data === 'object') {
      return data.transactionId || data.txnId || data.id || data.reference;
    }
    return null;
  }

  /**
   * Create transaction record
   */
  async createTransaction(data) {
    // Get user's wallet
    const wallet = await Wallet.findOne({ user: new mongoose.Types.ObjectId(data.userId) });
    if (!wallet) {
      throw new AppError('User wallet not found', 404);
    }

    // Check wallet balance
    if (wallet.balance < data.amount) {
      throw new AppError('Insufficient wallet balance', 400);
    }

    // Deduct amount from wallet immediately when transaction is created
    wallet.balance -= data.amount;
    await wallet.save();

    const transactionId = this.generateTransactionId();
    
    const transaction = new Transaction({
      wallet: wallet._id,
      userId: data.userId,
      amount: data.amount,
      type: (data.serviceType === 'mobile') ? 'mobile-recharge' : (data.serviceType === 'dth') ? 'dth-recharge' : 'bill-payment',
      status: 'pending',
      description: `${data.serviceType.toUpperCase()} ${data.serviceType === 'mobile' || data.serviceType === 'dth' ? 'Recharge' : 'Bill Payment'} - ${data.operatorCode}`,
      transactionId: transactionId,
      reference: transactionId,
      operator: data.operatorCode,
      
      // Recharge-specific data
      rechargeData: {
        mobileNumber: data.mobileNumber,
        customerNumber: data.customerNumber,
        circle: data.circle,
        planId: data.planId,
        planName: data.planName,
        planDescription: data.planDescription,
        validity: data.validity,
        talktime: data.talktime,
        data: data.data,
        registeredMobile: data.registeredMobile
      },
      
      // Processing configuration
      apiProvider: data.processingMode === 'api' ? 'api' : 'manual',
      
      // Metadata
      metadata: {
        processingMode: data.processingMode,
        operatorConfig: data.operatorConfig?._id
      },
      
      // Timing
      initiatedAt: new Date()
    });

    return await transaction.save();
  }

  /**
   * Update transaction on success
   */
  async updateTransactionSuccess(transaction, result, apiProvider) {
    transaction.status = result.pending ? 'pending' : 'success';
    transaction.apiTransactionId = result.apiTransactionId;
    transaction.apiResponse = result.rawResponse;
    transaction.apiProvider = apiProvider.name || apiProvider._id;
    
    if (!result.pending) {
      transaction.completedAt = new Date();
    }
    
    // Update status history
    if (!transaction.statusHistory) {
      transaction.statusHistory = [];
    }
    transaction.statusHistory.push({
      status: transaction.status,
      timestamp: new Date(),
      reason: result.pending ? 'API processing pending' : 'Transaction completed successfully',
      updatedBy: 'system'
    });
    
    await transaction.save();
  }

  /**
   * Generate unique transaction ID
   */
  generateTransactionId() {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TXN${timestamp}${random}`;
  }

  /**
   * Delay utility for retries
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get available operators for a service type
   */
  async getOperators(serviceType) {
    const operators = await OperatorConfig.getActiveOperators(serviceType);
    
    return operators.map(op => ({
      code: op.operatorCode,
      name: op.operatorName,
      serviceType: op.serviceType,
      processingMode: op.processingMode,
      minAmount: op.minAmount,
      maxAmount: op.maxAmount,
      allowedAmounts: op.allowedAmounts,
      circles: op.circles.filter(c => c.isActive),
      commission: op.commission,
      isInMaintenance: op.isInMaintenance()
    }));
  }

  /**
   * Check transaction status
   */
  async checkTransactionStatus(transactionId) {
    const transaction = await Transaction.findOne({ 
      transactionId,
      type: { $in: ['mobile-recharge', 'dth-recharge'] }
    })
      .populate('userId', 'name email')
      .populate('wallet', 'balance')
      .populate('apiProvider', 'name displayName');

    if (!transaction) {
      throw new AppError('Transaction not found', 404);
    }

    // If transaction is pending and has API provider, check status with API
    if (transaction.status === 'pending' && transaction.apiProvider && transaction.apiTransactionId) {
      try {
        const statusResult = await this.checkApiTransactionStatus(transaction);
        if (statusResult && statusResult.status !== transaction.status) {
          transaction.status = statusResult.status;
          if (statusResult.status === 'success') {
            transaction.completedAt = new Date();
          } else if (statusResult.status === 'failed') {
            transaction.failureReason = statusResult.message;
          }
          await transaction.save();
        }
      } catch (error) {
        console.error('Error checking API transaction status:', error);
      }
    }

    return transaction;
  }

  /**
   * Check transaction status with API provider
   */
  async checkApiTransactionStatus(transaction) {
    const apiProvider = await ApiProvider.findById(transaction.apiProvider);
    if (!apiProvider || !apiProvider.isActive) {
      return null;
    }

    const credentials = apiProvider.getCredentials();
    const endpoint = apiProvider.endpoints.checkStatus;
    
    if (!endpoint) {
      return null;
    }

    try {
      const response = await axios({
        method: 'GET',
        url: `${credentials.baseUrl}${endpoint}`,
        headers: this.buildHeaders(apiProvider, credentials),
        params: {
          transactionId: transaction.apiTransactionId || transaction.transactionId
        },
        timeout: apiProvider.timeout || this.defaultTimeout
      });

      return this.parseApiResponse(response.data, apiProvider);
    } catch (error) {
      console.error('API status check failed:', error);
      return null;
    }
  }

  /**
   * Process bill payment (utilities, postpaid, broadband, etc.)
   */
  async processBillPayment(billData) {
    const { userId, serviceType, customerNumber, operator, amount, registeredMobile } = billData;

    // Validate operator configuration
    if (!operator) {
      throw new AppError('Operator not found or not supported', 404);
    }
    if (!operator.isActive) {
      throw new AppError('Operator is currently inactive', 400);
    }
    if (operator.isInMaintenance && operator.isInMaintenance()) {
      throw new AppError(operator.maintenanceMode?.message || 'Operator is under maintenance', 503);
    }

    // Validate amount against operator limits
    if (typeof operator.isAmountValid === 'function') {
      if (!operator.isAmountValid(amount)) {
        throw new AppError(`Amount must be between ₹${operator.minAmount || 50} and ₹${operator.maxAmount || 50000}`, 400);
      }
    } else {
      if (amount < 50 || amount > 50000) {
        throw new AppError('Amount must be between ₹50 and ₹50,000', 400);
      }
    }

    // Create transaction record and deduct wallet
    const transaction = await this.createTransaction({
      userId,
      serviceType,
      amount,
      operatorCode: operator.operatorCode,
      customerNumber,
      operatorConfig: operator,
      processingMode: operator.processingMode,
      registeredMobile
    });

    try {
      let result;

      switch (operator.processingMode) {
        case 'api':
          result = await this.processApiRecharge(transaction, operator);
          break;
        case 'manual':
          result = await this.processManualRecharge(transaction, operator);
          break;
        case 'disabled':
          throw new AppError('This operator is currently disabled', 503);
        default:
          throw new AppError('Invalid processing mode', 500);
      }

      // Update operator statistics
      await operator.updateStats(
        result.status === 'success' ? 'success' : result.status === 'failed' ? 'failed' : 'pending',
        amount,
        result.processingTime
      );

      return {
        transactionId: transaction.transactionId,
        status: result.status,
        amount: transaction.amount,
        customerNumber: transaction.rechargeData?.customerNumber || customerNumber,
        processingMode: operator.processingMode
      };
    } catch (error) {
      // Mark failed
      transaction.status = 'failed';
      transaction.failureReason = error.message;
      await transaction.save();

      // Refund wallet balance on failure
      const wallet = await Wallet.findOne({ user: new mongoose.Types.ObjectId(userId) });
      if (wallet) {
        wallet.balance += amount;
        await wallet.save();
      }

      // Update operator statistics
      if (typeof operator.updateStats === 'function') {
        await operator.updateStats('failed', amount);
      }

      throw error;
    }
  }
}

module.exports = new RechargeService();