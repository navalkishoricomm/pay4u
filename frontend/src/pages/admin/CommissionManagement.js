import React, { useState, useEffect } from 'react';
import './Admin.css';

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
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Commission Management</h1>
        <button 
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          <i className="bi bi-plus-lg me-2"></i>
          Add New Commission
        </button>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}

      <div className="admin-card">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
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
                  <td className="fw-medium">{commission.operator}</td>
                  <td>
                    <span className="badge bg-light text-dark border">
                      {transactionTypes.find(t => t.value === commission.transactionType)?.label}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${commission.commissionType === 'percentage' ? 'bg-info bg-opacity-10 text-info' : 'bg-warning bg-opacity-10 text-warning'}`}>
                      {commission.commissionType === 'percentage' ? 'Percentage' : 'Fixed'}
                    </span>
                  </td>
                  <td className="fw-bold text-primary">
                    {commission.commissionType === 'percentage' 
                      ? `${commission.commissionValue}%` 
                      : `₹${commission.commissionValue}`
                    }
                  </td>
                  <td className="small text-muted">
                    <div>Min: ₹{commission.minCommission}</div>
                    <div>Max: {commission.maxCommission ? `₹${commission.maxCommission}` : 'No limit'}</div>
                  </td>
                  <td>
                    <span className={`badge ${commission.isActive ? 'bg-success' : 'bg-secondary'}`}>
                      {commission.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="btn-group btn-group-sm">
                      <button 
                        className="btn btn-outline-secondary"
                        onClick={() => handleEdit(commission)}
                        title="Edit"
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button 
                        className={`btn ${commission.isActive ? 'btn-outline-warning' : 'btn-outline-success'}`}
                        onClick={() => handleToggleStatus(commission._id)}
                        title={commission.isActive ? 'Deactivate' : 'Activate'}
                      >
                        <i className={`bi ${commission.isActive ? 'bi-pause-circle' : 'bi-play-circle'}`}></i>
                      </button>
                      <button 
                        className="btn btn-outline-danger"
                        onClick={() => handleDelete(commission._id)}
                        title="Delete"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {commissions.length === 0 && (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-inbox fs-1 d-block mb-3"></i>
              <p>No commission structures found. Add one to get started.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal for Add/Edit Commission */}
      {showModal && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{editingCommission ? 'Edit Commission' : 'Add New Commission'}</h5>
                  <button 
                    type="button" 
                    className="btn-close"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                  ></button>
                </div>
                
                <div className="modal-body">
                  <form onSubmit={handleSubmit} id="commissionForm">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">Operator <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className="form-control"
                          name="operator"
                          value={formData.operator}
                          onChange={handleInputChange}
                          required
                          placeholder="e.g., Airtel, Jio, Vodafone"
                        />
                      </div>
                      
                      <div className="col-md-6">
                        <label className="form-label">Transaction Type <span className="text-danger">*</span></label>
                        <select
                          className="form-select"
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

                      <div className="col-md-6">
                        <label className="form-label">Commission Type <span className="text-danger">*</span></label>
                        <select
                          className="form-select"
                          name="commissionType"
                          value={formData.commissionType}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="percentage">Percentage</option>
                          <option value="fixed">Fixed Amount</option>
                        </select>
                      </div>
                      
                      <div className="col-md-6">
                        <label className="form-label">
                          Commission Value <span className="text-danger">*</span>
                          {formData.commissionType === 'percentage' ? ' (%)' : ' (₹)'}
                        </label>
                        <input
                          type="number"
                          className="form-control"
                          name="commissionValue"
                          value={formData.commissionValue}
                          onChange={handleInputChange}
                          required
                          min="0"
                          step="0.01"
                          placeholder={formData.commissionType === 'percentage' ? '2.5' : '10'}
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Minimum Commission (₹)</label>
                        <input
                          type="number"
                          className="form-control"
                          name="minCommission"
                          value={formData.minCommission}
                          onChange={handleInputChange}
                          min="0"
                          step="0.01"
                          placeholder="0"
                        />
                      </div>
                      
                      <div className="col-md-6">
                        <label className="form-label">Maximum Commission (₹)</label>
                        <input
                          type="number"
                          className="form-control"
                          name="maxCommission"
                          value={formData.maxCommission}
                          onChange={handleInputChange}
                          min="0"
                          step="0.01"
                          placeholder="Leave empty for no limit"
                        />
                      </div>
                      
                      <div className="col-12">
                        <label className="form-label">Description</label>
                        <textarea
                          className="form-control"
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          rows="3"
                          placeholder="Optional description for this commission structure"
                        />
                      </div>

                      {previewData && (
                        <div className="col-12">
                          <div className="alert alert-info d-flex align-items-center mb-0">
                            <i className="bi bi-calculator me-2"></i>
                            <div>
                              <strong>Preview (for ₹1000 transaction):</strong> Commission: ₹{previewData.commissionAmount}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </form>
                </div>
                
                <div className="modal-footer">
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
                    className="btn btn-info text-white"
                    onClick={getCommissionPreview}
                  >
                    <i className="bi bi-eye me-1"></i> Preview
                  </button>
                  <button type="submit" form="commissionForm" className="btn btn-primary">
                    {editingCommission ? 'Update' : 'Create'} Commission
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CommissionManagement;