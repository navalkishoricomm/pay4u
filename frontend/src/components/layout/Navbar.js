import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import './Navbar.css';

const Navbar = () => {
  const { isAuthenticated, currentUser, logout } = useAuth();
  const { unreadCount } = useSocket();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
              <Link to="/dashboard" onClick={closeMenu}>Dashboard</Link>
            </li>
            <li>
              <Link to="/wallet" onClick={closeMenu}>Wallet</Link>
            </li>
            <li>
              <Link to="/recharge" onClick={closeMenu}>Recharge</Link>
            </li>
            <li>
              <Link to="/money-transfer" onClick={closeMenu}>Money Transfer</Link>
            </li>
            <li>
              <Link to="/aeps" onClick={closeMenu}>AEPS</Link>
            </li>
            <li>
              <Link to="/transactions" onClick={closeMenu}>Transactions</Link>
            </li>
            <li>
              <Link to="/vouchers" onClick={closeMenu}>Brand Vouchers</Link>
            </li>
            <li>
              <Link to="/notifications" onClick={closeMenu} className="notification-link">
                <span className="notification-icon">🔔</span>
                Notifications
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount}</span>
                )}
              </Link>
            </li>
            {currentUser?.role === 'admin' && (
              <>
                <li>
                  <Link to="/admin/notifications" onClick={closeMenu} className="admin-link">Admin Notifications</Link>
                </li>
                <li>
                  <Link to="/admin/dashboard" className="admin-link" onClick={closeMenu}>Admin Panel</Link>
                </li>
              </>
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
            <span className="bell-icon">🔔</span>
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