import React, { useState, useEffect } from 'react';
import './VoucherManagement.css';

const VoucherManagement = () => {
  const [vouchers, setVouchers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [showDenominationModal, setShowDenominationModal] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [denominations, setDenominations] = useState([]);
  const [editingDenomination, setEditingDenomination] = useState(null);

  const [voucherForm, setVoucherForm] = useState({
    brandName: '',
    description: '',
    image: '',
    category: 'Other',
    termsAndConditions: '',
    validityPeriod: 365,
    isActive: true
  });

  const [denominationForm, setDenominationForm] = useState({
    denomination: '',
    discountPercentage: 0,
    maxQuantityPerUser: 5,
    totalAvailableQuantity: 1000,
    isActive: true
  });

  useEffect(() => {
    fetchVouchers();
    fetchCategories();
  }, []);

  const fetchVouchers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/vouchers/brands', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setVouchers(data.data);
      }
    } catch (error) {
      console.error('Error fetching vouchers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/vouchers/categories');
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchDenominations = async (voucherId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/vouchers/brands/${voucherId}/denominations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setDenominations(data.data);
      }
    } catch (error) {
      console.error('Error fetching denominations:', error);
    }
  };

  const handleVoucherSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const url = editingVoucher 
        ? `/api/vouchers/brands/${editingVoucher._id}`
        : '/api/vouchers/brands';
      const method = editingVoucher ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(voucherForm)
      });

      const data = await response.json();
      if (data.success) {
        alert(data.message);
        fetchVouchers();
        resetVoucherForm();
        setShowModal(false);
      } else {
        alert(data.message || 'Error saving voucher');
      }
    } catch (error) {
      console.error('Error saving voucher:', error);
      alert('Error saving voucher');
    }
  };

  const handleDenominationSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const url = editingDenomination 
        ? `/api/vouchers/denominations/${editingDenomination._id}`
        : `/api/vouchers/brands/${selectedVoucher._id}/denominations`;
      const method = editingDenomination ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(denominationForm)
      });

      const data = await response.json();
      if (data.success) {
        alert(data.message);
        fetchDenominations(selectedVoucher._id);
        resetDenominationForm();
      } else {
        alert(data.message || 'Error saving denomination');
      }
    } catch (error) {
      console.error('Error saving denomination:', error);
      alert('Error saving denomination');
    }
  };

  const handleDeleteVoucher = async (voucherId) => {
    if (window.confirm('Are you sure you want to delete this voucher?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/vouchers/brands/${voucherId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();
        if (data.success) {
          alert(data.message);
          fetchVouchers();
        } else {
          alert(data.message || 'Error deleting voucher');
        }
      } catch (error) {
        console.error('Error deleting voucher:', error);
        alert('Error deleting voucher');
      }
    }
  };

  const handleDeleteDenomination = async (denominationId) => {
    if (window.confirm('Are you sure you want to delete this denomination?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/vouchers/denominations/${denominationId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();
        if (data.success) {
          alert(data.message);
          fetchDenominations(selectedVoucher._id);
        } else {
          alert(data.message || 'Error deleting denomination');
        }
      } catch (error) {
        console.error('Error deleting denomination:', error);
        alert('Error deleting denomination');
      }
    }
  };

  const resetVoucherForm = () => {
    setVoucherForm({
      brandName: '',
      description: '',
      image: '',
      category: 'Other',
      termsAndConditions: '',
      validityPeriod: 365,
      isActive: true
    });
    setEditingVoucher(null);
  };

  const resetDenominationForm = () => {
    setDenominationForm({
      denomination: '',
      discountPercentage: 0,
      maxQuantityPerUser: 5,
      totalAvailableQuantity: 1000,
      isActive: true
    });
    setEditingDenomination(null);
  };

  const openEditVoucher = (voucher) => {
    setVoucherForm({
      brandName: voucher.brandName,
      description: voucher.description,
      image: voucher.image,
      category: voucher.category,
      termsAndConditions: voucher.termsAndConditions || '',
      validityPeriod: voucher.validityPeriod,
      isActive: voucher.isActive
    });
    setEditingVoucher(voucher);
    setShowModal(true);
  };

  const openEditDenomination = (denomination) => {
    setDenominationForm({
      denomination: denomination.denomination,
      discountPercentage: denomination.discountPercentage,
      maxQuantityPerUser: denomination.maxQuantityPerUser,
      totalAvailableQuantity: denomination.totalAvailableQuantity,
      isActive: denomination.isActive
    });
    setEditingDenomination(denomination);
  };

  const openDenominationModal = (voucher) => {
    setSelectedVoucher(voucher);
    setShowDenominationModal(true);
    fetchDenominations(voucher._id);
  };

  if (loading) {
    return <div className="loading">Loading vouchers...</div>;
  }

  return (
    <div className="dashboard-container">
      {/* Mobile-friendly header */}
      <div className="welcome-header">
        <h1><i className="fas fa-ticket-alt"></i> Voucher Management</h1>
        <p className="welcome-subtitle">Manage brand vouchers and denominations</p>
      </div>

      {/* Add voucher card */}
      <div className="card" style={{marginBottom: '1.5rem', textAlign: 'center', padding: '1.5rem'}}>
        <h3 style={{margin: '0 0 1rem 0', fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)'}}>
          <i className="fas fa-plus-circle" style={{marginRight: '0.5rem', color: 'var(--primary-color)'}}></i>
          Quick Actions
        </h3>
        <button 
          className="btn btn-primary touch-target"
          onClick={() => {
            resetVoucherForm();
            setShowModal(true);
          }}
          style={{padding: '0.75rem 2rem', fontSize: '0.875rem', fontWeight: '600'}}
        >
          <i className="fas fa-plus" style={{marginRight: '0.5rem'}}></i>
          Add New Voucher
        </button>
      </div>

      {/* Enhanced vouchers grid */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '2rem'}}>
        {vouchers.map(voucher => (
          <div key={voucher._id} className="card" style={{overflow: 'hidden', transition: 'all 0.2s ease'}}>
            <div style={{height: '160px', overflow: 'hidden', background: 'var(--light-color)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              {voucher.image ? (
                <img 
                  src={voucher.image} 
                  alt={voucher.brandName} 
                  style={{width: '100%', height: '100%', objectFit: 'cover'}}
                />
              ) : (
                <div style={{color: 'var(--text-secondary)', fontSize: '0.875rem', textAlign: 'center'}}>
                  <i className="fas fa-image" style={{fontSize: '2rem', marginBottom: '0.5rem', display: 'block'}}></i>
                  No Image
                </div>
              )}
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
              
              <p style={{margin: '0 0 0.75rem 0', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'}}>
                {voucher.description}
              </p>
              
              <div style={{marginBottom: '1rem'}}>
                <span className={`status-badge ${voucher.isActive ? 'success' : 'danger'}`} style={{fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '12px'}}>
                  {voucher.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem'}}>
                <button 
                  className="btn btn-outline-primary touch-target"
                  onClick={() => openEditVoucher(voucher)}
                  style={{padding: '0.5rem', fontSize: '0.75rem', fontWeight: '600'}}
                >
                  <i className="fas fa-edit" style={{marginRight: '0.25rem'}}></i>
                  Edit
                </button>
                <button 
                  className="btn btn-outline-info touch-target"
                  onClick={() => openDenominationModal(voucher)}
                  style={{padding: '0.5rem', fontSize: '0.75rem', fontWeight: '600'}}
                >
                  <i className="fas fa-coins" style={{marginRight: '0.25rem'}}></i>
                  Denominations
                </button>
              </div>
              
              <button 
                className="btn btn-outline-danger touch-target"
                onClick={() => handleDeleteVoucher(voucher._id)}
                style={{padding: '0.5rem', fontSize: '0.75rem', fontWeight: '600', marginTop: '0.5rem', width: '100%'}}
              >
                <i className="fas fa-trash" style={{marginRight: '0.25rem'}}></i>
                Delete Voucher
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced Voucher Modal */}
      {showModal && (
        <div className="modal-overlay" style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem'}}>
          <div className="modal" style={{backgroundColor: 'white', borderRadius: '12px', maxWidth: '500px', width: '100%', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.15)'}}>
            <div className="modal-header" style={{padding: '1.5rem 1.5rem 1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <h3 style={{margin: 0, fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)'}}>
                <i className={`fas ${editingVoucher ? 'fa-edit' : 'fa-plus'}`} style={{marginRight: '0.5rem', color: 'var(--primary-color)'}}></i>
                {editingVoucher ? 'Edit Voucher' : 'Add New Voucher'}
              </h3>
              <button 
                className="close-btn touch-target"
                onClick={() => {
                  setShowModal(false);
                  resetVoucherForm();
                }}
                style={{background: 'none', border: 'none', fontSize: '1.5rem', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem', borderRadius: '50%', width: '2rem', height: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center'}}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleVoucherSubmit} className="modal-body" style={{padding: '1.5rem'}}>
              <div style={{marginBottom: '1.5rem'}}>
                <label style={{display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)'}}>Brand Name *</label>
                <input
                  type="text"
                  value={voucherForm.brandName}
                  onChange={(e) => setVoucherForm({...voucherForm, brandName: e.target.value})}
                  required
                  style={{width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.875rem', transition: 'border-color 0.2s ease'}}
                />
              </div>
              <div style={{marginBottom: '1.5rem'}}>
                <label style={{display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)'}}>Description *</label>
                <textarea
                  value={voucherForm.description}
                  onChange={(e) => setVoucherForm({...voucherForm, description: e.target.value})}
                  required
                  rows="3"
                  style={{width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.875rem', resize: 'vertical', transition: 'border-color 0.2s ease'}}
                />
              </div>
              <div style={{marginBottom: '1.5rem'}}>
                <label style={{display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)'}}>Image URL *</label>
                <input
                  type="url"
                  value={voucherForm.image}
                  onChange={(e) => setVoucherForm({...voucherForm, image: e.target.value})}
                  required
                  placeholder="https://example.com/image.jpg"
                  style={{width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.875rem', transition: 'border-color 0.2s ease'}}
                />
              </div>
              <div style={{marginBottom: '1.5rem'}}>
                <label style={{display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)'}}>Category</label>
                <select
                  value={voucherForm.category}
                  onChange={(e) => setVoucherForm({...voucherForm, category: e.target.value})}
                  style={{width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.875rem', backgroundColor: 'white', transition: 'border-color 0.2s ease'}}
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div style={{marginBottom: '1.5rem'}}>
                <label style={{display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)'}}>Terms and Conditions</label>
                <textarea
                  value={voucherForm.termsAndConditions}
                  onChange={(e) => setVoucherForm({...voucherForm, termsAndConditions: e.target.value})}
                  rows="3"
                  style={{width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.875rem', resize: 'vertical', transition: 'border-color 0.2s ease'}}
                />
              </div>
              <div style={{marginBottom: '1.5rem'}}>
                <label style={{display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)'}}>Validity Period (days)</label>
                <input
                  type="number"
                  value={voucherForm.validityPeriod}
                  onChange={(e) => setVoucherForm({...voucherForm, validityPeriod: parseInt(e.target.value)})}
                  min="1"
                  required
                  style={{width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.875rem', transition: 'border-color 0.2s ease'}}
                />
              </div>
              <div style={{marginBottom: '2rem'}}>
                <label style={{display: 'flex', alignItems: 'center', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', cursor: 'pointer'}}>
                  <input
                    type="checkbox"
                    checked={voucherForm.isActive}
                    onChange={(e) => setVoucherForm({...voucherForm, isActive: e.target.checked})}
                    style={{marginRight: '0.5rem', width: '1rem', height: '1rem'}}
                  />
                  <span>Active</span>
                </label>
              </div>
              <div style={{display: 'flex', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)'}}>
                <button 
                  type="button" 
                  className="btn btn-outline-secondary touch-target" 
                  onClick={() => {
                    setShowModal(false);
                    resetVoucherForm();
                  }}
                  style={{flex: 1, padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600'}}
                >
                  <i className="fas fa-times" style={{marginRight: '0.5rem'}}></i>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary touch-target"
                  style={{flex: 1, padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600'}}
                >
                  <i className={`fas ${editingVoucher ? 'fa-save' : 'fa-plus'}`} style={{marginRight: '0.5rem'}}></i>
                  {editingVoucher ? 'Update' : 'Create'} Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enhanced Denomination Modal */}
      {showDenominationModal && (
        <div className="modal-overlay" style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem'}}>
          <div className="modal" style={{backgroundColor: 'white', borderRadius: '12px', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.15)'}}>
            <div className="modal-header" style={{padding: '1.5rem 1.5rem 1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <h3 style={{margin: 0, fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)'}}>
                <i className="fas fa-coins" style={{marginRight: '0.5rem', color: 'var(--primary-color)'}}></i>
                Manage Denominations - {selectedVoucher?.brandName}
              </h3>
              <button 
                className="close-btn touch-target"
                onClick={() => {
                  setShowDenominationModal(false);
                  setSelectedVoucher(null);
                  resetDenominationForm();
                }}
                style={{background: 'none', border: 'none', fontSize: '1.5rem', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem', borderRadius: '50%', width: '2rem', height: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center'}}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body" style={{padding: '1.5rem'}}>
              <form onSubmit={handleDenominationSubmit}>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem'}}>
                  <div>
                    <label style={{display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)'}}>Denomination Value *</label>
                    <input
                      type="number"
                      value={denominationForm.denomination}
                      onChange={(e) => setDenominationForm({...denominationForm, denomination: parseInt(e.target.value)})}
                      min="1"
                      required
                      style={{width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.875rem', transition: 'border-color 0.2s ease'}}
                    />
                  </div>
                  <div>
                    <label style={{display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)'}}>Discount % *</label>
                    <input
                      type="number"
                      value={denominationForm.discountPercentage}
                      onChange={(e) => setDenominationForm({...denominationForm, discountPercentage: parseFloat(e.target.value)})}
                      min="0"
                      max="100"
                      step="0.01"
                      required
                      style={{width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.875rem', transition: 'border-color 0.2s ease'}}
                    />
                  </div>
                </div>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem'}}>
                  <div>
                    <label style={{display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)'}}>Max Quantity Per User *</label>
                    <input
                      type="number"
                      value={denominationForm.maxQuantityPerUser}
                      onChange={(e) => setDenominationForm({...denominationForm, maxQuantityPerUser: parseInt(e.target.value)})}
                      min="1"
                      required
                      style={{width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.875rem', transition: 'border-color 0.2s ease'}}
                    />
                  </div>
                  <div>
                    <label style={{display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)'}}>Total Available Quantity *</label>
                    <input
                      type="number"
                      value={denominationForm.totalAvailableQuantity}
                      onChange={(e) => setDenominationForm({...denominationForm, totalAvailableQuantity: parseInt(e.target.value)})}
                      min="0"
                      required
                      style={{width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.875rem', transition: 'border-color 0.2s ease'}}
                    />
                  </div>
                </div>
                <div style={{marginBottom: '1.5rem'}}>
                  <label style={{display: 'flex', alignItems: 'center', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', cursor: 'pointer'}}>
                    <input
                      type="checkbox"
                      checked={denominationForm.isActive}
                      onChange={(e) => setDenominationForm({...denominationForm, isActive: e.target.checked})}
                      style={{marginRight: '0.5rem', width: '1rem', height: '1rem'}}
                    />
                    Active
                  </label>
                </div>
                <div style={{display: 'flex', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)'}}>
                  <button 
                    type="submit" 
                    className="btn btn-primary touch-target"
                    style={{flex: 1, padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600'}}
                  >
                    <i className={`fas ${editingDenomination ? 'fa-save' : 'fa-plus'}`} style={{marginRight: '0.5rem'}}></i>
                    {editingDenomination ? 'Update' : 'Add'} Denomination
                  </button>
                  {editingDenomination && (
                    <button 
                      type="button" 
                      className="btn btn-outline-secondary touch-target"
                      onClick={resetDenominationForm}
                      style={{flex: 1, padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600'}}
                    >
                      <i className="fas fa-times" style={{marginRight: '0.5rem'}}></i>
                      Cancel Edit
                    </button>
                  )}
                </div>
              </form>

              <div style={{marginTop: '2rem'}}>
                <h4 style={{margin: '0 0 1rem 0', fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)'}}>
                  <i className="fas fa-list" style={{marginRight: '0.5rem', color: 'var(--primary-color)'}}></i>
                  Existing Denominations
                </h4>
                {denominations.length === 0 ? (
                  <div style={{textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)'}}>
                    <i className="fas fa-inbox" style={{fontSize: '3rem', marginBottom: '1rem', display: 'block', opacity: 0.3}}></i>
                    <p style={{margin: 0, fontSize: '0.875rem'}}>No denominations found.</p>
                  </div>
                ) : (
                  <div style={{display: 'grid', gap: '1rem'}}>
                    {denominations.map(denomination => (
                      <div key={denomination._id} className="card" style={{padding: '1rem'}}>
                        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', marginBottom: '1rem'}}>
                          <div>
                            <div style={{fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', fontWeight: '600', textTransform: 'uppercase'}}>Value</div>
                            <div style={{fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)'}}>₹{denomination.denomination}</div>
                          </div>
                          <div>
                            <div style={{fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', fontWeight: '600', textTransform: 'uppercase'}}>Discount</div>
                            <div style={{fontSize: '1rem', fontWeight: '600', color: 'var(--success-color)'}}>{denomination.discountPercentage}%</div>
                          </div>
                          <div>
                            <div style={{fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', fontWeight: '600', textTransform: 'uppercase'}}>Final Price</div>
                            <div style={{fontSize: '1rem', fontWeight: '600', color: 'var(--primary-color)'}}>₹{denomination.discountedPrice}</div>
                          </div>
                          <div>
                            <div style={{fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', fontWeight: '600', textTransform: 'uppercase'}}>Max/User</div>
                            <div style={{fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)'}}>{denomination.maxQuantityPerUser}</div>
                          </div>
                        </div>
                        
                        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '1rem', marginBottom: '1rem'}}>
                          <div>
                            <div style={{fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', fontWeight: '600', textTransform: 'uppercase'}}>Available</div>
                            <div style={{fontSize: '1rem', fontWeight: '600', color: 'var(--info-color)'}}>{denomination.remainingQuantity}</div>
                          </div>
                          <div>
                            <div style={{fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', fontWeight: '600', textTransform: 'uppercase'}}>Sold</div>
                            <div style={{fontSize: '1rem', fontWeight: '600', color: 'var(--warning-color)'}}>{denomination.soldQuantity}</div>
                          </div>
                          <div>
                            <div style={{fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', fontWeight: '600', textTransform: 'uppercase'}}>Status</div>
                            <span className={`status-badge ${denomination.isActive ? 'success' : 'danger'}`} style={{fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '12px'}}>
                              {denomination.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                        
                        <div style={{display: 'flex', gap: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)'}}>
                          <button 
                            className="btn btn-outline-primary touch-target"
                            onClick={() => openEditDenomination(denomination)}
                            style={{flex: 1, padding: '0.5rem', fontSize: '0.75rem', fontWeight: '600'}}
                          >
                            <i className="fas fa-edit" style={{marginRight: '0.25rem'}}></i>
                            Edit
                          </button>
                          <button 
                            className="btn btn-outline-danger touch-target"
                            onClick={() => handleDeleteDenomination(denomination._id)}
                            style={{flex: 1, padding: '0.5rem', fontSize: '0.75rem', fontWeight: '600'}}
                          >
                            <i className="fas fa-trash" style={{marginRight: '0.25rem'}}></i>
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoucherManagement;