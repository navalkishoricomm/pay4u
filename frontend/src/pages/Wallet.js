import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useNotification } from '../context/NotificationContext';
import { useLocation } from '../contexts/LocationContext';
import withLocationPermission from '../hoc/withLocationPermission';

const Wallet = ({ locationData, hasLocationPermission, isLocationAvailable }) => {
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [topupAmount, setTopupAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const [selectedAmount, setSelectedAmount] = useState('');
  const { success, info, error: showError } = useNotification();
  const { getLocationForAPI } = useLocation();

  // Quick amount options
  const quickAmounts = [100, 200, 500, 1000, 2000, 5000];

  useEffect(() => {
    fetchWalletData();
    fetchPendingTransactions();
  }, []);

  const fetchWalletData = async () => {
    try {
      const response = await axios.get('/wallet/my-wallet');
      setWalletData(response.data.data.wallet);
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      showError('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingTransactions = async () => {
    try {
      const response = await axios.get('/transactions', {
        params: { status: 'awaiting_approval', type: 'topup' }
      });
      setPendingTransactions(response.data.data.transactions || []);
    } catch (err) {
      console.error('Error fetching pending transactions:', err);
    }
  };

  const handleTopup = async (e) => {
    e.preventDefault();
    
    if (!topupAmount || isNaN(topupAmount) || parseFloat(topupAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // In a real app, this would integrate with a payment gateway
      // For now, we'll just call our API endpoint directly
      const requestData = {
        amount: parseFloat(topupAmount),
        paymentMethod: 'card', // Placeholder
      };
      
      // Add location data if available
      const locationInfo = getLocationForAPI();
      if (locationInfo) {
        requestData.location = locationInfo;
      }
      
      const response = await axios.post('/wallet/topup', requestData);
      
      // Update pending transactions
      fetchPendingTransactions();
      
      // Show notification
      info(`Your request to add ₹${topupAmount} has been submitted for approval`);
      setTopupAmount('');
    } catch (error) {
      console.error('Error topping up wallet:', error);
      showError('Failed to top up wallet');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      {/* Mobile-friendly header */}
      <div className="welcome-header">
        <h1><i className="fas fa-wallet"></i> My Wallet</h1>
        <p className="welcome-subtitle">Manage your digital wallet</p>
      </div>
      
      {/* Enhanced wallet card */}
      <div className="wallet-summary">
        <div className="wallet-card">
          <div className="wallet-header">
            <i className="fas fa-wallet wallet-icon"></i>
            <div className="wallet-info">
              <h2>Available Balance</h2>
            </div>
          </div>
          <div className="wallet-balance">
            ₹{walletData?.balance.toFixed(2) || '0.00'}
          </div>
          <p style={{color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.875rem', margin: '0.5rem 0 0 0'}}>
            Last updated: {new Date(walletData?.updatedAt).toLocaleString()}
          </p>
          
          {pendingTransactions.length > 0 && (
            <div className="pending-transactions" style={{marginTop: '1.5rem', padding: '1rem', background: 'rgba(255, 255, 255, 0.1)', borderRadius: 'var(--border-radius)'}}>
              <h3 style={{color: 'rgba(255, 255, 255, 0.9)', fontSize: '1rem', marginBottom: '1rem'}}>Pending Approvals</h3>
              {pendingTransactions.map(transaction => (
                <div key={transaction._id} className="pending-transaction" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid rgba(255, 255, 255, 0.1)'}}>
                  <span style={{color: 'white', fontWeight: '600'}}>₹{transaction.amount.toFixed(2)}</span>
                  <span className="status-badge awaiting" style={{background: '#ffc107', color: '#000', padding: '0.25rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem'}}>Awaiting Approval</span>
                  <span style={{color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.75rem'}}>{new Date(transaction.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Mobile-optimized add money section */}
      <div className="card">
        <div style={{display: 'flex', alignItems: 'center', marginBottom: '1.5rem'}}>
          <i className="fas fa-plus-circle" style={{fontSize: '1.5rem', color: 'var(--primary-color)', marginRight: '0.75rem'}}></i>
          <h2 style={{margin: 0, fontSize: '1.25rem', fontWeight: '700'}}>Add Money to Wallet</h2>
        </div>
        
        <form onSubmit={handleTopup}>
          {/* Quick amount selection */}
          <div className="form-group">
            <label style={{fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', display: 'block'}}>Quick Select Amount</label>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1rem'}}>              
              {quickAmounts.map(amount => (
                <button
                  key={amount}
                  type="button"
                  className={`btn touch-target ${selectedAmount === amount.toString() ? 'btn-primary' : 'btn-outline-primary'}`}
                  style={{padding: '0.75rem 0.5rem', fontSize: '0.875rem', fontWeight: '600'}}
                  onClick={() => {
                    setSelectedAmount(amount.toString());
                    setTopupAmount(amount.toString());
                  }}
                >
                  ₹{amount}
                </button>
              ))}
            </div>
          </div>
          
          {/* Custom amount input */}
          <div className="form-group">
            <label htmlFor="amount" style={{fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', display: 'block'}}>Or Enter Custom Amount (₹)</label>
            <input
              type="number"
              id="amount"
              value={topupAmount}
              onChange={(e) => {
                setTopupAmount(e.target.value);
                setSelectedAmount('');
              }}
              className="form-control touch-target"
              placeholder="Enter amount"
              min="1"
              step="1"
              style={{fontSize: '1rem', padding: '0.875rem'}}
              required
            />
          </div>
          
          {/* Payment methods - mobile optimized */}
          <div className="form-group">
            <label style={{fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', display: 'block'}}>Payment Method</label>
            <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
              <div className="payment-method active touch-target" style={{display: 'flex', alignItems: 'center', padding: '1rem', border: '2px solid var(--primary-color)', borderRadius: 'var(--border-radius)', background: 'rgba(76, 175, 80, 0.1)'}}>
                <input 
                  type="radio" 
                  id="card" 
                  name="paymentMethod" 
                  value="card" 
                  defaultChecked
                  style={{marginRight: '0.75rem', transform: 'scale(1.2)'}}
                />
                <i className="fas fa-credit-card" style={{fontSize: '1.25rem', marginRight: '0.75rem', color: 'var(--primary-color)'}}></i>
                <label htmlFor="card" style={{fontSize: '1rem', fontWeight: '500', cursor: 'pointer', flex: 1}}>Credit/Debit Card</label>
              </div>
              
              <div className="payment-method disabled touch-target" style={{display: 'flex', alignItems: 'center', padding: '1rem', border: '2px solid var(--gray-color)', borderRadius: 'var(--border-radius)', opacity: 0.6}}>
                <input 
                  type="radio" 
                  id="upi" 
                  name="paymentMethod" 
                  value="upi" 
                  disabled
                  style={{marginRight: '0.75rem', transform: 'scale(1.2)'}}
                />
                <i className="fab fa-google-pay" style={{fontSize: '1.25rem', marginRight: '0.75rem', color: 'var(--gray-color)'}}></i>
                <label htmlFor="upi" style={{fontSize: '1rem', fontWeight: '500', cursor: 'not-allowed', flex: 1}}>UPI (Coming Soon)</label>
              </div>
              
              <div className="payment-method disabled touch-target" style={{display: 'flex', alignItems: 'center', padding: '1rem', border: '2px solid var(--gray-color)', borderRadius: 'var(--border-radius)', opacity: 0.6}}>
                <input 
                  type="radio" 
                  id="netbanking" 
                  name="paymentMethod" 
                  value="netbanking" 
                  disabled
                  style={{marginRight: '0.75rem', transform: 'scale(1.2)'}}
                />
                <i className="fas fa-university" style={{fontSize: '1.25rem', marginRight: '0.75rem', color: 'var(--gray-color)'}}></i>
                <label htmlFor="netbanking" style={{fontSize: '1rem', fontWeight: '500', cursor: 'not-allowed', flex: 1}}>Net Banking (Coming Soon)</label>
              </div>
            </div>
          </div>
          
          {/* Submit button */}
          <button 
            type="submit" 
            className="btn btn-primary btn-block touch-target"
            disabled={isProcessing}
            style={{padding: '1rem', fontSize: '1.125rem', fontWeight: '700', marginTop: '1.5rem'}}
          >
            <i className={`fas ${isProcessing ? 'fa-spinner fa-spin' : 'fa-plus'} btn-icon`}></i>
            {isProcessing ? 'Processing...' : 'Add Money'}
          </button>
          
          {/* Info text */}
          <div style={{marginTop: '1rem', padding: '0.75rem', background: 'var(--light-color)', borderRadius: 'var(--border-radius)', textAlign: 'center'}}>
            <p style={{margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)'}}>
              <i className="fas fa-info-circle" style={{marginRight: '0.5rem'}}></i>
              Note: This is a demo application. No actual payment will be processed.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default withLocationPermission(Wallet, {
  requireLocation: true,
  showLocationInfo: true
});