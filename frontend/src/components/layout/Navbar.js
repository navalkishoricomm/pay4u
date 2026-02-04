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
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

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
    setIsUserMenuOpen(false);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(prev => !prev);
  };

  const goProfile = () => {
    navigate('/profile');
    setIsUserMenuOpen(false);
    setIsMenuOpen(false);
  };

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isUserMenuOpen && !event.target.closest('.user-info')) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  return (
    <nav className="navbar">
      <Link to="/" className="logo" onClick={closeMenu}>
        <img src="/icon.svg" alt="Pay4U" style={{ height: '32px', width: '32px' }} />
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

      {/* Mobile Menu Overlay */}
      <div 
        className={`nav-overlay ${isMenuOpen ? 'active' : ''}`} 
        onClick={closeMenu}
        aria-hidden="true"
      ></div>

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
              <NavLink to="/dashboard" onClick={closeMenu}>Dashboard</NavLink>
            </li>
            <li>
              <NavLink to="/wallet" onClick={closeMenu}>Wallet</NavLink>
            </li>
            
            {SHOW_RECHARGES_EFF && (
              <>
                <li><NavLink to="/mobile-recharge" onClick={closeMenu}>Mobile Recharge</NavLink></li>
                <li><NavLink to="/dth-recharge" onClick={closeMenu}>DTH Recharge</NavLink></li>
              </>
            )}
            
            {SHOW_BILL_PAYMENTS_EFF && (
              <li><NavLink to="/bill-payment" onClick={closeMenu}>Bill Payment</NavLink></li>
            )}
            
            {SHOW_MONEY_TRANSFER_EFF && (
              <li><NavLink to="/money-transfer" onClick={closeMenu}>Money Transfer</NavLink></li>
            )}
            
            {SHOW_AEPS_EFF && (
              <li><NavLink to="/aeps" onClick={closeMenu}>AEPS</NavLink></li>
            )}

            <li>
              <NavLink to="/transactions" onClick={closeMenu}>Transactions</NavLink>
            </li>
            <li>
              <NavLink to="/notifications" onClick={closeMenu}>Notifications</NavLink>
            </li>
            
            {/* Mobile Only Links */}
            <li className="mobile-only" style={{ display: isMenuOpen ? 'block' : 'none' }}>
              <NavLink to="/profile" onClick={closeMenu}>Profile</NavLink>
            </li>
            <li className="mobile-only" style={{ display: isMenuOpen ? 'block' : 'none' }}>
              <button onClick={handleLogout} className="btn btn-secondary btn-full">
                Logout
              </button>
            </li>

            {currentUser?.role === 'admin' && (
              <li>
                <NavLink to="/admin/dashboard" className="admin-link" onClick={closeMenu}>Admin</NavLink>
              </li>
            )}
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

      {/* Desktop Right Section */}
      <div className="desktop-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Notification Bell - Show on desktop */}
        {isAuthenticated && (
          <div className="desktop-notifications">
            <Link to="/notifications" className="notification-bell-btn">
              <span className={`bell-icon ${isBellRinging ? 'ring' : ''}`}>🔔</span>
              {unreadCount > 0 && (
                <span className="notification-dot"></span>
              )}
            </Link>
          </div>
        )}

        {/* User Info - Show on desktop */}
        {isAuthenticated && currentUser && (
          <div className="user-info desktop-only" style={{ position: 'relative' }}>
            <button
              className="user-menu-btn"
              onClick={toggleUserMenu}
              aria-haspopup="true"
              aria-expanded={isUserMenuOpen ? 'true' : 'false'}
            >
              <div className="user-avatar">
                {(currentUser.name || currentUser.email || 'U').charAt(0).toUpperCase()}
              </div>
              <span className="user-name">{currentUser.name || currentUser.email}</span>
              <span style={{ fontSize: 12 }}>▾</span>
            </button>
            
            {isUserMenuOpen && (
              <div className="user-dropdown-menu">
                <button
                  className="dropdown-item"
                  onClick={goProfile}
                >
                  👤 Profile
                </button>
                <button
                  className="dropdown-item"
                  onClick={handleLogout}
                >
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
