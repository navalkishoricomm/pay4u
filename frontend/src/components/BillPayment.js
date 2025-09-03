import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './BillPayment.css';

const BillPayment = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    billType: '',
    accountNumber: '',
    provider: '',
    amount: '',
    customerName: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const billTypes = [
    'Electricity',
    'Gas',
    'Water',
    'Internet/Broadband',
    'Landline',
    'Insurance',
    'Credit Card',
    'Loan EMI'
  ];

  const providers = {
    'Electricity': ['MSEB', 'BSES', 'Adani Power', 'Tata Power', 'CESC', 'KSEB', 'TNEB', 'PSPCL'],
    'Gas': ['Indane', 'Bharat Gas', 'HP Gas', 'Gujarat Gas', 'IGL'],
    'Water': ['Municipal Corporation', 'Water Board', 'BWSSB', 'DJB'],
    'Internet/Broadband': ['Airtel', 'Jio Fiber', 'BSNL', 'ACT Fibernet', 'Hathway', 'Tikona'],
    'Landline': ['BSNL', 'Airtel', 'Reliance'],
    'Insurance': ['LIC', 'HDFC Life', 'ICICI Prudential', 'SBI Life', 'Max Life'],
    'Credit Card': ['HDFC', 'ICICI', 'SBI', 'Axis', 'Citibank', 'American Express'],
    'Loan EMI': ['HDFC Bank', 'ICICI Bank', 'SBI', 'Axis Bank', 'Kotak Mahindra']
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
      // Reset provider when bill type changes
      ...(name === 'billType' && { provider: '' })
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/transactions/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: 'bill-payment',
          amount: parseFloat(formData.amount),
          metadata: {
            billType: formData.billType,
            accountNumber: formData.accountNumber,
            provider: formData.provider,
            customerName: formData.customerName
          }
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Bill payment request submitted successfully! It will be processed manually by our admin team.');
        setFormData({
          billType: '',
          accountNumber: '',
          provider: '',
          amount: '',
          customerName: ''
        });
      } else {
        setMessage(data.message || 'Failed to submit bill payment request');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bill-payment-container">
      <div className="bill-payment-card">
        <h2>Bill Payment</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="billType">Bill Type</label>
            <select
              id="billType"
              name="billType"
              value={formData.billType}
              onChange={handleChange}
              required
            >
              <option value="">Select Bill Type</option>
              {billTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {formData.billType && (
            <div className="form-group">
              <label htmlFor="provider">Service Provider</label>
              <select
                id="provider"
                name="provider"
                value={formData.provider}
                onChange={handleChange}
                required
              >
                <option value="">Select Provider</option>
                {providers[formData.billType]?.map(provider => (
                  <option key={provider} value={provider}>{provider}</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="accountNumber">Account/Consumer Number</label>
            <input
              type="text"
              id="accountNumber"
              name="accountNumber"
              value={formData.accountNumber}
              onChange={handleChange}
              placeholder="Enter your account/consumer number"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="customerName">Customer Name</label>
            <input
              type="text"
              id="customerName"
              name="customerName"
              value={formData.customerName}
              onChange={handleChange}
              placeholder="Enter customer name as per bill"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="amount">Amount (₹)</label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="Enter bill amount"
              min="1"
              max="50000"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Processing...' : 'Submit Bill Payment Request'}
          </button>
        </form>

        {message && (
          <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default BillPayment;