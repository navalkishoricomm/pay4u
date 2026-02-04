import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';

// Map UI bill types to backend API types where they differ (used across the component)
const apiTypeMap = {
  credit_card: 'creditcard',
  loan: 'loan',
  insurance: 'insurance',
  dth: 'dth',
  electricity: 'electricity',
  gas: 'gas',
  water: 'water',
  broadband: 'broadband',
  landline: 'landline',
  postpaid: 'postpaid',
  cylinder: 'cylinder'
};

const BillPayment = () => {
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [operators, setOperators] = useState({});
  const [isFetching, setIsFetching] = useState(false);
  const [billInfo, setBillInfo] = useState(null);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    billerId: '',
    consumerNumber: '',
    registeredMobile: '',
    billType: '',
    amount: '',
  });

  const { billerId, consumerNumber, registeredMobile, billType, amount } = formData;

  // Determine selected operator to check if bill fetch is supported
  const selectedOperator = billType && billerId ? operators[billType]?.find(op => op.code === billerId) : null;
  useEffect(() => {
    fetchWalletData();
    // Preselect bill type from query param if present
    try {
      const params = new URLSearchParams(window.location.search);
      const typeParam = params.get('type');
      const mapping = {
        'dth': 'dth',
        'electricity': 'electricity',
        'gas': 'gas',
        'water': 'water',
        'credit-card': 'credit_card',
        'loan': 'loan',
        'insurance': 'insurance',
        'broadband': 'broadband',
        'landline': 'landline',
        'postpaid': 'postpaid',
        'cylinder': 'cylinder'
      };
      if (typeParam && mapping[typeParam]) {
        setFormData(prev => ({ ...prev, billType: mapping[typeParam] }));
      }
    } catch {}
  }, []);

  // Fetch operators whenever billType changes
  useEffect(() => {
    if (!formData.billType) return;
    fetchOperators(formData.billType);
  }, [formData.billType]);

  const fetchWalletData = async () => {
    try {
      const response = await axios.get('/wallet/my-wallet');
      setWalletBalance(response.data.data.wallet.balance);
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      toast.error('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const fetchOperators = async (type) => {
    try {
      // Map UI bill types to backend API types where they differ
      const apiTypeMap = {
        credit_card: 'creditcard',
        loan: 'loan',
        insurance: 'insurance',
        dth: 'dth',
        electricity: 'electricity',
        gas: 'gas',
        water: 'water',
        broadband: 'broadband',
        landline: 'landline',
        postpaid: 'postpaid',
        cylinder: 'cylinder'
      };
      const apiType = apiTypeMap[type] || type;
      const response = await axios.get('/recharge/operators', { params: { type: apiType } });
      if (response.data.status === 'success') {
        const list = response.data.data;
        setOperators(prev => ({ ...prev, [type]: Array.isArray(list) ? list : [] }));
      }
    } catch (error) {
      console.error('Error fetching operators:', error);
      toast.error('Failed to load operators');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFetchBill = async () => {
    if (!billerId || !consumerNumber || !billType) {
      toast.error('Please select bill type, biller, and enter consumer number');
      return;
    }

    setIsFetching(true);
    setBillInfo(null);
    try {
      const response = await axios.post('/bbps/bills/fetch', {
        serviceType: billType,
        operatorCode: billerId,
        customerNumber: consumerNumber
      });

      if (response.data?.status === 'success') {
        const data = response.data.data || {};
        const fetchedAmount = typeof data.amount === 'number' ? data.amount : parseFloat(data.amount);
        if (!isNaN(fetchedAmount) && fetchedAmount > 0) {
          setFormData(prev => ({ ...prev, amount: String(fetchedAmount) }));
        }
        setBillInfo({
          customerName: data.customerName || null,
          dueDate: data.dueDate || null,
          amount: fetchedAmount || null,
          message: data.message || 'Bill details fetched',
          details: data.billDetails || {}
        });
        toast.success('Bill details fetched');
      } else {
        toast.error(response.data?.message || 'Failed to fetch bill details');
      }
    } catch (error) {
      console.error('Error fetching bill details:', error);
      const msg = error.response?.data?.message || error.message || 'Failed to fetch bill details';
      toast.error(msg);
    } finally {
      setIsFetching(false);
    }
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
      const response = await axios.post('/recharge/bill-payment', {
        serviceType: (apiTypeMap[formData.billType] || formData.billType),
        operator: formData.billerId, // backend expects 'operator'
        customerNumber: formData.consumerNumber,
        amount: parseFloat(formData.amount),
        registeredMobile: formData.registeredMobile // Add this line
      });
      
      const data = response.data;
      
      if (data.status === 'success') {
        toast.success('Bill payment successful');
        // Refresh wallet balance after successful payment
        await fetchWalletData();
        navigate('/transactions');
      } else {
        toast.error(data.message || 'Bill payment failed');
      }
    } catch (error) {
      console.error('Error submitting bill payment request:', error);
      const msg = error.response?.data?.message || 'Failed to submit bill payment request';
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  // Bill types available in the system (matching API operator categories)
  const billTypes = [
    { id: 'dth', name: 'DTH Recharge' },
    { id: 'electricity', name: 'Electricity Bill' },
    { id: 'gas', name: 'Gas Bill' },
    { id: 'water', name: 'Water Bill' },
    { id: 'broadband', name: 'Broadband Bill' },
    { id: 'landline', name: 'Landline Bill' },
    { id: 'postpaid', name: 'Mobile Postpaid' },
    { id: 'credit_card', name: 'Credit Card Bill' },
    { id: 'loan', name: 'Loan EMI' },
    { id: 'insurance', name: 'Insurance Premium' },
    { id: 'cylinder', name: 'LPG Cylinder' },
  ];

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
                  amount: '',
                  registeredMobile: '',
                });
                setBillInfo(null);
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
                onChange={(e) => {
                  handleChange(e);
                  setBillInfo(null);
                  setFormData(prev => ({ ...prev, amount: '' }));
                }}
                className="form-control"
                required
              >
                <option value="">Select Biller</option>
                {operators[billType]?.map((operator) => (
                  <option key={operator.code} value={operator.code}>
                    {operator.name}{operator.supportsBillFetch ? ' • Bill Fetch' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="consumerNumber">
              {billType === 'dth' ? 'Customer ID' : 
               billType === 'electricity' ? 'Consumer Number' : 
               billType === 'gas' ? 'Customer ID' : 
               billType === 'water' ? 'Consumer Number' : 
               billType === 'credit_card' ? 'Credit Card Number' :
               'Consumer Number'}
            </label>
            <input
              type="text"
              id="consumerNumber"
              name="consumerNumber"
              value={consumerNumber}
              onChange={(e) => {
                handleChange(e);
                setBillInfo(null);
                setFormData(prev => ({ ...prev, amount: '' }));
              }}
              className="form-control"
              placeholder={`Enter your ${billType === 'dth' ? 'Customer ID' : 
                billType === 'electricity' ? 'Consumer Number' : 
                billType === 'gas' ? 'Customer ID' : 
                billType === 'water' ? 'Consumer Number' : 
                billType === 'credit_card' ? 'Credit Card Number' :
                'Consumer Number'}`}
              required
            />
          </div>

          {billType === 'credit_card' && (
            <div className="form-group">
              <label htmlFor="registeredMobile">Registered Phone Number</label>
              <input
                type="text"
                id="registeredMobile"
                name="registeredMobile"
                value={registeredMobile}
                onChange={handleChange}
                className="form-control"
                placeholder="Enter Registered Phone Number"
                required
                pattern="[0-9]{10}"
                maxLength="10"
              />
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="amount">Amount (₹)</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="number"
                id="amount"
                name="amount"
                value={amount}
                onChange={handleChange}
                className="form-control"
                placeholder="Enter amount or fetch bill"
                min="1"
                step="1"
                required
              />
              {selectedOperator?.supportsBillFetch && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleFetchBill}
                  disabled={isFetching || !billerId || !consumerNumber || !billType}
                >
                  {isFetching ? 'Fetching...' : 'Fetch Bill'}
                </button>
              )}
            </div
            >
            {billInfo && (
              <div className="bill-info" style={{ marginTop: '10px' }}>
                {billInfo.customerName && (
                  <p>Customer: <strong>{billInfo.customerName}</strong></p>
                )}
                {billInfo.dueDate && (
                  <p>Due Date: <strong>{billInfo.dueDate}</strong></p>
                )}
                {billInfo.amount && (
                  <p>Fetched Amount: <strong>₹{Number(billInfo.amount).toFixed(2)}</strong></p>
                )}
                {billInfo.message && (
                  <p style={{ color: '#555' }}>{billInfo.message}</p>
                )}
              </div>
            )}
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