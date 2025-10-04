const TransactionAudit = require('../models/TransactionAudit');
const geoip = require('geoip-lite');
const useragent = require('useragent');

// Audit middleware to capture transaction data
const auditMiddleware = {
  // Capture transaction audit data
  captureAudit: (req, res, next) => {
    console.log(`[AUDIT DEBUG] === MIDDLEWARE ENTRY === ${req.method} ${req.path}`);
    try {
      console.log(`[AUDIT DEBUG] captureAudit called for ${req.method} ${req.path}`);
      // Store original res.json to intercept response
      const originalJson = res.json;
      
      // Override res.json to capture response data
      res.json = function(data) {
        console.log(`[AUDIT DEBUG] res.json intercepted for ${req.path}`);
        // Call original json method
        const result = originalJson.call(this, data);
        
        // Capture audit data asynchronously (don't block response)
        setImmediate(() => {
          console.log(`[AUDIT DEBUG] Calling logTransactionAudit for ${req.path}`);
          auditMiddleware.logTransactionAudit(req, res, data);
        });
        
        return result;
      };
      
      next();
    } catch (error) {
      console.error('Audit middleware error:', error);
      next(); // Continue even if audit fails
    }
  },

  // Log transaction audit data
  logTransactionAudit: async (req, res, responseData) => {
    try {
      const fullPath = req.originalUrl || req.url || req.path;
      console.log(`[AUDIT DEBUG] Checking path: ${req.path}, originalUrl: ${req.originalUrl}, fullPath: ${fullPath}`);
      // Only audit transaction-related endpoints
      if (!auditMiddleware.isTransactionEndpoint(fullPath)) {
        console.log(`[AUDIT DEBUG] Path ${fullPath} not in transaction endpoints`);
        return;
      }
      console.log(`[AUDIT DEBUG] Path ${fullPath} is a transaction endpoint`);

      const startTime = req.startTime || Date.now();
      const responseTime = Date.now() - startTime;
      
      // Extract IP address
      const ipAddress = auditMiddleware.getClientIP(req);
      
      // Get geolocation from IP
      const geoData = geoip.lookup(ipAddress);
      
      // Parse user agent
      const agent = useragent.parse(req.headers['user-agent']);
      
      // Extract device and location data from request body
      const deviceData = req.body.deviceInfo || {};
      const locationData = req.body.location || {};
      
      // Determine transaction type and details
      const transactionInfo = auditMiddleware.extractTransactionInfo(req, responseData);
      console.log(`[AUDIT DEBUG] Transaction info extracted:`, transactionInfo);
      
      if (!transactionInfo) {
        console.log(`[AUDIT DEBUG] No transaction info found, skipping audit`);
        return; // Skip if not a valid transaction
      }
      console.log(`[AUDIT DEBUG] Creating audit record for transaction:`, transactionInfo.type);

      // Create audit record
      const auditData = {
        // Transaction Reference
        transactionId: transactionInfo.transactionId || new require('mongoose').Types.ObjectId(),
        transactionType: transactionInfo.type,
        transactionReference: transactionInfo.reference,
        
        // User Information
        userId: req.user?.id || req.body.userId,
        userMobile: req.user?.phone || req.body.mobile || req.body.phone || transactionInfo.mobile || 'N/A',
        
        // Network & Device Information
        ipAddress: ipAddress,
        userAgent: req.headers['user-agent'] || '',
        deviceFingerprint: deviceData.fingerprint,
        macAddress: deviceData.networkInfo?.macAddress,
        
        // Location Information
        location: {
          latitude: locationData.latitude || geoData?.ll?.[0],
          longitude: locationData.longitude || geoData?.ll?.[1],
          accuracy: locationData.accuracy,
          altitude: locationData.altitude,
          timestamp: locationData.timestamp,
          address: {
            street: locationData.address?.street || '',
            city: locationData.address?.city || geoData?.city,
            state: locationData.address?.state || geoData?.region,
            country: locationData.address?.country || geoData?.country,
            postalCode: locationData.address?.postalCode || geoData?.zip,
            formattedAddress: locationData.address?.formattedAddress
          },
          timezone: locationData.timezone || geoData?.timezone
        },
        
        // Browser & System Information
        browserInfo: {
          name: agent.family,
          version: agent.toVersion(),
          platform: agent.os.family,
          language: deviceData.browserInfo?.language,
          cookieEnabled: deviceData.browserInfo?.cookieEnabled,
          javaEnabled: deviceData.browserInfo?.javaEnabled,
          screenResolution: deviceData.browserInfo?.screenResolution,
          colorDepth: deviceData.browserInfo?.colorDepth,
          timezone: deviceData.browserInfo?.timezone
        },
        
        // Security Flags
        securityFlags: {
          isVpnDetected: auditMiddleware.detectVPN(ipAddress, req.headers),
          isProxyDetected: auditMiddleware.detectProxy(req.headers),
          isTorDetected: auditMiddleware.detectTor(ipAddress),
          riskScore: auditMiddleware.calculateRiskScore(req, deviceData, geoData),
          fraudFlags: auditMiddleware.detectFraudFlags(req, deviceData, responseData)
        },
        
        // Transaction Details
        transactionAmount: transactionInfo.amount,
        transactionStatus: transactionInfo.status,
        
        // Session Information
        sessionId: req.sessionID || req.headers['x-session-id'],
        sessionDuration: req.session?.duration,
        
        // API Information
        apiEndpoint: req.path,
        requestMethod: req.method,
        responseTime: responseTime,
        
        // Additional Metadata
        metadata: {
          requestHeaders: auditMiddleware.sanitizeHeaders(req.headers),
          requestBody: auditMiddleware.sanitizeRequestBody(req.body),
          responseStatus: res.statusCode,
          responseSize: JSON.stringify(responseData).length,
          deviceDetails: deviceData.fingerprintDetails
        }
      };

      // Check for duplicate audit records before saving
      const existingAudit = await TransactionAudit.findOne({
        transactionId: transactionInfo.transactionId,
        transactionReference: transactionInfo.reference,
        userId: req.user._id
      });
      
      if (existingAudit) {
        console.log(`[AUDIT DEBUG] Duplicate audit record detected for transaction ${transactionInfo.reference}, skipping...`);
        return;
      }
      
      // Save audit record
      console.log(`[AUDIT DEBUG] Attempting to save audit record...`);
      const audit = new TransactionAudit(auditData);
      await audit.save();
      console.log(`[AUDIT DEBUG] Audit record saved successfully with ID:`, audit._id);
      
      console.log(`Transaction audit logged: ${transactionInfo.type} - ${transactionInfo.reference}`);
      
    } catch (error) {
      console.error('[AUDIT DEBUG] Error logging transaction audit:', error);
      console.error('[AUDIT DEBUG] Error stack:', error.stack);
      // Don't throw error to avoid affecting the main transaction
    }
  },

  // Check if endpoint should be audited
  isTransactionEndpoint: (path) => {
    const transactionPaths = [
      '/api/dmt/transaction',
      '/api/dmt/beneficiary/register',
      '/api/dmt/beneficiary/',
      '/api/dmt/remitter/register',
      '/api/aeps/cash-withdrawal',
      '/api/aeps/cash-deposit',
      '/api/aeps/balance-inquiry',
      '/api/aeps/mini-statement',
      '/api/recharge/mobile',
      '/api/recharge/dth',
      '/api/transactions/process',
      '/api/transactions/mobile-recharge',
      '/api/transactions/dth-recharge',
      '/api/transactions/bill-payment',
      '/api/voucher/purchase',
      '/api/wallet/add-money',
      '/api/wallet/transfer',
      '/api/wallet/topup',
      '/api/v1/wallet/topup',
      '/api/v1/wallet/my-wallet',
      '/api/v1/wallet/balance',
      '/api/v1/wallet/transactions',
      '/api/v1/wallet/my-transactions',
      '/api/v1/voucher/purchase',
      '/api/v1/vouchers/purchase',
      // Admin transaction management endpoints
      '/api/admin/recharge/manual-transactions',
      '/api/admin/recharge/manual-transactions/approve',
      '/api/admin/recharge/manual-transactions/bulk-approve',
      '/api/admin/transactions',
      '/api/admin/transactions/bulk-approve',
      '/api/admin/transactions/bulk-reject'
    ];
    
    // Check both full path and relative path matching
    return transactionPaths.some(txPath => {
      return path === txPath || path.includes(txPath) || txPath.includes(path);
    });
  },

  // Extract client IP address
  getClientIP: (req) => {
    return req.headers['x-forwarded-for']?.split(',')[0] ||
           req.headers['x-real-ip'] ||
           req.connection?.remoteAddress ||
           req.socket?.remoteAddress ||
           req.ip ||
           '127.0.0.1';
  },

  // Extract transaction information from request and response
  extractTransactionInfo: (req, responseData) => {
    const path = req.path;
    console.log('[AUDIT DEBUG] extractTransactionInfo called with path:', path);
    console.log('[AUDIT DEBUG] responseData:', JSON.stringify(responseData, null, 2));
    console.log('[AUDIT DEBUG] req.body:', JSON.stringify(req.body, null, 2));
    
    if (path.includes('/dmt/transaction') || path.includes('/dmt/beneficiary') || path.includes('/dmt/remitter')) {
      return {
        type: 'DMT',
        transactionId: responseData.data?.transactionId || responseData.data?.transaction?.transactionId || responseData.transactionId,
        reference: responseData.data?.reference || responseData.data?.transaction?.reference || responseData.reference,
        amount: req.body.amount || 0,
        status: responseData.status === 'success' ? 'SUCCESS' : 'FAILED',
        mobile: req.body.mobile || req.body.remitterMobile || req.user?.phone
      };
    }
    
    if (path.includes('/aeps/')) {
      return {
        type: 'AEPS',
        transactionId: responseData.data?.transactionId || responseData.data?.transaction?.transactionId || responseData.transactionId,
        reference: responseData.data?.reference || responseData.data?.transaction?.reference || responseData.reference,
        amount: req.body.amount || 0,
        status: responseData.status === 'success' ? 'SUCCESS' : 'FAILED',
        mobile: req.body.customerMobile || req.body.mobile || req.user?.phone
      };
    }
    
    if (path.includes('/recharge/') || path.includes('/transactions/')) {
      return {
        type: path.includes('mobile') ? 'MOBILE_RECHARGE' : path.includes('dth') ? 'DTH_RECHARGE' : path.includes('bill') ? 'BILL_PAYMENT' : 'RECHARGE',
        transactionId: responseData.data?.transactionId || responseData.data?.transaction?.transactionId || responseData.transactionId,
        reference: responseData.data?.reference || responseData.data?.transaction?.reference || responseData.reference,
        amount: req.body.amount || 0,
        status: responseData.status === 'success' ? 'SUCCESS' : 'FAILED',
        mobile: req.body.mobileNumber || req.body.mobile || req.body.customerMobile || req.body.customerNumber || req.user?.phone
      };
    }
    
    if (path.includes('/voucher/') || path.includes('/vouchers/')) {
      let voucherType = 'VOUCHER';
      if (path.includes('/purchase')) {
        voucherType = 'VOUCHER_PURCHASE';
      }
      
      return {
        type: voucherType,
        transactionId: responseData.data?.transactionId || responseData.data?.transaction?.transactionId || responseData.transactionId || responseData.data?.orderId || responseData.orderId,
        reference: responseData.data?.reference || responseData.data?.transaction?.reference || responseData.reference || responseData.data?.orderReference,
        amount: req.body.amount || req.body.totalAmount || responseData.data?.amount || responseData.amount || 0,
        status: responseData.status === 'success' ? 'SUCCESS' : 'FAILED',
        mobile: req.body.mobile || req.user?.phone,
        voucherBrand: responseData.data?.brandName || responseData.brandName || req.body.brandName,
        voucherDenomination: responseData.data?.denomination || responseData.denomination || req.body.denomination,
        quantity: responseData.data?.quantity || responseData.quantity || req.body.quantity || 1
      };
    }
    
    if (path.includes('/wallet/') || path.includes('/topup') || path.includes('/my-wallet') || path.includes('/transfer')) {
      console.log('[AUDIT DEBUG] Wallet transaction detected for path:', path);
      const transactionInfo = {
        type: 'WALLET',
        transactionId: responseData.data?.transaction?._id || responseData.data?._id || responseData.data?.id || responseData._id,
        reference: responseData.data?.reference || responseData.data?.transaction?.reference || responseData.reference || responseData.data?.transactionReference,
        amount: req.body.amount || responseData.data?.amount || responseData.amount || responseData.data?.balance || responseData.balance || 0,
        status: responseData.status === 'success' ? 'SUCCESS' : 'FAILED',
        mobile: req.body.mobile || req.user?.phone || responseData.data?.mobile || responseData.mobile,
        walletBalance: responseData.data?.wallet?.balance || responseData.wallet?.balance,
        subType: path.includes('/topup') ? 'TOPUP' : path.includes('/transfer') ? 'TRANSFER' : path.includes('/balance') ? 'BALANCE' : 'OTHER'
      };
      
      console.log('[AUDIT DEBUG] Wallet transaction info created:', JSON.stringify(transactionInfo, null, 2));
      return transactionInfo;
    }
    
    return null;
  },

  // VPN Detection
  detectVPN: (ipAddress, headers) => {
    // Basic VPN detection logic
    const vpnHeaders = [
      'x-forwarded-for',
      'x-real-ip',
      'x-originating-ip',
      'x-remote-ip'
    ];
    
    const hasVpnHeaders = vpnHeaders.some(header => headers[header]);
    const isPrivateIP = auditMiddleware.isPrivateIP(ipAddress);
    
    return hasVpnHeaders && !isPrivateIP;
  },

  // Proxy Detection
  detectProxy: (headers) => {
    const proxyHeaders = [
      'via',
      'x-forwarded-for',
      'x-forwarded-host',
      'x-forwarded-proto',
      'x-proxy-id',
      'x-proxy-connection'
    ];
    
    return proxyHeaders.some(header => headers[header]);
  },

  // Tor Detection (basic)
  detectTor: (ipAddress) => {
    // This would require a Tor exit node list in production
    // For now, just check for common Tor patterns
    return false; // Placeholder
  },

  // Calculate risk score
  calculateRiskScore: (req, deviceData, geoData) => {
    let riskScore = 0;
    
    // High transaction amount
    const amount = req.body.amount || 0;
    if (amount > 50000) riskScore += 20;
    else if (amount > 25000) riskScore += 10;
    
    // Unusual location
    if (geoData && geoData.country !== 'IN') riskScore += 30;
    
    // No device fingerprint
    if (!deviceData.fingerprint) riskScore += 15;
    
    // Suspicious headers
    if (auditMiddleware.detectProxy(req.headers)) riskScore += 25;
    if (auditMiddleware.detectVPN(auditMiddleware.getClientIP(req), req.headers)) riskScore += 35;
    
    // Time-based risk (transactions at unusual hours)
    const hour = new Date().getHours();
    if (hour < 6 || hour > 23) riskScore += 10;
    
    return Math.min(riskScore, 100);
  },

  // Detect fraud flags
  detectFraudFlags: (req, deviceData, responseData) => {
    const flags = [];
    
    if (req.body.amount > 100000) flags.push('HIGH_AMOUNT');
    if (!deviceData.fingerprint) flags.push('NO_DEVICE_FINGERPRINT');
    if (auditMiddleware.detectProxy(req.headers)) flags.push('PROXY_DETECTED');
    if (auditMiddleware.detectVPN(auditMiddleware.getClientIP(req), req.headers)) flags.push('VPN_DETECTED');
    
    const hour = new Date().getHours();
    if (hour < 6 || hour > 23) flags.push('UNUSUAL_TIME');
    
    return flags;
  },

  // Check if IP is private
  isPrivateIP: (ip) => {
    const privateRanges = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^127\./,
      /^169\.254\./
    ];
    
    return privateRanges.some(range => range.test(ip));
  },

  // Sanitize headers for logging
  sanitizeHeaders: (headers) => {
    const sanitized = { ...headers };
    delete sanitized.authorization;
    delete sanitized.cookie;
    delete sanitized['x-api-key'];
    return sanitized;
  },

  // Sanitize request body for logging
  sanitizeRequestBody: (body) => {
    const sanitized = { ...body };
    delete sanitized.password;
    delete sanitized.pin;
    delete sanitized.otp;
    delete sanitized.token;
    return sanitized;
  },

  // Middleware to add start time
  addStartTime: (req, res, next) => {
    req.startTime = Date.now();
    next();
  }
};

module.exports = auditMiddleware;