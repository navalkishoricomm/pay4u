import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import './TransactionHistory.css';

const TransactionHistory = ({ remitterData }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, [pagination.page, filter, dateRange]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const queryParams = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(filter !== 'all' && { status: filter }),
        ...(dateRange.startDate && { startDate: dateRange.startDate }),
        ...(dateRange.endDate && { endDate: dateRange.endDate })
      });

      const response = await fetch(`/api/dmt/transactions?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTransactions(data.data.transactions || []);
        setPagination(prev => ({
          ...prev,
          total: data.pagination?.total || 0,
          pages: data.pagination?.pages || 0
        }));
      } else {
        toast.error('Failed to fetch transactions');
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTransactions();
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleDateRangeChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const checkTransactionStatus = async (transactionId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/dmt/transaction/${transactionId}/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Transaction status updated');
        fetchTransactions(); // Refresh the list
      } else {
        toast.error('Failed to check transaction status');
      }
    } catch (error) {
      console.error('Error checking transaction status:', error);
      toast.error('Network error. Please try again.');
    }
  };

  const viewReceipt = async (transactionId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/dmt/transaction/${transactionId}/receipt`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const receiptData = await response.json();
        const receipt = receiptData.data.receipt;
        
        // Open receipt in a new window or modal
        const receiptWindow = window.open('', '_blank', 'width=800,height=600');
        receiptWindow.document.write(`
          <html>
            <head>
              <title>Transaction Receipt - ${receipt.transactionId}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .receipt-header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
                .receipt-section { margin: 20px 0; }
                .receipt-row { display: flex; justify-content: space-between; margin: 5px 0; }
                .receipt-label { font-weight: bold; }
                .receipt-value { text-align: right; }
                .total-amount { font-size: 1.2em; color: #28a745; font-weight: bold; }
                .status-success { color: #28a745; font-weight: bold; }
                .status-pending { color: #ffc107; font-weight: bold; }
                .status-failed { color: #dc3545; font-weight: bold; }
              </style>
            </head>
            <body>
              <div class="receipt-header">
                <h2>Transaction Receipt</h2>
                <p>Transaction ID: ${receipt.transactionId}</p>
                ${receipt.referenceId ? `<p>Reference ID: ${receipt.referenceId}</p>` : ''}
              </div>
              
              <div class="receipt-section">
                <h3>Transaction Details</h3>
                <div class="receipt-row">
                  <span class="receipt-label">Status:</span>
                  <span class="receipt-value status-${receipt.status.toLowerCase()}">${receipt.status}</span>
                </div>
                <div class="receipt-row">
                  <span class="receipt-label">Amount:</span>
                  <span class="receipt-value">₹${receipt.amount?.toLocaleString()}</span>
                </div>
                <div class="receipt-row">
                  <span class="receipt-label">Charges:</span>
                  <span class="receipt-value">₹${receipt.charges?.toLocaleString()}</span>
                </div>
                <div class="receipt-row">
                  <span class="receipt-label">Total Amount:</span>
                  <span class="receipt-value total-amount">₹${receipt.totalAmount?.toLocaleString()}</span>
                </div>
                <div class="receipt-row">
                  <span class="receipt-label">Transfer Mode:</span>
                  <span class="receipt-value">${receipt.transferMode}</span>
                </div>
              </div>
              
              <div class="receipt-section">
                <h3>Beneficiary Details</h3>
                <div class="receipt-row">
                  <span class="receipt-label">Name:</span>
                  <span class="receipt-value">${receipt.beneficiary?.name}</span>
                </div>
                <div class="receipt-row">
                  <span class="receipt-label">Account Number:</span>
                  <span class="receipt-value">${receipt.beneficiary?.accountNumber}</span>
                </div>
                <div class="receipt-row">
                  <span class="receipt-label">Bank:</span>
                  <span class="receipt-value">${receipt.beneficiary?.bankName}</span>
                </div>
                <div class="receipt-row">
                  <span class="receipt-label">IFSC:</span>
                  <span class="receipt-value">${receipt.beneficiary?.ifscCode}</span>
                </div>
              </div>
              
              <div class="receipt-section">
                <h3>Sender Details</h3>
                <div class="receipt-row">
                  <span class="receipt-label">Name:</span>
                  <span class="receipt-value">${receipt.sender?.name}</span>
                </div>
                <div class="receipt-row">
                  <span class="receipt-label">Mobile:</span>
                  <span class="receipt-value">${receipt.sender?.mobile}</span>
                </div>
              </div>
              
              <div class="receipt-section">
                <h3>Timestamps</h3>
                <div class="receipt-row">
                  <span class="receipt-label">Initiated:</span>
                  <span class="receipt-value">${new Date(receipt.initiatedAt).toLocaleString()}</span>
                </div>
                <div class="receipt-row">
                  <span class="receipt-label">Completed:</span>
                  <span class="receipt-value">${new Date(receipt.completedAt).toLocaleString()}</span>
                </div>
                ${receipt.paysprintTransactionId ? `
                <div class="receipt-row">
                  <span class="receipt-label">API Transaction ID:</span>
                  <span class="receipt-value">${receipt.paysprintTransactionId}</span>
                </div>` : ''}
              </div>
              
              <div style="text-align: center; margin-top: 30px;">
                <button onclick="window.print()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">Print Receipt</button>
              </div>
            </body>
          </html>
        `);
        receiptWindow.document.close();
      } else {
        toast.error('Failed to fetch receipt details');
      }
    } catch (error) {
      console.error('Error fetching receipt:', error);
      toast.error('Network error. Please try again.');
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

  const filteredTransactions = transactions;

  if (loading && !refreshing) {
    return (
      <div className="transaction-history">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading transaction history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="transaction-history">
      <div className="history-header">
        <h2>Transaction History</h2>
        <button 
          className="btn-refresh"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="filters-section">
        <div className="filter-group">
          <label>Status Filter:</label>
          <select 
            value={filter} 
            onChange={(e) => handleFilterChange(e.target.value)}
          >
            <option value="all">All Transactions</option>
            <option value="SUCCESS">Successful</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>

        <div className="date-filters">
          <div className="filter-group">
            <label>From Date:</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <label>To Date:</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
            />
          </div>
        </div>
      </div>

      {filteredTransactions.length === 0 ? (
        <div className="no-transactions">
          <h3>No Transactions Found</h3>
          <p>You haven't made any money transfers yet or no transactions match your filters.</p>
        </div>
      ) : (
        <>
          <div className="transactions-list">
            {filteredTransactions.map((transaction) => (
              <div key={transaction._id} className="transaction-card">
                <div className="transaction-header">
                  <div className="transaction-id">
                    <strong>ID:</strong> {transaction.transactionId}
                  </div>
                  <div className={`status-badge ${getStatusBadgeClass(transaction.status)}`}>
                    {transaction.status}
                  </div>
                </div>

                <div className="transaction-details">
                  <div className="detail-section">
                    <div className="detail-grid">
                      <div className="detail-row full-width">
                        <span>Beneficiary:</span>
                        <span>{transaction.beneficiary?.accountHolderName || 'N/A'}</span>
                      </div>
                      <div className="detail-row">
                        <span>Account:</span>
                        <span>{transaction.beneficiary?.accountNumber || 'N/A'}</span>
                      </div>
                      <div className="detail-row">
                        <span>Bank:</span>
                        <span>{transaction.beneficiary?.bankName || 'N/A'}</span>
                      </div>
                      <div className="detail-row half-width">
                        <span>Amount:</span>
                        <span className="amount">₹{transaction.amount?.toLocaleString()}</span>
                      </div>
                      <div className="detail-row half-width">
                        <span>Charges:</span>
                        <span>₹{transaction.charges?.toLocaleString()}</span>
                      </div>
                      <div className="detail-row half-width">
                        <span>Total:</span>
                        <span className="total-amount">₹{transaction.totalAmount?.toLocaleString()}</span>
                      </div>
                      <div className="detail-row half-width">
                        <span>Mode:</span>
                        <span>{transaction.transferMode}</span>
                      </div>
                      <div className="detail-row">
                        <span>Purpose:</span>
                        <span>{transaction.purpose || 'N/A'}</span>
                      </div>
                      <div className="detail-row">
                        <span>Created:</span>
                        <span>{formatDate(transaction.createdAt)}</span>
                      </div>
                      {transaction.bankReferenceNumber && (
                        <div className="detail-row full-width">
                          <span>Bank Ref:</span>
                          <span>{transaction.bankReferenceNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="transaction-actions">
                  {(transaction.status === 'PENDING' || transaction.status === 'PROCESSING') && (
                    <button 
                      className="btn-check-status"
                      onClick={() => checkTransactionStatus(transaction.transactionId)}
                    >
                      Check Status
                    </button>
                  )}
                  <button 
                    className="btn-view-receipt"
                    onClick={() => viewReceipt(transaction.transactionId)}
                  >
                    View Receipt
                  </button>
                </div>
              </div>
            ))}
          </div>

          {pagination.pages > 1 && (
            <div className="pagination">
              <button 
                className="btn-page"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                Previous
              </button>
              
              <span className="page-info">
                Page {pagination.page} of {pagination.pages} ({pagination.total} total)
              </span>
              
              <button 
                className="btn-page"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TransactionHistory;