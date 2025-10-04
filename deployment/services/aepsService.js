const AepsTransaction = require('../models/AepsTransaction');
const ApiProvider = require('../models/ApiProvider');
const ChargeSlab = require('../models/ChargeSlab');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const axios = require('axios');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const productionLogger = require('../utils/productionLogger');

class AepsService {
  constructor() {
    this.apiProvider = null;
    // Production Paysprint Credentials (Ready for deployment)
    this.paysprintCredentials = {
      JWT_KEY: 'PS003214ff7994907c1ce05963cbb4983ddeb68b', // Decoded from base64
      AUTHORISED_KEY: '132d8577910bcd5afee8f26c0b239263', // Decoded from base64
      AES_ENCRYPTION_KEY: 'a901de13133edc22',
      AES_ENCRYPTION_IV: '2a1324e96009b15a',
      // Original Base64 encoded versions (backup)
      JWT_KEY_ENCODED: 'UFMwMDMyMTRmZjc5OTQ5MDdjMWNlMDU5NjNjYmI0OTgzZGRlYjY4Yg==',
      AUTHORISED_KEY_ENCODED: 'MTMyZDg1Nzc5MTBiY2Q1YWZlZThmMjZjMGIyMzkyNjM='
    };
    // Environment-based AEPS API endpoints
    this.paysprintEndpoints = {
      baseURL: this.getBaseURL(),
      aepsBalance: '/balance/balance/aepsbalance',
      balanceInquiry: '/aeps/balance/inquiry',
      cashWithdrawal: '/aeps/cash/withdrawal',
      cashDeposit: '/aeps/cash/deposit',
      miniStatement: '/aeps/mini/statement',
      bankList: '/aeps/bank/list'
    };
  }

  // Get environment-specific base URL
  getBaseURL() {
    const environment = process.env.NODE_ENV || 'development';
    
    if (environment === 'production') {
      // Live/Production environment
      return 'https://api.paysprint.in/api/v1/service';
    } else {
      // UAT/Development environment
      return 'https://sit.paysprint.in/service-api/api/v1/service';
    }
  }

  async initialize() {
    try {
      // Get Paysprint API provider configuration
      this.apiProvider = await ApiProvider.findOne({ 
        name: 'paysprint', 
        isActive: true 
      });
      
      if (!this.apiProvider) {
        console.log('Paysprint API provider not configured in database, using direct credentials');
        // Use direct credentials for production
        this.useDirectCredentials = true;
      }
    } catch (error) {
      console.error('AEPS Service initialization failed:', error);
      throw error;
    }
  }

  // Generate unique reference ID for transactions
  generateReferenceId() {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `AEPS${timestamp}${random}`.substring(0, 20);
  }

  // Generate JWT token for Paysprint authentication
  generateJWTToken() {
    const jwt = require('jsonwebtoken');
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const payload = {
      timestamp: currentTimestamp,
      partnerId: process.env.PAYSPRINT_PARTNER_ID || 'PS003214', // Paysprint Partner ID
      reqid: Math.floor(Math.random() * 1000000).toString()
    };
    
    // Use the JWT_KEY as the secret for signing
    const jwtToken = jwt.sign(payload, this.paysprintCredentials.JWT_KEY, { algorithm: 'HS256' });
    console.log('AEPS - Generated JWT Token:', jwtToken);
    return jwtToken;
  }

  // Build request headers based on API provider configuration
  buildHeaders() {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'TraePay4U-AEPS/1.0'
    };

    // For Paysprint API - Generate fresh JWT token for each request
    if (this.useDirectCredentials || !this.apiProvider) {
      // Direct Paysprint authentication as per team instructions
      const jwtToken = this.generateJWTToken();
      headers['Authorization'] = `Bearer ${jwtToken}`;
      headers['Authorised-Key'] = this.paysprintCredentials.AUTHORISED_KEY;
      
      console.log('AEPS - Using direct Paysprint authentication:');
      console.log('- JWT Token generated and added to Authorization header');
      console.log('- Authorised-Key added to headers');
      
      return headers;
    }

    if (!this.apiProvider || !this.apiProvider.headers) {
      return headers;
    }

    const additionalHeaders = {};
    
    switch (this.apiProvider.authType) {
      case 'bearer':
        // For Paysprint, generate JWT token according to their documentation
        if (this.apiProvider.name === 'paysprint') {
          const jwtToken = this.generateJWTToken();
          additionalHeaders['Authorization'] = `Bearer ${jwtToken}`;
          additionalHeaders['Authorised-Key'] = this.paysprintCredentials.AUTHORISED_KEY;
        } else if (this.apiProvider.apiSecret) {
          const jwt = require('jsonwebtoken');
          const token = jwt.sign(
            { 
              iss: 'traepay4u',
              aud: 'paysprint',
              iat: Math.floor(Date.now() / 1000)
            },
            this.apiProvider.apiSecret,
            { expiresIn: '1h' }
          );
          additionalHeaders['Authorization'] = `Bearer ${token}`;
        }
        break;
      case 'api_key':
        if (this.apiProvider.apiKey) {
          additionalHeaders['X-API-Key'] = this.apiProvider.apiKey;
        }
        break;
      case 'basic':
        if (this.apiProvider.apiKey && this.apiProvider.apiSecret) {
          const credentials = Buffer.from(`${this.apiProvider.apiKey}:${this.apiProvider.apiSecret}`).toString('base64');
          additionalHeaders['Authorization'] = `Basic ${credentials}`;
        }
        break;
    }

    return { ...headers, ...additionalHeaders };
  }

  // AES encryption for request body (required by Paysprint)
  encryptRequestBody(data) {
    if (this.useDirectCredentials) {
      // Use direct credentials for encryption
      try {
        const key = Buffer.from(this.paysprintCredentials.AES_ENCRYPTION_KEY, 'hex');
        const iv = Buffer.from(this.paysprintCredentials.AES_ENCRYPTION_IV, 'hex');
        
        const cipher = crypto.createCipher('aes-128-cbc', key);
        cipher.setAutoPadding(true);
        
        let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'base64');
        encrypted += cipher.final('base64');
        
        console.log('AEPS request body encrypted successfully');
        return { body: encrypted };
      } catch (error) {
        console.error('AEPS AES encryption failed:', error);
        return data; // Fallback to plain data
      }
    }

    if (!this.apiProvider.config || !this.apiProvider.config.aesEncryptionKey) {
      console.log('AES encryption not configured, sending plain data');
      return data;
    }

    try {
      const key = Buffer.from(this.apiProvider.config.aesEncryptionKey, 'hex');
      const iv = Buffer.from(this.apiProvider.config.aesEncryptionIv, 'hex');
      
      const cipher = crypto.createCipher('aes-128-cbc', key);
      cipher.setAutoPadding(true);
      
      let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'base64');
      encrypted += cipher.final('base64');
      
      console.log('AEPS request body encrypted successfully');
      return { body: encrypted };
    } catch (error) {
      console.error('AEPS AES encryption failed:', error);
      return data; // Fallback to plain data
    }
  }

  // Make API request with retry logic
  async makeApiRequest(endpoint, data, method = 'POST', retryCount = 0) {
    console.log(`=== STARTING AEPS API REQUEST ===`);
    console.log(`Endpoint: ${endpoint}`);
    console.log(`Method: ${method}`);
    console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
    
    let requestId = null;
    
    try {
      const baseUrl = this.useDirectCredentials ? 
        this.paysprintEndpoints.baseURL : 
        this.apiProvider.baseUrl;
      const url = `${baseUrl}${endpoint}`;
      const headers = this.buildHeaders();
      
      // Encrypt request body for Paysprint
      let requestData = data;
      if (method.toLowerCase() !== 'get') {
        requestData = this.encryptRequestBody(data);
      }
      
      // Log request for production debugging
      requestId = productionLogger.logRequest(url, method, headers, requestData, {
        endpoint,
        originalData: data,
        encrypted: method.toLowerCase() !== 'get',
        retryCount,
        apiProvider: 'paysprint-aeps'
      });
      
      console.log(`AEPS API Request to ${url}:`, { data: requestData, headers });
      
      const config = {
        method,
        url,
        headers,
        timeout: 30000
      };
      
      if (method.toLowerCase() !== 'get') {
        config.data = requestData;
      }
      
      const response = await axios(config);
      
      // Log successful response
      productionLogger.logResponse(requestId, response.status, response.statusText, response.headers, response.data);
      
      console.log(`AEPS API Response from ${url}:`, response.data);
      
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      // Log error response for production debugging
      if (requestId) {
        productionLogger.logResponse(
          requestId, 
          error.response?.status || 500, 
          error.response?.statusText || 'Internal Server Error', 
          error.response?.headers || {}, 
          error.response?.data || null, 
          error
        );
      }
      
      console.error(`=== DETAILED AEPS API ERROR for ${endpoint} ===`);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      
      // Retry logic for specific errors
      const maxRetries = 2;
      if (retryCount < maxRetries && this.shouldRetry(error)) {
        console.log(`Retrying AEPS API request (${retryCount + 1}/${maxRetries})...`);
        await this.delay(1000 * (retryCount + 1)); // Exponential backoff
        return this.makeApiRequest(endpoint, data, method, retryCount + 1);
      }
      
      return {
        success: false,
        error: error.response?.data || error.message,
        status: error.response?.status || 500
      };
    }
  }

  // Check if error should trigger a retry
  shouldRetry(error) {
    const retryableStatuses = [408, 429, 500, 502, 503, 504];
    const retryableCodes = ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND'];
    
    return (
      retryableStatuses.includes(error.response?.status) ||
      retryableCodes.includes(error.code)
    );
  }

  // Delay utility for retry logic
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Calculate AEPS charges based on transaction type and amount
  async calculateCharges(transactionType, amount = 0) {
    try {
      const chargeSlab = await ChargeSlab.findOne({
        serviceType: 'aeps',
        transactionType: transactionType,
        isActive: true,
        minAmount: { $lte: amount },
        maxAmount: { $gte: amount }
      });

      if (!chargeSlab) {
        // Default charges if no slab found
        const defaultCharges = {
          balance_inquiry: 5,
          cash_withdrawal: 10,
          cash_deposit: 10,
          mini_statement: 5
        };
        return defaultCharges[transactionType] || 0;
      }

      let charges = 0;
      if (chargeSlab.chargeType === 'flat') {
        charges = chargeSlab.charge;
      } else if (chargeSlab.chargeType === 'percentage') {
        charges = (amount * chargeSlab.charge) / 100;
      }

      return Math.max(charges, chargeSlab.minCharge || 0);
    } catch (error) {
      console.error('Error calculating AEPS charges:', error);
      return 0;
    }
  }

  // Balance Inquiry
  async balanceInquiry(requestData) {
    const {
      userId,
      aadhaarNumber,
      customerMobile,
      bankIin,
      biometricType,
      pidData,
      wadh,
      merchantId,
      terminalId
    } = requestData;

    try {
      // Calculate charges
      const charges = await this.calculateCharges('balance_inquiry');
      
      // Create transaction record
      const transactionId = uuidv4();
      const referenceId = this.generateReferenceId();
      
      const transaction = new AepsTransaction({
        transactionId,
        referenceId,
        userId,
        aadhaarNumber,
        customerMobile,
        transactionType: 'balance_inquiry',
        amount: 0,
        charges,
        totalAmount: charges,
        bankIin,
        biometricType,
        pidData,
        wadh,
        merchantId,
        terminalId,
        status: 'pending'
      });
      
      await transaction.save();
      
      // Prepare API request data
      const apiData = {
        reference_id: referenceId,
        aadhaar_number: aadhaarNumber,
        mobile: customerMobile,
        bank_iin: bankIin,
        biometric_type: biometricType,
        pid_data: pidData,
        wadh: wadh,
        merchant_id: merchantId,
        terminal_id: terminalId
      };
      
      // Update transaction status
      await transaction.updateStatus('processing', 'API request initiated');
      
      // Make API call
      const response = await this.makeApiRequest(
        this.paysprintEndpoints.balanceInquiry,
        apiData
      );
      
      // Process response
      if (response.success && response.data) {
        const apiResponse = response.data;
        
        // Update transaction with response
        transaction.paysprintResponse = apiResponse;
        transaction.paysprintTransactionId = apiResponse.txn_id;
        transaction.paysprintStatus = apiResponse.status;
        transaction.paysprintStatusDescription = apiResponse.message;
        transaction.balanceAmount = apiResponse.balance;
        transaction.rrn = apiResponse.rrn;
        transaction.bankReferenceNumber = apiResponse.bank_ref_num;
        
        if (apiResponse.status === '1' || apiResponse.status === 'success') {
          await transaction.updateStatus('success', 'Balance inquiry completed');
        } else {
          await transaction.updateStatus('failed', apiResponse.message || 'Balance inquiry failed');
        }
        
        return {
          success: true,
          transaction: transaction.getSummary(),
          balance: apiResponse.balance,
          message: apiResponse.message,
          rrn: apiResponse.rrn
        };
      } else {
        await transaction.updateStatus('failed', response.error || 'API request failed');
        throw new Error(response.error || 'Balance inquiry failed');
      }
    } catch (error) {
      console.error('Balance inquiry error:', error);
      throw error;
    }
  }

  // Cash Withdrawal
  async cashWithdrawal(requestData) {
    const {
      userId,
      aadhaarNumber,
      customerMobile,
      amount,
      bankIin,
      biometricType,
      pidData,
      wadh,
      merchantId,
      terminalId
    } = requestData;

    try {
      // Validate amount
      if (!amount || amount <= 0 || amount > 10000) {
        throw new Error('Invalid withdrawal amount. Amount must be between ₹1 and ₹10,000');
      }

      // Calculate charges
      const charges = await this.calculateCharges('cash_withdrawal', amount);
      const totalAmount = amount + charges;
      
      // Check user wallet balance for charges
      const wallet = await Wallet.findOne({ userId });
      if (!wallet || wallet.balance < charges) {
        throw new Error('Insufficient wallet balance to cover transaction charges');
      }
      
      // Create transaction record
      const transactionId = uuidv4();
      const referenceId = this.generateReferenceId();
      
      const transaction = new AepsTransaction({
        transactionId,
        referenceId,
        userId,
        aadhaarNumber,
        customerMobile,
        transactionType: 'cash_withdrawal',
        amount,
        charges,
        totalAmount,
        bankIin,
        biometricType,
        pidData,
        wadh,
        merchantId,
        terminalId,
        status: 'pending'
      });
      
      await transaction.save();
      
      // Prepare API request data
      const apiData = {
        reference_id: referenceId,
        aadhaar_number: aadhaarNumber,
        mobile: customerMobile,
        amount: amount,
        bank_iin: bankIin,
        biometric_type: biometricType,
        pid_data: pidData,
        wadh: wadh,
        merchant_id: merchantId,
        terminal_id: terminalId
      };
      
      // Update transaction status
      await transaction.updateStatus('processing', 'API request initiated');
      
      // Make API call
      const response = await this.makeApiRequest(
        this.paysprintEndpoints.cashWithdrawal,
        apiData
      );
      
      // Process response
      if (response.success && response.data) {
        const apiResponse = response.data;
        
        // Update transaction with response
        transaction.paysprintResponse = apiResponse;
        transaction.paysprintTransactionId = apiResponse.txn_id;
        transaction.paysprintStatus = apiResponse.status;
        transaction.paysprintStatusDescription = apiResponse.message;
        transaction.rrn = apiResponse.rrn;
        transaction.bankReferenceNumber = apiResponse.bank_ref_num;
        
        if (apiResponse.status === '1' || apiResponse.status === 'success') {
          // Deduct charges from wallet
          wallet.balance -= charges;
          await wallet.save();
          
          await transaction.updateStatus('success', 'Cash withdrawal completed');
          
          return {
            success: true,
            transaction: transaction.getSummary(),
            message: apiResponse.message,
            rrn: apiResponse.rrn,
            amount: amount,
            charges: charges
          };
        } else {
          await transaction.updateStatus('failed', apiResponse.message || 'Cash withdrawal failed');
          throw new Error(apiResponse.message || 'Cash withdrawal failed');
        }
      } else {
        await transaction.updateStatus('failed', response.error || 'API request failed');
        throw new Error(response.error || 'Cash withdrawal failed');
      }
    } catch (error) {
      console.error('Cash withdrawal error:', error);
      throw error;
    }
  }

  // Cash Deposit
  async cashDeposit(requestData) {
    const {
      userId,
      aadhaarNumber,
      customerMobile,
      amount,
      bankIin,
      biometricType,
      pidData,
      wadh,
      merchantId,
      terminalId
    } = requestData;

    try {
      // Validate amount
      if (!amount || amount <= 0 || amount > 50000) {
        throw new Error('Invalid deposit amount. Amount must be between ₹1 and ₹50,000');
      }

      // Calculate charges
      const charges = await this.calculateCharges('cash_deposit', amount);
      const totalAmount = amount + charges;
      
      // Check user wallet balance for charges
      const wallet = await Wallet.findOne({ userId });
      if (!wallet || wallet.balance < charges) {
        throw new Error('Insufficient wallet balance to cover transaction charges');
      }
      
      // Create transaction record
      const transactionId = uuidv4();
      const referenceId = this.generateReferenceId();
      
      const transaction = new AepsTransaction({
        transactionId,
        referenceId,
        userId,
        aadhaarNumber,
        customerMobile,
        transactionType: 'cash_deposit',
        amount,
        charges,
        totalAmount,
        bankIin,
        biometricType,
        pidData,
        wadh,
        merchantId,
        terminalId,
        status: 'pending'
      });
      
      await transaction.save();
      
      // Prepare API request data
      const apiData = {
        reference_id: referenceId,
        aadhaar_number: aadhaarNumber,
        mobile: customerMobile,
        amount: amount,
        bank_iin: bankIin,
        biometric_type: biometricType,
        pid_data: pidData,
        wadh: wadh,
        merchant_id: merchantId,
        terminal_id: terminalId
      };
      
      // Update transaction status
      await transaction.updateStatus('processing', 'API request initiated');
      
      // Make API call
      const response = await this.makeApiRequest(
        this.paysprintEndpoints.cashDeposit,
        apiData
      );
      
      // Process response
      if (response.success && response.data) {
        const apiResponse = response.data;
        
        // Update transaction with response
        transaction.paysprintResponse = apiResponse;
        transaction.paysprintTransactionId = apiResponse.txn_id;
        transaction.paysprintStatus = apiResponse.status;
        transaction.paysprintStatusDescription = apiResponse.message;
        transaction.rrn = apiResponse.rrn;
        transaction.bankReferenceNumber = apiResponse.bank_ref_num;
        
        if (apiResponse.status === '1' || apiResponse.status === 'success') {
          // Deduct charges from wallet
          wallet.balance -= charges;
          await wallet.save();
          
          await transaction.updateStatus('success', 'Cash deposit completed');
          
          return {
            success: true,
            transaction: transaction.getSummary(),
            message: apiResponse.message,
            rrn: apiResponse.rrn,
            amount: amount,
            charges: charges
          };
        } else {
          await transaction.updateStatus('failed', apiResponse.message || 'Cash deposit failed');
          throw new Error(apiResponse.message || 'Cash deposit failed');
        }
      } else {
        await transaction.updateStatus('failed', response.error || 'API request failed');
        throw new Error(response.error || 'Cash deposit failed');
      }
    } catch (error) {
      console.error('Cash deposit error:', error);
      throw error;
    }
  }

  // Mini Statement
  async miniStatement(requestData) {
    const {
      userId,
      aadhaarNumber,
      customerMobile,
      bankIin,
      biometricType,
      pidData,
      wadh,
      merchantId,
      terminalId
    } = requestData;

    try {
      // Calculate charges
      const charges = await this.calculateCharges('mini_statement');
      
      // Check user wallet balance for charges
      const wallet = await Wallet.findOne({ userId });
      if (!wallet || wallet.balance < charges) {
        throw new Error('Insufficient wallet balance to cover transaction charges');
      }
      
      // Create transaction record
      const transactionId = uuidv4();
      const referenceId = this.generateReferenceId();
      
      const transaction = new AepsTransaction({
        transactionId,
        referenceId,
        userId,
        aadhaarNumber,
        customerMobile,
        transactionType: 'mini_statement',
        amount: 0,
        charges,
        totalAmount: charges,
        bankIin,
        biometricType,
        pidData,
        wadh,
        merchantId,
        terminalId,
        status: 'pending'
      });
      
      await transaction.save();
      
      // Prepare API request data
      const apiData = {
        reference_id: referenceId,
        aadhaar_number: aadhaarNumber,
        mobile: customerMobile,
        bank_iin: bankIin,
        biometric_type: biometricType,
        pid_data: pidData,
        wadh: wadh,
        merchant_id: merchantId,
        terminal_id: terminalId
      };
      
      // Update transaction status
      await transaction.updateStatus('processing', 'API request initiated');
      
      // Make API call
      const response = await this.makeApiRequest(
        this.paysprintEndpoints.miniStatement,
        apiData
      );
      
      // Process response
      if (response.success && response.data) {
        const apiResponse = response.data;
        
        // Update transaction with response
        transaction.paysprintResponse = apiResponse;
        transaction.paysprintTransactionId = apiResponse.txn_id;
        transaction.paysprintStatus = apiResponse.status;
        transaction.paysprintStatusDescription = apiResponse.message;
        transaction.balanceAmount = apiResponse.balance;
        transaction.rrn = apiResponse.rrn;
        transaction.bankReferenceNumber = apiResponse.bank_ref_num;
        transaction.miniStatement = apiResponse.mini_statement || [];
        
        if (apiResponse.status === '1' || apiResponse.status === 'success') {
          // Deduct charges from wallet
          wallet.balance -= charges;
          await wallet.save();
          
          await transaction.updateStatus('success', 'Mini statement retrieved');
          
          return {
            success: true,
            transaction: transaction.getSummary(),
            balance: apiResponse.balance,
            miniStatement: apiResponse.mini_statement || [],
            message: apiResponse.message,
            rrn: apiResponse.rrn,
            charges: charges
          };
        } else {
          await transaction.updateStatus('failed', apiResponse.message || 'Mini statement failed');
          throw new Error(apiResponse.message || 'Mini statement failed');
        }
      } else {
        await transaction.updateStatus('failed', response.error || 'API request failed');
        throw new Error(response.error || 'Mini statement failed');
      }
    } catch (error) {
      console.error('Mini statement error:', error);
      throw error;
    }
  }

  // Get transaction status
  async getTransactionStatus(transactionId) {
    try {
      const transaction = await AepsTransaction.findOne({ transactionId });
      if (!transaction) {
        throw new Error('Transaction not found');
      }
      
      return {
        success: true,
        transaction: transaction.getSummary(),
        status: transaction.status,
        statusHistory: transaction.statusHistory
      };
    } catch (error) {
      console.error('Get transaction status error:', error);
      throw error;
    }
  }

  // Get user AEPS transactions
  async getUserTransactions(userId, page = 1, limit = 10, transactionType = null) {
    try {
      const query = { userId };
      if (transactionType) {
        query.transactionType = transactionType;
      }
      
      const skip = (page - 1) * limit;
      
      const transactions = await AepsTransaction.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
      
      const total = await AepsTransaction.countDocuments(query);
      
      return {
        success: true,
        transactions: transactions.map(t => ({
          transactionId: t.transactionId,
          transactionType: t.transactionType,
          amount: t.amount,
          charges: t.charges,
          status: t.status,
          aadhaarNumber: t.aadhaarNumber.replace(/\d(?=\d{4})/g, 'X'),
          bankName: t.bankName,
          rrn: t.rrn,
          initiatedAt: t.initiatedAt,
          completedAt: t.completedAt
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Get user transactions error:', error);
      throw error;
    }
  }

  // Get AEPS statistics
  async getAepsStats(userId, startDate, endDate) {
    try {
      const stats = await AepsTransaction.getStats(userId, startDate, endDate);
      return {
        success: true,
        stats
      };
    } catch (error) {
      console.error('Get AEPS stats error:', error);
      throw error;
    }
  }
}

module.exports = new AepsService();