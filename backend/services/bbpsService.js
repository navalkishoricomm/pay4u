const axios = require('axios');
const ApiProvider = require('../models/ApiProvider');
const OperatorConfig = require('../models/OperatorConfig');
const AppError = require('../utils/appError');

class BbpsService {
  constructor() {
    this.defaultTimeout = 30000;
    this.maxRetries = 3;
  }

  // Fetch bill details for a given operator and consumer
  async fetchBill({ serviceType, operatorCode, customerNumber, additionalParams = {} }) {
    // Basic validation
    if (!serviceType || !operatorCode || !customerNumber) {
      throw new AppError('Missing required fields: serviceType, operatorCode, customerNumber', 400);
    }

    // Get operator configuration
    const operatorConfig = await OperatorConfig.getOperatorByCode(operatorCode);
    if (!operatorConfig || operatorConfig.serviceType !== serviceType) {
      throw new AppError('Operator not found or service type mismatch', 404);
    }

    if (!operatorConfig.bbps || !operatorConfig.bbps.supportsBillFetch) {
      throw new AppError('Bill fetch is not supported for this operator', 400);
    }

    const apiProvider = operatorConfig.primaryApiProvider;
    if (!apiProvider || !apiProvider.isActive) {
      throw new AppError('No active API provider configured for this operator', 503);
    }

    const credentials = apiProvider.getCredentials();
    const endpoint = this.getBillFetchEndpoint(apiProvider);
    if (!endpoint) {
      throw new AppError('Bill fetch endpoint not configured for API provider', 500);
    }

    const requestData = this.buildFetchRequestData({
      operatorConfig,
      customerNumber,
      additionalParams
    });

    const headers = this.buildHeaders(apiProvider, credentials);

    const axiosConfig = {
      method: 'POST',
      url: `${credentials.baseUrl}${endpoint}`,
      headers,
      timeout: apiProvider.timeout || this.defaultTimeout,
      data: requestData
    };

    let lastError;
    const maxRetries = apiProvider.retryAttempts || this.maxRetries;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await axios(axiosConfig);
        const parsed = this.parseBillFetchResponse(response.data, apiProvider);

        // Update API provider statistics
        await apiProvider.updateStats(parsed.success, parsed.amount || 0);

        if (!parsed.success) {
          throw new AppError(parsed.message || 'Failed to fetch bill', 502);
        }

        return parsed;
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries) {
          await this.delay(Math.pow(2, attempt) * 1000);
        }
      }
    }

    await apiProvider.updateStats(false, 0);
    throw lastError || new AppError('Bill fetch failed after retries', 502);
  }

  getBillFetchEndpoint(apiProvider) {
    const endpoints = apiProvider.endpoints || {};
    return endpoints.billFetch || endpoints.bill_payment_fetch || endpoints.billPaymentFetch || null;
  }

  buildFetchRequestData({ operatorConfig, customerNumber, additionalParams }) {
    const data = {
      billerId: operatorConfig.bbps?.billerId || operatorConfig.apiMapping?.operatorId || operatorConfig.operatorCode,
      operatorCode: operatorConfig.operatorCode,
      serviceType: operatorConfig.serviceType,
      customerNumber: customerNumber,
      parameters: {}
    };

    // Merge BBPS parameters
    if (operatorConfig.bbps?.parameters) {
      for (const [key, value] of operatorConfig.bbps.parameters.entries()) {
        data.parameters[key] = value;
      }
    }

    // Merge any custom fields defined in apiMapping
    if (operatorConfig.apiMapping?.customFields) {
      for (const [key, value] of operatorConfig.apiMapping.customFields.entries()) {
        data.parameters[key] = value;
      }
    }

    // Merge additional params from request
    if (additionalParams && typeof additionalParams === 'object') {
      Object.assign(data.parameters, additionalParams);
    }

    return data;
  }

  buildHeaders(apiProvider, credentials) {
    const headers = {
      'Content-Type': 'application/json'
    };

    const authType = apiProvider.authType || 'api_key';
    switch (authType) {
      case 'bearer': {
        if (credentials.apiKey) {
          headers['Authorization'] = `Bearer ${credentials.apiKey}`;
        }
        break;
      }
      case 'basic': {
        if (credentials.apiKey && credentials.apiSecret) {
          const basicToken = Buffer.from(`${credentials.apiKey}:${credentials.apiSecret}`).toString('base64');
          headers['Authorization'] = `Basic ${basicToken}`;
        }
        break;
      }
      case 'api_key': {
        if (credentials.apiKey) {
          headers['x-api-key'] = credentials.apiKey;
        }
        if (credentials.apiSecret) {
          headers['x-api-secret'] = credentials.apiSecret;
        }
        break;
      }
      default: {
        // No auth or custom
        break;
      }
    }

    // Append custom headers from provider config
    if (apiProvider.headers) {
      for (const [key, value] of apiProvider.headers.entries()) {
        headers[key] = value;
      }
    }

    return headers;
  }

  parseBillFetchResponse(data, apiProvider) {
    // Attempt to normalize common response patterns
    const success = this.getResponseSuccess(data);
    const amount = this.getResponseAmount(data);
    const dueDate = this.getResponseDueDate(data);
    const customerName = this.getResponseCustomerName(data);
    const billDetails = this.getResponseBillDetails(data);
    const message = this.getResponseMessage(data);

    return {
      success,
      amount,
      dueDate,
      customerName,
      billDetails,
      message,
      raw: data
    };
  }

  getResponseSuccess(data) {
    if (typeof data === 'object') {
      if (data.success === true) return true;
      if (data.status && ['success', 'ok', 'SUCCESS'].includes(String(data.status).toLowerCase())) return true;
      if (data.code && ["00", "200", "0"].includes(String(data.code))) return true;
    }
    return false;
  }

  getResponseAmount(data) {
    const candidates = [
      data?.amount,
      data?.billAmount,
      data?.dueAmount,
      data?.data?.amount,
      data?.data?.billAmount,
      data?.data?.dueAmount
    ];
    const amt = candidates.find(v => typeof v === 'number' || (typeof v === 'string' && v.trim() !== ''));
    return amt ? parseFloat(amt) : 0;
  }

  getResponseDueDate(data) {
    const candidates = [data?.dueDate, data?.data?.dueDate, data?.bill?.dueDate];
    return candidates.find(v => !!v) || null;
  }

  getResponseCustomerName(data) {
    const candidates = [data?.customerName, data?.data?.customerName, data?.name];
    return candidates.find(v => !!v) || null;
  }

  getResponseBillDetails(data) {
    return data?.bill || data?.data?.bill || data?.details || data?.data?.details || {};
  }

  getResponseMessage(data) {
    return data?.message || data?.msg || data?.statusMessage || 'Bill fetch completed';
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new BbpsService();