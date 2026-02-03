import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaWallet, FaMobileAlt, FaSatelliteDish, FaFileInvoiceDollar } from 'react-icons/fa';
import '../styles/home.css';
import { SHOW_RECHARGES, SHOW_BILL_PAYMENTS } from '../config/featureFlags';

const Home = () => {
  const { isAuthenticated, currentUser } = useAuth();
  const perms = (currentUser && currentUser.featurePermissions) || {};
  const SHOW_RECHARGES_EFF = perms.showRecharges ?? SHOW_RECHARGES;
  const SHOW_BILL_PAYMENTS_EFF = perms.showBillPayments ?? SHOW_BILL_PAYMENTS;

  return (
    <div className="home-container">
      <div className="hero-section">
        <h1>Welcome to Pay4U</h1>
        <p className="lead">
          Your trusted place to buy and manage branded digital vouchers.
        </p>
        
        {!isAuthenticated ? (
          <div className="cta-buttons">
            <Link to="/register" className="btn btn-primary">
              Get Started
            </Link>
            <Link to="/login" className="btn btn-secondary">
              Login
            </Link>
          </div>
        ) : (
          <div className="cta-buttons">
            <Link to="/dashboard" className="btn btn-primary">
              Go to Dashboard
            </Link>
          </div>
        )}
      </div>

      <div className="features-section">
        <h2>Our Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <FaWallet />
            </div>
            <h3>Digital Wallet</h3>
            <p>Securely store balance and pay for voucher purchases instantly.</p>
          </div>

          {SHOW_RECHARGES_EFF && (
            <div className="feature-card">
              <div className="feature-icon">
                <FaMobileAlt />
              </div>
              <h3>Mobile Recharge</h3>
              <p>Recharge your prepaid mobile across all major operators instantly.</p>
            </div>
          )}

          {SHOW_RECHARGES_EFF && (
            <div className="feature-card">
              <div className="feature-icon">
                <FaSatelliteDish />
              </div>
              <h3>DTH Recharge</h3>
              <p>Pay for your DTH services and enjoy uninterrupted entertainment.</p>
            </div>
          )}

          {SHOW_BILL_PAYMENTS_EFF && (
            <div className="feature-card">
              <div className="feature-icon">
                <FaFileInvoiceDollar />
              </div>
              <h3>Bill Payments</h3>
              <p>Pay your utility bills, credit cards, and more in just a few clicks.</p>
            </div>
          )}
        </div>
      </div>

      <div className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Create an Account</h3>
            <p>Sign up for a free Pay4U account in minutes.</p>
          </div>
          
          <div className="step">
            <div className="step-number">2</div>
            <h3>Add Money to Wallet</h3>
            <p>Top up your wallet using various payment methods.</p>
          </div>
          
          <div className="step">
            <div className="step-number">3</div>
            <h3>Buy Vouchers</h3>
            <p>Use your wallet balance to purchase branded digital vouchers.</p>
          </div>
        </div>
      </div>

      <div className="stats-section">
        <div className="stats-container">
          <div className="stat-item">
            <div className="stat-number">10K+</div>
            <div className="stat-label">Happy Users</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">50K+</div>
            <div className="stat-label">Transactions</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">99.9%</div>
            <div className="stat-label">Uptime</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">24/7</div>
            <div className="stat-label">Support</div>
          </div>
        </div>
      </div>

      <div className="testimonials-section">
        <h2>What Our Users Say</h2>
        <div className="testimonials-grid">
          <div className="testimonial-card">
            <div className="testimonial-content">
              <p>"Pay4U has made my life so much easier. I can recharge my phone and pay bills instantly without any hassle."</p>
            </div>
            <div className="testimonial-author">
              <div className="author-name">Priya Sharma</div>
              <div className="author-role">Regular User</div>
            </div>
          </div>
          
          <div className="testimonial-card">
            <div className="testimonial-content">
              <p>"The digital wallet feature is fantastic. Quick, secure, and reliable for all my payment needs."</p>
            </div>
            <div className="testimonial-author">
              <div className="author-name">Rahul Kumar</div>
              <div className="author-role">Business Owner</div>
            </div>
          </div>
          
          <div className="testimonial-card">
            <div className="testimonial-content">
              <p>"Best app for mobile recharges and bill payments. The interface is clean and user-friendly."</p>
            </div>
            <div className="testimonial-author">
              <div className="author-name">Anjali Patel</div>
              <div className="author-role">Student</div>
            </div>
          </div>
        </div>
      </div>

      <div className="cta-section">
        <div className="cta-content">
          <h2>Ready to Get Started?</h2>
          <p>Join thousands of users who trust Pay4U for their digital payment needs.</p>
          {!isAuthenticated ? (
            <div className="cta-buttons">
              <Link to="/register" className="btn btn-primary">
                Create Account
              </Link>
              <Link to="/login" className="btn btn-secondary">
                Sign In
              </Link>
            </div>
          ) : (
            <div className="cta-buttons">
              <Link to="/dashboard" className="btn btn-primary">
                Go to Dashboard
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;