import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import './Admin.css';

const AdminDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is admin
    if (currentUser?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }

    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/admin/dashboard-stats');
        setStats(response.data.data.stats);
        setLoading(false);
      } catch (err) {
        setError('Failed to load dashboard statistics');
        setLoading(false);
        console.error('Error fetching admin dashboard stats:', err);
      }
    };

    fetchDashboardStats();
  }, [currentUser, navigate]);

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
    return (
      <div className="alert alert-danger m-4" role="alert">
        {error}
      </div>
    );
  }

  if (!stats) {
    return <div className="loading">Loading dashboard data...</div>;
  }

  return (
    <div className="admin-dashboard">
      <div className="mobile-header">
        <h1>Admin Dashboard</h1>
        <p>Welcome back, {currentUser?.name}</p>
      </div>
      
      {stats && (
        <>
          <div className="dashboard-stats">
            {/* Users Stats */}
            <div className="stat-card">
              <div className="stat-icon users">
                <i className="fas fa-users"></i>
              </div>
              <div className="stat-content">
                <h3>Users</h3>
                <div className="stat-value">{stats.totalUsers}</div>
                <p className="stat-subtext">Active: {stats.activeUsers}</p>
              </div>
            </div>
            
            {/* Transactions Count Stats */}
            <div className="stat-card">
              <div className="stat-icon transactions">
                <i className="fas fa-exchange-alt"></i>
              </div>
              <div className="stat-content">
                <h3>Transactions</h3>
                <div className="stat-value">{stats.totalTransactions}</div>
                <p className="stat-subtext">Total Count</p>
              </div>
            </div>

            {/* Transaction Volume Stats */}
            <div className="stat-card">
              <div className="stat-icon revenue">
                <i className="fas fa-rupee-sign"></i>
              </div>
              <div className="stat-content">
                <h3>Total Volume</h3>
                <div className="stat-value">₹{stats.totalTransactionAmount ? stats.totalTransactionAmount.toLocaleString() : '0'}</div>
                <p className="stat-subtext">Total Amount</p>
              </div>
            </div>
            
            {/* Pending Approvals */}
            <div className="stat-card">
              <div className="stat-icon pending">
                <i className="fas fa-clock"></i>
              </div>
              <div className="stat-content">
                <h3>Pending Approvals</h3>
                <div className="stat-value">{stats.pendingApprovals}</div>
                <p className="stat-subtext">Needs Review</p>
              </div>
            </div>
          </div>
          
          <div className="charts-grid">
            {/* Transactions by Type */}
            <div className="chart-card">
              <div className="chart-header">
                <i className="fas fa-chart-bar"></i>
                Transactions by Type
              </div>
              <div className="chart-body">
                {Object.entries(stats.transactionsByType || {}).map(([type, count]) => (
                  <div key={type} className="chart-row">
                    <span className="chart-label">{type.replace('-', ' ')}</span>
                    <div className="chart-bar-container">
                      <div className="progress-bar-bg">
                        <div 
                          className="progress-bar-fill" 
                          style={{
                            width: `${(count / stats.totalTransactions) * 100}%`,
                            background: 'var(--primary-color)'
                          }}
                        ></div>
                      </div>
                      <span className="chart-value">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Transactions by Status */}
            <div className="chart-card">
              <div className="chart-header">
                <i className="fas fa-chart-pie"></i>
                Transactions by Status
              </div>
              <div className="chart-body">
                {Object.entries(stats.transactionsByStatus || {}).map(([status, count]) => {
                  const statusColors = {
                    completed: 'var(--success-text)',
                    pending: 'var(--warning-text)',
                    failed: 'var(--danger-text)',
                    awaiting_approval: '#fd7e14',
                    approved: '#20c997',
                    rejected: '#6f42c1'
                  };
                  return (
                    <div key={status} className="chart-row">
                      <span className="chart-label">{status.replace('_', ' ')}</span>
                      <div className="chart-bar-container">
                        <div className="progress-bar-bg">
                          <div 
                            className="progress-bar-fill" 
                            style={{
                              width: `${(count / stats.totalTransactions) * 100}%`,
                              background: statusColors[status] || 'var(--text-muted)'
                            }}
                          ></div>
                        </div>
                        <span className="chart-value" style={{ color: statusColors[status] }}>{count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* Quick Actions Section */}
          <div className="quick-actions-section mt-4">
            <h3 className="section-title mb-3 h5 fw-bold text-secondary">
              <i className="fas fa-bolt me-2 text-primary"></i>
              Quick Actions
            </h3>
            <div className="row g-3">
              <div className="col-6 col-md-3">
                <button
                  onClick={() => navigate('/admin/api-providers')}
                  className="btn btn-outline-primary w-100 p-3 h-100 d-flex flex-column align-items-center justify-content-center gap-2"
                >
                  <i className="fas fa-server fa-2x"></i>
                  <span>API Providers</span>
                </button>
              </div>
              <div className="col-6 col-md-3">
                <button
                  onClick={() => navigate('/admin/commissions')}
                  className="btn btn-outline-success w-100 p-3 h-100 d-flex flex-column align-items-center justify-content-center gap-2"
                >
                  <i className="fas fa-percentage fa-2x"></i>
                  <span>Commissions</span>
                </button>
              </div>
              <div className="col-6 col-md-3">
                <button
                  onClick={() => navigate('/admin/users')}
                  className="btn btn-outline-info w-100 p-3 h-100 d-flex flex-column align-items-center justify-content-center gap-2"
                >
                  <i className="fas fa-users-cog fa-2x"></i>
                  <span>User Management</span>
                </button>
              </div>
              <div className="col-6 col-md-3">
                <button
                  onClick={() => navigate('/admin/reports')}
                  className="btn btn-outline-warning w-100 p-3 h-100 d-flex flex-column align-items-center justify-content-center gap-2"
                >
                  <i className="fas fa-file-alt fa-2x"></i>
                  <span>Reports</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;