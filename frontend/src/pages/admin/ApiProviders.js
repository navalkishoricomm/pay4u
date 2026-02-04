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
        <h1>API Providers Management</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
        >
          <i className="fas fa-plus me-2"></i>
          Add New Provider
        </button>
      </div>

      <div className="charts-grid">
        {Array.isArray(providers) && providers.length > 0 ? (
          providers.map(provider => (
            <div key={provider._id} className="chart-card d-flex flex-column h-100">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <h3 className="h5 mb-0 text-primary">{provider.displayName || provider.name}</h3>
                <div className="d-flex flex-column align-items-end gap-1">
                  <span className={`badge ${provider.isActive ? 'bg-success' : 'bg-danger'}`}>
                    {provider.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {provider.testMode && <span className="badge bg-warning text-dark">Test Mode</span>}
                </div>
              </div>
              
              <div className="flex-grow-1 mb-3">
                <p className="mb-1 text-muted small"><strong>Base URL:</strong></p>
                <p className="text-break mb-2 small">{provider.baseUrl}</p>
                
                <div className="row g-2 small">
                  <div className="col-6">
                    <p className="mb-0"><strong>Priority:</strong> {provider.priority}</p>
                  </div>
                  <div className="col-6">
                    <p className="mb-0"><strong>Commission:</strong> {provider.commission}%</p>
                  </div>
                  <div className="col-12">
                    <p className="mb-0"><strong>Services:</strong> {provider.supportedServices.join(', ')}</p>
                  </div>
                  <div className="col-12">
                    <p className="mb-0"><strong>Range:</strong> ₹{provider.minAmount} - ₹{provider.maxAmount}</p>
                  </div>
                </div>
              </div>
              
              <div className="d-flex gap-2 mt-auto pt-3 border-top">
                <button 
                  className="btn btn-sm btn-outline-primary flex-grow-1"
                  onClick={() => handleEdit(provider)}
                >
                  <i className="fas fa-edit me-1"></i> Edit
                </button>
                <button 
                  className="btn btn-sm btn-outline-danger flex-grow-1"
                  onClick={() => handleDelete(provider._id)}
                >
                  <i className="fas fa-trash me-1"></i> Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-12 text-center py-5">
            <div className="text-muted mb-3">
              <i className="fas fa-server fa-3x mb-3"></i>
              <p className="h5">No API providers configured yet.</p>
            </div>
            <button 
              className="btn btn-primary"
              onClick={() => setShowModal(true)}
            >
              Add Your First Provider
            </button>
          </div>
        )}
      </div>

      {/* Bootstrap Modal */}
      {showModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editingProvider ? 'Edit Provider' : 'Add New Provider'}</h5>
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
                <form onSubmit={handleSubmit} id="providerForm">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Provider Name (Internal)</label>
                      <input
                        type="text"
                        className="form-control"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        placeholder="e.g., provider_api_v1"
                      />
                    </div>
                    
                    <div className="col-md-6">
                      <label className="form-label">Display Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="displayName"
                        value={formData.displayName}
                        onChange={handleInputChange}
                        required
                        placeholder="e.g., Provider API Service"
                      />
                    </div>
                  
                    <div className="col-md-8">
                      <label className="form-label">Base URL</label>
                      <input
                        type="url"
                        className="form-control"
                        name="baseUrl"
                        value={formData.baseUrl}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div className="col-md-4">
                      <label className="form-label">Auth Type</label>
                      <select
                        className="form-select"
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
                  
                    <div className="col-md-6">
                      <label className="form-label">API Key</label>
                      <input
                        type="text"
                        className="form-control"
                        name="apiKey"
                        value={formData.apiKey}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div className="col-md-6">
                      <label className="form-label">API Secret</label>
                      <input
                        type="password"
                        className="form-control"
                        name="apiSecret"
                        value={formData.apiSecret}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  
                    <div className="col-12 mt-4">
                      <h6 className="border-bottom pb-2">Endpoints</h6>
                    </div>
                    
                    <div className="col-md-6">
                      <label className="form-label">Mobile Recharge Endpoint</label>
                      <input
                        type="text"
                        className="form-control"
                        name="endpoints.mobileRecharge"
                        value={formData.endpoints.mobileRecharge}
                        onChange={handleInputChange}
                        required
                        placeholder="/api/mobile-recharge"
                      />
                    </div>
                    
                    <div className="col-md-6">
                      <label className="form-label">DTH Recharge Endpoint</label>
                      <input
                        type="text"
                        className="form-control"
                        name="endpoints.dthRecharge"
                        value={formData.endpoints.dthRecharge}
                        onChange={handleInputChange}
                        required
                        placeholder="/api/dth-recharge"
                      />
                    </div>
                  
                    <div className="col-md-6">
                      <label className="form-label">Status Check Endpoint</label>
                      <input
                        type="text"
                        className="form-control"
                        name="endpoints.checkStatus"
                        value={formData.endpoints.checkStatus}
                        onChange={handleInputChange}
                        required
                        placeholder="/api/check-status"
                      />
                    </div>
                    
                    <div className="col-md-6">
                      <label className="form-label">Get Operators Endpoint</label>
                      <input
                        type="text"
                        className="form-control"
                        name="endpoints.getOperators"
                        value={formData.endpoints.getOperators}
                        onChange={handleInputChange}
                        placeholder="/api/operators"
                      />
                    </div>
                  
                    <div className="col-12 mt-4">
                      <h6 className="border-bottom pb-2">Configuration</h6>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label">Priority</label>
                      <input
                        type="number"
                        className="form-control"
                        name="priority"
                        value={formData.priority}
                        onChange={handleInputChange}
                        min="1"
                      />
                    </div>
                    
                    <div className="col-md-4">
                      <label className="form-label">Commission (%)</label>
                      <input
                        type="number"
                        className="form-control"
                        name="commission"
                        value={formData.commission}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    
                    <div className="col-md-4">
                      <label className="form-label">Timeout (ms)</label>
                      <input
                        type="number"
                        className="form-control"
                        name="timeout"
                        value={formData.timeout}
                        onChange={handleInputChange}
                        min="1000"
                      />
                    </div>
                  
                    <div className="col-md-6">
                      <label className="form-label">Min Amount</label>
                      <input
                        type="number"
                        className="form-control"
                        name="minAmount"
                        value={formData.minAmount}
                        onChange={handleInputChange}
                        min="1"
                      />
                    </div>
                    
                    <div className="col-md-6">
                      <label className="form-label">Max Amount</label>
                      <input
                        type="number"
                        className="form-control"
                        name="maxAmount"
                        value={formData.maxAmount}
                        onChange={handleInputChange}
                        min="1"
                      />
                    </div>
                  
                    <div className="col-12">
                      <label className="form-label">Supported Services (comma-separated)</label>
                      <input
                        type="text"
                        className="form-control"
                        name="supportedServices"
                        value={formData.supportedServices.join(', ')}
                        onChange={handleInputChange}
                        placeholder="mobile, dth"
                      />
                    </div>
                  
                    <div className="col-12 mt-4">
                      <h6 className="border-bottom pb-2">Response Codes</h6>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Success Codes</label>
                      <input
                        type="text"
                        className="form-control"
                        name="successCodes"
                        value={formData.successCodes.join(', ')}
                        onChange={handleInputChange}
                        placeholder="200, SUCCESS, ACCEPTED"
                      />
                    </div>
                    
                    <div className="col-md-6">
                      <label className="form-label">Failure Codes</label>
                      <input
                        type="text"
                        className="form-control"
                        name="failureCodes"
                        value={formData.failureCodes.join(', ')}
                        onChange={handleInputChange}
                        placeholder="FAILED, ERROR, REJECTED"
                      />
                    </div>
                    
                    <div className="col-12">
                      <label className="form-label">Pending Codes</label>
                      <input
                        type="text"
                        className="form-control"
                        name="pendingCodes"
                        value={formData.pendingCodes.join(', ')}
                        onChange={handleInputChange}
                        placeholder="PENDING, PROCESSING, IN_PROGRESS"
                      />
                    </div>
                  
                    <div className="col-12 mt-3">
                      <div className="d-flex gap-4">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            name="isActive"
                            checked={formData.isActive}
                            onChange={handleInputChange}
                            id="isActiveCheck"
                          />
                          <label className="form-check-label" htmlFor="isActiveCheck">
                            Active
                          </label>
                        </div>
                        
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            name="testMode"
                            checked={formData.testMode}
                            onChange={handleInputChange}
                            id="testModeCheck"
                          />
                          <label className="form-check-label" htmlFor="testModeCheck">
                            Test Mode
                          </label>
                        </div>
                      </div>
                    </div>
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
                <button type="submit" form="providerForm" className="btn btn-primary">
                  {editingProvider ? 'Update Provider' : 'Create Provider'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiProviders;