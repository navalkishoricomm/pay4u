import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import './DMTTransactions.css';

const DMTTransactions = () => {
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
    status: '',
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: '',
    userId: '',
    userName: '',
    userEmail: '',
    remitterMobile: '',
    beneficiaryName: '',
    transferMode: '',
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  const [stats, setStats] = useState({
    totalTransactions: 0,
    successfulTransactions: 0,
    pendingTransactions: 0,
    failedTransactions: 0,
    totalAmount: 0,
    totalCharges: 0
  });

  useEffect(() => {
    // Check if user is admin
    if (currentUser?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }

    fetchTransactions();
    fetchStats();
  }, [currentUser, navigate]);

  useEffect(() => {
    fetchTransactions();
  }, [filters.page, filters.limit, filters.sortBy, filters.sortOrder]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const queryParams = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key] && filters[key] !== '') {
          queryParams.append(key, filters[key]);
        }
      });

      const response = await axios.get(`/admin/dmt/transactions?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setTransactions(response.data.data.transactions || []);
        setPagination({
          page: response.data.pagination?.page || 1,
          pages: response.data.pagination?.pages || 1,
          total: response.data.pagination?.total || 0,
          results: response.data.pagination?.results || 0
        });
      }
    } catch (error) {
      console.error('Error fetching DMT transactions:', error);
      setError('Failed to fetch DMT transactions');
      toast.error('Failed to fetch DMT transactions');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/admin/dmt/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching DMT stats:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filtering
    }));
  };

  const handleApplyFilters = () => {
    fetchTransactions();
  };

  const handleClearFilters = () => {
    setFilters({
      status: '',
      startDate: '',
      endDate: '',
      minAmount: '',
      maxAmount: '',
      userId: '',
      userName: '',
      userEmail: '',
      remitterMobile: '',
      beneficiaryName: '',
      transferMode: '',
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleSort = (field) => {
    const newOrder = filters.sortBy === field && filters.sortOrder === 'desc' ? 'asc' : 'desc';
    setFilters(prev => ({
      ...prev,
      sortBy: field,
      sortOrder: newOrder
    }));
  };

  const handleTransactionSelect = (transactionId) => {
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

  const checkTransactionStatus = async (transactionId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`/admin/dmt/transaction/${transactionId}/check-status`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        toast.success('Transaction status updated');
        fetchTransactions();
        fetchStats();
      } else {
        toast.error(response.data.message || 'Failed to check transaction status');
      }
    } catch (error) {
      console.error('Error checking transaction status:', error);
      toast.error('Failed to check transaction status');
    }
  };

  const bulkCheckStatus = async () => {
    if (selectedTransactions.length === 0) {
      toast.warning('Please select transactions to check status');
      return;
    }

    try {
      setBulkLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.post('/admin/dmt/transactions/bulk-check-status', {
        transactionIds: selectedTransactions
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        toast.success(`Status checked for ${selectedTransactions.length} transactions`);
        setSelectedTransactions([]);
        fetchTransactions();
        fetchStats();
      } else {
        toast.error(response.data.message || 'Failed to check transaction statuses');
      }
    } catch (error) {
      console.error('Error in bulk status check:', error);
      toast.error('Failed to check transaction statuses');
    } finally {
      setBulkLoading(false);
    }
  };

  const exportTransactions = async () => {
    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key] && filters[key] !== '' && key !== 'page' && key !== 'limit') {
          queryParams.append(key, filters[key]);
        }
      });

      const response = await axios.get(`/admin/dmt/transactions/export?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `dmt-transactions-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Transactions exported successfully');
    } catch (error) {
      console.error('Error exporting transactions:', error);
      toast.error('Failed to export transactions');
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'success':
      case 'completed':
        return 'status-success';
      case 'failed':
      case 'failure':
        return 'status-failed';
      case 'pending':
      case 'processing':
      case 'initiated':
        return 'status-pending';
      default:
        return 'status-unknown';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="dmt-transactions-admin">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading DMT transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dmt-transactions-admin">
      <div className="page-header">
        <h1>DMT Transactions Management</h1>
        <div className="header-actions">
          <button className="btn-export" onClick={exportTransactions}>
            Export CSV
          </button>
          {selectedTransactions.length > 0 && (
            <button 
              className="btn-bulk-action"
              onClick={bulkCheckStatus}
              disabled={bulkLoading}
            >
              {bulkLoading ? 'Checking...' : `Check Status (${selectedTransactions.length})`}
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Transactions</h3>
          <p className="stat-number">{stats.totalTransactions}</p>
        </div>
        <div className="stat-card">
          <h3>Successful</h3>
          <p className="stat-number success">{stats.successfulTransactions}</p>
        </div>
        <div className="stat-card">
          <h3>Pending</h3>
          <p className="stat-number pending">{stats.pendingTransactions}</p>
        </div>
        <div className="stat-card">
          <h3>Failed</h3>
          <p className="stat-number failed">{stats.failedTransactions}</p>
        </div>
        <div className="stat-card">
          <h3>Total Amount</h3>
          <p className="stat-number">{formatCurrency(stats.totalAmount)}</p>
        </div>
        <div className="stat-card">
          <h3>Total Charges</h3>
          <p className="stat-number">{formatCurrency(stats.totalCharges)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filters-grid">
          <div className="filter-group">
            <label>Status</label>
            <select 
              value={filters.status} 
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="SUCCESS">Success</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
              <option value="PROCESSING">Processing</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Transfer Mode</label>
            <select 
              value={filters.transferMode} 
              onChange={(e) => handleFilterChange('transferMode', e.target.value)}
            >
              <option value="">All Modes</option>
              <option value="IMPS">IMPS</option>
              <option value="NEFT">NEFT</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Min Amount</label>
            <input
              type="number"
              placeholder="Min amount"
              value={filters.minAmount}
              onChange={(e) => handleFilterChange('minAmount', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Max Amount</label>
            <input
              type="number"
              placeholder="Max amount"
              value={filters.maxAmount}
              onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>User Email</label>
            <input
              type="text"
              placeholder="User email"
              value={filters.userEmail}
              onChange={(e) => handleFilterChange('userEmail', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Remitter Mobile</label>
            <input
              type="text"
              placeholder="Remitter mobile"
              value={filters.remitterMobile}
              onChange={(e) => handleFilterChange('remitterMobile', e.target.value)}
            />
          </div>
        </div>

        <div className="filter-actions">
          <button className="btn-apply" onClick={handleApplyFilters}>
            Apply Filters
          </button>
          <button className="btn-clear" onClick={handleClearFilters}>
            Clear Filters
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="transactions-section">
        <div className="table-header">
          <div className="table-controls">
            <label className="select-all">
              <input
                type="checkbox"
                checked={selectedTransactions.length === transactions.length && transactions.length > 0}
                onChange={handleSelectAll}
              />
              Select All ({transactions.length})
            </label>
          </div>
          <div className="pagination-info">
            Showing {((pagination.page - 1) * filters.limit) + 1} to {Math.min(pagination.page * filters.limit, pagination.total)} of {pagination.total} transactions
          </div>
        </div>

        {transactions.length === 0 ? (
          <div className="no-transactions">
            <h3>No DMT Transactions Found</h3>
            <p>No transactions match your current filters.</p>
          </div>
        ) : (
          <div className="transactions-table">
            <table>
              <thead>
                <tr>
                  <th>Select</th>
                  <th onClick={() => handleSort('transactionId')} className="sortable">
                    Transaction ID
                    {filters.sortBy === 'transactionId' && (
                      <span className={`sort-icon ${filters.sortOrder}`}></span>
                    )}
                  </th>
                  <th onClick={() => handleSort('createdAt')} className="sortable">
                    Date
                    {filters.sortBy === 'createdAt' && (
                      <span className={`sort-icon ${filters.sortOrder}`}></span>
                    )}
                  </th>
                  <th>User</th>
                  <th>Remitter</th>
                  <th>Beneficiary</th>
                  <th onClick={() => handleSort('amount')} className="sortable">
                    Amount
                    {filters.sortBy === 'amount' && (
                      <span className={`sort-icon ${filters.sortOrder}`}></span>
                    )}
                  </th>
                  <th>Charges</th>
                  <th>Mode</th>
                  <th onClick={() => handleSort('status')} className="sortable">
                    Status
                    {filters.sortBy === 'status' && (
                      <span className={`sort-icon ${filters.sortOrder}`}></span>
                    )}
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction._id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedTransactions.includes(transaction._id)}
                        onChange={() => handleTransactionSelect(transaction._id)}
                      />
                    </td>
                    <td className="transaction-id">{transaction.transactionId}</td>
                    <td>{formatDate(transaction.createdAt)}</td>
                    <td>
                      <div className="user-info">
                        <div>{transaction.user?.name || 'N/A'}</div>
                        <div className="user-email">{transaction.user?.email || 'N/A'}</div>
                      </div>
                    </td>
                    <td>
                      <div className="remitter-info">
                        <div>{transaction.remitter?.name || 'N/A'}</div>
                        <div className="remitter-mobile">{transaction.remitter?.mobile || 'N/A'}</div>
                      </div>
                    </td>
                    <td>
                      <div className="beneficiary-info">
                        <div>{transaction.beneficiary?.accountHolderName || 'N/A'}</div>
                        <div className="account-number">{transaction.beneficiary?.accountNumber || 'N/A'}</div>
                        <div className="bank-name">{transaction.beneficiary?.bankName || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="amount">{formatCurrency(transaction.amount)}</td>
                    <td className="charges">{formatCurrency(transaction.charges)}</td>
                    <td className="transfer-mode">{transaction.transferMode}</td>
                    <td>
                      <span className={`status-badge ${getStatusBadgeClass(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        {(transaction.status === 'PENDING' || transaction.status === 'PROCESSING') && (
                          <button 
                            className="btn-check-status"
                            onClick={() => checkTransactionStatus(transaction.transactionId)}
                            title="Check Status"
                          >
                            Check
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="pagination">
            <button 
              className="btn-page"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              Previous
            </button>
            
            <div className="page-numbers">
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                let pageNum;
                if (pagination.pages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.page <= 3) {
                  pageNum = i + 1;
                } else if (pagination.page >= pagination.pages - 2) {
                  pageNum = pagination.pages - 4 + i;
                } else {
                  pageNum = pagination.page - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    className={`btn-page ${pagination.page === pageNum ? 'active' : ''}`}
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button 
              className="btn-page"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DMTTransactions;