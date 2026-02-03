import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Recharge.css';

const Recharge = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('mobile');
  const [operators, setOperators] = useState({});
  const [circles] = useState([
    'Andhra Pradesh', 'Assam', 'Bihar', 'Chennai', 'Delhi', 'Gujarat',
    'Haryana', 'Himachal Pradesh', 'Jammu Kashmir', 'Karnataka',
    'Kerala', 'Kolkata', 'Madhya Pradesh', 'Maharashtra', 'Mumbai',
    'North East', 'Orissa', 'Punjab', 'Rajasthan', 'Tamil Nadu',
    'UP East', 'UP West', 'West Bengal'
  ]);
  
  const [formData, setFormData] = useState({
    mobileNumber: '',
    customerNumber: '',
    operator: '',
    amount: '',
    circle: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [rechargeHistory, setRechargeHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchOperators();
    fetchRechargeHistory();
  }, []);

  const fetchOperators = async () => {
    try {
      const response = await axios.get('/recharge/operators');
       if (response.data.status === 'success') {
         setOperators(response.data.data);
       }
    } catch (error) {
      console.error('Error fetching operators:', error);
    }
  };

  const fetchRechargeHistory = async () => {
    try {
      const response = await axios.get('/recharge/history?limit=5');
      if (response.data.status === 'success') {
        setRechargeHistory(response.data.data.recharges);
      }
    } catch (error) {
      console.error('Error fetching recharge history:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      let endpoint, payload;
      
      if (activeTab === 'mobile') {
        endpoint = '/recharge/mobile';
        payload = {
          mobileNumber: formData.mobileNumber,
          operator: formData.operator,
          amount: parseFloat(formData.amount),
          circle: formData.circle
        };
      } else if (activeTab === 'dth') {
        endpoint = '/recharge/dth';
        payload = {
          customerNumber: formData.customerNumber,
          operator: formData.operator,
          amount: parseFloat(formData.amount)
        };
      } else {
        // For other service types (electricity, water, gas, broadband)
        endpoint = '/recharge/bill-payment';
        payload = {
          serviceType: activeTab,
          customerNumber: formData.customerNumber,
          operator: formData.operator,
          amount: parseFloat(formData.amount)
        };
      }

      const response = await axios.post(endpoint, payload);
      const data = response.data;
      
      if (data.success) {
        const serviceLabel = activeTab === 'mobile' ? 'Mobile' : 
                           activeTab === 'dth' ? 'DTH' : 
                           activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
        setMessage(`${serviceLabel} ${activeTab === 'mobile' ? 'recharge' : 'bill payment'} successful! Transaction ID: ${data.data.transactionId}`);
        setFormData({
          mobileNumber: '',
          customerNumber: '',
          operator: '',
          amount: '',
          circle: ''
        });
        fetchRechargeHistory();
      } else {
        setMessage(data.message || 'Transaction failed. Please try again.');
      }
    } catch (error) {
      console.error('Transaction error:', error);
      setMessage('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return '#28a745';
      case 'failed': return '#dc3545';
      case 'pending': return '#ffc107';
      default: return '#6c757d';
    }
  };

  return (
    <div className="recharge-container">
      <div className="recharge-header">
        <h2>Recharge & Bill Payment</h2>
        <p>Wallet Balance: ₹{user?.walletBalance?.toFixed(2) || '0.00'}</p>
      </div>

      <div className="recharge-tabs">
        <button 
          className={`tab-button ${activeTab === 'mobile' ? 'active' : ''}`}
          onClick={() => setActiveTab('mobile')}
        >
          Mobile Recharge
        </button>
        <button 
          className={`tab-button ${activeTab === 'dth' ? 'active' : ''}`}
          onClick={() => setActiveTab('dth')}
        >
          DTH Recharge
        </button>
        <button 
          className={`tab-button ${activeTab === 'electricity' ? 'active' : ''}`}
          onClick={() => setActiveTab('electricity')}
        >
          Electricity
        </button>
        <button 
          className={`tab-button ${activeTab === 'water' ? 'active' : ''}`}
          onClick={() => setActiveTab('water')}
        >
          Water
        </button>
        <button 
          className={`tab-button ${activeTab === 'gas' ? 'active' : ''}`}
          onClick={() => setActiveTab('gas')}
        >
          Gas
        </button>
        <button 
          className={`tab-button ${activeTab === 'cylinder' ? 'active' : ''}`}
          onClick={() => setActiveTab('cylinder')}
        >
          LPG Cylinder
        </button>
        <button 
          className={`tab-button ${activeTab === 'broadband' ? 'active' : ''}`}
          onClick={() => setActiveTab('broadband')}
        >
          Broadband
        </button>
      </div>

      <div className="recharge-form-container">
        <form onSubmit={handleSubmit} className="recharge-form">
          {activeTab === 'mobile' ? (
            <>
              <div className="form-group">
                <label>Mobile Number</label>
                <input
                  type="tel"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleInputChange}
                  placeholder="Enter 10-digit mobile number"
                  pattern="[6-9][0-9]{9}"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Operator</label>
                <select
                  name="operator"
                  value={formData.operator}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Operator</option>
                  {operators.mobile?.map(op => (
                    <option key={op.code} value={op.code}>
                      {op.name} {op.type && `(${op.type})`}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Circle</label>
                <select
                  name="circle"
                  value={formData.circle}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Circle</option>
                  {circles.map(circle => (
                    <option key={circle} value={circle}>{circle}</option>
                  ))}
                </select>
              </div>
            </>
          ) : activeTab === 'dth' ? (
            <>
              <div className="form-group">
                <label>Customer Number</label>
                <input
                  type="text"
                  name="customerNumber"
                  value={formData.customerNumber}
                  onChange={handleInputChange}
                  placeholder="Enter DTH customer number"
                  minLength="8"
                  maxLength="15"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>DTH Operator</label>
                <select
                  name="operator"
                  value={formData.operator}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select DTH Operator</option>
                  {operators.dth?.map(op => (
                    <option key={op.code} value={op.code}>{op.name}</option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label>
                  {activeTab === 'electricity' ? 'Consumer Number' :
                   activeTab === 'water' ? 'Consumer ID' :
                   activeTab === 'gas' ? 'Customer ID' :
                   activeTab === 'broadband' ? 'Account Number' :
                   'Customer Number'}
                </label>
                <input
                  type="text"
                  name="customerNumber"
                  value={formData.customerNumber}
                  onChange={handleInputChange}
                  placeholder={`Enter ${activeTab === 'electricity' ? 'Consumer Number' :
                    activeTab === 'water' ? 'Consumer ID' :
                    activeTab === 'gas' ? 'Customer ID' :
                    activeTab === 'broadband' ? 'Account Number' :
                    'Customer Number'}`}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Provider</label>
                <select
                  name="operator"
                  value={formData.operator}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Provider</option>
                  {operators[activeTab]?.map(op => (
                    <option key={op.code} value={op.code}>{op.name}</option>
                  ))}
                </select>
              </div>
            </>
          )}
          
          <div className="form-group">
            <label>Amount (₹)</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              placeholder={activeTab === 'mobile' ? 'Min ₹10, Max ₹5000' : 'Min ₹50, Max ₹50000'}
              min={activeTab === 'mobile' ? '10' : '50'}
              max={activeTab === 'mobile' ? '5000' : '50000'}
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="recharge-button"
            disabled={loading}
          >
            {loading ? 'Processing...' : activeTab === 'mobile' ? 'Recharge Now' : 'Pay Bill'}
          </button>
        </form>
        
        {message && (
          <div className={`message ${message.includes('successful') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}
      </div>

      <div className="recharge-history-section">
        <div className="history-header">
          <h3>Recent Recharges</h3>
          <button 
            className="toggle-history"
            onClick={() => setShowHistory(!showHistory)}
          >
            {showHistory ? 'Hide' : 'Show'} History
          </button>
        </div>
        
        {showHistory && (
          <div className="history-list">
            {rechargeHistory.length > 0 ? (
              rechargeHistory.map(recharge => (
                <div key={recharge._id} className="history-item">
                  <div className="history-details">
                    <div className="history-main">
                      <span className="history-type">
                        {recharge.type.toUpperCase()} - {recharge.operator}
                      </span>
                      <span className="history-number">
                        {recharge.mobileNumber || recharge.customerNumber}
                      </span>
                    </div>
                    <div className="history-meta">
                      <span className="history-amount">₹{recharge.amount}</span>
                      <span 
                        className="history-status"
                        style={{ color: getStatusColor(recharge.status) }}
                      >
                        {recharge.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="history-date">
                    {new Date(recharge.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="no-history">
                <p>No recharge history found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Recharge;