import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminNavbar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Helper to check if the current path matches
  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className="admin-navbar">
      <div className="admin-navbar-brand">
        <Link to="/admin/dashboard" className="admin-logo">
          Pay4U Admin
        </Link>
      </div>

      <ul className="admin-nav-links">
        <li className={isActive('/admin/dashboard')}>
          <Link to="/admin/dashboard">
            <i className="fas fa-tachometer-alt"></i> Dashboard
          </Link>
        </li>
        <li className={isActive('/admin/transactions/pending')}>
          <Link to="/admin/transactions/pending">
            <i className="fas fa-clock"></i> Pending Approvals
          </Link>
        </li>
        <li className={isActive('/admin/transactions')}>
          <Link to="/admin/transactions">
            <i className="fas fa-exchange-alt"></i> All Transactions
          </Link>
        </li>
        <li className={isActive('/admin/commissions')}>
          <Link to="/admin/commissions">
            <i className="fas fa-percentage"></i> Commission Management
          </Link>
        </li>
        <li className={isActive('/admin/commission-schemes')}>
          <Link to="/admin/commission-schemes">
            <i className="fas fa-layer-group"></i> Commission Schemes
          </Link>
        </li>
        <li className={isActive('/admin/user-commissions')}>
          <Link to="/admin/user-commissions">
            <i className="fas fa-users-cog"></i> User Commissions
          </Link>
        </li>
        <li className={isActive('/admin/vouchers')}>
          <Link to="/admin/vouchers">
            <i className="fas fa-gift"></i> Voucher Management
          </Link>
        </li>
        <li className={isActive('/admin/voucher-orders')}>
          <Link to="/admin/voucher-orders">
            <i className="fas fa-clipboard-check"></i> Voucher Approvals
          </Link>
        </li>
        <li>
          <Link to="/dashboard">
            <i className="fas fa-user"></i> User Dashboard
          </Link>
        </li>
        <li>
          <button onClick={handleLogout} className="btn-logout">
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default AdminNavbar;