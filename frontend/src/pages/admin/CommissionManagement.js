import React, { useState, useEffect } from 'react';
import './CommissionManagement.css';

const CommissionManagement = () => {
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCommission, setEditingCommission] = useState(null);
  const [operators, setOperators] = useState([]);
  const [previewData, setPreviewData] = useState(null);
  
  const [formData, setFormData] = useState({
    operator: '',
    transactionType: 'mobile-recharge',
    commissionType: 'percentage',
    commissionValue: '',
    minCommission: '',
    maxCommission: '',
    description: ''
  });

  const transactionTypes = [
    { value: 'mobile-recharge', label: 'Mobile Recharge' },
    { value: 'dth-recharge', label: 'DTH Recharge' },
    { value: 'bill-payment', label: 'Bill Payment' }
  ];

  useEffect(() => {
    fetchCommissions();
    fetchOperators();
  }, []);

  const fetchCommissions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/commissions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCommissions(data.data.commissions);
      } else {
        setError('Failed to fetch commissions');
      }
    } catch (err) {
      setError('Error fetching commissions');
    } finally {
      setLoading(false);
    }
  };

  const fetchOperators = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/commissions/operators', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setOperators(data.data.operators);
      }
    } catch (err) {
      console.error('Error fetching operators:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const url = editingCommission 
        ? `/api/commissions/${editingCommission._id}`
        : '/api/commissions';
      
      const method = editingCommission ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          commissionValue: parseFloat(formData.commissionValue),
          minCommission: formData.minCommission ? parseFloat(formData.minCommission) : 0,
          maxCommission: formData.maxCommission ? parseFloat(formData.maxCommission) : null
        })
      });
      
      if (response.ok) {
        await fetchCommissions();
        resetForm();
        setShowModal(false);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to save commission');
      }
    } catch (err) {
      setError('Error saving commission');
    }
  };

  const handleEdit = (commission) => {
    setEditingCommission(commission);
    setFormData({
      operator: commission.operator,
      transactionType: commission.transactionType,
      commissionType: commission.commissionType,
      commissionValue: commission.commissionValue.toString(),
      minCommission: commission.minCommission.toString(),
      maxCommission: commission.maxCommission ? commission.maxCommission.toString() : '',
      description: commission.description || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this commission structure?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/commissions/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        await fetchCommissions();
      } else {
        setError('Failed to delete commission');
      }
    } catch (err) {
      setError('Error deleting commission');
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/commissions/${id}/toggle-status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        await fetchCommissions();
      } else {
        setError('Failed to toggle commission status');
      }
    } catch (err) {
      setError('Error toggling commission status');
    }
  };

  const getCommissionPreview = async () => {
    if (!formData.operator || !formData.transactionType || !formData.commissionValue) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const testAmount = 1000; // Test with ₹1000
      
      const response = await fetch(
        `/api/commissions/preview?operator=${formData.operator}&transactionType=${formData.transactionType}&amount=${testAmount}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setPreviewData(data.data);
      }
    } catch (err) {
      console.error('Error getting preview:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      operator: '',
      transactionType: 'mobile-recharge',
      commissionType: 'percentage',
      commissionValue: '',
      minCommission: '',
      maxCommission: '',
      description: ''
    });
    setEditingCommission(null);
    setPreviewData(null);
  };

  if (loading) {
    return <div className="loading">Loading commissions...</div>;
  }

  return (
    <div className="commission-management">
      <div className="commission-header">
        <h2>Commission Management</h2>
        <button 
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          Add New Commission
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="commission-table-container">
        <table className="commission-table">
          <thead>
            <tr>
              <th>Operator</th>
              <th>Transaction Type</th>
              <th>Commission Type</th>
              <th>Value</th>
              <th>Min/Max</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {commissions.map(commission => (
              <tr key={commission._id}>
                <td>{commission.operator}</td>
                <td className="transaction-type">
                  {transactionTypes.find(t => t.value === commission.transactionType)?.label}
                </td>
                <td>
                  <span className={`commission-type ${commission.commissionType}`}>
                    {commission.commissionType === 'percentage' ? 'Percentage' : 'Fixed'}
                  </span>
                </td>
                <td>
                  {commission.commissionType === 'percentage' 
                    ? `${commission.commissionValue}%` 
                    : `₹${commission.commissionValue}`
                  }
                </td>
                <td>
                  Min: ₹{commission.minCommission}<br/>
                  Max: {commission.maxCommission ? `₹${commission.maxCommission}` : 'No limit'}
                </td>
                <td>
                  <span className={`status ${commission.isActive ? 'active' : 'inactive'}`}>
                    {commission.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleEdit(commission)}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn btn-sm btn-warning"
                      onClick={() => handleToggleStatus(commission._id)}
                    >
                      {commission.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button 
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(commission._id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {commissions.length === 0 && (
          <div className="no-data">No commission structures found. Add one to get started.</div>
        )}
      </div>

      {/* Modal for Add/Edit Commission */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingCommission ? 'Edit Commission' : 'Add New Commission'}</h3>
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
            
            <form onSubmit={handleSubmit} className="commission-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Operator *</label>
                  <input
                    type="text"
                    name="operator"
                    value={formData.operator}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., Airtel, Jio, Vodafone"
                  />
                </div>
                
                <div className="form-group">
                  <label>Transaction Type *</label>
                  <select
                    name="transactionType"
                    value={formData.transactionType}
                    onChange={handleInputChange}
                    required
                  >
                    {transactionTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Commission Type *</label>
                  <select
                    name="commissionType"
                    value={formData.commissionType}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>
                    Commission Value * 
                    {formData.commissionType === 'percentage' ? '(%)' : '(₹)'}
                  </label>
                  <input
                    type="number"
                    name="commissionValue"
                    value={formData.commissionValue}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder={formData.commissionType === 'percentage' ? '2.5' : '10'}
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Minimum Commission (₹)</label>
                  <input
                    type="number"
                    name="minCommission"
                    value={formData.minCommission}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    placeholder="0"
                  />
                </div>
                
                <div className="form-group">
                  <label>Maximum Commission (₹)</label>
                  <input
                    type="number"
                    name="maxCommission"
                    value={formData.maxCommission}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    placeholder="Leave empty for no limit"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Optional description for this commission structure"
                />
              </div>
              
              {previewData && (
                <div className="commission-preview">
                  <h4>Preview (for ₹1000 transaction):</h4>
                  <p>Commission: ₹{previewData.commissionAmount}</p>
                </div>
              )}
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-info"
                  onClick={getCommissionPreview}
                >
                  Preview
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCommission ? 'Update' : 'Create'} Commission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommissionManagement;