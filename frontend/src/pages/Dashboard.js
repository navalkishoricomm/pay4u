import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
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
  
  // New state for web-view enhancements
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

        // Fetch Wallet
        const walletRes = await axios.get('/wallet/my-wallet', config);
        setWalletData(walletRes.data.data.wallet);

        // Fetch Transactions
        const transRes = await axios.get('/wallet/my-transactions', config);
        const transactions = transRes.data.data.transactions || [];
        setRecentTransactions(transactions.slice(0, 5));

        // Process Performance Data (Last 6 months spending)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        
        const monthlyStats = transactions.reduce((acc, t) => {
          const tDate = new Date(t.createdAt);
          if (tDate >= sixMonthsAgo && t.status === 'completed' && t.amount > 0) {
            const monthKey = tDate.toLocaleString('default', { month: 'short' });
            acc[monthKey] = (acc[monthKey] || 0) + parseFloat(t.amount);
          }
          return acc;
        }, {});

        // Ensure chronological order for last 6 months
        const chartData = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          const monthKey = d.toLocaleString('default', { month: 'short' });
          chartData.push({
            month: monthKey,
            amount: monthlyStats[monthKey] || 0
          });
        }
        setPerformanceData(chartData);

        // Fetch Notifications
        const notifRes = await axios.get('/notifications', config); // Using relative path like wallet
        setRecentNotifications((notifRes.data?.data?.notifications || []).slice(0, 5));

        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error?.response?.data || error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

  const getTypeIcon = (type) => {
    switch (type) {
      case 'topup': return '💰';
      case 'mobile-recharge': return '📱';
      case 'dth-recharge': return '📺';
      case 'bill-payment': return '📄';
      case 'voucher_purchase': return '🎫';
      default: return '💸';
    }
  };

  const getStatusInfo = (status) => {
    const s = status?.toLowerCase() || 'pending';
    switch (s) {
      case 'success':
      case 'completed':
        return { color: 'var(--success-color, #28a745)', label: 'Success', class: 'status-success' };
      case 'failed':
      case 'rejected':
        return { color: 'var(--danger-color, #dc3545)', label: 'Failed', class: 'status-failed' };
      case 'pending':
      case 'processing':
      case 'awaiting_approval':
        return { color: 'var(--warning-color, #ffc107)', label: 'Pending', class: 'status-pending' };
      default:
        return { color: 'var(--text-secondary, #6c757d)', label: status, class: 'status-default' };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="container flex-center" style={{ height: '80vh' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      {/* Welcome Header */}
      <div className="mb-4">
        <h1>Welcome back, {currentUser?.name?.split(' ')[0] || 'User'}!</h1>
        <p className="text-muted">Manage your payments and wallet easily.</p>
      </div>
      
      {/* Wallet Section */}
      <div className="mb-4">
        <div className="wallet-card-modern">
          <div className="wallet-label">Available Balance</div>
          <div className="wallet-balance">
            ₹{walletData?.balance.toFixed(2) || '0.00'}
          </div>
          <div className="flex gap-4">
            <Link to="/wallet" className="btn btn-secondary" style={{ color: 'var(--primary-color)', borderColor: 'white', background: 'white' }}>
              <span>💰</span> Add Money
            </Link>
            <Link to="/transactions" className="btn btn-secondary" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', borderColor: 'rgba(255,255,255,0.4)' }}>
              <span>📋</span> History
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-4">
        <h2 className="mb-4">Quick Actions</h2>
        <div className="dashboard-grid">
          {SHOW_VOUCHERS_EFF && (
            <Link to="/vouchers" className="dashboard-card">
              <div className="dashboard-icon" style={{ color: '#E91E63', background: '#FCE4EC' }}>🎟️</div>
              <h3>Vouchers</h3>
              <p>Gift Cards</p>
            </Link>
          )}

          {SHOW_RECHARGES_EFF && (
            <>
              <Link to="/mobile-recharge" className="dashboard-card">
                <div className="dashboard-icon" style={{ color: '#0056D2', background: '#E1F0FF' }}>📱</div>
                <h3>Mobile</h3>
                <p>Recharge</p>
              </Link>
              <Link to="/dth-recharge" className="dashboard-card">
                <div className="dashboard-icon" style={{ color: '#D93025', background: '#FCE8E6' }}>📺</div>
                <h3>DTH</h3>
                <p>Recharge</p>
              </Link>
            </>
          )}

          {SHOW_BILL_PAYMENTS_EFF && (
            <>
              <Link to="/bill-payment?type=electricity" className="dashboard-card">
                <div className="dashboard-icon" style={{ color: '#FFC107', background: '#FFF8E1' }}>💡</div>
                <h3>Electricity</h3>
                <p>Bill</p>
              </Link>
              <Link to="/bill-payment?type=water" className="dashboard-card">
                <div className="dashboard-icon" style={{ color: '#03A9F4', background: '#E1F5FE' }}>💧</div>
                <h3>Water</h3>
                <p>Bill</p>
              </Link>
              <Link to="/bill-payment?type=gas" className="dashboard-card">
                <div className="dashboard-icon" style={{ color: '#FF5722', background: '#FBE9E7' }}>🔥</div>
                <h3>Gas</h3>
                <p>Piped</p>
              </Link>
              <Link to="/bill-payment?type=broadband" className="dashboard-card">
                <div className="dashboard-icon" style={{ color: '#673AB7', background: '#EDE7F6' }}>🌐</div>
                <h3>Broadband</h3>
                <p>Internet</p>
              </Link>
              <Link to="/bill-payment?type=landline" className="dashboard-card">
                <div className="dashboard-icon" style={{ color: '#795548', background: '#EFEBE9' }}>☎️</div>
                <h3>Landline</h3>
                <p>Phone</p>
              </Link>
              <Link to="/bill-payment?type=insurance" className="dashboard-card">
                <div className="dashboard-icon" style={{ color: '#4CAF50', background: '#E8F5E9' }}>🛡️</div>
                <h3>Insurance</h3>
                <p>Premium</p>
              </Link>
              <Link to="/bill-payment?type=loan" className="dashboard-card">
                <div className="dashboard-icon" style={{ color: '#607D8B', background: '#ECEFF1' }}>💰</div>
                <h3>Loan</h3>
                <p>EMI</p>
              </Link>
              <Link to="/bill-payment?type=credit-card" className="dashboard-card">
                <div className="dashboard-icon" style={{ color: '#3F51B5', background: '#E8EAF6' }}>💳</div>
                <h3>Credit Card</h3>
                <p>Bill</p>
              </Link>
              <Link to="/bill-payment?type=cylinder" className="dashboard-card">
                <div className="dashboard-icon" style={{ color: '#FF9800', background: '#FFF3E0' }}>⛽</div>
                <h3>Cylinder</h3>
                <p>Booking</p>
              </Link>
            </>
          )}

          {SHOW_MONEY_TRANSFER_EFF && (
            <Link to="/money-transfer" className="dashboard-card">
              <div className="dashboard-icon" style={{ color: '#EA8600', background: '#FEF7E0' }}>💸</div>
              <h3>Transfer</h3>
              <p>Money</p>
            </Link>
          )}

          {SHOW_AEPS_EFF && (
            <Link to="/aeps" className="dashboard-card">
              <div className="dashboard-icon" style={{ color: '#9C27B0', background: '#F3E5F5' }}>👆</div>
              <h3>AEPS</h3>
              <p>Aadhaar</p>
            </Link>
          )}
        </div>
      </div>

      {/* Web Only Enhancements */}
      <div className="dashboard-enhancements-grid web-only">
        {/* Recent Transactions Pane */}
        <div className="dashboard-pane">
          <div className="pane-header">
            <h2>Recent Transactions</h2>
            <Link to="/transactions" className="view-all-link">View All</Link>
          </div>
          {recentTransactions.length === 0 ? (
            <div className="empty-state">
              <p>No recent transactions</p>
            </div>
          ) : (
            <div className="transaction-list-mini">
              {recentTransactions.map((t) => {
                const statusInfo = getStatusInfo(t.status);
                return (
                  <div key={t.id || t._id} className="transaction-item-mini" style={{ borderLeft: `3px solid ${statusInfo.color}` }}>
                    <div className="transaction-icon-mini">{getTypeIcon(t.type)}</div>
                    <div className="transaction-info-mini">
                      <h4>{t.description || t.type}</h4>
                      <p>
                        {formatDate(t.createdAt)}
                        <span style={{ color: statusInfo.color, marginLeft: '8px', fontWeight: '500', fontSize: '0.75rem' }}>
                          {statusInfo.label}
                        </span>
                      </p>
                    </div>
                    <div className={`transaction-amount-mini ${t.type === 'topup' ? 'text-success' : 'text-danger'}`}>
                      {t.type === 'topup' ? '+' : '-'}₹{Math.abs(t.amount).toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Notifications Pane */}
        <div className="dashboard-pane">
          <div className="pane-header">
            <h2>Recent Notifications</h2>
            <Link to="/notifications" className="view-all-link">View All</Link>
          </div>
          {recentNotifications.length === 0 ? (
            <div className="empty-state">
              <p>No new notifications</p>
            </div>
          ) : (
            <div className="notifications-list-mini">
              {recentNotifications.map((n) => (
                <div key={n.id || n._id} className={`notification-item-mini ${n.isRead ? '' : 'unread'}`}>
                  <h4>{n.title}</h4>
                  <p>{n.message}</p>
                  <small>{formatDate(n.createdAt)}</small>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Performance Graph Pane */}
        <div className="dashboard-pane">
          <div className="pane-header">
            <h2>Spending Analysis</h2>
          </div>
          <div className="performance-graph-container">
             {performanceData.length === 0 ? (
                <div className="empty-state"><p>No data available</p></div>
             ) : (
                <div className="simple-bar-chart">
                  {performanceData.map((d) => {
                     const max = Math.max(...performanceData.map(p => p.amount), 1);
                     const height = (d.amount / max) * 100;
                     return (
                       <div key={d.month} className="chart-bar-group">
                         <div className="chart-bar" style={{height: `${height}%`}} title={`₹${d.amount}`}></div>
                         <div className="chart-label">{d.month}</div>
                       </div>
                     );
                  })}
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
