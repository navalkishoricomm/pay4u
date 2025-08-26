import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import axios from 'axios';
import './PendingTransactions.css';

const PendingTransactions = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { success, error: notifyError } = useNotification();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [transactionId, setTransactionId] = useState('');
  const [failureReason, setFailureReason] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    // Check if user is admin
    if (currentUser?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }

    const fetchPendingTransactions = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/admin/transactions/pending');
        setTransactions(response.data.data.transactions);
        setLoading(false);
      } catch (err) {
        setError('Failed to load pending transactions');
        notifyError('Failed to load pending transactions');
        setLoading(false);
        console.error('Error fetching pending transactions:', err);
      }
    };

    fetchPendingTransactions();
  }, [currentUser, navigate]);

  const openApprovalModal = (transaction) => {
    setSelectedTransaction(transaction);
    setTransactionId('');
    setNotes('');
    setShowApprovalModal(true);
  };

  const openRejectionModal = (transaction) => {
    setSelectedTransaction(transaction);
    setFailureReason('');
    setNotes('');
    setShowRejectionModal(true);
  };

  const closeModals = () => {
    setShowApprovalModal(false);
    setShowRejectionModal(false);
    setSelectedTransaction(null);
    setTransactionId('');
    setFailureReason('');
    setNotes('');
  };

  const handleApproval = async () => {
    if (!selectedTransaction) return;
    
    try {
      setProcessingId(selectedTransaction._id);
      
      const requestData = {
        status: 'approved',
        notes,
        ...(transactionId && { transactionId })
      };
      
      await axios.patch(`/api/admin/transactions/${selectedTransaction._id}`, requestData);
      
      // Update the local state to remove the approved transaction
      setTransactions(transactions.filter(t => t._id !== selectedTransaction._id));
      
      success('Transaction approved successfully');
      closeModals();
      setProcessingId(null);
    } catch (err) {
      notifyError('Failed to approve transaction');
      setProcessingId(null);
      console.error('Error approving transaction:', err);
    }
  };

  const handleRejection = async () => {
    if (!selectedTransaction) return;
    
    try {
      setProcessingId(selectedTransaction._id);
      
      const requestData = {
        status: 'rejected',
        notes,
        ...(failureReason && { failureReason })
      };
      
      await axios.patch(`/api/admin/transactions/${selectedTransaction._id}`, requestData);
      
      // Update the local state to remove the rejected transaction
      setTransactions(transactions.filter(t => t._id !== selectedTransaction._id));
      
      success('Transaction rejected successfully');
      closeModals();
      setProcessingId(null);
    } catch (err) {
      notifyError('Failed to reject transaction');
      setProcessingId(null);
      console.error('Error rejecting transaction:', err);
    }
  };

  if (loading) {
    return <div className="loading">Loading pending transactions...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="pending-transactions">
      <div className="page-header">
        <h1>Pending Transactions</h1>
        <button 
          className="btn btn-secondary" 
          onClick={() => navigate('/admin/dashboard')}
        >
          Back to Dashboard
        </button>
      </div>
      
      {transactions.length === 0 ? (
        <div className="no-transactions">
          <p>No pending transactions found.</p>
        </div>
      ) : (
        <div className="transactions-list">
          {transactions.map(transaction => (
            <div key={transaction._id} className="transaction-card">
              <div className="transaction-header">
                <h3>Transaction #{transaction._id.substring(0, 8)}</h3>
                <span className="transaction-date">
                  {new Date(transaction.createdAt).toLocaleString()}
                </span>
              </div>
              
              <div className="transaction-details">
                <div className="detail-row">
                  <span className="detail-label">User:</span>
                  <span className="detail-value">{transaction.wallet?.user?.name || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">{transaction.wallet?.user?.email || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Phone:</span>
                  <span className="detail-value">{transaction.wallet?.user?.phone || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Amount:</span>
                  <span className="detail-value amount">₹{transaction.amount}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Type:</span>
                  <span className="detail-value">{transaction.type}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Description:</span>
                  <span className="detail-value">{transaction.description}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Payment Method:</span>
                  <span className="detail-value">
                    {transaction.metadata.paymentMethod}
                    {transaction.metadata.cardLast4 && ` (**** **** **** ${transaction.metadata.cardLast4})`}
                    {transaction.metadata.bankReference && ` (Ref: ${transaction.metadata.bankReference})`}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Reference:</span>
                  <span className="detail-value">{transaction.reference}</span>
                </div>
              </div>
              
              <div className="transaction-actions">
                <button 
                  className="btn btn-success" 
                  onClick={() => openApprovalModal(transaction)}
                  disabled={processingId === transaction._id}
                >
                  {processingId === transaction._id ? 'Processing...' : 'Approve'}
                </button>
                <button 
                  className="btn btn-danger" 
                  onClick={() => openRejectionModal(transaction)}
                  disabled={processingId === transaction._id}
                >
                  {processingId === transaction._id ? 'Processing...' : 'Reject'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Approve Transaction</h3>
              <button className="close-btn" onClick={closeModals}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="transactionId">Transaction ID (Optional)</label>
                <input
                  type="text"
                  id="transactionId"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="Enter transaction ID from payment gateway"
                />
              </div>
              <div className="form-group">
                <label htmlFor="approvalNotes">Notes (Optional)</label>
                <textarea
                  id="approvalNotes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about this approval"
                  rows="3"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModals}>Cancel</button>
              <button 
                className="btn btn-success" 
                onClick={handleApproval}
                disabled={processingId === selectedTransaction?._id}
              >
                {processingId === selectedTransaction?._id ? 'Processing...' : 'Approve Transaction'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Rejection Modal */}
      {showRejectionModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Reject Transaction</h3>
              <button className="close-btn" onClick={closeModals}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="failureReason">Failure Reason</label>
                <input
                  type="text"
                  id="failureReason"
                  value={failureReason}
                  onChange={(e) => setFailureReason(e.target.value)}
                  placeholder="Enter reason for rejection"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="rejectionNotes">Additional Notes (Optional)</label>
                <textarea
                  id="rejectionNotes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any additional notes"
                  rows="3"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModals}>Cancel</button>
              <button 
                className="btn btn-danger" 
                onClick={handleRejection}
                disabled={processingId === selectedTransaction?._id || !failureReason.trim()}
              >
                {processingId === selectedTransaction?._id ? 'Processing...' : 'Reject Transaction'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingTransactions;