import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const MobileRecharge = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    mobileNumber: '',
    operator: '',
    plan: '',
    amount: '',
    circle: 'DELHI'
  });
  
  const [operators, setOperators] = useState([]);


  const { mobileNumber, operator, plan, amount, circle } = formData;

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        navigate('/login');
        return;
      }
      fetchWalletData();
      fetchOperators();
    }
  }, [isAuthenticated, authLoading, navigate]);
  


  const fetchWalletData = async () => {
    try {
      const response = await axios.get('/wallet/balance');
      setWalletBalance(response.data.data.wallet.balance);
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      toast.error('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchOperators = async () => {
    try {
      const response = await axios.get('/recharge/operators?type=mobile');
      setOperators(response.data.data || []);
    } catch (error) {
      console.error('Error fetching operators:', error);
      toast.error('Failed to load operators');
    }
  };
  


  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!mobileNumber || !operator || !amount || !circle) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    if (!/^\d{10}$/.test(mobileNumber)) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }
    
    const amountValue = parseFloat(amount);
    if (amountValue <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    // Validate amount range (1 to 10000)
     if (amountValue < 1 || amountValue > 10000) {
       toast.error('Amount must be between ₹1 and ₹10000');
       return;
     }
    
    setIsProcessing(true);
    
    try {
      const response = await axios.post('/recharge/mobile', {
        mobileNumber,
        operator: operator,
        amount: amountValue,
        circle: circle
      });
      
      if (response.data.status === 'success') {
        toast.success(`Recharge ${response.data.data.status === 'pending' ? 'submitted for approval' : 'completed successfully'}`);
        // Refresh wallet balance after successful recharge
        await fetchWalletData();
        navigate('/transactions');
      }
    } catch (error) {
      console.error('Error submitting recharge request:', error);
      toast.error('Failed to submit recharge request');
    } finally {
      setIsProcessing(false);
    }
  };

  // Available circles
  const circles = [
    { code: 'DELHI', name: 'Delhi' },
    { code: 'MUMBAI', name: 'Mumbai' },
    { code: 'KOLKATA', name: 'Kolkata' },
    { code: 'CHENNAI', name: 'Chennai' },
    { code: 'BANGALORE', name: 'Bangalore' },
    { code: 'HYDERABAD', name: 'Hyderabad' },
    { code: 'PUNE', name: 'Pune' },
    { code: 'AHMEDABAD', name: 'Ahmedabad' }
  ];

  const plans = [
    { id: 'plan1', name: 'Unlimited Calls + 1.5GB/day - ₹299 (28 days)' },
    { id: 'plan2', name: 'Unlimited Calls + 2GB/day - ₹399 (56 days)' },
    { id: 'plan3', name: 'Unlimited Calls + 2.5GB/day - ₹599 (84 days)' },
    { id: 'custom', name: 'Custom Amount' },
  ];

  if (authLoading || loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
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
                <option key={op.code} value={op.code}>
                  {op.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="circle">Select Circle</label>
            <select
              id="circle"
              name="circle"
              value={circle}
              onChange={handleChange}
              className="form-control"
              required
            >
              {circles.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
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