import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './DTHRecharge.css';

const DTHRecharge = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    subscriberId: '',
    operator: '',
    amount: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const dthOperators = [
    'Tata Sky', 'Airtel Digital TV', 'Dish TV', 'Videocon D2H', 'Sun Direct', 'DD Free Dish'
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
          type: 'dth-recharge',
          amount: parseFloat(formData.amount),
          metadata: {
            subscriberId: formData.subscriberId,
            operator: formData.operator
          }
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('DTH recharge request submitted successfully! It will be processed manually by our admin team.');
        setFormData({
          subscriberId: '',
          operator: '',
          amount: ''
        });
      } else {
        setMessage(data.message || 'Failed to submit DTH recharge request');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dth-recharge-container">
      <div className="dth-recharge-card">
        <h2>DTH Recharge</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="subscriberId">Subscriber ID / Customer ID</label>
            <input
              type="text"
              id="subscriberId"
              name="subscriberId"
              value={formData.subscriberId}
              onChange={handleChange}
              placeholder="Enter your subscriber ID"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="operator">DTH Operator</label>
            <select
              id="operator"
              name="operator"
              value={formData.operator}
              onChange={handleChange}
              required
            >
              <option value="">Select DTH Operator</option>
              {dthOperators.map(op => (
                <option key={op} value={op}>{op}</option>
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
              min="100"
              max="10000"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Processing...' : 'Submit DTH Recharge Request'}
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

export default DTHRecharge;