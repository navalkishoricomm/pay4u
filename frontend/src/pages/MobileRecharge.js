import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';

const MobileRecharge = () => {
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    mobileNumber: '',
    operator: '',
    plan: '',
    amount: '',
  });

  const { mobileNumber, operator, plan, amount } = formData;

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
    if (!mobileNumber || !operator || !amount) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    if (!/^\d{10}$/.test(mobileNumber)) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }
    
    if (parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const response = await axios.post('/api/transactions/process', {
        type: 'mobile-recharge',
        amount: parseFloat(amount),
        metadata: {
          mobileNumber,
          operator,
          plan
        }
      });
      
      toast.success('Mobile recharge request submitted for approval');
      navigate('/transactions');
    } catch (error) {
      console.error('Error submitting recharge request:', error);
      toast.error('Failed to submit recharge request');
    } finally {
      setIsProcessing(false);
    }
  };

  // Sample operators and plans (in a real app, these would come from an API)
  const operators = [
    { id: 'airtel', name: 'Airtel' },
    { id: 'jio', name: 'Jio' },
    { id: 'vi', name: 'Vi' },
    { id: 'bsnl', name: 'BSNL' },
  ];

  const plans = [
    { id: 'plan1', name: 'Unlimited Calls + 1.5GB/day - ₹299 (28 days)' },
    { id: 'plan2', name: 'Unlimited Calls + 2GB/day - ₹399 (56 days)' },
    { id: 'plan3', name: 'Unlimited Calls + 2.5GB/day - ₹599 (84 days)' },
    { id: 'custom', name: 'Custom Amount' },
  ];

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="recharge-container">
      <h1>Mobile Recharge</h1>
      
      <div className="wallet-info">
        <p>Wallet Balance: <strong>₹{walletBalance.toFixed(2)}</strong></p>
      </div>
      
      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="mobileNumber">Mobile Number</label>
            <input
              type="tel"
              id="mobileNumber"
              name="mobileNumber"
              value={mobileNumber}
              onChange={handleChange}
              className="form-control"
              placeholder="Enter 10-digit mobile number"
              pattern="[0-9]{10}"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="operator">Select Operator</label>
            <select
              id="operator"
              name="operator"
              value={operator}
              onChange={handleChange}
              className="form-control"
              required
            >
              <option value="">Select an operator</option>
              {operators.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="plan">Select Plan (Optional)</label>
            <select
              id="plan"
              name="plan"
              value={plan}
              onChange={(e) => {
                const selectedPlan = plans.find(p => p.id === e.target.value);
                if (selectedPlan && selectedPlan.id !== 'custom') {
                  const planAmount = selectedPlan.name.match(/₹(\d+)/);
                  if (planAmount && planAmount[1]) {
                    setFormData({
                      ...formData,
                      plan: e.target.value,
                      amount: planAmount[1]
                    });
                    return;
                  }
                }
                setFormData({
                  ...formData,
                  plan: e.target.value,
                  amount: ''
                });
              }}
              className="form-control"
            >
              <option value="">Select a plan (or enter custom amount)</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
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
            {isProcessing ? 'Submitting...' : 'Submit Recharge Request'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default MobileRecharge;