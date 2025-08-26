import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './MobileRecharge.css';

const MobileRecharge = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    mobileNumber: '',
    operator: '',
    amount: '',
    circle: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const operators = [
    'Airtel', 'Jio', 'Vi (Vodafone Idea)', 'BSNL', 'Aircel', 'Telenor', 'Tata Docomo'
  ];

  const circles = [
    'Andhra Pradesh', 'Assam', 'Bihar', 'Chennai', 'Delhi', 'Gujarat', 'Haryana',
    'Himachal Pradesh', 'Jammu Kashmir', 'Karnataka', 'Kerala', 'Kolkata', 'Madhya Pradesh',
    'Maharashtra', 'Mumbai', 'North East', 'Orissa', 'Punjab', 'Rajasthan', 'Tamil Nadu',
    'UP East', 'UP West', 'West Bengal'
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/transactions/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: 'mobile-recharge',
          amount: parseFloat(formData.amount),
          metadata: {
            mobileNumber: formData.mobileNumber,
            operator: formData.operator,
            circle: formData.circle
          }
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Mobile recharge request submitted successfully! It will be processed manually by our admin team.');
        setFormData({
          mobileNumber: '',
          operator: '',
          amount: '',
          circle: ''
        });
      } else {
        setMessage(data.message || 'Failed to submit recharge request');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mobile-recharge-container">
      <div className="mobile-recharge-card">
        <h2>Mobile Recharge</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="mobileNumber">Mobile Number</label>
            <input
              type="tel"
              id="mobileNumber"
              name="mobileNumber"
              value={formData.mobileNumber}
              onChange={handleChange}
              placeholder="Enter 10-digit mobile number"
              pattern="[0-9]{10}"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="operator">Operator</label>
            <select
              id="operator"
              name="operator"
              value={formData.operator}
              onChange={handleChange}
              required
            >
              <option value="">Select Operator</option>
              {operators.map(op => (
                <option key={op} value={op}>{op}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="circle">Circle</label>
            <select
              id="circle"
              name="circle"
              value={formData.circle}
              onChange={handleChange}
              required
            >
              <option value="">Select Circle</option>
              {circles.map(circle => (
                <option key={circle} value={circle}>{circle}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="amount">Amount (₹)</label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="Enter recharge amount"
              min="10"
              max="5000"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Processing...' : 'Submit Recharge Request'}
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

export default MobileRecharge;