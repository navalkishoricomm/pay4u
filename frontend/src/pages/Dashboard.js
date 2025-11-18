import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import TransactionStatusUpdates from '../components/TransactionStatusUpdates';
import {
  SHOW_RECHARGES,
  SHOW_BILL_PAYMENTS,
  SHOW_MONEY_TRANSFER,
  SHOW_AEPS,
  SHOW_VOUCHERS
} from '../config/featureFlags';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/wallet/my-wallet', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        setWalletData(response.data.data.wallet);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching wallet data:', error?.response?.data || error);
        setLoading(false);
      }
    };

    fetchWalletData();
  }, []);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  // Effective per-user feature visibility with safe defaults
  const perms = (currentUser && currentUser.featurePermissions) || {};
  const normalizeBool = (val, fallback) => {
    if (val === undefined || val === null) return fallback;
    if (typeof val === 'string') {
      const s = val.trim().toLowerCase();
      if (s === 'true') return true;
      if (s === 'false') return false;
    }
    return !!val;
  };

  const SHOW_RECHARGES_EFF = normalizeBool(perms.showRecharges, SHOW_RECHARGES);
  const SHOW_BILL_PAYMENTS_EFF = normalizeBool(perms.showBillPayments, SHOW_BILL_PAYMENTS);
  const SHOW_MONEY_TRANSFER_EFF = normalizeBool(perms.showMoneyTransfer, SHOW_MONEY_TRANSFER);
  const SHOW_AEPS_EFF = normalizeBool(perms.showAEPS, SHOW_AEPS);
  const SHOW_VOUCHERS_EFF = normalizeBool(perms.showVouchers, SHOW_VOUCHERS);

  return (
    <div className="dashboard-container" style={{padding: '0.75rem'}}>
      {/* Ultra-compact mobile header */}
      <div className="welcome-header" style={{marginBottom: '0.75rem', textAlign: 'center'}}>
        <h1 style={{fontSize: '1.25rem', margin: 0, marginBottom: '0.25rem'}}>Welcome back!</h1>
        <p className="welcome-subtitle" style={{fontSize: '0.875rem', margin: 0, color: 'var(--text-secondary)'}}>{currentUser?.name || 'User'}</p>
      </div>
      
      {/* Ultra-compact wallet card */}
      <div className="wallet-summary" style={{marginBottom: '1rem'}}>
        <div className="wallet-card" style={{padding: '0.75rem', borderRadius: '8px', background: 'var(--card-bg)', border: '1px solid var(--border-color)'}}>
          <div className="wallet-header" style={{marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
            <div className="wallet-icon" style={{fontSize: '1.25rem'}}>💳</div>
            <div className="wallet-info" style={{flex: 1}}>
              <h2 style={{fontSize: '0.875rem', margin: 0, marginBottom: '0.125rem', color: 'var(--text-secondary)'}}>Balance</h2>
              <div className="wallet-balance" style={{fontSize: '1.25rem', fontWeight: '700', color: 'var(--primary-color)'}}>
                ₹{walletData?.balance.toFixed(2) || '0.00'}
              </div>
            </div>
          </div>
          <div className="wallet-actions" style={{gap: '0.5rem', display: 'flex'}}>
            <Link to="/wallet" className="btn btn-primary touch-target" style={{padding: '0.375rem 0.75rem', fontSize: '0.75rem', flex: 1, textAlign: 'center'}}>
              <span className="btn-icon">💰</span>
              Top Up
            </Link>
            <Link to="/transactions" className="btn btn-secondary touch-target" style={{padding: '0.375rem 0.75rem', fontSize: '0.75rem', flex: 1, textAlign: 'center'}}>
              <span className="btn-icon">📋</span>
              History
            </Link>
          </div>
        </div>
      </div>

      {/* Ultra-compact quick actions */}
      <div className="quick-actions-section">
        <h2 style={{fontSize: '1rem', margin: 0, marginBottom: '0.75rem', color: 'var(--text-primary)'}}>Quick Actions</h2>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: '0.75rem', marginBottom: '1rem', justifyItems: 'center'}}>
          <div className="dashboard">
            {SHOW_RECHARGES_EFF && (
              <>
                <Link to="/mobile-recharge" className="quick-action-card">
                  <div className="quick-action-icon service-mobile">📱</div>
                  <div className="quick-action-label">Mobile</div>
                </Link>
                <Link to="/dth-recharge" className="quick-action-card">
                  <div className="quick-action-icon service-dth">📺</div>
                  <div className="quick-action-label">DTH</div>
                </Link>
              </>
            )}

            {SHOW_BILL_PAYMENTS_EFF && (
              <>
                <Link to="/bill-payment?type=credit-card" className="quick-action-card">
                  <div className="quick-action-icon service-credit-card">💳</div>
                  <div className="quick-action-label">Credit Card</div>
                </Link>
                <Link to="/bill-payment?type=loan" className="quick-action-card">
                  <div className="quick-action-icon service-loan">💼</div>
                  <div className="quick-action-label">Loan</div>
                </Link>
                <Link to="/bill-payment?type=insurance" className="quick-action-card">
                  <div className="quick-action-icon service-insurance">🛡️</div>
                  <div className="quick-action-label">Insurance</div>
                </Link>
                <Link to="/bill-payment" className="quick-action-card">
                  <div className="quick-action-icon service-bill">🧾</div>
                  <div className="quick-action-label">Bill</div>
                </Link>
              </>
            )}

            {SHOW_MONEY_TRANSFER_EFF && (
              <Link to="/money-transfer" className="quick-action-card">
                <div className="quick-action-icon service-money-transfer">💸</div>
                <div className="quick-action-label">Transfer</div>
              </Link>
            )}

            {SHOW_AEPS_EFF && (
              <Link to="/aeps" className="quick-action-card">
                <div className="quick-action-icon service-aeps">🏦</div>
                <div className="quick-action-label">AEPS</div>
              </Link>
            )}

            {SHOW_VOUCHERS_EFF && (
              <Link to="/vouchers" className="quick-action-card">
                <div className="quick-action-icon service-vouchers">🎁</div>
                <div className="quick-action-label">Vouchers</div>
              </Link>
            )}

            <Link to="/transactions" className="quick-action-card">
              <div className="quick-action-icon service-transactions">📄</div>
              <div className="quick-action-label">Transactions</div>
            </Link>
          </div>
        </div>
      </div>
      
      <TransactionStatusUpdates />
    </div>
  );
};

export default Dashboard;