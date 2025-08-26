import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import TransactionStatusUpdates from '../components/TransactionStatusUpdates';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const { error: showError } = useNotification();
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        const response = await axios.get('/api/wallet/my-wallet');
        setWalletData(response.data.data.wallet);
      } catch (error) {
        console.error('Error fetching wallet data:', error);
        showError('Failed to load wallet data');
      } finally {
        setLoading(false);
      }
    };

    fetchWalletData();
  }, []);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      {/* Mobile-friendly welcome header */}
      <div className="welcome-header">
        <h1>Welcome back!</h1>
        <p className="welcome-subtitle">{currentUser?.name || 'User'}</p>
      </div>
      
      {/* Enhanced wallet card */}
      <div className="wallet-summary">
        <div className="wallet-card">
          <div className="wallet-header">
            <div className="wallet-icon">💳</div>
            <div className="wallet-info">
              <h2>Wallet Balance</h2>
              <div className="wallet-balance">
                ₹{walletData?.balance.toFixed(2) || '0.00'}
              </div>
            </div>
          </div>
          <div className="wallet-actions">
            <Link to="/wallet" className="btn btn-primary touch-target">
              <span className="btn-icon">💰</span>
              Top Up
            </Link>
            <Link to="/transactions" className="btn btn-secondary touch-target">
              <span className="btn-icon">📋</span>
              History
            </Link>
          </div>
        </div>
      </div>

      {/* Quick actions with improved mobile layout */}
      <div className="quick-actions-section">
        <h2>Quick Actions</h2>
        <div className="dashboard">
          <Link to="/mobile-recharge" className="card dashboard-card touch-target">
            <div className="dashboard-icon mobile-recharge">📱</div>
            <div className="card-content">
              <h3>Mobile Recharge</h3>
              <p>Instant prepaid recharge</p>
            </div>
            <div className="card-arrow">→</div>
          </Link>

          <Link to="/dth-recharge" className="card dashboard-card touch-target">
            <div className="dashboard-icon dth-recharge">📺</div>
            <div className="card-content">
              <h3>DTH Recharge</h3>
              <p>TV connection recharge</p>
            </div>
            <div className="card-arrow">→</div>
          </Link>

          <Link to="/bill-payment" className="card dashboard-card touch-target">
            <div className="dashboard-icon bill-payment">📄</div>
            <div className="card-content">
              <h3>Bill Payment</h3>
              <p>Pay utility bills</p>
            </div>
            <div className="card-arrow">→</div>
          </Link>

          <Link to="/vouchers" className="card dashboard-card touch-target">
            <div className="dashboard-icon vouchers">🎁</div>
            <div className="card-content">
              <h3>Brand Vouchers</h3>
              <p>Discounted vouchers</p>
            </div>
            <div className="card-arrow">→</div>
          </Link>

          <Link to="/transactions" className="card dashboard-card touch-target">
            <div className="dashboard-icon transactions">📊</div>
            <div className="card-content">
              <h3>Transactions</h3>
              <p>View transaction history</p>
            </div>
            <div className="card-arrow">→</div>
          </Link>
        </div>
      </div>
      
      <TransactionStatusUpdates />
    </div>
  );
};

export default Dashboard;