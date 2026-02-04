import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import axios from 'axios';
import './Admin.css';

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
        const response = await axios.get('/admin/transactions/pending');
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
      
      await axios.patch(`/admin/transactions/${selectedTransaction._id}`, requestData);
      
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
      
      await axios.patch(`/admin/transactions/${selectedTransaction._id}`, requestData);
      
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
        <h1>Pending Transactions</h1>
        <button 
          className="btn btn-outline-secondary" 
          onClick={() => navigate('/admin/dashboard')}
        >
          <i className="bi bi-arrow-left me-2"></i>
          Back to Dashboard
        </button>
      </div>
      
      <div className="admin-card table-responsive">
        {transactions.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-check2-all fs-1 d-block mb-3"></i>
            <p>No pending transactions found.</p>
          </div>
        ) : (
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>ID</th>
                <th>User</th>
                <th>Amount</th>
                <th>Type</th>
                <th>Payment Method</th>
                <th>Reference</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(transaction => (
                <tr key={transaction._id}>
                  <td><small className="text-muted font-monospace">{transaction._id ? transaction._id.substring(0, 8) : 'N/A'}</small></td>
                  <td>
                    <div className="fw-medium">{transaction.wallet?.user?.name || 'N/A'}</div>
                    <small className="text-muted">{transaction.wallet?.user?.email || 'N/A'}</small>
                    <div className="small text-muted">{transaction.wallet?.user?.phone || 'N/A'}</div>
                  </td>
                  <td className="fw-bold text-dark">₹{transaction.amount}</td>
                  <td><span className="badge bg-light text-dark border">{transaction.type}</span></td>
                  <td>
                    <div className="small">
                      {transaction.metadata?.paymentMethod || 'N/A'}
                      {transaction.metadata?.cardLast4 && ` (**** ${transaction.metadata.cardLast4})`}
                    </div>
                    {transaction.metadata?.bankReference && <div className="small text-muted">Ref: {transaction.metadata.bankReference}</div>}
                  </td>
                  <td className="small text-muted">{transaction.reference}</td>
                  <td className="small">{new Date(transaction.createdAt).toLocaleString()}</td>
                  <td>
                    <div className="btn-group btn-group-sm">
                      <button 
                        className="btn btn-success" 
                        onClick={() => openApprovalModal(transaction)}
                        disabled={processingId === transaction._id}
                        title="Approve"
                      >
                        {processingId === transaction._id ? '...' : <i className="bi bi-check-lg"></i>}
                      </button>
                      <button 
                        className="btn btn-danger" 
                        onClick={() => openRejectionModal(transaction)}
                        disabled={processingId === transaction._id}
                        title="Reject"
                      >
                        {processingId === transaction._id ? '...' : <i className="bi bi-x-lg"></i>}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Approve Transaction</h5>
                <button type="button" className="btn-close" onClick={closeModals}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="transactionId" className="form-label">Transaction ID (Optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    id="transactionId"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="Enter transaction ID from payment gateway"
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="approvalNotes" className="form-label">Notes (Optional)</label>
                  <textarea
                    className="form-control"
                    id="approvalNotes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any notes about this approval"
                    rows="3"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModals}>Cancel</button>
                <button 
                  type="button" 
                  className="btn btn-success" 
                  onClick={handleApproval}
                  disabled={processingId === selectedTransaction?._id}
                >
                  {processingId === selectedTransaction?._id ? 'Processing...' : 'Approve Transaction'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Rejection Modal */}
      {showRejectionModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Reject Transaction</h5>
                <button type="button" className="btn-close" onClick={closeModals}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="failureReason" className="form-label">Failure Reason <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    id="failureReason"
                    value={failureReason}
                    onChange={(e) => setFailureReason(e.target.value)}
                    placeholder="Enter reason for rejection"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="rejectionNotes" className="form-label">Additional Notes (Optional)</label>
                  <textarea
                    className="form-control"
                    id="rejectionNotes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any additional notes"
                    rows="3"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModals}>Cancel</button>
                <button 
                  type="button" 
                  className="btn btn-danger" 
                  onClick={handleRejection}
                  disabled={processingId === selectedTransaction?._id || !failureReason.trim()}
                >
                  {processingId === selectedTransaction?._id ? 'Processing...' : 'Reject Transaction'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingTransactions;
