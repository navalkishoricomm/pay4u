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
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '0.75rem', marginBottom: '1rem', justifyItems: 'center'}}>
          <Link 
            to="/mobile-recharge" 
            style={{
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              textDecoration: 'none',
              cursor: 'pointer', 
              transition: 'all 0.2s ease',
              padding: '0.5rem'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <div style={{
               width: '48px', 
               height: '48px', 
               borderRadius: '50%', 
               background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
               display: 'flex', 
               alignItems: 'center', 
               justifyContent: 'center',
               marginBottom: '0.375rem',
               border: '1.5px solid var(--primary-color)',
               boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
               fontSize: '1.25rem'
             }}>
              📱
            </div>
            <div style={{textAlign: 'center'}}>
              <h4 style={{
                 margin: 0, 
                 fontSize: '0.625rem', 
                 fontWeight: '600', 
                 color: 'var(--text-primary)', 
                 marginBottom: '0.0625rem',
                 lineHeight: '1.1'
               }}>
                Mobile
              </h4>
              <span style={{
                 fontSize: '0.5rem', 
                 color: 'var(--text-secondary)', 
                 fontWeight: '400'
               }}>
                Recharge
              </span>
            </div>
          </Link>

          <Link 
            to="/dth-recharge" 
            style={{
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              textDecoration: 'none',
              cursor: 'pointer', 
              transition: 'all 0.2s ease',
              padding: '0.5rem'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <div style={{
               width: '48px', 
               height: '48px', 
               borderRadius: '50%', 
               background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', 
               display: 'flex', 
               alignItems: 'center', 
               justifyContent: 'center',
               marginBottom: '0.375rem',
               border: '1.5px solid var(--primary-color)',
               boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
               fontSize: '1.25rem'
             }}>
              📺
            </div>
            <div style={{textAlign: 'center'}}>
              <h4 style={{
                 margin: 0, 
                 fontSize: '0.625rem', 
                 fontWeight: '600', 
                 color: 'var(--text-primary)', 
                 marginBottom: '0.0625rem',
                 lineHeight: '1.1'
               }}>
                 DTH
               </h4>
               <span style={{
                 fontSize: '0.5rem', 
                 color: 'var(--text-secondary)', 
                 fontWeight: '400'
               }}>
                Recharge
              </span>
            </div>
          </Link>

          <Link 
            to="/bill-payment" 
            style={{
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              textDecoration: 'none',
              cursor: 'pointer', 
              transition: 'all 0.2s ease',
              padding: '0.5rem'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <div style={{
               width: '48px', 
               height: '48px', 
               borderRadius: '50%', 
               background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', 
               display: 'flex', 
               alignItems: 'center', 
               justifyContent: 'center',
               marginBottom: '0.375rem',
               border: '1.5px solid var(--primary-color)',
               boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
               fontSize: '1.25rem'
             }}>
              📄
            </div>
            <div style={{textAlign: 'center'}}>
              <h4 style={{
                 margin: 0, 
                 fontSize: '0.625rem', 
                 fontWeight: '600', 
                 color: 'var(--text-primary)', 
                 marginBottom: '0.0625rem',
                 lineHeight: '1.1'
               }}>
                 Bills
               </h4>
               <span style={{
                 fontSize: '0.5rem', 
                 color: 'var(--text-secondary)', 
                 fontWeight: '400'
               }}>
                Payment
              </span>
            </div>
          </Link>

          <Link 
            to="/vouchers" 
            style={{
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              textDecoration: 'none',
              cursor: 'pointer', 
              transition: 'all 0.2s ease',
              padding: '0.5rem'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <div style={{
               width: '48px', 
               height: '48px', 
               borderRadius: '50%', 
               background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', 
               display: 'flex', 
               alignItems: 'center', 
               justifyContent: 'center',
               marginBottom: '0.375rem',
               border: '1.5px solid var(--primary-color)',
               boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
               fontSize: '1.25rem'
             }}>
              🎁
            </div>
            <div style={{textAlign: 'center'}}>
              <h4 style={{
                 margin: 0, 
                 fontSize: '0.625rem', 
                 fontWeight: '600', 
                 color: 'var(--text-primary)', 
                 marginBottom: '0.0625rem',
                 lineHeight: '1.1'
               }}>
                 Vouchers
               </h4>
               <span style={{
                 fontSize: '0.5rem', 
                 color: 'var(--text-secondary)', 
                 fontWeight: '400'
               }}>
                Discounts
              </span>
            </div>
          </Link>

          <Link 
            to="/transactions" 
            style={{
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              textDecoration: 'none',
              cursor: 'pointer', 
              transition: 'all 0.2s ease',
              padding: '0.5rem'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <div style={{
               width: '48px', 
               height: '48px', 
               borderRadius: '50%', 
               background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', 
               display: 'flex', 
               alignItems: 'center', 
               justifyContent: 'center',
               marginBottom: '0.375rem',
               border: '1.5px solid var(--primary-color)',
               boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
               fontSize: '1.25rem'
             }}>
              📊
            </div>
            <div style={{textAlign: 'center'}}>
              <h4 style={{
                 margin: 0, 
                 fontSize: '0.625rem', 
                 fontWeight: '600', 
                 color: 'var(--text-primary)', 
                 marginBottom: '0.0625rem',
                 lineHeight: '1.1'
               }}>
                 History
               </h4>
               <span style={{
                 fontSize: '0.5rem', 
                 color: 'var(--text-secondary)', 
                 fontWeight: '400'
               }}>
                Transactions
              </span>
            </div>
          </Link>
        </div>
      </div>
      
      <TransactionStatusUpdates />
    </div>
  );
};

export default Dashboard;