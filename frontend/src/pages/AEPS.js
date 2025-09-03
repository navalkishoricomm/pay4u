import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import './AEPS.css';

const AEPS = () => {
  const [activeTab, setActiveTab] = useState('balance');
  const [loading, setLoading] = useState(false);
  const [banks, setBanks] = useState([]);
  const [formData, setFormData] = useState({
    aadhaarNumber: '',
    mobileNumber: '',
    bankIin: '',
    amount: '',
    transactionType: 'BE', // BE: Balance Enquiry, CW: Cash Withdrawal, CD: Cash Deposit, MS: Mini Statement
    pidData: '', // Biometric data
    ci: '', // Certificate Identifier
    dc: '', // Device Code
    dpId: '', // Device Provider ID
    mc: '', // Merchant Code
    mi: '', // Merchant Identifier
    rdsId: '', // RDS ID
    rdsVer: '' // RDS Version
  });
  const [transactionResult, setTransactionResult] = useState(null);
  const [miniStatement, setMiniStatement] = useState([]);

  useEffect(() => {
    fetchBankList();
  }, []);

  const fetchBankList = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/aeps/banks', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Bank list response:', data);
        console.log('Banks data:', data.data);
        setBanks(data.data || []);
        toast.success(`Loaded ${data.data?.length || 0} banks`);
      } else {
        toast.error('Failed to fetch bank list');
      }
    } catch (error) {
      console.error('Error fetching banks:', error);
      toast.error('Error fetching bank list');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.aadhaarNumber || formData.aadhaarNumber.length !== 12) {
      toast.error('Please enter a valid 12-digit Aadhaar number');
      return false;
    }
    
    if (!formData.mobileNumber || formData.mobileNumber.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return false;
    }
    
    if (!formData.bankId) {
      toast.error('Please select a bank');
      return false;
    }
    
    if ((activeTab === 'withdrawal' || activeTab === 'deposit') && (!formData.amount || formData.amount <= 0)) {
      toast.error('Please enter a valid amount');
      return false;
    }
    
    if (!formData.pidData) {
      toast.error('Biometric authentication is required');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setTransactionResult(null);
    setMiniStatement([]);
    
    try {
      const token = localStorage.getItem('token');
      let endpoint = '';
      let transactionType = '';
      
      switch (activeTab) {
        case 'balance':
          endpoint = '/aeps/balance-inquiry';
          transactionType = 'BE';
          break;
        case 'withdrawal':
          endpoint = '/aeps/cash-withdrawal';
          transactionType = 'CW';
          break;
        case 'deposit':
          endpoint = '/aeps/cash-deposit';
          transactionType = 'CD';
          break;
        case 'statement':
          endpoint = '/aeps/mini-statement';
          transactionType = 'MS';
          break;
        default:
          throw new Error('Invalid transaction type');
      }
      
      // Find selected bank details
      const selectedBank = banks.find(bank => bank.id === formData.bankId);
      
      const requestData = {
        aadhaarNumber: formData.aadhaarNumber,
        mobileNumber: formData.mobileNumber,
        bankIin: formData.bankId,
        bankName: selectedBank ? selectedBank.name : '',
        biometricType: 'fingerprint',
        pidData: formData.pidData,
        wadh: formData.aadhaarNumber, // WADH is typically the Aadhaar number
        transactionType,
        amount: (activeTab === 'withdrawal' || activeTab === 'deposit') ? parseFloat(formData.amount) : undefined
      };
      
      console.log('=== AEPS REQUEST DEBUG ===');
      console.log('Endpoint:', endpoint);
      console.log('Form Data:', formData);
      console.log('Selected Bank:', selectedBank);
      console.log('Request Data:', requestData);
      console.log('========================');
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setTransactionResult(data);
        
        if (activeTab === 'statement' && data.miniStatement) {
          setMiniStatement(data.miniStatement);
        }
        
        toast.success(data.message || 'Transaction completed successfully');
        
        // Reset form for new transaction
        if (activeTab !== 'balance' && activeTab !== 'statement') {
          setFormData(prev => ({
            ...prev,
            amount: '',
            pidData: ''
          }));
        }
      } else {
        // Handle validation errors with more detail
        if (data.errors && Array.isArray(data.errors)) {
          const errorMessages = data.errors.map(err => `${err.field}: ${err.message}`).join(', ');
          toast.error(`Validation Error: ${errorMessages}`);
        } else {
          toast.error(data.message || 'Transaction failed');
        }
      }
    } catch (error) {
      console.error('AEPS transaction error:', error);
      toast.error('An error occurred while processing your AEPS request.');
    } finally {
      setLoading(false);
    }
  };

  const simulateBiometric = () => {
    // Simulate biometric capture for testing
    const mockPidData = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<PidData>
  <Resp errCode="0" errInfo="Success" fCount="1" fType="0" nmPoints="36" qScore="75"/>
  <DeviceInfo dpId="MANTRA.MSIPL" rdsId="MANTRA.WIN.001" rdsVer="1.0.5" mi="MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC" mc="MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC" dc="d1808a8c-5b1a-4b1a-8c5b-1a4b1a8c5b1a"/>
  <Skey ci="20230101">encrypted_session_key_here</Skey>
  <Hmac>hmac_value_here</Hmac>
  <Data type="X">biometric_template_data_here</Data>
</PidData>`;
    
    setFormData(prev => ({
      ...prev,
      pidData: mockPidData,
      biometricType: 'fingerprint',
      ci: '20230101',
      dc: 'd1808a8c-5b1a-4b1a-8c5b-1a4b1a8c5b1a',
      dpId: 'MANTRA.MSIPL',
      mc: 'MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC',
      mi: 'MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC',
      rdsId: 'MANTRA.WIN.001',
      rdsVer: '1.0.5'
    }));
    
    toast.success('Biometric data captured successfully (simulated)');
  };

  const renderTabContent = () => {
    return (
      <form onSubmit={handleSubmit} className="aeps-form">
        <div className="form-group">
          <label htmlFor="aadhaarNumber">Aadhaar Number *</label>
          <input
            type="text"
            id="aadhaarNumber"
            name="aadhaarNumber"
            value={formData.aadhaarNumber}
            onChange={handleInputChange}
            placeholder="Enter 12-digit Aadhaar number"
            maxLength="12"
            pattern="[0-9]{12}"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="mobileNumber">Mobile Number *</label>
          <input
            type="text"
            id="mobileNumber"
            name="mobileNumber"
            value={formData.mobileNumber}
            onChange={handleInputChange}
            placeholder="Enter 10-digit mobile number"
            maxLength="10"
            pattern="[0-9]{10}"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="bankIin">Select Bank *</label>
          <select
            id="bankIin"
            name="bankIin"
            value={formData.bankIin}
            onChange={handleInputChange}
            required
          >
            <option value="">Select a bank</option>
            {banks.map(bank => (
              <option key={bank.id} value={bank.id}>
                {bank.name}
              </option>
            ))}
          </select>
        </div>
        
        {(activeTab === 'withdrawal' || activeTab === 'deposit') && (
          <div className="form-group">
            <label htmlFor="amount">Amount *</label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              placeholder="Enter amount"
              min="1"
              max={activeTab === 'withdrawal' ? '10000' : '50000'}
              step="1"
              required
            />
            <small className="form-text">
              {activeTab === 'withdrawal' 
                ? 'Minimum: ₹100, Maximum: ₹10,000 per transaction'
                : 'Minimum: ₹100, Maximum: ₹50,000 per transaction'
              }
            </small>
          </div>
        )}
        
        <div className="form-group biometric-section">
          <label>Biometric Authentication *</label>
          <div className="biometric-controls">
            <button
              type="button"
              onClick={simulateBiometric}
              className="btn btn-secondary"
              disabled={loading}
            >
              📱 Capture Biometric (Simulated)
            </button>
            {formData.pidData && (
              <span className="biometric-status">✅ Biometric Captured</span>
            )}
          </div>
          <small className="form-text">
            In production, this would integrate with actual biometric devices
          </small>
        </div>
        
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || !formData.pidData}
        >
          {loading ? 'Processing...' : `Process ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`}
        </button>
      </form>
    );
  };

  return (
    <div className="aeps-container">
      <div className="aeps-header">
        <h1>AEPS Services</h1>
        <p>Aadhaar Enabled Payment System</p>
      </div>
      
      <div className="aeps-tabs">
        <button
          className={`tab-button ${activeTab === 'balance' ? 'active' : ''}`}
          onClick={() => setActiveTab('balance')}
        >
          Balance Inquiry
        </button>
        <button
          className={`tab-button ${activeTab === 'withdrawal' ? 'active' : ''}`}
          onClick={() => setActiveTab('withdrawal')}
        >
          Cash Withdrawal
        </button>
        <button
          className={`tab-button ${activeTab === 'deposit' ? 'active' : ''}`}
          onClick={() => setActiveTab('deposit')}
        >
          Cash Deposit
        </button>
        <button
          className={`tab-button ${activeTab === 'statement' ? 'active' : ''}`}
          onClick={() => setActiveTab('statement')}
        >
          Mini Statement
        </button>
      </div>
      
      <div className="aeps-content">
        <div className="aeps-form-section">
          {renderTabContent()}
        </div>
        
        {transactionResult && (
          <div className="transaction-result">
            <h3>Transaction Result</h3>
            <div className="result-details">
              <div className="result-item">
                <span className="label">Status:</span>
                <span className={`value ${transactionResult.status === 'SUCCESS' ? 'success' : 'error'}`}>
                  {transactionResult.status}
                </span>
              </div>
              <div className="result-item">
                <span className="label">Message:</span>
                <span className="value">{transactionResult.message}</span>
              </div>
              {transactionResult.transactionId && (
                <div className="result-item">
                  <span className="label">Transaction ID:</span>
                  <span className="value">{transactionResult.transactionId}</span>
                </div>
              )}
              {transactionResult.rrn && (
                <div className="result-item">
                  <span className="label">RRN:</span>
                  <span className="value">{transactionResult.rrn}</span>
                </div>
              )}
              {transactionResult.balance && (
                <div className="result-item">
                  <span className="label">Available Balance:</span>
                  <span className="value balance">₹{transactionResult.balance}</span>
                </div>
              )}
              {transactionResult.amount && (
                <div className="result-item">
                  <span className="label">Amount:</span>
                  <span className="value amount">₹{transactionResult.amount}</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {miniStatement.length > 0 && (
          <div className="mini-statement">
            <h3>Mini Statement</h3>
            <div className="statement-table">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {miniStatement.map((transaction, index) => (
                    <tr key={index}>
                      <td>{new Date(transaction.date).toLocaleDateString()}</td>
                      <td>{transaction.description}</td>
                      <td className={transaction.type === 'debit' ? 'debit' : 'credit'}>
                        {transaction.type === 'debit' ? '-' : '+'}₹{transaction.amount}
                      </td>
                      <td>₹{transaction.balance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AEPS;