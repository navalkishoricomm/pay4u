import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import axios from 'axios';
import TransactionStatusUpdates from '../components/TransactionStatusUpdates';
import '../styles/transactions.css';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const { error: showError } = useNotification();

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await axios.get('/wallet/my-transactions');
      setTransactions(response.data.data.transactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      showError('Failed to load transaction history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'completed':
        return 'status-completed';
      case 'pending':
        return 'status-pending';
      case 'awaiting_approval':
        return 'status-awaiting';
      case 'approved':
        return 'status-approved';
      case 'rejected':
        return 'status-rejected';
      case 'failed':
        return 'status-failed';
      default:
        return '';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'topup':
        return '💰';
      case 'mobile-recharge':
        return '📱';
      case 'dth-recharge':
        return '📺';
      case 'bill-payment':
        return '📄';
      case 'voucher_purchase':
      return '🎫';
      default:
        return '💸';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (filter === 'all') return true;
    return transaction.type === filter;
  });

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      {/* Mobile-friendly header */}
      <div className="welcome-header">
        <h1><i className="fas fa-history"></i> Transaction History</h1>
        <p className="welcome-subtitle">Track all your transactions</p>
      </div>
      
      {/* Mobile-optimized filter controls */}
      <div className="card" style={{marginBottom: '1.5rem'}}>
        <div style={{display: 'flex', alignItems: 'center', marginBottom: '1rem'}}>
          <i className="fas fa-filter" style={{fontSize: '1.25rem', color: 'var(--primary-color)', marginRight: '0.75rem'}}></i>
          <h3 style={{margin: 0, fontSize: '1.125rem', fontWeight: '600'}}>Filter Transactions</h3>
        </div>
        
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem'}}>          
          <button 
            className={`btn touch-target ${filter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setFilter('all')}
            style={{padding: '0.75rem 0.5rem', fontSize: '0.875rem', fontWeight: '600'}}
          >
            <i className="fas fa-list" style={{marginRight: '0.5rem'}}></i>
            All
          </button>
          <button 
            className={`btn touch-target ${filter === 'topup' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setFilter('topup')}
            style={{padding: '0.75rem 0.5rem', fontSize: '0.875rem', fontWeight: '600'}}
          >
            <i className="fas fa-plus" style={{marginRight: '0.5rem'}}></i>
            Top-up
          </button>
          <button 
            className={`btn touch-target ${filter === 'mobile-recharge' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setFilter('mobile-recharge')}
            style={{padding: '0.75rem 0.5rem', fontSize: '0.875rem', fontWeight: '600'}}
          >
            <i className="fas fa-mobile-alt" style={{marginRight: '0.5rem'}}></i>
            Mobile
          </button>
          <button 
            className={`btn touch-target ${filter === 'dth-recharge' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setFilter('dth-recharge')}
            style={{padding: '0.75rem 0.5rem', fontSize: '0.875rem', fontWeight: '600'}}
          >
            <i className="fas fa-tv" style={{marginRight: '0.5rem'}}></i>
            DTH
          </button>
          <button 
            className={`btn touch-target ${filter === 'bill-payment' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setFilter('bill-payment')}
            style={{padding: '0.75rem 0.5rem', fontSize: '0.875rem', fontWeight: '600'}}
          >
            <i className="fas fa-file-invoice-dollar" style={{marginRight: '0.5rem'}}></i>
            Bill Payment
          </button>
          <button 
            className={`btn touch-target ${filter === 'voucher_purchase' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setFilter('voucher_purchase')}
            style={{padding: '0.75rem 0.5rem', fontSize: '0.875rem', fontWeight: '600'}}
          >
            <i className="fas fa-gift" style={{marginRight: '0.5rem'}}></i>
            Vouchers
          </button>
        </div>
      </div>
      
      {filteredTransactions.length === 0 ? (
        <div className="card" style={{textAlign: 'center', padding: '3rem 1rem'}}>
          <i className="fas fa-receipt" style={{fontSize: '3rem', color: 'var(--gray-color)', marginBottom: '1rem'}}></i>
          <h3 style={{color: 'var(--text-secondary)', marginBottom: '1rem'}}>No transactions found</h3>
          {filter !== 'all' && (
            <button 
              className="btn btn-primary touch-target"
              onClick={() => setFilter('all')}
              style={{padding: '0.75rem 1.5rem'}}
            >
              <i className="fas fa-list btn-icon"></i>
              Show All Transactions
            </button>
          )}
        </div>
      ) : (
        <div className="transaction-list">
          {filteredTransactions.map((transaction) => (
            <div key={transaction._id} className="transaction-item card" style={{marginBottom: '1rem', padding: '1rem'}}>
              <div style={{display: 'flex', alignItems: 'flex-start', gap: '1rem'}}>
                {/* Transaction Icon */}
                <div style={{flexShrink: 0}}>
                  <div className={`dashboard-icon ${transaction.type.replace('-', '-')}`} style={{width: '2.5rem', height: '2.5rem', fontSize: '1.25rem'}}>
                    {getTypeIcon(transaction.type)}
                  </div>
                </div>
                
                {/* Transaction Details */}
                <div style={{flex: 1, minWidth: 0}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem'}}>
                    <div>
                      <h4 style={{margin: 0, fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)'}}>
                        {transaction.type === 'topup' ? 'Wallet Top-up' :
                         transaction.type === 'mobile-recharge' ? 'Mobile Recharge' :
                         transaction.type === 'dth-recharge' ? 'DTH Recharge' :
                         transaction.type === 'bill-payment' ? 'Bill Payment' :
                         transaction.type === 'voucher_purchase' ? 'Brand Voucher Purchase' :
                         'Transaction'}
                      </h4>
                      <p style={{margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)'}}>
                        ID: {transaction.transactionId || (transaction._id ? transaction._id.substring(0, 8) + '...' : 'N/A')}
                      </p>
                    </div>
                    <div style={{textAlign: 'right'}}>
                      <div className={`transaction-amount ${transaction.type === 'topup' ? 'credit' : 'debit'}`} style={{fontSize: '1rem', fontWeight: '700'}}>
                        {transaction.type === 'topup' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                      </div>
                      <span className={`status-badge ${getStatusClass(transaction.status)}`} style={{fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '12px', marginTop: '0.25rem', display: 'inline-block'}}>
                        {transaction.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  
                  {/* Description */}
                  {transaction.description && (
                    <p style={{margin: '0.5rem 0', fontSize: '0.875rem', color: 'var(--text-primary)'}}>
                      {transaction.description}
                    </p>
                  )}
                  
                  {/* Date and additional info */}
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)'}}>
                    <span style={{fontSize: '0.75rem', color: 'var(--text-secondary)'}}>
                      <i className="fas fa-calendar-alt" style={{marginRight: '0.25rem'}}></i>
                      {formatDate(transaction.createdAt)}
                    </span>
                    
                    {/* Show additional details on mobile */}
                    {(transaction.approvalNotes || transaction.failureReason) && (
                      <button 
                        className="btn btn-outline-secondary"
                        style={{fontSize: '0.75rem', padding: '0.25rem 0.5rem'}}
                        onClick={() => {
                          const details = [];
                          if (transaction.approvalNotes) details.push(`Admin: ${transaction.approvalNotes}`);
                          if (transaction.failureReason) details.push(`Failure: ${transaction.failureReason}`);
                          alert(details.join('\n'));
                        }}
                      >
                        <i className="fas fa-info-circle"></i>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <TransactionStatusUpdates />
      
      <div style={{marginTop: '2rem', textAlign: 'center'}}>
        <Link to="/dashboard" className="btn btn-secondary touch-target" style={{padding: '0.75rem 2rem'}}>
          <i className="fas fa-arrow-left btn-icon"></i>
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default Transactions;