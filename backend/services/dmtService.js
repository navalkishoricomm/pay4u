const DmtRemitter = require('../models/DmtRemitter');
const DmtBeneficiary = require('../models/DmtBeneficiary');
const DmtTransaction = require('../models/DmtTransaction');
const ApiProvider = require('../models/ApiProvider');
const ChargeSlab = require('../models/ChargeSlab');
const axios = require('axios');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const productionLogger = require('../utils/productionLogger');

class DmtService {
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
    // Environment-based API endpoints
    this.paysprintEndpoints = {
      baseURL: this.getBaseURL(),
      // DMT Endpoints
      balance: '/balance/balance/mainbalance',
      bankList: '/dmt/bank/banklist',
      remitterRegister: '/dmt/remitter/register',
      beneficiaryRegister: '/dmt/beneficiary/register',
      moneyTransfer: '/dmt/transfer/transfer',
      transactionStatus: '/dmt/transaction/status',
      // AEPS Endpoints
      aepsBalance: '/balance/balance/aepsbalance',
      aepsBankList: '/aeps/bank/banklist',
      aepsBalanceInquiry: '/aeps/balance/inquiry',
      aepsCashWithdrawal: '/aeps/cash/withdrawal',
      aepsCashDeposit: '/aeps/cash/deposit',
      aepsMiniStatement: '/aeps/mini/statement',
      aepsTransactionStatus: '/aeps/transaction/status'
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
      console.error('DMT Service initialization failed:', error);
      throw error;
    }
  }

  // Test Paysprint authentication with current credentials
  async testPaysprintAuthentication() {
    console.log('🔍 Testing Paysprint Authentication...');
    
    const testConfigurations = [
      {
        name: 'POST Body - Standard Format',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'TraePay4U/1.0'
        },
        body: {
          jwt_key: this.paysprintCredentials.JWT_KEY,
          authorised_key: this.paysprintCredentials.AUTHORISED_KEY,
          aes_encryption_key: this.paysprintCredentials.AES_ENCRYPTION_KEY,
          aes_encryption_iv: this.paysprintCredentials.AES_ENCRYPTION_IV
        }
      },
      {
        name: 'Headers - JWT Bearer',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${this.paysprintCredentials.JWT_KEY}`,
          'X-API-Key': this.paysprintCredentials.AUTHORISED_KEY,
          'User-Agent': 'TraePay4U/1.0'
        }
      },
      {
        name: 'Headers - Custom Paysprint',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'JWT_KEY': this.paysprintCredentials.JWT_KEY,
          'AUTHORISED_KEY': this.paysprintCredentials.AUTHORISED_KEY,
          'AES_ENCRYPTION_KEY': this.paysprintCredentials.AES_ENCRYPTION_KEY,
          'AES_ENCRYPTION_IV': this.paysprintCredentials.AES_ENCRYPTION_IV,
          'User-Agent': 'TraePay4U/1.0'
        }
      }
    ];

    const testEndpoint = `${this.paysprintEndpoints.baseURL}${this.paysprintEndpoints.balance}`;
    
    for (const config of testConfigurations) {
      try {
        console.log(`\n🧪 Testing: ${config.name}`);
        
        const axiosConfig = {
          method: config.method,
          url: testEndpoint,
          headers: config.headers,
          timeout: 10000
        };
        
        if (config.body) {
          axiosConfig.data = config.body;
        }
        
        const response = await axios(axiosConfig);
        
        console.log(`✅ SUCCESS! ${config.name} worked!`);
        console.log(`Status: ${response.status}`);
        console.log(`Response:`, response.data);
        
        // Save working configuration
        this.workingAuthConfig = config;
        return {
          success: true,
          workingConfig: config,
          response: response.data
        };
        
      } catch (error) {
        if (error.response) {
          console.log(`❌ ${config.name}: ${error.response.status} - ${error.response.data?.message || 'Failed'}`);
        } else {
          console.log(`❌ ${config.name}: Network error - ${error.message}`);
        }
      }
    }
    
    console.log('\n🔍 No working authentication method found yet.');
    console.log('📞 Contact Paysprint support for correct authentication format.');
    
    return {
      success: false,
      message: 'Authentication method needs to be confirmed with Paysprint support'
    };
  }

  // Generate unique reference ID (20 characters as per Paysprint requirement)
  generateReferenceId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 7);
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
    console.log('Generated JWT Token:', jwtToken);
    return jwtToken;
  }

  // Build request headers for Paysprint API
  buildHeaders(additionalHeaders = {}) {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'TraePay4U/1.0'
    };

    // For Paysprint API - Generate fresh JWT token for each request
    if (this.useDirectCredentials || !this.apiProvider) {
      // Direct Paysprint authentication as per team instructions
      const jwtToken = this.generateJWTToken();
      headers['Authorization'] = `Bearer ${jwtToken}`;
      headers['Authorised-Key'] = this.paysprintCredentials.AUTHORISED_KEY;
      
      console.log('Using direct Paysprint authentication:');
      console.log('- JWT Token generated and added to Authorization header');
      console.log('- Authorised-Key added to headers');
      
      return { ...headers, ...additionalHeaders };
    }

    // Legacy API provider configuration (fallback)
    if (this.apiProvider && this.apiProvider.headers) {
      // Handle both Map and Object formats
      if (this.apiProvider.headers instanceof Map) {
        for (const [key, value] of this.apiProvider.headers) {
          headers[key] = value;
        }
      } else if (typeof this.apiProvider.headers === 'object') {
        Object.assign(headers, this.apiProvider.headers);
      }
    }

    // Add authentication based on auth type
    if (this.apiProvider) {
      switch (this.apiProvider.authType) {
        case 'bearer':
          // For Paysprint, generate JWT token according to their documentation
          if (this.apiProvider.name === 'paysprint') {
            const jwtToken = this.generateJWTToken();
            headers['Authorization'] = `Bearer ${jwtToken}`;
            headers['Authorised-Key'] = this.paysprintCredentials.AUTHORISED_KEY;
          } else {
            headers['Authorization'] = `Bearer ${this.apiProvider.apiKey}`;
          }
          break;
        case 'api_key':
          headers['X-API-Key'] = this.apiProvider.apiKey;
          break;
        case 'basic':
          const credentials = Buffer.from(`${this.apiProvider.apiKey}:${this.apiProvider.apiSecret}`).toString('base64');
          headers['Authorization'] = `Basic ${credentials}`;
          break;
      }
    }

    return { ...headers, ...additionalHeaders };
  }

  // AES encryption for request body (required by Paysprint)
  encryptRequestBody(data) {
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
      
      console.log('Request body encrypted successfully');
      return { body: encrypted };
    } catch (error) {
      console.error('AES encryption failed:', error);
      return data; // Fallback to plain data
    }
  }

  // Make API request with retry logic
  async makeApiRequest(endpoint, data, method = 'POST', retryCount = 0) {
    console.log(`=== STARTING API REQUEST ===`);
    console.log(`Endpoint: ${endpoint}`);
    console.log(`Method: ${method}`);
    console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`API Provider:`, this.apiProvider);
    
    let requestId = null;
    
    try {
      const url = `${this.apiProvider.baseUrl}${endpoint}`;
      const headers = this.buildHeaders();
      
      // Encrypt request body for Paysprint
      let requestData = data;
      if (this.apiProvider.name === 'paysprint' && method.toLowerCase() !== 'get') {
        requestData = this.encryptRequestBody(data);
      }
      
      // Log request for production debugging
      requestId = productionLogger.logRequest(url, method, headers, requestData, {
        endpoint,
        originalData: data,
        encrypted: this.apiProvider.name === 'paysprint' && method.toLowerCase() !== 'get',
        retryCount,
        apiProvider: this.apiProvider.name
      });
      
      console.log(`DMT API Request to ${url}:`, { data: requestData, headers });
      
      const config = {
        method,
        url,
        headers,
        timeout: this.apiProvider.timeout || 30000
      };
      
      if (method.toLowerCase() !== 'get') {
        config.data = requestData;
      }
      
      const response = await axios(config);
      
      // Log successful response
      productionLogger.logResponse(requestId, response.status, response.statusText, response.headers, response.data);
      
      console.log(`DMT API Response from ${url}:`, response.data);
      
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
      
      console.error(`=== DETAILED API ERROR for ${endpoint} ===`);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      console.error('Request URL:', error.config?.url);
      console.error('Request method:', error.config?.method);
      console.error('Request headers:', error.config?.headers);
      console.error('Request data:', error.config?.data);
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response statusText:', error.response.statusText);
        console.error('Response headers:', error.response.headers);
        console.error('Response data:', error.response.data);
      } else if (error.request) {
        console.error('No response received. Request details:', error.request);
      }
      
      console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
      console.log(`Development check: ${process.env.NODE_ENV === 'development' || !process.env.NODE_ENV}`);
      
      // In development mode, provide mock responses when API fails
      console.log('=== ERROR HANDLING ===');
      console.log('NODE_ENV value:', JSON.stringify(process.env.NODE_ENV));
      console.log('NODE_ENV type:', typeof process.env.NODE_ENV);
      console.log('Is development?:', process.env.NODE_ENV === 'development');
      console.log('Is undefined?:', !process.env.NODE_ENV);
      console.log('Combined condition:', process.env.NODE_ENV === 'development' || !process.env.NODE_ENV);
      
      if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
        console.log('Providing mock response for development mode');
        return this.getMockResponse(endpoint, data);
      } else {
        console.log('Production mode - NOT providing mock response');
        console.log('Throwing error instead of mock response');
        throw error; // Re-throw the original error instead of continuing
      }
      
      // Retry logic
      if (retryCount < (this.apiProvider.retryAttempts || 3)) {
        console.log(`Retrying DMT API request (${retryCount + 1}/${this.apiProvider.retryAttempts})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return this.makeApiRequest(endpoint, data, method, retryCount + 1);
      }
      
      return {
        success: false,
        error: error.response?.data || error.message,
        status: error.response?.status || 500
      };
    }
  }

  // Register or verify remitter
  async registerRemitter(remitterData) {
    try {
      if (!this.apiProvider) await this.initialize();
      
      const { mobile, firstName, lastName, address, pincode, dateOfBirth, gstState, userId } = remitterData;
      
      // Check if remitter already exists
      let remitter = await DmtRemitter.findByMobile(mobile);
      
      if (remitter) {
        return {
          success: true,
          remitter,
          message: 'Remitter already exists'
        };
      }
      
      // Create new remitter record
      remitter = new DmtRemitter({
        mobile,
        firstName,
        lastName,
        address,
        pincode,
        dateOfBirth: new Date(dateOfBirth),
        gstState,
        userId,
        kycStatus: 'pending'
      });
      
      await remitter.save();
      
      return {
        success: true,
        remitter,
        message: 'Remitter registered successfully'
      };
    } catch (error) {
      console.error('Register remitter error:', error);
      throw error;
    }
  }

  // Perform remitter KYC
  async performRemitterKyc(remitterId, kycData) {
    try {
      if (!this.apiProvider) await this.initialize();
      
      const remitter = await DmtRemitter.findById(remitterId);
      if (!remitter) {
        throw new Error('Remitter not found');
      }
      
      // Check if KYC can be performed
      if (!remitter.canPerformKyc()) {
        throw new Error('KYC attempts exceeded for today');
      }
      
      const endpoint = this.apiProvider.endpoints.dmtRemitterKyc;
      if (!endpoint) {
        throw new Error('DMT remitter KYC endpoint not configured');
      }
      
      const requestData = {
        mobile: remitter.mobile,
        is_iris: kycData.kycType === 'iris' ? 1 : (kycData.kycType === 'face_auth' ? 4 : 2),
        wadh: kycData.wadh || 'Cg5ADsLzrNR1aw8zxSssYAs6SkK6CfOURCGIc0CTzkc=', // Default for IRIS
        piddata: kycData.piddata,
        ...kycData
      };
      
      const response = await this.makeApiRequest(endpoint, requestData);
      
      // Update remitter KYC attempts
      remitter.kycAttempts += 1;
      remitter.lastKycAttempt = new Date();
      
      if (response.success && response.data.response_code === 1) {
        remitter.kycStatus = 'verified';
        remitter.kycExpiryTime = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        remitter.paysprintRemitterId = response.data.remitter_id;
      } else {
        remitter.kycStatus = 'rejected';
      }
      
      await remitter.save();
      
      return {
        success: response.success,
        remitter,
        response: response.data,
        message: response.success ? 'KYC completed successfully' : 'KYC failed'
      };
    } catch (error) {
      console.error('Remitter KYC error:', error);
      throw error;
    }
  }

  // Register beneficiary
  async registerBeneficiary(beneficiaryData) {
    try {
      if (!this.apiProvider) await this.initialize();
      
      const { remitterId, accountNumber, ifscCode, accountHolderName, bankName, mobile, userId } = beneficiaryData;
      
      const remitter = await DmtRemitter.findById(remitterId);
      if (!remitter) {
        throw new Error('Remitter not found');
      }
      
      // Check KYC status
      if (remitter.kycStatus !== 'verified') {
        // For development: auto-verify newly created remitters (DISABLED FOR KYC TESTING)
        // if (process.env.NODE_ENV === 'development' && remitter.kycStatus === 'pending' && !remitter.kycAttempts) {
        //   remitter.kycStatus = 'verified';
        //   remitter.kycExpiryTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        //   await remitter.save();
        //   console.log('Auto-verified KYC for development mode');
        // } else {
          throw new Error('Remitter KYC not verified. Please complete KYC verification first.');
        // }
      }
      
      // Check if active beneficiary already exists for this remitter
      let beneficiary = await DmtBeneficiary.findOne({
        remitterId,
        accountNumber,
        ifscCode: ifscCode.toUpperCase(),
        isActive: true,
        isBlocked: false
      });
      
      if (beneficiary) {
        // If beneficiary exists but doesn't have paysprintBeneficiaryId, register it with payment provider
        if (!beneficiary.paysprintBeneficiaryId) {
          console.log('Found existing beneficiary without paysprintBeneficiaryId, registering with payment provider...');
          
          const endpoint = this.apiProvider.endpoints.dmtBeneficiaryRegistration;
          if (!endpoint) {
            throw new Error('DMT beneficiary registration endpoint not configured');
          }
          
          const requestData = {
            mobile: remitter.mobile,
            benename: beneficiary.accountHolderName,
            bankid: this.getBankIdFromIfsc(beneficiary.ifscCode),
            accno: beneficiary.accountNumber,
            ifsccode: beneficiary.ifscCode.toUpperCase(),
            verified: 0,
            gst_state: '07', // Default state code
            dob: remitter.dateOfBirth.toISOString().split('T')[0]
          };
          
          const response = await this.makeApiRequest(endpoint, requestData);
          
          if (response.success && response.data.response_code === 1) {
            beneficiary.paysprintBeneficiaryId = response.data.beneid;
            beneficiary.verificationStatus = 'verified';
            beneficiary.verificationDate = new Date();
            await beneficiary.save();
            
            return {
              success: true,
              beneficiary,
              response: response.data,
              message: 'Existing beneficiary registered with payment provider successfully'
            };
          } else {
            return {
              success: false,
              beneficiary,
              response: response.data,
              message: 'Failed to register existing beneficiary with payment provider'
            };
          }
        }
        
        return {
          success: false,
          beneficiary,
          message: 'Beneficiary with this account number already exists for this remitter',
          error: 'DUPLICATE_BENEFICIARY'
        };
      }
      
      // Check if there's a deleted/blocked beneficiary that can be reactivated
      let deletedBeneficiary = await DmtBeneficiary.findOne({
        remitterId,
        accountNumber,
        ifscCode: ifscCode.toUpperCase(),
        isBlocked: true
      });
      
      if (deletedBeneficiary) {
        // Reactivate the deleted beneficiary
        deletedBeneficiary.isBlocked = false;
        deletedBeneficiary.blockReason = undefined;
        deletedBeneficiary.accountHolderName = accountHolderName;
        deletedBeneficiary.mobile = mobile;
        await deletedBeneficiary.save();
        
        return {
          success: true,
          beneficiary: deletedBeneficiary,
          message: 'Beneficiary reactivated successfully',
          reactivated: true
        };
      }
      
      const endpoint = this.apiProvider.endpoints.dmtBeneficiaryRegistration;
      if (!endpoint) {
        throw new Error('DMT beneficiary registration endpoint not configured');
      }
      
      const requestData = {
        mobile: remitter.mobile,
        benename: accountHolderName,
        bankid: this.getBankIdFromIfsc(ifscCode),
        accno: accountNumber,
        ifsccode: ifscCode.toUpperCase(),
        verified: 0,
        gst_state: '07', // Default state code
        dob: remitter.dateOfBirth.toISOString().split('T')[0]
      };
      
      const response = await this.makeApiRequest(endpoint, requestData);
      
      // Create beneficiary record
      beneficiary = new DmtBeneficiary({
        remitterId,
        remitterMobile: remitter.mobile,
        accountNumber,
        ifscCode: ifscCode.toUpperCase(),
        accountHolderName,
        bankName,
        mobile,
        userId,
        verificationStatus: 'pending'
      });
      
      if (response.success && response.data.response_code === 1) {
        beneficiary.paysprintBeneficiaryId = response.data.beneid;
        beneficiary.verificationStatus = 'verified';
        beneficiary.verificationDate = new Date();
      }
      
      await beneficiary.save();
      
      return {
        success: response.success,
        beneficiary,
        response: response.data,
        message: response.success ? 'Beneficiary registered successfully' : 'Beneficiary registration failed'
      };
    } catch (error) {
      console.error('Register beneficiary error:', error);
      
      // Handle MongoDB duplicate key error
      if (error.code === 11000) {
        // Check if active beneficiary exists
        const existingBeneficiary = await DmtBeneficiary.findOne({
          remitterId: beneficiaryData.remitterId,
          accountNumber: beneficiaryData.accountNumber,
          isActive: true,
          isBlocked: false
        });
        
        if (existingBeneficiary) {
          return {
            success: false,
            beneficiary: existingBeneficiary,
            message: 'Beneficiary with this account number already exists for this remitter',
            error: 'DUPLICATE_BENEFICIARY'
          };
        }
        
        // Check if there's a deleted beneficiary that can be reactivated
        const deletedBeneficiary = await DmtBeneficiary.findOne({
          remitterId: beneficiaryData.remitterId,
          accountNumber: beneficiaryData.accountNumber,
          isBlocked: true
        });
        
        if (deletedBeneficiary) {
          // Reactivate the deleted beneficiary
          deletedBeneficiary.isBlocked = false;
          deletedBeneficiary.blockReason = undefined;
          deletedBeneficiary.accountHolderName = beneficiaryData.accountHolderName;
          deletedBeneficiary.mobile = beneficiaryData.mobile;
          await deletedBeneficiary.save();
          
          return {
            success: true,
            beneficiary: deletedBeneficiary,
            message: 'Beneficiary reactivated successfully',
            reactivated: true
          };
        }
      }
      
      throw error;
    }
  }

  // Verify beneficiary account (Penny Drop)
  async verifyBeneficiary(beneficiaryId) {
    try {
      if (!this.apiProvider) await this.initialize();
      
      const beneficiary = await DmtBeneficiary.findById(beneficiaryId).populate('remitterId');
      if (!beneficiary) {
        throw new Error('Beneficiary not found');
      }
      
      const endpoint = this.apiProvider.endpoints.dmtBeneficiaryVerification;
      if (!endpoint) {
        throw new Error('DMT beneficiary verification endpoint not configured');
      }
      
      const requestData = {
        mobile: beneficiary.remitterMobile,
        beneid: beneficiary.paysprintBeneficiaryId,
        txnid: this.generateReferenceId()
      };
      
      const response = await this.makeApiRequest(endpoint, requestData);
      
      if (response.success && response.data.response_code === 1) {
        beneficiary.markVerified({
          accountHolderName: response.data.benename || beneficiary.accountHolderName,
          response: response.data
        });
      } else {
        beneficiary.markFailed('Verification failed', response.data);
      }
      
      await beneficiary.save();
      
      return {
        success: response.success,
        beneficiary,
        response: response.data,
        message: response.success ? 'Beneficiary verified successfully' : 'Beneficiary verification failed'
      };
    } catch (error) {
      console.error('Verify beneficiary error:', error);
      throw error;
    }
  }

  // Process money transfer transaction
  async processTransaction(transactionData) {
    console.log('=== PROCESS TRANSACTION STARTED ===');
    console.log('Transaction data:', JSON.stringify(transactionData, null, 2));
    try {
      if (!this.apiProvider) await this.initialize();
      
      const { remitterId, beneficiaryId, amount, transferMode = 'IMPS', userId, ipAddress, userAgent } = transactionData;
      
      // Validate remitter
      const remitter = await DmtRemitter.findById(remitterId);
      if (!remitter) {
        throw new Error('Remitter not found');
      }
      
      const canTransact = remitter.canTransact(amount);
      if (!canTransact.allowed) {
        throw new Error(canTransact.reason);
      }
      
      // Validate beneficiary
      const beneficiary = await DmtBeneficiary.findById(beneficiaryId);
      if (!beneficiary) {
        throw new Error('Beneficiary not found');
      }
      
      if (!beneficiary.paysprintBeneficiaryId) {
        // Try to re-register the beneficiary automatically
        console.log('Beneficiary not registered with payment provider, attempting re-registration...');
        try {
          const reRegistrationResult = await this.registerBeneficiary({
            remitterId: beneficiary.remitterId,
            accountNumber: beneficiary.accountNumber,
            ifscCode: beneficiary.ifscCode,
            accountHolderName: beneficiary.accountHolderName,
            bankName: beneficiary.bankName,
            mobile: beneficiary.mobile,
            userId: beneficiary.userId
          });
          
          console.log('Re-registration result:', JSON.stringify(reRegistrationResult, null, 2));
          
          if (reRegistrationResult.success && reRegistrationResult.beneficiary.paysprintBeneficiaryId) {
            // Update the current beneficiary object with the new paysprintBeneficiaryId
            beneficiary.paysprintBeneficiaryId = reRegistrationResult.beneficiary.paysprintBeneficiaryId;
            beneficiary.verificationStatus = 'verified';
            beneficiary.verificationDate = new Date();
            await beneficiary.save();
            console.log('Beneficiary re-registered successfully');
          } else {
            console.log('Re-registration failed - success:', reRegistrationResult.success, 'paysprintBeneficiaryId:', reRegistrationResult.beneficiary?.paysprintBeneficiaryId);
            throw new Error('Failed to re-register beneficiary with payment provider');
          }
        } catch (reRegError) {
          console.error('Re-registration failed:', reRegError);
          throw new Error('Beneficiary not registered with payment provider. Please register the beneficiary first.');
        }
      }
      
      const canReceive = beneficiary.canReceive(amount);
      if (!canReceive.allowed) {
        throw new Error(canReceive.reason);
      }
      
      // Calculate charges (this should be configurable)
      const charges = await this.calculateCharges(amount, transferMode);
      const totalAmount = amount + charges;
      
      // Generate transaction reference
      const referenceId = this.generateReferenceId();
      const transactionId = `DMT${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      
      // Create transaction record
      const transaction = new DmtTransaction({
        transactionId,
        referenceId,
        remitterId,
        remitterMobile: remitter.mobile,
        remitterName: `${remitter.firstName} ${remitter.lastName}`,
        beneficiaryId,
        beneficiaryAccountNumber: beneficiary.accountNumber,
        beneficiaryIfscCode: beneficiary.ifscCode,
        beneficiaryName: beneficiary.accountHolderName,
        beneficiaryBankName: beneficiary.bankName,
        amount,
        charges,
        totalAmount,
        transferMode,
        status: 'pending',
        userId,
        ipAddress,
        userAgent
      });
      
      await transaction.save();
      
      // Make API request to Paysprint
      const endpoint = this.apiProvider.endpoints.dmtTransaction;
      if (!endpoint) {
        throw new Error('DMT transaction endpoint not configured');
      }
      
      const requestData = {
        mobile: remitter.mobile,
        beneid: beneficiary.paysprintBeneficiaryId,
        amount: amount,
        txnid: referenceId,
        mode: transferMode.toLowerCase() === 'imps' ? 'imps' : 'neft'
      };
      
      const response = await this.makeApiRequest(endpoint, requestData);
      
      // Update transaction with API response
      transaction.updatePaysprintResponse(response.data);
      
      if (response.success) {
        transaction.paysprintTransactionId = response.data.txnid;
        transaction.updateStatus('processing', 'Transaction submitted to Paysprint');
        
        // Update remitter and beneficiary usage
        remitter.updateMonthlyUsage(amount);
        beneficiary.updateMonthlyReceived(amount);
        
        await Promise.all([
          transaction.save(),
          remitter.save(),
          beneficiary.save()
        ]);
      } else {
        transaction.updateStatus('failed', 'API request failed', response.data);
        await transaction.save();
      }
      
      return {
        success: response.success,
        transaction,
        response: response.data,
        message: response.success ? 'Transaction initiated successfully' : 'Transaction failed'
      };
    } catch (error) {
      console.error('Process transaction error:', error);
      throw error;
    }
  }

  // Check transaction status
  async checkTransactionStatus(transactionId) {
    try {
      if (!this.apiProvider) await this.initialize();
      
      const transaction = await DmtTransaction.findOne({ transactionId });
      if (!transaction) {
        throw new Error('Transaction not found');
      }
      
      if (!transaction.paysprintTransactionId) {
        return {
          success: false,
          transaction,
          message: 'No Paysprint transaction ID available'
        };
      }
      
      const endpoint = this.apiProvider.endpoints.dmtTransactionStatus;
      if (!endpoint) {
        throw new Error('DMT transaction status endpoint not configured');
      }
      
      const requestData = {
        txnid: transaction.paysprintTransactionId
      };
      
      const response = await this.makeApiRequest(endpoint, requestData, 'GET');
      
      if (response.success) {
        transaction.updatePaysprintResponse(response.data);
        await transaction.save();
      }
      
      return {
        success: response.success,
        transaction,
        response: response.data,
        message: 'Transaction status updated'
      };
    } catch (error) {
      console.error('Check transaction status error:', error);
      throw error;
    }
  }

  // Calculate transaction charges using charge slabs
  async calculateCharges(amount, transferMode = 'IMPS') {
    try {
      const charge = await ChargeSlab.findChargeForAmount(amount, transferMode.toUpperCase());
      return charge;
    } catch (error) {
      console.error('Error calculating charges from slabs:', error);
      // Fallback to old logic if slab lookup fails
      const baseCharge = transferMode.toLowerCase() === 'imps' ? 5 : 3;
      const percentageCharge = amount * 0.001; // 0.1%
      return Math.max(baseCharge, Math.min(percentageCharge, 20)); // Min 5, Max 20
    }
  }

  // Get bank ID from IFSC code (simplified mapping)
  getBankIdFromIfsc(ifscCode) {
    const bankMapping = {
      'SBIN': 'SBI',
      'HDFC': 'HDFC',
      'ICIC': 'ICICI',
      'AXIS': 'AXIS',
      'PUNB': 'PNB',
      'UBIN': 'UBI',
      'CNRB': 'CNB'
    };
    
    const bankCode = ifscCode.substring(0, 4);
    return bankMapping[bankCode] || bankCode;
  }

  // Get remitter beneficiaries
  async getRemitterBeneficiaries(remitterId) {
    try {
      return await DmtBeneficiary.findByRemitter(remitterId);
    } catch (error) {
      console.error('Get remitter beneficiaries error:', error);
      throw error;
    }
  }

  // Get user transactions
  async getUserTransactions(userId, limit = 50) {
    try {
      return await DmtTransaction.findByUser(userId, limit);
    } catch (error) {
      console.error('Get user transactions error:', error);
      throw error;
    }
  }

  // Get transaction statistics
  async getTransactionStats(userId, startDate, endDate) {
    try {
      return await DmtTransaction.getTransactionStats(userId, startDate, endDate);
    } catch (error) {
      console.error('Get transaction stats error:', error);
      throw error;
    }
  }

  // Process pending transactions (for cron job)
  async processPendingTransactions() {
    try {
      const pendingTransactions = await DmtTransaction.findPendingTransactions(30);
      
      for (const transaction of pendingTransactions) {
        try {
          await this.checkTransactionStatus(transaction.transactionId);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
        } catch (error) {
          console.error(`Error processing pending transaction ${transaction.transactionId}:`, error);
        }
      }
      
      return {
        success: true,
        processed: pendingTransactions.length,
        message: `Processed ${pendingTransactions.length} pending transactions`
      };
    } catch (error) {
      console.error('Process pending transactions error:', error);
      throw error;
    }
  }

  // Mock responses for development mode
  getMockResponse(endpoint, data) {
    console.log(`Generating mock response for endpoint: ${endpoint}`);
    
    switch (endpoint) {
      case '/dmt/remitter/register':
        return {
          success: true,
          data: {
            response_code: 1,
            status: 'SUCCESS',
            message: 'Remitter registered successfully (MOCK)',
            mobile: data.mobile,
            fname: data.fname,
            lname: data.lname,
            remitter_id: `MOCK_REM_${Date.now()}`
          }
        };
        
      case '/dmt/beneficiary/register':
        return {
          success: true,
          data: {
            response_code: 1,
            status: 'SUCCESS',
            message: 'Beneficiary registered successfully (MOCK)',
            beneid: `MOCK_BENE_${Date.now()}`,
            benename: data.benename,
            mobile: data.mobile,
            accno: data.accno,
            ifsccode: data.ifsccode,
            bankname: 'Mock Bank'
          }
        };
        
      case '/dmt/beneficiary/verify':
        return {
          success: true,
          data: {
            response_code: 1,
            status: 'SUCCESS',
            message: 'Beneficiary verified successfully (MOCK)',
            benename: 'MOCK ACCOUNT HOLDER',
            txnid: `MOCK_VER_${Date.now()}`
          }
        };
        
      case '/dmt/transaction':
        return {
          success: true,
          data: {
            response_code: 1,
            status: 'SUCCESS',
            message: 'Transaction initiated successfully (MOCK)',
            txnid: `MOCK_TXN_${Date.now()}`,
            amount: data.amount,
            charge: data.charge || 5,
            rrn: `MOCK${Date.now()}`,
            utr: `UTR${Date.now()}`
          }
        };
        
      case '/dmt/transaction/status':
        return {
          success: true,
          data: {
            response_code: 1,
            status: 'SUCCESS',
            message: 'Transaction completed successfully (MOCK)',
            txn_status: 'SUCCESS',
            rrn: `MOCK${Date.now()}`,
            utr: `UTR${Date.now()}`
          }
        };
        
      default:
        return {
          success: true,
          data: {
            response_code: 1,
            status: 'SUCCESS',
            message: 'Mock response generated successfully'
          }
        };
    }
  }
}

module.exports = new DmtService();