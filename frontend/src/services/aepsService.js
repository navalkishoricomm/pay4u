import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

class AepsService {
  constructor() {
    this.api = axios.create({
      baseURL: `${API_BASE_URL}/api/aeps`,
      timeout: 30000, // 30 seconds timeout for AEPS operations
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get list of banks supported for AEPS
   */
  async getBankList() {
    try {
      const response = await this.api.get('/banks');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Perform balance inquiry
   */
  async balanceInquiry(data) {
    try {
      const response = await this.api.post('/balance-inquiry', {
        aadhaarNumber: data.aadhaarNumber,
        mobileNumber: data.mobileNumber,
        bankIin: data.bankIin,
        pidData: data.pidData,
        ci: data.ci,
        dc: data.dc,
        dpId: data.dpId,
        mc: data.mc,
        mi: data.mi,
        rdsId: data.rdsId,
        rdsVer: data.rdsVer
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Perform cash withdrawal
   */
  async cashWithdrawal(data) {
    try {
      const response = await this.api.post('/cash-withdrawal', {
        aadhaarNumber: data.aadhaarNumber,
        mobileNumber: data.mobileNumber,
        bankIin: data.bankIin,
        amount: parseFloat(data.amount),
        pidData: data.pidData,
        ci: data.ci,
        dc: data.dc,
        dpId: data.dpId,
        mc: data.mc,
        mi: data.mi,
        rdsId: data.rdsId,
        rdsVer: data.rdsVer
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Perform cash deposit
   */
  async cashDeposit(data) {
    try {
      const response = await this.api.post('/cash-deposit', {
        aadhaarNumber: data.aadhaarNumber,
        mobileNumber: data.mobileNumber,
        bankIin: data.bankIin,
        amount: parseFloat(data.amount),
        pidData: data.pidData,
        ci: data.ci,
        dc: data.dc,
        dpId: data.dpId,
        mc: data.mc,
        mi: data.mi,
        rdsId: data.rdsId,
        rdsVer: data.rdsVer
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get mini statement
   */
  async miniStatement(data) {
    try {
      const response = await this.api.post('/mini-statement', {
        aadhaarNumber: data.aadhaarNumber,
        mobileNumber: data.mobileNumber,
        bankIin: data.bankIin,
        pidData: data.pidData,
        ci: data.ci,
        dc: data.dc,
        dpId: data.dpId,
        mc: data.mc,
        mi: data.mi,
        rdsId: data.rdsId,
        rdsVer: data.rdsVer
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(transactionId) {
    try {
      const response = await this.api.get(`/transaction-status/${transactionId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get user's AEPS transaction history
   */
  async getTransactionHistory(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      if (params.transactionType) queryParams.append('transactionType', params.transactionType);
      if (params.status) queryParams.append('status', params.status);
      
      const response = await this.api.get(`/transactions?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get AEPS service statistics
   */
  async getStatistics() {
    try {
      const response = await this.api.get('/statistics');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Check AEPS service status
   */
  async getServiceStatus() {
    try {
      const response = await this.api.get('/service-status');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Validate Aadhaar number
   */
  async validateAadhaar(aadhaarNumber) {
    try {
      const response = await this.api.post('/validate-aadhaar', {
        aadhaarNumber
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get wallet balance for AEPS transactions
   */
  async getWalletBalance() {
    try {
      const response = await this.api.get('/wallet-balance');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Handle API errors consistently
   */
  handleError(error) {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          return new Error(data.message || 'Invalid request data');
        case 401:
          return new Error('Authentication failed. Please login again.');
        case 403:
          return new Error('Access denied. Insufficient permissions.');
        case 404:
          return new Error('Service not found');
        case 422:
          return new Error(data.message || 'Validation failed');
        case 429:
          return new Error('Too many requests. Please try again later.');
        case 500:
          return new Error('Internal server error. Please try again.');
        case 502:
        case 503:
        case 504:
          return new Error('Service temporarily unavailable. Please try again.');
        default:
          return new Error(data.message || 'An unexpected error occurred');
      }
    } else if (error.request) {
      // Network error
      return new Error('Network error. Please check your connection and try again.');
    } else {
      // Other error
      return new Error(error.message || 'An unexpected error occurred');
    }
  }

  /**
   * Utility method to format Aadhaar number for display
   */
  static formatAadhaarNumber(aadhaarNumber) {
    if (!aadhaarNumber || aadhaarNumber.length !== 12) {
      return aadhaarNumber;
    }
    return aadhaarNumber.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3');
  }

  /**
   * Utility method to validate Aadhaar number format
   */
  static isValidAadhaarNumber(aadhaarNumber) {
    if (!aadhaarNumber) return false;
    
    // Remove spaces and check if it's 12 digits
    const cleanAadhaar = aadhaarNumber.replace(/\s/g, '');
    
    if (cleanAadhaar.length !== 12) return false;
    if (!/^\d{12}$/.test(cleanAadhaar)) return false;
    
    // Check if all digits are same (invalid Aadhaar)
    if (/^(\d)\1{11}$/.test(cleanAadhaar)) return false;
    
    return true;
  }

  /**
   * Utility method to validate mobile number format
   */
  static isValidMobileNumber(mobileNumber) {
    if (!mobileNumber) return false;
    
    // Remove spaces and special characters
    const cleanMobile = mobileNumber.replace(/[^\d]/g, '');
    
    // Check if it's 10 digits and starts with 6-9
    return /^[6-9]\d{9}$/.test(cleanMobile);
  }

  /**
   * Utility method to format currency
   */
  static formatCurrency(amount) {
    if (!amount && amount !== 0) return '₹0.00';
    
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Utility method to get transaction type display name
   */
  static getTransactionTypeDisplayName(type) {
    const typeMap = {
      'BE': 'Balance Enquiry',
      'CW': 'Cash Withdrawal',
      'CD': 'Cash Deposit',
      'MS': 'Mini Statement'
    };
    
    return typeMap[type] || type;
  }

  /**
   * Utility method to get status color class
   */
  static getStatusColorClass(status) {
    const statusMap = {
      'SUCCESS': 'success',
      'PENDING': 'warning',
      'FAILED': 'error',
      'TIMEOUT': 'error',
      'CANCELLED': 'secondary'
    };
    
    return statusMap[status] || 'secondary';
  }
}

// Create and export a singleton instance
const aepsService = new AepsService();
export default aepsService;

// Also export the class for testing purposes
export { AepsService };