import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

export const dmtService = {
  getBeneficiaries: async (userId) => {
    const res = await axios.get(`${API_BASE_URL}/dmt/beneficiaries`, { params: { userId } });
    return res.data;
  },
  addBeneficiary: async (payload) => {
    const res = await axios.post(`${API_BASE_URL}/dmt/beneficiaries`, payload);
    return res.data;
  },
  deleteBeneficiary: async (beneficiaryId) => {
    const res = await axios.delete(`${API_BASE_URL}/dmt/beneficiaries/${beneficiaryId}`);
    return res.data;
  },
  transfer: async (payload) => {
    const res = await axios.post(`${API_BASE_URL}/dmt/transfer`, payload);
    return res.data;
  },
};