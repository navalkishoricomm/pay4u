import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import {
  SHOW_RECHARGES,
  SHOW_BILL_PAYMENTS,
  SHOW_MONEY_TRANSFER,
  SHOW_AEPS,
  SHOW_VOUCHERS
} from '../../config/featureFlags';
import './Navbar.css';

const Navbar = () => {
  const { isAuthenticated, currentUser, logout } = useAuth();
  const { unreadCount } = useSocket();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isBellRinging, setIsBellRinging] = useState(false);

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

  useEffect(() => {
    let timer;
    const handleNewNotification = () => {
      setIsBellRinging(true);
      clearTimeout(timer);
      timer = setTimeout(() => setIsBellRinging(false), 1500);
    };
    window.addEventListener('newNotification', handleNewNotification);
    return () => {
      window.removeEventListener('newNotification', handleNewNotification);
      clearTimeout(timer);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <Link to="/" className="logo" onClick={closeMenu}>
        Pay4U
      </Link>

      {/* Hamburger Menu Button */}
      <button 
        className={`hamburger ${isMenuOpen ? 'active' : ''}`}
        onClick={toggleMenu}
        aria-label="Toggle navigation menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Navigation Menu */}
      <ul className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
        {!isAuthenticated && (
          <li>
            <Link to="/" onClick={closeMenu}>Home</Link>
          </li>
        )}
        
        {isAuthenticated ? (
          <>
            <li>
              <NavLink to="/dashboard">Dashboard</NavLink>
            </li>
            <li>
              <NavLink to="/wallet">Wallet</NavLink>
            </li>
            
            {SHOW_RECHARGES_EFF && (
              <>
                <li><NavLink to="/mobile-recharge">Mobile Recharge</NavLink></li>
                <li><NavLink to="/dth-recharge">DTH Recharge</NavLink></li>
              </>
            )}
            
            {SHOW_BILL_PAYMENTS_EFF && (
              <li><NavLink to="/bill-payment">Bill Payment</NavLink></li>
            )}
            
            {SHOW_MONEY_TRANSFER_EFF && (
              <li><NavLink to="/money-transfer">Money Transfer</NavLink></li>
            )}
            
            {SHOW_AEPS_EFF && (
              <li><NavLink to="/aeps">AEPS</NavLink></li>
            )}

            <li>
              <NavLink to="/transactions">Transactions</NavLink>
            </li>
            
            {SHOW_VOUCHERS_EFF && (
              <li>
                <NavLink to="/vouchers">Brand Vouchers</NavLink>
              </li>
            )}
            <li>
              <NavLink to="/notifications">Notifications</NavLink>
            </li>
            {currentUser?.role === 'admin' && (
              <li>
                <NavLink to="/admin/dashboard" className="admin-link">Admin</NavLink>
              </li>
            )}
            <li>
              <button onClick={handleLogout} className="btn btn-secondary">
                Logout
              </button>
            </li>
          </>
        ) : (
          <>
            <li>
              <Link to="/login" onClick={closeMenu}>Login</Link>
            </li>
            <li>
              <Link to="/register" onClick={closeMenu}>Register</Link>
            </li>
          </>
        )}
      </ul>

      {/* Notification Bell - Show on desktop */}
      {isAuthenticated && (
        <div className="desktop-notifications">
          <Link to="/notifications" className="notification-bell">
            <span className={`bell-icon ${isBellRinging ? 'ring' : ''}`}>🔔</span>
            {unreadCount > 0 && (
              <span className="notification-count">{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </Link>
        </div>
      )}

      {/* User Info - Show on desktop */}
      {isAuthenticated && currentUser && (
        <div className="user-info desktop-only">
          {currentUser.profilePicture && (
            <img src={currentUser.profilePicture} alt="Profile" />
          )}
          <span>Welcome, {currentUser.name || currentUser.email}</span>
        </div>
      )}
    </nav>
  );
};

export default Navbar;