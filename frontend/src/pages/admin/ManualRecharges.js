import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import './Admin.css';

const ManualRecharges = () => {
  const { user } = useAuth();
  const [recharges, setRecharges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [showModal, setShowModal] = useState(false);
  const [selectedRecharge, setSelectedRecharge] = useState(null);
  const [actionType, setActionType] = useState('');
  const [actionNote, setActionNote] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchManualRecharges();
  }, [filter]);

  const fetchManualRecharges = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/admin/recharge/manual?status=${filter}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.status === 'success') {
        setRecharges(data.data);
      }
    } catch (error) {
      console.error('Error fetching manual recharges:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (recharge, action) => {
    setSelectedRecharge(recharge);
    setActionType(action);
    setShowModal(true);
  };

  const processAction = async () => {
    if (!selectedRecharge || !actionType) return;

    try {
      setProcessing(true);
      const response = await fetch(`/admin/recharge/manual/${selectedRecharge._id}/${actionType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          note: actionNote,
          processedBy: user._id
        })
      });

      const data = await response.json();
      if (data.status === 'success') {
        fetchManualRecharges();
        setShowModal(false);
        setActionNote('');
        setSelectedRecharge(null);
        setActionType('');
      }
    } catch (error) {
      console.error('Error processing action:', error);
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'danger';
      case 'processing': return 'info';
      case 'completed': return 'success';
      case 'failed': return 'danger';
      default: return 'secondary';
    }
  };

  const getServiceIcon = (serviceType) => {
    return serviceType === 'mobile' ? 'fa-mobile-alt' : 'fa-satellite-dish';
  };

  if (loading) {
    return <div className="loading">Loading manual recharges...</div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Manual Recharge Processing</h1>
        <div className="filter-controls">
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="pending">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
            <option value="failed">Failed</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>

      <div className="recharges-table">
        {recharges.length === 0 ? (
          <div className="no-data">
            <p>No {filter === 'all' ? '' : filter} manual recharges found.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>User</th>
                <th>Service</th>
                <th>Details</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recharges.map(recharge => (
                <tr key={recharge._id}>
                  <td>
                    <div className="transaction-info">
                      <strong>{recharge.transactionId}</strong>
                      {recharge.operatorTransactionId && (
                        <small>Op: {recharge.operatorTransactionId}</small>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="user-info">
                      <strong>{recharge.user?.name || 'Unknown'}</strong>
                      <small>{recharge.user?.mobile || 'N/A'}</small>
                    </div>
                  </td>
                  <td>
                    <div className="service-info">
                      <i className={`fas ${getServiceIcon(recharge.serviceType)}`}></i>
                      <span>{recharge.serviceType.toUpperCase()}</span>
                    </div>
                  </td>
                  <td>
                    <div className="recharge-details">
                      <strong>{recharge.number}</strong>
                      <small>{recharge.operator?.operatorName || recharge.operatorCode}</small>
                      {recharge.circle && <small>Circle: {recharge.circle}</small>}
                    </div>
                  </td>
                  <td>
                    <div className="amount-info">
                      <strong>{formatCurrency(recharge.amount)}</strong>
                      {recharge.commission > 0 && (
                        <small>Commission: {formatCurrency(recharge.commission)}</small>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`status ${getStatusColor(recharge.status)}`}>
                      {recharge.status.toUpperCase()}
                    </span>
                    {recharge.manualProcessing?.requiresApproval && (
                      <small className="approval-required">Approval Required</small>
                    )}
                  </td>
                  <td>
                    <div className="date-info">
                      <strong>{formatDate(recharge.createdAt)}</strong>
                      {recharge.processedAt && (
                        <small>Processed: {formatDate(recharge.processedAt)}</small>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {recharge.status === 'pending' && (
                        <>
                          <button 
                            className="btn btn-sm btn-primary"
                            onClick={() => handleAction(recharge, 'approve')}
                          >
                            Approve
                          </button>
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => handleAction(recharge, 'reject')}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {recharge.status === 'approved' && (
                        <button 
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleAction(recharge, 'process')}
                        >
                          Process
                        </button>
                      )}
                      {recharge.status === 'processing' && (
                        <>
                          <button 
                            className="btn btn-sm btn-primary"
                            onClick={() => handleAction(recharge, 'complete')}
                          >
                            Complete
                          </button>
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => handleAction(recharge, 'fail')}
                          >
                            Mark Failed
                          </button>
                        </>
                      )}
                      <button 
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleAction(recharge, 'view')}
                      >
                        View Details
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && selectedRecharge && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>
                {actionType === 'view' ? 'Recharge Details' : 
                 actionType === 'approve' ? 'Approve Recharge' :
                 actionType === 'reject' ? 'Reject Recharge' :
                 actionType === 'process' ? 'Process Recharge' :
                 actionType === 'complete' ? 'Complete Recharge' :
                 actionType === 'fail' ? 'Mark as Failed' : 'Action'}
              </h2>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowModal(false);
                  setActionNote('');
                  setSelectedRecharge(null);
                  setActionType('');
                }}
              >
                ×
              </button>
            </div>
            
            <div className="modal-content">
              <div className="recharge-summary">
                <div className="summary-row">
                  <span className="label">Transaction ID:</span>
                  <span className="value">{selectedRecharge.transactionId}</span>
                </div>
                <div className="summary-row">
                  <span className="label">User:</span>
                  <span className="value">{selectedRecharge.user?.name} ({selectedRecharge.user?.mobile})</span>
                </div>
                <div className="summary-row">
                  <span className="label">Service:</span>
                  <span className="value">{selectedRecharge.serviceType.toUpperCase()}</span>
                </div>
                <div className="summary-row">
                  <span className="label">Number:</span>
                  <span className="value">{selectedRecharge.number}</span>
                </div>
                <div className="summary-row">
                  <span className="label">Operator:</span>
                  <span className="value">{selectedRecharge.operator?.operatorName || selectedRecharge.operatorCode}</span>
                </div>
                <div className="summary-row">
                  <span className="label">Amount:</span>
                  <span className="value">{formatCurrency(selectedRecharge.amount)}</span>
                </div>
                <div className="summary-row">
                  <span className="label">Status:</span>
                  <span className={`value status ${getStatusColor(selectedRecharge.status)}`}>
                    {selectedRecharge.status.toUpperCase()}
                  </span>
                </div>
                {selectedRecharge.notes && (
                  <div className="summary-row">
                    <span className="label">Notes:</span>
                    <span className="value">{selectedRecharge.notes}</span>
                  </div>
                )}
              </div>

              {actionType !== 'view' && (
                <div className="action-form">
                  <div className="form-group">
                    <label>Action Note:</label>
                    <textarea
                      value={actionNote}
                      onChange={(e) => setActionNote(e.target.value)}
                      placeholder={`Add a note for this ${actionType} action...`}
                      rows="3"
                      required={actionType === 'reject'}
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="modal-actions">
              {actionType !== 'view' && (
                <button 
                  className={`btn btn-primary ${processing ? 'loading' : ''}`}
                  onClick={processAction}
                  disabled={processing || (actionType === 'reject' && !actionNote.trim())}
                >
                  {processing ? 'Processing...' : 
                   actionType === 'approve' ? 'Approve Recharge' :
                   actionType === 'reject' ? 'Reject Recharge' :
                   actionType === 'process' ? 'Start Processing' :
                   actionType === 'complete' ? 'Mark Complete' :
                   actionType === 'fail' ? 'Mark Failed' : 'Confirm'}
                </button>
              )}
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  setShowModal(false);
                  setActionNote('');
                  setSelectedRecharge(null);
                  setActionType('');
                }}
              >
                {actionType === 'view' ? 'Close' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManualRecharges;