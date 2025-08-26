import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import './Admin.css';

const OperatorConfig = () => {
  const { user } = useAuth();
  const [operators, setOperators] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingOperator, setEditingOperator] = useState(null);
  const [formData, setFormData] = useState({
    operatorCode: '',
    operatorName: '',
    serviceType: 'mobile',
    processingMode: 'api',
    primaryApiProvider: '',
    fallbackApiProvider: '',
    isActive: true,
    commission: 0,
    minAmount: 10,
    maxAmount: 10000,
    allowedAmounts: [],
    circles: [],
    validationRules: {
      numberLength: { min: 10, max: 12 },
      numberPattern: '',
      allowedPrefixes: []
    },
    manualProcessing: {
      requiresApproval: false,
      autoApprovalLimit: 0,
      approvalWorkflow: []
    },
    apiMapping: {
      numberField: 'mobile',
      amountField: 'amount',
      operatorField: 'operator'
    },
    maintenanceMode: false,
    notes: ''
  });

  const circles = [
    'ANDHRA_PRADESH', 'ASSAM', 'BIHAR_JHARKHAND', 'CHENNAI', 'DELHI',
    'GUJARAT', 'HARYANA', 'HIMACHAL_PRADESH', 'JAMMU_KASHMIR', 'KARNATAKA',
    'KERALA', 'KOLKATA', 'MADHYA_PRADESH', 'MAHARASHTRA', 'MUMBAI',
    'NORTH_EAST', 'ORISSA', 'PUNJAB', 'RAJASTHAN', 'TAMIL_NADU',
    'UP_EAST', 'UP_WEST', 'WEST_BENGAL'
  ];

  useEffect(() => {
    fetchOperators();
    fetchProviders();
  }, []);

  const fetchOperators = async () => {
    try {
      const response = await fetch('/api/admin/recharge/operators', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.status === 'success') {
        setOperators(data.data);
      }
    } catch (error) {
      console.error('Error fetching operators:', error);
    }
  };

  const fetchProviders = async () => {
    try {
      const response = await fetch('/api/admin/recharge/providers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.status === 'success') {
        setProviders(data.data.filter(p => p.isActive));
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingOperator 
        ? `/api/admin/recharge/operators/${editingOperator._id}`
        : '/api/admin/recharge/operators';
      
      const method = editingOperator ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      if (data.status === 'success') {
        fetchOperators();
        setShowModal(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error saving operator:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this operator configuration?')) {
      try {
        const response = await fetch(`/api/admin/recharge/operators/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        const data = await response.json();
        if (data.status === 'success') {
          fetchOperators();
        }
      } catch (error) {
        console.error('Error deleting operator:', error);
      }
    }
  };

  const handleEdit = (operator) => {
    setEditingOperator(operator);
    setFormData({
      operatorCode: operator.operatorCode,
      operatorName: operator.operatorName,
      serviceType: operator.serviceType,
      processingMode: operator.processingMode,
      primaryApiProvider: operator.primaryApiProvider?._id || '',
      fallbackApiProvider: operator.fallbackApiProvider?._id || '',
      isActive: operator.isActive,
      commission: operator.commission,
      minAmount: operator.minAmount,
      maxAmount: operator.maxAmount,
      allowedAmounts: operator.allowedAmounts,
      circles: operator.circles,
      validationRules: operator.validationRules,
      manualProcessing: operator.manualProcessing,
      apiMapping: operator.apiMapping,
      maintenanceMode: operator.maintenanceMode,
      notes: operator.notes
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingOperator(null);
    setFormData({
      operatorCode: '',
      operatorName: '',
      serviceType: 'mobile',
      processingMode: 'api',
      primaryApiProvider: '',
      fallbackApiProvider: '',
      isActive: true,
      commission: 0,
      minAmount: 10,
      maxAmount: 10000,
      allowedAmounts: [],
      circles: [],
      validationRules: {
        numberLength: { min: 10, max: 12 },
        numberPattern: '',
        allowedPrefixes: []
      },
      manualProcessing: {
        requiresApproval: false,
        autoApprovalLimit: 0,
        approvalWorkflow: []
      },
      apiMapping: {
        numberField: 'mobile',
        amountField: 'amount',
        operatorField: 'operator'
      },
      maintenanceMode: false,
      notes: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.includes('.')) {
      const keys = name.split('.');
      setFormData(prev => {
        const newData = { ...prev };
        let current = newData;
        for (let i = 0; i < keys.length - 1; i++) {
          current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = type === 'checkbox' ? checked : value;
        return newData;
      });
    } else if (name === 'allowedAmounts') {
      setFormData(prev => ({
        ...prev,
        [name]: value.split(',').map(item => parseInt(item.trim())).filter(item => !isNaN(item))
      }));
    } else if (name === 'circles') {
      const selectedCircles = Array.from(e.target.selectedOptions, option => option.value);
      setFormData(prev => ({
        ...prev,
        [name]: selectedCircles
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const getProviderName = (providerId) => {
    const provider = providers.find(p => p._id === providerId);
    return provider ? provider.name : 'Not Selected';
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Operator Configuration</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
        >
          Add New Operator
        </button>
      </div>

      <div className="operators-table">
        <table>
          <thead>
            <tr>
              <th>Operator</th>
              <th>Service</th>
              <th>Processing Mode</th>
              <th>Primary API</th>
              <th>Status</th>
              <th>Commission</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {operators.map(operator => (
              <tr key={operator._id}>
                <td>
                  <div className="operator-info">
                    <strong>{operator.operatorName}</strong>
                    <small>{operator.operatorCode}</small>
                  </div>
                </td>
                <td>
                  <span className={`service-type ${operator.serviceType}`}>
                    {operator.serviceType.toUpperCase()}
                  </span>
                </td>
                <td>
                  <span className={`processing-mode ${operator.processingMode}`}>
                    {operator.processingMode.toUpperCase()}
                  </span>
                </td>
                <td>{getProviderName(operator.primaryApiProvider?._id)}</td>
                <td>
                  <span className={`status ${operator.isActive ? 'active' : 'inactive'}`}>
                    {operator.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {operator.maintenanceMode && <span className="maintenance">Maintenance</span>}
                </td>
                <td>{operator.commission}%</td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleEdit(operator)}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(operator._id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal large-modal">
            <div className="modal-header">
              <h2>{editingOperator ? 'Edit Operator' : 'Add New Operator'}</h2>
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
            
            <form onSubmit={handleSubmit} className="operator-form">
              <div className="form-section">
                <h3>Basic Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Operator Code</label>
                    <input
                      type="text"
                      name="operatorCode"
                      value={formData.operatorCode}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Operator Name</label>
                    <input
                      type="text"
                      name="operatorName"
                      value={formData.operatorName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Service Type</label>
                    <select
                      name="serviceType"
                      value={formData.serviceType}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="mobile">Mobile</option>
                      <option value="dth">DTH</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="form-section">
                <h3>Processing Configuration</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Processing Mode</label>
                    <select
                      name="processingMode"
                      value={formData.processingMode}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="api">API</option>
                      <option value="manual">Manual</option>
                      <option value="disabled">Disabled</option>
                    </select>
                  </div>
                  
                  {formData.processingMode === 'api' && (
                    <>
                      <div className="form-group">
                        <label>Primary API Provider</label>
                        <select
                          name="primaryApiProvider"
                          value={formData.primaryApiProvider}
                          onChange={handleInputChange}
                        >
                          <option value="">Select Provider</option>
                          {providers.map(provider => (
                            <option key={provider._id} value={provider._id}>
                              {provider.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="form-group">
                        <label>Fallback API Provider</label>
                        <select
                          name="fallbackApiProvider"
                          value={formData.fallbackApiProvider}
                          onChange={handleInputChange}
                        >
                          <option value="">Select Provider</option>
                          {providers.map(provider => (
                            <option key={provider._id} value={provider._id}>
                              {provider.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              <div className="form-section">
                <h3>Amount Configuration</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Commission (%)</label>
                    <input
                      type="number"
                      name="commission"
                      value={formData.commission}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Min Amount</label>
                    <input
                      type="number"
                      name="minAmount"
                      value={formData.minAmount}
                      onChange={handleInputChange}
                      min="1"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Max Amount</label>
                    <input
                      type="number"
                      name="maxAmount"
                      value={formData.maxAmount}
                      onChange={handleInputChange}
                      min="1"
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Allowed Amounts (comma-separated)</label>
                  <input
                    type="text"
                    name="allowedAmounts"
                    value={formData.allowedAmounts.join(', ')}
                    onChange={handleInputChange}
                    placeholder="10, 20, 50, 100, 200, 500"
                  />
                </div>
              </div>
              
              {formData.serviceType === 'mobile' && (
                <div className="form-section">
                  <h3>Circles</h3>
                  <div className="form-group">
                    <label>Supported Circles</label>
                    <select
                      name="circles"
                      multiple
                      value={formData.circles}
                      onChange={handleInputChange}
                      className="multi-select"
                    >
                      {circles.map(circle => (
                        <option key={circle} value={circle}>
                          {circle.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
              
              <div className="form-section">
                <h3>Status & Settings</h3>
                <div className="form-row">
                  <div className="form-group checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleInputChange}
                      />
                      Active
                    </label>
                  </div>
                  
                  <div className="form-group checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        name="maintenanceMode"
                        checked={formData.maintenanceMode}
                        onChange={handleInputChange}
                      />
                      Maintenance Mode
                    </label>
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Additional notes or configuration details"
                  />
                </div>
              </div>
              
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">
                  {editingOperator ? 'Update Operator' : 'Create Operator'}
                </button>
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
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperatorConfig;