import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import './AllTransactions.css';

const AllTransactions = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTransactions, setSelectedTransactions] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    results: 0
  });
  
  // Filter states
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: '',
    userId: '',
    userName: '',
    userEmail: '',
    operator: '',
    apiProvider: '',
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  useEffect(() => {
    // Check if user is admin
    if (currentUser?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }

    fetchTransactions();
  }, [currentUser, navigate]);

  const fetchTransactions = async (pageNum = filters.page) => {
    try {
      setLoading(true);
      
      // Build query string from filters
      const queryParams = new URLSearchParams();
      const filtersToSend = { ...filters, page: pageNum };
      Object.entries(filtersToSend).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      
      const response = await axios.get(`/admin/transactions?${queryParams.toString()}`);
      setTransactions(response.data.data.transactions);
      setPagination({
        page: response.data.page,
        pages: response.data.pages,
        total: response.data.total,
        results: response.data.results
      });
      setSelectedTransactions([]);
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
      maxAmount: '',
      userId: '',
      userName: '',
      userEmail: '',
      operator: '',
      apiProvider: '',
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    // Fetch all transactions without filters
    fetchTransactions(1);
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
    fetchTransactions(newPage);
  };

  const handleSelectTransaction = (transactionId) => {
    setSelectedTransactions(prev => {
      if (prev.includes(transactionId)) {
        return prev.filter(id => id !== transactionId);
      } else {
        return [...prev, transactionId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedTransactions.length === transactions.length) {
      setSelectedTransactions([]);
    } else {
      setSelectedTransactions(transactions.map(t => t._id));
    }
  };

  const handleBulkApprove = async () => {
    if (selectedTransactions.length === 0) {
      toast.warning('Please select transactions to approve');
      return;
    }

    const notes = prompt('Enter approval notes (optional):');
    if (notes === null) return; // User cancelled

    try {
      setBulkLoading(true);
      const response = await axios.patch('/admin/transactions/bulk-approve', {
        transactionIds: selectedTransactions,
        notes
      });

      toast.success(response.data.message);
      fetchTransactions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve transactions');
      console.error('Bulk approve error:', err);
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedTransactions.length === 0) {
      toast.warning('Please select transactions to reject');
      return;
    }

    const failureReason = prompt('Enter rejection reason:');
    if (!failureReason) {
      toast.warning('Rejection reason is required');
      return;
    }

    try {
      setBulkLoading(true);
      const response = await axios.patch('/admin/transactions/bulk-reject', {
        transactionIds: selectedTransactions,
        failureReason
      });

      toast.success(response.data.message);
      fetchTransactions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject transactions');
      console.error('Bulk reject error:', err);
    } finally {
      setBulkLoading(false);
    }
  };

  const handleSingleApprove = async (transactionId) => {
    const notes = prompt('Enter approval notes (optional):');
    if (notes === null) return;

    try {
      await axios.patch(`/admin/transactions/${transactionId}`, {
        status: 'approved',
        notes
      });
      toast.success('Transaction approved successfully');
      fetchTransactions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve transaction');
    }
  };

  const handleSingleReject = async (transactionId) => {
    const failureReason = prompt('Enter rejection reason:');
    if (!failureReason) {
      toast.warning('Rejection reason is required');
      return;
    }

    try {
      await axios.patch(`/admin/transactions/${transactionId}`, {
        status: 'rejected',
        failureReason
      });
      toast.success('Transaction rejected successfully');
      fetchTransactions();
    } catch (err) {
       toast.error(err.response?.data?.message || 'Failed to reject transaction');
     }
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
            
            <div className="form-group">
              <label htmlFor="operator">Operator</label>
              <select 
                id="operator" 
                name="operator" 
                value={filters.operator} 
                onChange={handleFilterChange}
              >
                <option value="">All Operators</option>
                <option value="airtel">Airtel</option>
                <option value="jio">Jio</option>
                <option value="vi">Vi</option>
                <option value="bsnl">BSNL</option>
                <option value="tata-sky">Tata Sky</option>
                <option value="dish-tv">Dish TV</option>
                <option value="sun-direct">Sun Direct</option>
                <option value="videocon">Videocon</option>
              </select>
            </div>
          </div>
          
          <div className="filters-row">
            <div className="form-group">
              <label htmlFor="userName">User Name</label>
              <input 
                type="text" 
                id="userName" 
                name="userName" 
                value={filters.userName} 
                onChange={handleFilterChange}
                placeholder="Search by user name"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="userEmail">User Email</label>
              <input 
                type="email" 
                id="userEmail" 
                name="userEmail" 
                value={filters.userEmail} 
                onChange={handleFilterChange}
                placeholder="Search by user email"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="apiProvider">API Provider</label>
              <select 
                id="apiProvider" 
                name="apiProvider" 
                value={filters.apiProvider} 
                onChange={handleFilterChange}
              >
                <option value="">All Providers</option>
                <option value="primary">Primary</option>
                <option value="secondary">Secondary</option>
                <option value="manual">Manual</option>
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
            
            <div className="form-group">
              <label htmlFor="limit">Results per page</label>
              <select 
                id="limit" 
                name="limit" 
                value={filters.limit} 
                onChange={handleFilterChange}
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
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
      
      {selectedTransactions.length > 0 && (
        <div className="bulk-actions">
          <div className="bulk-info">
            <span>{selectedTransactions.length} transaction(s) selected</span>
          </div>
          <div className="bulk-buttons">
            <button 
              className="btn btn-success" 
              onClick={handleBulkApprove}
              disabled={bulkLoading}
            >
              {bulkLoading ? 'Processing...' : 'Bulk Approve'}
            </button>
            <button 
              className="btn btn-danger" 
              onClick={handleBulkReject}
              disabled={bulkLoading}
            >
              {bulkLoading ? 'Processing...' : 'Bulk Reject'}
            </button>
          </div>
        </div>
      )}
      
      {transactions.length === 0 ? (
        <div className="no-transactions">
          <p>No transactions found matching the selected filters.</p>
        </div>
      ) : (
        <div className="transactions-table-container">
          <div className="table-header">
            <div className="table-info">
              <span>Showing {pagination.results} of {pagination.total} transactions</span>
            </div>
          </div>
          
          <table className="transactions-table">
            <thead>
              <tr>
                <th>
                  <input 
                    type="checkbox" 
                    checked={selectedTransactions.length === transactions.length && transactions.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th>ID</th>
                <th>User</th>
                <th>Type</th>
                <th>Operator</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th>Reference</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(transaction => (
                <tr key={transaction._id}>
                  <td>
                    <input 
                      type="checkbox" 
                      checked={selectedTransactions.includes(transaction._id)}
                      onChange={() => handleSelectTransaction(transaction._id)}
                    />
                  </td>
                  <td>{transaction._id.substring(0, 8)}...</td>
                  <td>
                    {transaction.wallet?.user?.name || 'N/A'}<br />
                    <small>{transaction.wallet?.user?.email || 'N/A'}</small>
                  </td>
                  <td>{transaction.type}</td>
                  <td>{transaction.operator || 'N/A'}</td>
                  <td className="amount">₹{transaction.amount}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(transaction.status)}`}>
                      {transaction.status}
                    </span>
                  </td>
                  <td>{new Date(transaction.createdAt).toLocaleString()}</td>
                  <td>{transaction.reference || 'N/A'}</td>
                  <td className="actions">
                    {transaction.status === 'awaiting_approval' && (
                      <>
                        <button 
                          className="btn btn-sm btn-success"
                          onClick={() => handleSingleApprove(transaction._id)}
                          title="Approve"
                        >
                          ✓
                        </button>
                        <button 
                          className="btn btn-sm btn-danger"
                          onClick={() => handleSingleReject(transaction._id)}
                          title="Reject"
                        >
                          ✗
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {pagination.pages > 1 && (
            <div className="pagination">
              <button 
                className="btn btn-sm btn-secondary"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                Previous
              </button>
              
              <span className="page-info">
                Page {pagination.page} of {pagination.pages}
              </span>
              
              <button 
                className="btn btn-sm btn-secondary"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AllTransactions;