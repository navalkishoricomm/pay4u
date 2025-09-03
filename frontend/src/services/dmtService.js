const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

export const dmtService = {
  // Verify mobile number for remitter
  verifyMobile: async (mobile) => {
    try {
      const response = await fetch(`${API_BASE_URL}/dmt/remitter/verify-mobile`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ mobile })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Mobile verification failed');
      }
      return data;
    } catch (error) {
      console.error('Mobile verification error:', error);
      throw error;
    }
  },

  // Get remitter status
  getRemitterStatus: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/dmt/remitter/status`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get remitter status');
      }
      return data;
    } catch (error) {
      console.error('Get remitter status error:', error);
      throw error;
    }
  },

  // Register new remitter
  registerRemitter: async (remitterData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/dmt/remitter/register`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(remitterData)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Remitter registration failed');
      }
      return data;
    } catch (error) {
      console.error('Remitter registration error:', error);
      throw error;
    }
  },

  // Verify OTP for remitter registration
  verifyRemitterOTP: async (otpData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/dmt/remitter/verify-otp`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(otpData)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'OTP verification failed');
      }
      return data;
    } catch (error) {
      console.error('OTP verification error:', error);
      throw error;
    }
  },

  // Get beneficiaries
  getBeneficiaries: async (remitterId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/dmt/remitter/${remitterId}/beneficiaries`, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      const data = await response.json();
      console.log('=== getBeneficiaries API Response ===');
      console.log('Response status:', response.status);
      console.log('Response data:', data);
      if (data.data && data.data.beneficiaries) {
        console.log('Beneficiaries array:', data.data.beneficiaries);
        data.data.beneficiaries.forEach((ben, index) => {
          console.log(`Beneficiary ${index}:`, {
            _id: ben._id,
            id: ben.id,
            isVerified: ben.isVerified,
            verificationStatus: ben.verificationStatus,
            accountHolderName: ben.accountHolderName
          });
        });
      }
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get beneficiaries');
      }
      return data;
    } catch (error) {
      console.error('Get beneficiaries error:', error);
      throw error;
    }
  },

  // Add beneficiary
  addBeneficiary: async (beneficiaryData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/dmt/beneficiary/register`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(beneficiaryData)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to add beneficiary');
      }
      return data;
    } catch (error) {
      console.error('Add beneficiary error:', error);
      throw error;
    }
  },

  // Verify beneficiary
  verifyBeneficiary: async (beneficiaryId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/dmt/beneficiary/${beneficiaryId}/verify`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to verify beneficiary');
      }
      return data;
    } catch (error) {
      console.error('Verify beneficiary error:', error);
      throw error;
    }
  },

  // Delete beneficiary
  deleteBeneficiary: async (beneficiaryId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/dmt/beneficiary/${beneficiaryId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete beneficiary');
      }
      return data;
    } catch (error) {
      console.error('Delete beneficiary error:', error);
      throw error;
    }
  },

  // Initiate money transfer
  initiateTransfer: async (transferData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/dmt/transaction`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(transferData)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Money transfer failed');
      }
      return data;
    } catch (error) {
      console.error('Money transfer error:', error);
      throw error;
    }
  },

  // Get transaction history
  getTransactionHistory: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `${API_BASE_URL}/dmt/transactions${queryString ? `?${queryString}` : ''}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get transaction history');
      }
      return data;
    } catch (error) {
      console.error('Get transaction history error:', error);
      throw error;
    }
  },

  // Get transaction status
  getTransactionStatus: async (transactionId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/dmt/transaction/${transactionId}/status`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get transaction status');
      }
      return data;
    } catch (error) {
      console.error('Get transaction status error:', error);
      throw error;
    }
  },

  // Perform KYC
  performKYC: async (kycData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/dmt/remitter/${kycData.remitterId}/kyc`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(kycData)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'KYC failed');
      }
      return data;
    } catch (error) {
      console.error('KYC error:', error);
      throw error;
    }
  }
};

export default dmtService;