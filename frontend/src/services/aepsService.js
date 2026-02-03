import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

export const aepsService = {
  getWalletBalance: async () => {
    const response = await axios.get(`${API_BASE_URL}/aeps/wallet-balance`);
    return response.data;
  },
  validateAadhaar: async (payload) => {
    const response = await axios.post(`${API_BASE_URL}/aeps/validate-aadhaar`, payload);
    return response.data;
  },
  cashWithdrawal: async (payload) => {
    const response = await axios.post(`${API_BASE_URL}/aeps/cash-withdrawal`, payload);
    return response.data;
  },
  cashDeposit: async (payload) => {
    const response = await axios.post(`${API_BASE_URL}/aeps/cash-deposit`, payload);
    return response.data;
  },
  balanceEnquiry: async (payload) => {
    const response = await axios.post(`${API_BASE_URL}/aeps/balance-enquiry`, payload);
    return response.data;
  },
  miniStatement: async (payload) => {
    const response = await axios.post(`${API_BASE_URL}/aeps/mini-statement`, payload);
    return response.data;
  },
};