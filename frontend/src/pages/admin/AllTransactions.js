import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const AllTransactions = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: ''
  });

  useEffect(() => {
    // Check if user is admin
    if (currentUser?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }

    fetchTransactions();
  }, [currentUser, navigate]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      
      // Build query string from filters
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      
      const response = await axios.get(`/api/admin/transactions?${queryParams.toString()}`);
      setTransactions(response.data.data.transactions);
      setLoading(false);
    } catch (err) {
      setError('Failed to load transactions');
      setLoading(false);
      console.error('Error fetching transactions:', err);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchTransactions();
  };

  const handleClearFilters = () => {
    setFilters({
      type: '',
      status: '',
      startDate: '',
      endDate: '',
      minAmount: '',
      maxAmount: ''
    });
    // Fetch all transactions without filters
    fetchTransactions();
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'completed': return 'status-completed';
      case 'awaiting_approval': return 'status-pending';
      case 'approved': return 'status-approved';
      case 'rejected': return 'status-rejected';
      case 'failed': return 'status-failed';
      default: return '';
    }
  };

  if (loading) {
    return <div className="loading">Loading transactions...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="all-transactions">
      <div className="page-header">
        <h1>All Transactions</h1>
        <button 
          className="btn btn-secondary" 
          onClick={() => navigate('/admin/dashboard')}
        >
          Back to Dashboard
        </button>
      </div>
      
      <div className="filters-section">
        <h3>Filter Transactions</h3>
        <form onSubmit={handleFilterSubmit} className="filters-form">
          <div className="filters-row">
            <div className="form-group">
              <label htmlFor="type">Type</label>
              <select 
                id="type" 
                name="type" 
                value={filters.type} 
                onChange={handleFilterChange}
              >
                <option value="">All Types</option>
                <option value="topup">Top-up</option>
                <option value="mobile-recharge">Mobile Recharge</option>
                <option value="dth-recharge">DTH Recharge</option>
                <option value="bill-payment">Bill Payment</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select 
                id="status" 
                name="status" 
                value={filters.status} 
                onChange={handleFilterChange}
              >
                <option value="">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="awaiting_approval">Awaiting Approval</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
          
          <div className="filters-row">
            <div className="form-group">
              <label htmlFor="startDate">Start Date</label>
              <input 
                type="date" 
                id="startDate" 
                name="startDate" 
                value={filters.startDate} 
                onChange={handleFilterChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="endDate">End Date</label>
              <input 
                type="date" 
                id="endDate" 
                name="endDate" 
                value={filters.endDate} 
                onChange={handleFilterChange}
              />
            </div>
          </div>
          
          <div className="filters-row">
            <div className="form-group">
              <label htmlFor="minAmount">Min Amount (₹)</label>
              <input 
                type="number" 
                id="minAmount" 
                name="minAmount" 
                value={filters.minAmount} 
                onChange={handleFilterChange}
                min="0"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="maxAmount">Max Amount (₹)</label>
              <input 
                type="number" 
                id="maxAmount" 
                name="maxAmount" 
                value={filters.maxAmount} 
                onChange={handleFilterChange}
                min="0"
              />
            </div>
          </div>
          
          <div className="filters-actions">
            <button type="submit" className="btn btn-primary">Apply Filters</button>
            <button type="button" className="btn btn-secondary" onClick={handleClearFilters}>Clear Filters</button>
          </div>
        </form>
      </div>
      
      {transactions.length === 0 ? (
        <div className="no-transactions">
          <p>No transactions found matching the selected filters.</p>
        </div>
      ) : (
        <div className="transactions-table-container">
          <table className="transactions-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>User</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th>Reference</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(transaction => (
                <tr key={transaction._id}>
                  <td>{transaction._id.substring(0, 8)}...</td>
                  <td>
                    {transaction.wallet?.user?.name || 'N/A'}<br />
                    <small>{transaction.wallet?.user?.email || 'N/A'}</small>
                  </td>
                  <td>{transaction.type}</td>
                  <td className="amount">₹{transaction.amount}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(transaction.status)}`}>
                      {transaction.status}
                    </span>
                  </td>
                  <td>{new Date(transaction.createdAt).toLocaleString()}</td>
                  <td>{transaction.reference}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AllTransactions;