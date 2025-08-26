import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';

const BillPayment = () => {
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    billerId: '',
    consumerNumber: '',
    billType: '',
    amount: '',
  });

  const { billerId, consumerNumber, billType, amount } = formData;

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const response = await axios.get('/api/wallet/my-wallet');
      setWalletBalance(response.data.data.wallet.balance);
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      toast.error('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!billerId || !consumerNumber || !billType || !amount) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    if (parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const response = await axios.post('/api/transactions/process', {
        type: 'bill-payment',
        amount: parseFloat(amount),
        metadata: {
          billerId,
          consumerNumber,
          billType
        }
      });
      
      toast.success('Bill payment request submitted for approval');
      navigate('/transactions');
    } catch (error) {
      console.error('Error submitting bill payment request:', error);
      toast.error('Failed to submit bill payment request');
    } finally {
      setIsProcessing(false);
    }
  };

  // Sample bill types and billers (in a real app, these would come from an API)
  const billTypes = [
    { id: 'electricity', name: 'Electricity' },
    { id: 'water', name: 'Water' },
    { id: 'gas', name: 'Gas' },
    { id: 'broadband', name: 'Broadband/Internet' },
    { id: 'landline', name: 'Landline' },
  ];

  const billers = {
    electricity: [
      { id: 'adani', name: 'Adani Electricity' },
      { id: 'tata', name: 'Tata Power' },
      { id: 'bses', name: 'BSES' },
      { id: 'msedcl', name: 'MSEDCL' },
    ],
    water: [
      { id: 'delhi-jal', name: 'Delhi Jal Board' },
      { id: 'mcgm', name: 'Municipal Corporation of Greater Mumbai' },
    ],
    gas: [
      { id: 'igl', name: 'Indraprastha Gas Limited' },
      { id: 'mgl', name: 'Mahanagar Gas Limited' },
    ],
    broadband: [
      { id: 'airtel', name: 'Airtel Broadband' },
      { id: 'jio', name: 'Jio Fiber' },
      { id: 'bsnl', name: 'BSNL Broadband' },
    ],
    landline: [
      { id: 'bsnl-ll', name: 'BSNL Landline' },
      { id: 'airtel-ll', name: 'Airtel Landline' },
    ],
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="bill-payment-container">
      <h1>Bill Payment</h1>
      
      <div className="wallet-info">
        <p>Wallet Balance: <strong>₹{walletBalance.toFixed(2)}</strong></p>
      </div>
      
      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="billType">Bill Type</label>
            <select
              id="billType"
              name="billType"
              value={billType}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  billType: e.target.value,
                  billerId: '',
                });
              }}
              className="form-control"
              required
            >
              <option value="">Select Bill Type</option>
              {billTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
          
          {billType && (
            <div className="form-group">
              <label htmlFor="billerId">Select Biller</label>
              <select
                id="billerId"
                name="billerId"
                value={billerId}
                onChange={handleChange}
                className="form-control"
                required
              >
                <option value="">Select Biller</option>
                {billers[billType]?.map((biller) => (
                  <option key={biller.id} value={biller.id}>
                    {biller.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="consumerNumber">
              {billType === 'electricity' ? 'Consumer Number' : 
               billType === 'water' ? 'Consumer ID' : 
               billType === 'gas' ? 'Customer ID' : 
               billType === 'broadband' || billType === 'landline' ? 'Account Number' : 
               'Consumer Number'}
            </label>
            <input
              type="text"
              id="consumerNumber"
              name="consumerNumber"
              value={consumerNumber}
              onChange={handleChange}
              className="form-control"
              placeholder={`Enter your ${billType === 'electricity' ? 'Consumer Number' : 
                billType === 'water' ? 'Consumer ID' : 
                billType === 'gas' ? 'Customer ID' : 
                billType === 'broadband' || billType === 'landline' ? 'Account Number' : 
                'Consumer Number'}`}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="amount">Amount (₹)</label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={amount}
              onChange={handleChange}
              className="form-control"
              placeholder="Enter amount"
              min="1"
              step="1"
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary btn-block"
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Pay Bill'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BillPayment;