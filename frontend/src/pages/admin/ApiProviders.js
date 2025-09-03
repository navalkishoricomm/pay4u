import React, { useState, useEffect } from 'react';
// import { useAuth } from '../../context/AuthContext'; // Commented out as not currently used
import './Admin.css';

const ApiProviders = () => {
  // const { user } = useAuth(); // Commented out as not currently used
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    baseUrl: '',
    apiKey: '',
    apiSecret: '',
    authType: 'bearer',
    endpoints: {
      mobileRecharge: '',
      dthRecharge: '',
      checkStatus: '',
      getOperators: ''
    },
    requestFormat: 'json',
    responseFormat: 'json',
    timeout: 30000,
    retryAttempts: 3,
    isActive: true,
    priority: 1,
    successCodes: ['200', 'SUCCESS', 'ACCEPTED'],
    failureCodes: ['FAILED', 'ERROR', 'REJECTED'],
    pendingCodes: ['PENDING', 'PROCESSING', 'IN_PROGRESS'],
    commission: 0,
    minAmount: 10,
    maxAmount: 10000,
    supportedServices: ['mobile', 'dth'],
    testMode: false
  });

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const response = await fetch('/admin/recharge/providers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.status === 'success') {
        // Handle the correct response structure from backend
        if (Array.isArray(data.data?.apiProviders)) {
          setProviders(data.data.apiProviders);
        } else if (Array.isArray(data.data)) {
          setProviders(data.data);
        } else if (Array.isArray(data.providers)) {
          setProviders(data.providers);
        } else {
          console.error('Invalid providers data structure:', data);
          setProviders([]);
        }
      } else {
        console.error('API response error:', data);
        setProviders([]);
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
      setProviders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingProvider 
        ? `/admin/recharge/providers/${editingProvider._id}`
        : '/admin/recharge/providers';
      
      const method = editingProvider ? 'PUT' : 'POST';
      
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
        fetchProviders();
        setShowModal(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error saving provider:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this provider?')) {
      try {
        const response = await fetch(`/admin/recharge/providers/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        const data = await response.json();
        if (data.status === 'success') {
          fetchProviders();
        }
      } catch (error) {
        console.error('Error deleting provider:', error);
      }
    }
  };

  const handleEdit = (provider) => {
    setEditingProvider(provider);
    setFormData({
      name: provider.name,
      displayName: provider.displayName || '',
      baseUrl: provider.baseUrl,
      apiKey: provider.apiKey,
      apiSecret: provider.apiSecret,
      authType: provider.authType || 'bearer',
      endpoints: provider.endpoints || {
        mobileRecharge: '',
        dthRecharge: '',
        checkStatus: '',
        getOperators: ''
      },
      requestFormat: provider.requestFormat,
      responseFormat: provider.responseFormat,
      timeout: provider.timeout,
      retryAttempts: provider.retryAttempts,
      isActive: provider.isActive,
      priority: provider.priority,
      successCodes: provider.successCodes || ['200', 'SUCCESS', 'ACCEPTED'],
      failureCodes: provider.failureCodes || ['FAILED', 'ERROR', 'REJECTED'],
      pendingCodes: provider.pendingCodes || ['PENDING', 'PROCESSING', 'IN_PROGRESS'],
      commission: provider.commission,
      minAmount: provider.minAmount,
      maxAmount: provider.maxAmount,
      supportedServices: provider.supportedServices,
      testMode: provider.testMode || false
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingProvider(null);
    setFormData({
      name: '',
      displayName: '',
      baseUrl: '',
      apiKey: '',
      apiSecret: '',
      authType: 'bearer',
      endpoints: {
        mobileRecharge: '',
        dthRecharge: '',
        checkStatus: '',
        getOperators: ''
      },
      requestFormat: 'json',
      responseFormat: 'json',
      timeout: 30000,
      retryAttempts: 3,
      isActive: true,
      priority: 1,
      successCodes: ['200', 'SUCCESS', 'ACCEPTED'],
      failureCodes: ['FAILED', 'ERROR', 'REJECTED'],
      pendingCodes: ['PENDING', 'PROCESSING', 'IN_PROGRESS'],
      commission: 0,
      minAmount: 10,
      maxAmount: 10000,
      supportedServices: ['mobile', 'dth'],
      testMode: false
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else if (name === 'successCodes' || name === 'failureCodes' || name === 'pendingCodes' || name === 'supportedServices') {
      setFormData(prev => ({
        ...prev,
        [name]: value.split(',').map(item => item.trim())
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>API Providers Management</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
        >
          Add New Provider
        </button>
      </div>

      <div className="providers-grid">
        {Array.isArray(providers) && providers.length > 0 ? (
          providers.map(provider => (
            <div key={provider._id} className="provider-card">
            <div className="provider-header">
              <h3>{provider.name}</h3>
              <div className="provider-status">
                <span className={`status ${provider.isActive ? 'active' : 'inactive'}`}>
                  {provider.isActive ? 'Active' : 'Inactive'}
                </span>
                {provider.isTestMode && <span className="test-mode">Test Mode</span>}
              </div>
            </div>
            
            <div className="provider-details">
              <p><strong>Base URL:</strong> {provider.baseUrl}</p>
              <p><strong>Priority:</strong> {provider.priority}</p>
              <p><strong>Commission:</strong> {provider.commission}%</p>
              <p><strong>Services:</strong> {provider.supportedServices.join(', ')}</p>
              <p><strong>Amount Range:</strong> ₹{provider.minAmount} - ₹{provider.maxAmount}</p>
            </div>
            
            <div className="provider-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => handleEdit(provider)}
              >
                Edit
              </button>
              <button 
                className="btn btn-danger"
                onClick={() => handleDelete(provider._id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))
        ) : (
          <div className="no-providers">
            <p>No API providers configured yet.</p>
            <button 
              className="btn btn-primary"
              onClick={() => setShowModal(true)}
            >
              Add Your First Provider
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingProvider ? 'Edit Provider' : 'Add New Provider'}</h2>
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
            
            <form onSubmit={handleSubmit} className="provider-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Provider Name (Internal)</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., provider_api_v1"
                  />
                </div>
                
                <div className="form-group">
                  <label>Display Name</label>
                  <input
                    type="text"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., Provider API Service"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Base URL</label>
                  <input
                    type="url"
                    name="baseUrl"
                    value={formData.baseUrl}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Auth Type</label>
                  <select
                    name="authType"
                    value={formData.authType}
                    onChange={handleInputChange}
                  >
                    <option value="bearer">Bearer Token</option>
                    <option value="basic">Basic Auth</option>
                    <option value="api_key">API Key</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>API Key</label>
                  <input
                    type="text"
                    name="apiKey"
                    value={formData.apiKey}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>API Secret</label>
                  <input
                    type="password"
                    name="apiSecret"
                    value={formData.apiSecret}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className="form-section">
                <h3>Endpoints</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Mobile Recharge Endpoint</label>
                    <input
                      type="text"
                      name="endpoints.mobileRecharge"
                      value={formData.endpoints.mobileRecharge}
                      onChange={handleInputChange}
                      required
                      placeholder="/api/mobile-recharge"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>DTH Recharge Endpoint</label>
                    <input
                      type="text"
                      name="endpoints.dthRecharge"
                      value={formData.endpoints.dthRecharge}
                      onChange={handleInputChange}
                      required
                      placeholder="/api/dth-recharge"
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Status Check Endpoint</label>
                    <input
                      type="text"
                      name="endpoints.checkStatus"
                      value={formData.endpoints.checkStatus}
                      onChange={handleInputChange}
                      required
                      placeholder="/api/check-status"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Get Operators Endpoint</label>
                    <input
                      type="text"
                      name="endpoints.getOperators"
                      value={formData.endpoints.getOperators}
                      onChange={handleInputChange}
                      placeholder="/api/operators"
                    />
                  </div>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Priority</label>
                  <input
                    type="number"
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    min="1"
                  />
                </div>
                
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
                  <label>Timeout (ms)</label>
                  <input
                    type="number"
                    name="timeout"
                    value={formData.timeout}
                    onChange={handleInputChange}
                    min="1000"
                  />
                </div>
              </div>
              
              <div className="form-row">
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
              
              <div className="form-row">
                <div className="form-group">
                  <label>Supported Services (comma-separated)</label>
                  <input
                    type="text"
                    name="supportedServices"
                    value={formData.supportedServices.join(', ')}
                    onChange={handleInputChange}
                    placeholder="mobile, dth"
                  />
                </div>
              </div>
              
              <div className="form-section">
                <h3>Response Codes</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Success Codes (comma-separated)</label>
                    <input
                      type="text"
                      name="successCodes"
                      value={formData.successCodes.join(', ')}
                      onChange={handleInputChange}
                      placeholder="200, SUCCESS, ACCEPTED"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Failure Codes (comma-separated)</label>
                    <input
                      type="text"
                      name="failureCodes"
                      value={formData.failureCodes.join(', ')}
                      onChange={handleInputChange}
                      placeholder="FAILED, ERROR, REJECTED"
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Pending Codes (comma-separated)</label>
                    <input
                      type="text"
                      name="pendingCodes"
                      value={formData.pendingCodes.join(', ')}
                      onChange={handleInputChange}
                      placeholder="PENDING, PROCESSING, IN_PROGRESS"
                    />
                  </div>
                </div>
              </div>
              
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
                      name="testMode"
                      checked={formData.testMode}
                      onChange={handleInputChange}
                    />
                    Test Mode
                  </label>
                </div>
              </div>
              
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">
                  {editingProvider ? 'Update Provider' : 'Create Provider'}
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

export default ApiProviders;