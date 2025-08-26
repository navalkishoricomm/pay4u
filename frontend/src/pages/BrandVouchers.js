import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import './BrandVouchers.css';

const BrandVouchers = () => {
  const { currentUser } = useAuth();
  const { success, error: notifyError } = useNotification();
  const [vouchers, setVouchers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [denominations, setDenominations] = useState([]);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedDenomination, setSelectedDenomination] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [customerEmail, setCustomerEmail] = useState('');
  const [purchasing, setPurchasing] = useState(false);
  const [userOrders, setUserOrders] = useState([]);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    fetchVouchers();
    fetchCategories();
    fetchWalletBalance();
  }, []);

  const fetchVouchers = async () => {
    try {
      const response = await fetch('/api/vouchers/brands');
      const data = await response.json();
      if (data.success) {
        setVouchers(data.data.filter(voucher => voucher.isActive));
      }
    } catch (error) {
      console.error('Error fetching vouchers:', error);
      notifyError('Failed to load vouchers');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/vouchers/categories');
      const data = await response.json();
      if (data.success) {
        setCategories(['All', ...data.data]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchWalletBalance = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/wallet/balance', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.status === 'success') {
        setWalletBalance(data.data.wallet.balance);
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    }
  };

  const fetchDenominations = async (voucherId) => {
    try {
      const response = await fetch(`/api/vouchers/brands/${voucherId}/denominations`);
      const data = await response.json();
      if (data.success) {
        setDenominations(data.data.filter(denom => denom.isActive && denom.remainingQuantity > 0));
      }
    } catch (error) {
      console.error('Error fetching denominations:', error);
      notifyError('Failed to load denominations');
    }
  };

  const fetchUserOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/vouchers/my-orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setUserOrders(data.data);
      }
    } catch (error) {
      console.error('Error fetching user orders:', error);
      notifyError('Failed to load your orders');
    }
  };

  const handleVoucherSelect = (voucher) => {
    setSelectedVoucher(voucher);
    fetchDenominations(voucher._id);
  };

  const handlePurchase = async () => {
    if (!selectedDenomination || quantity < 1) {
      notifyError('Please select a valid denomination and quantity');
      return;
    }

    if (!customerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      notifyError('Please provide a valid email address for voucher delivery');
      return;
    }

    const totalAmount = selectedDenomination.discountedPrice * quantity;
    if (totalAmount > walletBalance) {
      notifyError('Insufficient wallet balance');
      return;
    }

    setPurchasing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/vouchers/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          denominationId: selectedDenomination._id,
          quantity,
          customerEmail
        })
      });

      const data = await response.json();
      if (data.success) {
        success('Voucher purchased successfully!');
        setShowPurchaseModal(false);
        setSelectedVoucher(null);
        setSelectedDenomination(null);
        setQuantity(1);
        setCustomerEmail('');
        fetchWalletBalance();
        fetchDenominations(selectedVoucher._id);
      } else {
        notifyError(data.message || 'Failed to purchase voucher');
      }
    } catch (error) {
      console.error('Error purchasing voucher:', error);
      notifyError('Failed to purchase voucher');
    } finally {
      setPurchasing(false);
    }
  };

  const filteredVouchers = selectedCategory === 'All' 
    ? vouchers 
    : vouchers.filter(voucher => voucher.category === selectedCategory);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleDownloadVoucher = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/vouchers/orders/${orderId}/download-file`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `voucher-${orderId}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        success('Voucher file downloaded successfully!');
      } else {
        const data = await response.json();
        notifyError(data.message || 'Failed to download voucher file');
      }
    } catch (error) {
      console.error('Error downloading voucher:', error);
      notifyError('Failed to download voucher file');
    }
  };

  if (loading) {
    return <div className="loading">Loading vouchers...</div>;
  }

  return (
    <div className="dashboard-container">
      {/* Mobile-friendly header */}
      <div className="welcome-header">
        <h1><i className="fas fa-gift"></i> Brand Vouchers</h1>
        <p className="welcome-subtitle">Purchase vouchers from your favorite brands at discounted prices</p>
      </div>

      {/* Enhanced wallet card */}
      <div className="enhanced-wallet-card card" style={{marginBottom: '1.5rem'}}>
        <div className="card-content">
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
            <div>
              <h3 style={{margin: 0, fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)'}}>
                <i className="fas fa-wallet" style={{marginRight: '0.5rem', color: 'var(--primary-color)'}}></i>
                Wallet Balance
              </h3>
              <div style={{fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary-color)', marginTop: '0.5rem'}}>
                ₹{walletBalance.toFixed(2)}
              </div>
            </div>
            <button 
              className="btn btn-primary touch-target"
              onClick={() => {
                fetchUserOrders();
                setShowOrdersModal(true);
              }}
              style={{padding: '0.75rem 1rem', fontSize: '0.875rem', fontWeight: '600'}}
            >
              <i className="fas fa-shopping-bag" style={{marginRight: '0.5rem'}}></i>
              My Orders
            </button>
          </div>
        </div>
      </div>

      {/* Mobile-optimized category filter */}
      <div className="card" style={{marginBottom: '1.5rem'}}>
        <div style={{display: 'flex', alignItems: 'center', marginBottom: '1rem'}}>
          <i className="fas fa-filter" style={{fontSize: '1.25rem', color: 'var(--primary-color)', marginRight: '0.75rem'}}></i>
          <h3 style={{margin: 0, fontSize: '1.125rem', fontWeight: '600'}}>Categories</h3>
        </div>
        
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.5rem'}}>
          {categories.map(category => (
            <button
              key={category}
              className={`btn touch-target ${selectedCategory === category ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setSelectedCategory(category)}
              style={{padding: '0.75rem 0.5rem', fontSize: '0.875rem', fontWeight: '600', textAlign: 'center'}}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Enhanced vouchers grid */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '2rem'}}>
        {filteredVouchers.map(voucher => (
          <div key={voucher._id} className="card" style={{overflow: 'hidden', transition: 'all 0.2s ease'}}>
            <div style={{height: '180px', overflow: 'hidden', background: 'var(--light-color)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <img 
                src={voucher.image} 
                alt={voucher.brandName} 
                style={{width: '100%', height: '100%', objectFit: 'cover'}}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = `<div style="color: var(--text-secondary); font-size: 0.875rem; text-align: center;"><i class="fas fa-image" style="font-size: 2rem; margin-bottom: 0.5rem; display: block;"></i>No Image</div>`;
                }}
              />
            </div>
            <div style={{padding: '1rem'}}>
              <div style={{marginBottom: '0.75rem'}}>
                <h3 style={{margin: 0, fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem'}}>
                  {voucher.brandName}
                </h3>
                <span style={{fontSize: '0.75rem', color: 'var(--primary-color)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px'}}>
                  {voucher.category}
                </span>
              </div>
              
              <p style={{margin: '0 0 1rem 0', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'}}>
                {voucher.description}
              </p>
              
              <button 
                 className="btn btn-primary touch-target"
                 onClick={() => {
                   setSelectedVoucher(voucher);
                   setShowModal(true);
                 }}
                 style={{width: '100%', padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600'}}
               >
                 <i className="fas fa-eye" style={{marginRight: '0.5rem'}}></i>
                 View Details
               </button>
            </div>
          </div>
        ))}
      </div>

      {filteredVouchers.length === 0 && (
        <div className="no-vouchers">
          <p>No vouchers available in this category.</p>
        </div>
      )}

      {/* Voucher Details Modal */}
      {selectedVoucher && (
        <div className="modal-overlay">
          <div className="modal large">
            <div className="modal-header">
              <h3>{selectedVoucher.brandName} - Available Offers</h3>
              <button 
                className="close-btn"
                onClick={() => {
                  setSelectedVoucher(null);
                  setDenominations([]);
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="voucher-details">
                <div className="voucher-info">
                  <img src={selectedVoucher.image} alt={selectedVoucher.brandName} />
                  <div className="info-content">
                    <h4>{selectedVoucher.brandName}</h4>
                    <p>{selectedVoucher.description}</p>
                    {selectedVoucher.termsAndConditions && (
                      <div className="terms">
                        <h5>Terms & Conditions:</h5>
                        <p>{selectedVoucher.termsAndConditions}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="denominations-list">
                <h4>Available Denominations</h4>
                {denominations.length === 0 ? (
                  <p>No denominations available at the moment.</p>
                ) : (
                  <div className="denominations-grid">
                    {denominations.map(denomination => (
                      <div key={denomination._id} className="denomination-card">
                        <div className="denomination-value">₹{denomination.denomination}</div>
                        <div className="discount-info">
                          <span className="discount">{denomination.discountPercentage}% OFF</span>
                          <span className="final-price">₹{denomination.discountedPrice}</span>
                        </div>
                        <div className="availability">
                          <span>Available: {denomination.remainingQuantity}</span>
                          <span>Max per user: {denomination.maxQuantityPerUser}</span>
                        </div>
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={() => {
                            setSelectedDenomination(denomination);
                            setShowPurchaseModal(true);
                          }}
                        >
                          Buy Now
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Purchase Modal */}
      {showPurchaseModal && selectedDenomination && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Purchase Voucher</h3>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowPurchaseModal(false);
                  setSelectedDenomination(null);
                  setQuantity(1);
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="purchase-details">
                <div className="voucher-summary">
                  <h4>{selectedVoucher.brandName}</h4>
                  <div className="denomination-info">
                    <span className="value">₹{selectedDenomination.denomination}</span>
                    <span className="discount">{selectedDenomination.discountPercentage}% OFF</span>
                    <span className="price">₹{selectedDenomination.discountedPrice}</span>
                  </div>
                </div>

                <div className="quantity-selector">
                  <label>Quantity:</label>
                  <div className="quantity-controls">
                    <button 
                      className="qty-btn"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      -
                    </button>
                    <span className="quantity">{quantity}</span>
                    <button 
                      className="qty-btn"
                      onClick={() => setQuantity(Math.min(selectedDenomination.maxQuantityPerUser, quantity + 1))}
                      disabled={quantity >= selectedDenomination.maxQuantityPerUser}
                    >
                      +
                    </button>
                  </div>
                  <small>Max {selectedDenomination.maxQuantityPerUser} per user</small>
                </div>

                <div className="email-input">
                  <label>Email Address for Voucher Delivery:</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                  />
                  <small>Admin will email the voucher file to this address after approval</small>
                </div>

                <div className="purchase-summary">
                  <div className="summary-row">
                    <span>Unit Price:</span>
                    <span>₹{selectedDenomination.discountedPrice}</span>
                  </div>
                  <div className="summary-row">
                    <span>Quantity:</span>
                    <span>{quantity}</span>
                  </div>
                  <div className="summary-row total">
                    <span>Total Amount:</span>
                    <span>₹{(selectedDenomination.discountedPrice * quantity).toFixed(2)}</span>
                  </div>
                  <div className="summary-row savings">
                    <span>You Save:</span>
                    <span>₹{(selectedDenomination.discountAmount * quantity).toFixed(2)}</span>
                  </div>
                </div>

                <div className="wallet-check">
                  <div className="wallet-balance">
                    <span>Wallet Balance: ₹{walletBalance.toFixed(2)}</span>
                  </div>
                  {(selectedDenomination.discountedPrice * quantity) > walletBalance && (
                    <div className="insufficient-balance">
                      <span>⚠️ Insufficient wallet balance</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowPurchaseModal(false);
                    setSelectedDenomination(null);
                    setQuantity(1);
                    setCustomerEmail('');
                  }}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={handlePurchase}
                  disabled={purchasing || (selectedDenomination.discountedPrice * quantity) > walletBalance}
                >
                  {purchasing ? 'Processing...' : 'Purchase Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* My Orders Modal */}
      {showOrdersModal && (
        <div className="modal-overlay">
          <div className="modal large">
            <div className="modal-header">
              <h3>My Voucher Orders</h3>
              <button 
                className="close-btn"
                onClick={() => setShowOrdersModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              {userOrders.length === 0 ? (
                <p>No orders found.</p>
              ) : (
                <div className="orders-list">
                  {userOrders.map(order => (
                    <div key={order._id} className="order-card">
                      <div className="order-header">
                        <h4>Order #{order.orderNumber}</h4>
                        <div className="order-statuses">
                          <span className={`status ${order.status.toLowerCase()}`}>
                            {order.status}
                          </span>
                          <span className={`approval-status ${order.approvalStatus?.toLowerCase().replace('_', '-') || 'pending'}`}>
                            {order.approvalStatus === 'pending_approval' ? 'Pending Approval' : 
                             order.approvalStatus === 'approved' ? 'Approved' : 
                             order.approvalStatus === 'rejected' ? 'Rejected' : 'Pending'}
                          </span>
                        </div>
                      </div>
                      <div className="order-details">
                        <div className="order-info">
                          <p><strong>Brand:</strong> {order.brandVoucher.brandName}</p>
                          <p><strong>Denomination:</strong> ₹{order.voucherDenomination.denomination}</p>
                          <p><strong>Quantity:</strong> {order.quantity}</p>
                          <p><strong>Amount Paid:</strong> ₹{order.finalAmount}</p>
                          <p><strong>Customer Email:</strong> {order.customerEmail}</p>
                          <p><strong>Purchase Date:</strong> {formatDate(order.purchaseDate)}</p>
                          <p><strong>Expiry Date:</strong> {formatDate(order.expiryDate)}</p>
                          {order.approvalStatus === 'rejected' && order.rejectionReason && (
                            <p><strong>Rejection Reason:</strong> <span className="rejection-reason">{order.rejectionReason}</span></p>
                          )}
                        </div>
                        
                        {/* Download Section for Approved Orders */}
                        {order.approvalStatus === 'approved' && (
                          <div className="voucher-download">
                            {order.voucherFilePath ? (
                              <div className="download-section">
                                <p className="download-info">✅ Your voucher file is ready for download</p>
                                <button 
                                  className="btn btn-download"
                                  onClick={() => handleDownloadVoucher(order._id)}
                                >
                                  Download Voucher File
                                </button>
                              </div>
                            ) : (
                              <div className="processing-section">
                                <p className="processing-info">⏳ Your voucher is being processed. File will be available soon.</p>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Status Information */}
                        {order.approvalStatus === 'pending_approval' && (
                          <div className="status-info">
                            <p className="pending-info">⏳ Your order is pending admin approval. You will receive your voucher file once approved.</p>
                          </div>
                        )}
                        {order.voucherCodes && order.voucherCodes.length > 0 && (
                          <div className="voucher-codes">
                            <h5>Voucher Codes:</h5>
                            {order.voucherCodes.map((codeObj, index) => (
                              <div key={index} className="voucher-code">
                                <span className="code">{codeObj.code}</span>
                                <span className={`code-status ${codeObj.isUsed ? 'used' : 'active'}`}>
                                  {codeObj.isUsed ? 'Used' : 'Active'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrandVouchers;