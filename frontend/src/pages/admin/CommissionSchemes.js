import React, { useState, useEffect } from 'react';
import './CommissionSchemes.css';

const CommissionSchemes = () => {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingScheme, setEditingScheme] = useState(null);
  const [formData, setFormData] = useState({
    schemeName: '',
    description: '',
    commissions: [],
    isDefault: false
  });
  const [newCommission, setNewCommission] = useState({
    operator: '',
    transactionType: 'mobile-recharge',
    commissionType: 'percentage',
    commissionValue: '',
    minCommission: '',
    maxCommission: ''
  });

  const transactionTypes = [
    { value: 'mobile-recharge', label: 'Mobile Recharge' },
    { value: 'dth-recharge', label: 'DTH Recharge' },
    { value: 'bill-payment', label: 'Bill Payment' }
  ];

  const operators = [
    'Airtel', 'Jio', 'Vi', 'BSNL', 'Tata Sky', 'Dish TV', 'Sun Direct', 'Videocon D2H'
  ];

  useEffect(() => {
    fetchSchemes();
  }, []);

  const fetchSchemes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/commission-schemes', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSchemes(data.data.schemes);
      } else {
        console.error('Failed to fetch commission schemes');
      }
    } catch (error) {
      console.error('Error fetching commission schemes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.commissions.length === 0) {
      alert('Please add at least one commission rule');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const url = editingScheme 
        ? `/api/commission-schemes/${editingScheme._id}`
        : '/api/commission-schemes';
      
      const method = editingScheme ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchSchemes();
        resetForm();
        setShowModal(false);
        alert(editingScheme ? 'Scheme updated successfully!' : 'Scheme created successfully!');
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error saving scheme:', error);
      alert('Error saving scheme');
    }
  };

  const handleEdit = (scheme) => {
    setEditingScheme(scheme);
    setFormData({
      schemeName: scheme.schemeName,
      description: scheme.description || '',
      commissions: [...scheme.commissions],
      isDefault: scheme.isDefault
    });
    setShowModal(true);
  };

  const handleDelete = async (schemeId) => {
    if (!window.confirm('Are you sure you want to delete this commission scheme?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/commission-schemes/${schemeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchSchemes();
        alert('Scheme deleted successfully!');
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error deleting scheme:', error);
      alert('Error deleting scheme');
    }
  };

  const handleSetDefault = async (schemeId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/commission-schemes/${schemeId}/set-default`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchSchemes();
        alert('Default scheme updated successfully!');
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error setting default scheme:', error);
      alert('Error setting default scheme');
    }
  };

  const addCommissionRule = () => {
    if (!newCommission.operator || !newCommission.commissionValue) {
      alert('Please fill in operator and commission value');
      return;
    }

    // Check for duplicate operator-transactionType combination
    const duplicate = formData.commissions.find(
      c => c.operator === newCommission.operator && c.transactionType === newCommission.transactionType
    );

    if (duplicate) {
      alert('Commission rule for this operator and transaction type already exists');
      return;
    }

    const commission = {
      ...newCommission,
      commissionValue: parseFloat(newCommission.commissionValue),
      minCommission: newCommission.minCommission ? parseFloat(newCommission.minCommission) : 0,
      maxCommission: newCommission.maxCommission ? parseFloat(newCommission.maxCommission) : null
    };

    setFormData({
      ...formData,
      commissions: [...formData.commissions, commission]
    });

    setNewCommission({
      operator: '',
      transactionType: 'mobile-recharge',
      commissionType: 'percentage',
      commissionValue: '',
      minCommission: '',
      maxCommission: ''
    });
  };

  const removeCommissionRule = (index) => {
    const updatedCommissions = formData.commissions.filter((_, i) => i !== index);
    setFormData({ ...formData, commissions: updatedCommissions });
  };

  const resetForm = () => {
    setFormData({
      schemeName: '',
      description: '',
      commissions: [],
      isDefault: false
    });
    setNewCommission({
      operator: '',
      transactionType: 'mobile-recharge',
      commissionType: 'percentage',
      commissionValue: '',
      minCommission: '',
      maxCommission: ''
    });
    setEditingScheme(null);
  };

  if (loading) {
    return <div className="loading">Loading commission schemes...</div>;
  }

  return (
    <div className="commission-schemes">
      <div className="commission-schemes-header">
        <h2>Commission Schemes</h2>
        <button 
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          Create New Scheme
        </button>
      </div>

      <div className="schemes-grid">
        {schemes.map((scheme) => (
          <div key={scheme._id} className={`scheme-card ${scheme.isDefault ? 'default-scheme' : ''}`}>
            <div className="scheme-header">
              <h3>{scheme.schemeName}</h3>
              {scheme.isDefault && <span className="default-badge">Default</span>}
            </div>
            
            <p className="scheme-description">{scheme.description || 'No description'}</p>
            
            <div className="scheme-stats">
              <span>{scheme.commissions.length} commission rules</span>
              <span className={`status ${scheme.isActive ? 'active' : 'inactive'}`}>
                {scheme.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="commission-rules">
              {scheme.commissions.slice(0, 3).map((commission, index) => (
                <div key={index} className="commission-rule-preview">
                  <span className="operator">{commission.operator}</span>
                  <span className="type">{commission.transactionType}</span>
                  <span className="value">
                    {commission.commissionType === 'percentage' 
                      ? `${commission.commissionValue}%` 
                      : `₹${commission.commissionValue}`
                    }
                  </span>
                </div>
              ))}
              {scheme.commissions.length > 3 && (
                <div className="more-rules">+{scheme.commissions.length - 3} more</div>
              )}
            </div>

            <div className="scheme-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => handleEdit(scheme)}
              >
                Edit
              </button>
              {!scheme.isDefault && (
                <button 
                  className="btn btn-outline"
                  onClick={() => handleSetDefault(scheme._id)}
                >
                  Set Default
                </button>
              )}
              <button 
                className="btn btn-danger"
                onClick={() => handleDelete(scheme._id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingScheme ? 'Edit Commission Scheme' : 'Create Commission Scheme'}</h3>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group">
                <label>Scheme Name *</label>
                <input
                  type="text"
                  value={formData.schemeName}
                  onChange={(e) => setFormData({ ...formData, schemeName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  />
                  Set as default scheme
                </label>
              </div>

              <div className="commission-rules-section">
                <h4>Commission Rules</h4>
                
                <div className="add-commission-form">
                  <div className="form-row">
                    <select
                      value={newCommission.operator}
                      onChange={(e) => setNewCommission({ ...newCommission, operator: e.target.value })}
                    >
                      <option value="">Select Operator</option>
                      {operators.map(op => (
                        <option key={op} value={op}>{op}</option>
                      ))}
                    </select>

                    <select
                      value={newCommission.transactionType}
                      onChange={(e) => setNewCommission({ ...newCommission, transactionType: e.target.value })}
                    >
                      {transactionTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>

                    <select
                      value={newCommission.commissionType}
                      onChange={(e) => setNewCommission({ ...newCommission, commissionType: e.target.value })}
                    >
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed Amount</option>
                    </select>

                    <input
                      type="number"
                      step="0.01"
                      placeholder={newCommission.commissionType === 'percentage' ? 'Rate %' : 'Amount ₹'}
                      value={newCommission.commissionValue}
                      onChange={(e) => setNewCommission({ ...newCommission, commissionValue: e.target.value })}
                    />

                    <input
                      type="number"
                      step="0.01"
                      placeholder="Min ₹"
                      value={newCommission.minCommission}
                      onChange={(e) => setNewCommission({ ...newCommission, minCommission: e.target.value })}
                    />

                    <input
                      type="number"
                      step="0.01"
                      placeholder="Max ₹"
                      value={newCommission.maxCommission}
                      onChange={(e) => setNewCommission({ ...newCommission, maxCommission: e.target.value })}
                    />

                    <button type="button" onClick={addCommissionRule} className="btn btn-primary">
                      Add
                    </button>
                  </div>
                </div>

                <div className="commission-rules-list">
                  {formData.commissions.map((commission, index) => (
                    <div key={index} className="commission-rule">
                      <span>{commission.operator}</span>
                      <span>{commission.transactionType}</span>
                      <span>
                        {commission.commissionType === 'percentage' 
                          ? `${commission.commissionValue}%` 
                          : `₹${commission.commissionValue}`
                        }
                      </span>
                      <span>Min: ₹{commission.minCommission}</span>
                      <span>Max: {commission.maxCommission ? `₹${commission.maxCommission}` : 'None'}</span>
                      <button 
                        type="button" 
                        onClick={() => removeCommissionRule(index)}
                        className="btn btn-danger btn-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingScheme ? 'Update Scheme' : 'Create Scheme'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommissionSchemes;