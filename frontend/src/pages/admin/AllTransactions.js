import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import './Admin.css';

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

  const handleChangeToAwaiting = async (transactionId) => {
    const notes = prompt('Enter notes for status change (optional):');
    if (notes === null) return; // User cancelled

    try {
      await axios.patch(`/admin/transactions/${transactionId}`, {
        status: 'awaiting_approval',
        notes
      });
      toast.success('Transaction status changed to awaiting approval');
      fetchTransactions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change transaction status');
    }
  };

  const handleBulkChangeToAwaiting = async () => {
    if (selectedTransactions.length === 0) {
      toast.warning('Please select transactions to change status');
      return;
    }

    const notes = prompt('Enter notes for bulk status change (optional):');
    if (notes === null) return; // User cancelled

    try {
      setBulkLoading(true);
      
      // Process each transaction individually since there's no bulk endpoint for awaiting_approval
      const promises = selectedTransactions.map(transactionId => 
        axios.patch(`/admin/transactions/${transactionId}`, {
          status: 'awaiting_approval',
          notes
        })
      );
      
      await Promise.all(promises);
      toast.success(`${selectedTransactions.length} transactions changed to awaiting approval`);
      fetchTransactions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change transaction statuses');
    } finally {
       setBulkLoading(false);
     }
   };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed': return 'bg-success';
      case 'awaiting_approval': return 'bg-warning text-dark';
      case 'approved': return 'bg-info text-white';
      case 'rejected': return 'bg-danger';
      case 'failed': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger m-4">{error}</div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>All Transactions</h1>
        <button 
          className="btn btn-outline-secondary" 
          onClick={() => navigate('/admin/dashboard')}
        >
          <i className="bi bi-arrow-left me-2"></i>
          Back to Dashboard
        </button>
      </div>
      
      <div className="admin-card">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">Filter Transactions</h5>
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={handleClearFilters}>
            <i className="bi bi-x-circle me-1"></i> Clear Filters
          </button>
        </div>
        <form onSubmit={handleFilterSubmit}>
          <div className="row g-3">
            <div className="col-md-3">
              <label htmlFor="type" className="form-label small text-muted">Type</label>
              <select 
                id="type" 
                name="type" 
                className="form-select form-select-sm"
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
            
            <div className="col-md-3">
              <label htmlFor="status" className="form-label small text-muted">Status</label>
              <select 
                id="status" 
                name="status" 
                className="form-select form-select-sm"
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
            
            <div className="col-md-3">
              <label htmlFor="operator" className="form-label small text-muted">Operator</label>
              <select 
                id="operator" 
                name="operator" 
                className="form-select form-select-sm"
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

            <div className="col-md-3">
              <label htmlFor="apiProvider" className="form-label small text-muted">API Provider</label>
              <select 
                id="apiProvider" 
                name="apiProvider" 
                className="form-select form-select-sm"
                value={filters.apiProvider} 
                onChange={handleFilterChange}
              >
                <option value="">All Providers</option>
                <option value="primary">Primary</option>
                <option value="secondary">Secondary</option>
                <option value="manual">Manual</option>
              </select>
            </div>
            
            <div className="col-md-3">
              <label htmlFor="userName" className="form-label small text-muted">User Name</label>
              <input 
                type="text" 
                id="userName" 
                name="userName" 
                className="form-control form-control-sm"
                value={filters.userName} 
                onChange={handleFilterChange}
                placeholder="Search by user name"
              />
            </div>
            
            <div className="col-md-3">
              <label htmlFor="userEmail" className="form-label small text-muted">User Email</label>
              <input 
                type="email" 
                id="userEmail" 
                name="userEmail" 
                className="form-control form-control-sm"
                value={filters.userEmail} 
                onChange={handleFilterChange}
                placeholder="Search by user email"
              />
            </div>
            
            <div className="col-md-3">
              <label htmlFor="startDate" className="form-label small text-muted">Start Date</label>
              <input 
                type="date" 
                id="startDate" 
                name="startDate" 
                className="form-control form-control-sm"
                value={filters.startDate} 
                onChange={handleFilterChange}
              />
            </div>
            
            <div className="col-md-3">
              <label htmlFor="endDate" className="form-label small text-muted">End Date</label>
              <input 
                type="date" 
                id="endDate" 
                name="endDate" 
                className="form-control form-control-sm"
                value={filters.endDate} 
                onChange={handleFilterChange}
              />
            </div>

            <div className="col-md-3">
              <label htmlFor="minAmount" className="form-label small text-muted">Min Amount (₹)</label>
              <input 
                type="number" 
                id="minAmount" 
                name="minAmount" 
                className="form-control form-control-sm"
                value={filters.minAmount} 
                onChange={handleFilterChange}
                min="0"
              />
            </div>
            
            <div className="col-md-3">
              <label htmlFor="maxAmount" className="form-label small text-muted">Max Amount (₹)</label>
              <input 
                type="number" 
                id="maxAmount" 
                name="maxAmount" 
                className="form-control form-control-sm"
                value={filters.maxAmount} 
                onChange={handleFilterChange}
                min="0"
              />
            </div>

            <div className="col-md-3">
              <label htmlFor="limit" className="form-label small text-muted">Results per page</label>
              <select 
                id="limit" 
                name="limit" 
                className="form-select form-select-sm"
                value={filters.limit} 
                onChange={handleFilterChange}
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>

            <div className="col-md-3 d-flex align-items-end">
               <button type="submit" className="btn btn-primary btn-sm w-100">
                 <i className="bi bi-funnel me-1"></i> Apply Filters
               </button>
            </div>
          </div>
        </form>
      </div>
      
      {selectedTransactions.length > 0 && (
        <div className="alert alert-info d-flex justify-content-between align-items-center mb-3 p-2">
          <div className="d-flex align-items-center">
             <i className="bi bi-check-circle-fill me-2"></i>
             <span>{selectedTransactions.length} transaction(s) selected</span>
          </div>
          <div className="btn-group btn-group-sm">
            <button 
              className="btn btn-success" 
              onClick={handleBulkApprove}
              disabled={bulkLoading}
            >
              {bulkLoading ? '...' : 'Approve'}
            </button>
            <button 
              className="btn btn-danger" 
              onClick={handleBulkReject}
              disabled={bulkLoading}
            >
              {bulkLoading ? '...' : 'Reject'}
            </button>
            <button 
              className="btn btn-warning" 
              onClick={handleBulkChangeToAwaiting}
              disabled={bulkLoading}
            >
              {bulkLoading ? '...' : 'Wait'}
            </button>
          </div>
        </div>
      )}
      
      <div className="admin-card table-responsive">
        {transactions.length === 0 ? (
           <div className="text-center py-5 text-muted">
             <i className="bi bi-search fs-1 d-block mb-3"></i>
             <p>No transactions found matching the selected filters.</p>
           </div>
        ) : (
          <>
            <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom bg-light">
              <small className="text-muted">Showing {pagination.results} of {pagination.total} transactions</small>
            </div>
            
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{width: '40px'}}>
                    <input 
                      type="checkbox" 
                      className="form-check-input"
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
                        className="form-check-input"
                        checked={selectedTransactions.includes(transaction._id)}
                        onChange={() => handleSelectTransaction(transaction._id)}
                      />
                    </td>
                    <td><small className="text-muted font-monospace">{transaction._id ? transaction._id.substring(0, 8) + '...' : 'N/A'}</small></td>
                    <td>
                      <div className="fw-medium">{transaction.wallet?.user?.name || 'N/A'}</div>
                      <small className="text-muted">{transaction.wallet?.user?.email || 'N/A'}</small>
                    </td>
                    <td><span className="badge bg-light text-dark border">{transaction.type}</span></td>
                    <td>{transaction.operator || '-'}</td>
                    <td className="fw-bold text-dark">₹{transaction.amount}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td className="small">{new Date(transaction.createdAt).toLocaleString()}</td>
                    <td className="small text-muted">{transaction.reference || '-'}</td>
                    <td>
                      <div className="btn-group btn-group-sm">
                        {transaction.status === 'awaiting_approval' && (
                          <>
                            <button 
                              className="btn btn-outline-success"
                              onClick={() => handleSingleApprove(transaction._id)}
                              title="Approve"
                            >
                              <i className="bi bi-check-lg"></i>
                            </button>
                            <button 
                              className="btn btn-outline-danger"
                              onClick={() => handleSingleReject(transaction._id)}
                              title="Reject"
                            >
                              <i className="bi bi-x-lg"></i>
                            </button>
                          </>
                        )}
                        {transaction.status !== 'awaiting_approval' && (
                          <>
                            <button 
                              className="btn btn-outline-warning"
                              onClick={() => handleChangeToAwaiting(transaction._id)}
                              title="Change to Awaiting Approval"
                            >
                              <i className="bi bi-hourglass-split"></i>
                            </button>
                            {(transaction.status === 'approved' || transaction.status === 'rejected') && (
                              <>
                                <button 
                                  className="btn btn-outline-success"
                                  onClick={() => handleSingleApprove(transaction._id)}
                                  title="Approve"
                                >
                                  <i className="bi bi-check-lg"></i>
                                </button>
                                <button 
                                  className="btn btn-outline-danger"
                                  onClick={() => handleSingleReject(transaction._id)}
                                  title="Reject"
                                >
                                  <i className="bi bi-x-lg"></i>
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <nav aria-label="Page navigation" className="d-flex justify-content-center mt-4">
          <ul className="pagination">
            <li className={`page-item ${pagination.page === 1 ? 'disabled' : ''}`}>
              <button 
                className="page-link" 
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                Previous
              </button>
            </li>
            
            {[...Array(Math.min(5, pagination.pages))].map((_, idx) => {
              // Logic to show pages around current page
              let pageNum = pagination.page;
              if (pagination.pages <= 5) {
                pageNum = idx + 1;
              } else if (pagination.page <= 3) {
                pageNum = idx + 1;
              } else if (pagination.page >= pagination.pages - 2) {
                pageNum = pagination.pages - 4 + idx;
              } else {
                pageNum = pagination.page - 2 + idx;
              }
              
              return (
                <li key={pageNum} className={`page-item ${pagination.page === pageNum ? 'active' : ''}`}>
                  <button 
                    className="page-link" 
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </button>
                </li>
              );
            })}
            
            <li className={`page-item ${pagination.page === pagination.pages ? 'disabled' : ''}`}>
              <button 
                className="page-link" 
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
              >
                Next
              </button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
};

export default AllTransactions;
