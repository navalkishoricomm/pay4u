import React, { useState, useEffect } from 'react';
import './UserCommissions.css';

const UserCommissions = () => {
  const [users, setUsers] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userCommissions, setUserCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [selectedScheme, setSelectedScheme] = useState('');
  const [customCommission, setCustomCommission] = useState({
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

  const operators = [
    'Airtel', 'Jio', 'Vi', 'BSNL', 'Tata Sky', 'Dish TV', 'Sun Direct', 'Videocon D2H'
  ];

  useEffect(() => {
    fetchUsers();
    fetchSchemes();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.data.users || data.users || []);
      } else {
        console.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

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
        setSchemes(data.data.schemes || []);
      } else {
        console.error('Failed to fetch commission schemes');
      }
    } catch (error) {
      console.error('Error fetching commission schemes:', error);
    }
  };

  const fetchUserCommissions = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/commission-schemes/users/${userId}/commissions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserCommissions(data.data.commissions || []);
      } else {
        console.error('Failed to fetch user commissions');
        setUserCommissions([]);
      }
    } catch (error) {
      console.error('Error fetching user commissions:', error);
      setUserCommissions([]);
    }
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    fetchUserCommissions(user._id);
  };

  const handleAssignScheme = async () => {
    if (!selectedScheme || !selectedUser) {
      alert('Please select a scheme');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/commission-schemes/${selectedScheme}/apply-to-user`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: selectedUser._id })
      });

      if (response.ok) {
        await fetchUserCommissions(selectedUser._id);
        setShowAssignModal(false);
        setSelectedScheme('');
        alert('Scheme assigned successfully!');
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error assigning scheme:', error);
      alert('Error assigning scheme');
    }
  };

  const handleAddCustomCommission = async () => {
    if (!customCommission.operator || !customCommission.commissionValue) {
      alert('Please fill in operator and commission value');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/commission-schemes/users/${selectedUser._id}/commissions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...customCommission,
          commissionValue: parseFloat(customCommission.commissionValue),
          minCommission: customCommission.minCommission ? parseFloat(customCommission.minCommission) : 0,
          maxCommission: customCommission.maxCommission ? parseFloat(customCommission.maxCommission) : null
        })
      });

      if (response.ok) {
        await fetchUserCommissions(selectedUser._id);
        setShowCustomModal(false);
        resetCustomCommission();
        alert('Custom commission added successfully!');
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error adding custom commission:', error);
      alert('Error adding custom commission');
    }
  };

  const handleRemoveCommission = async (commissionId) => {
    if (!window.confirm('Are you sure you want to remove this commission?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/commission-schemes/users/${selectedUser._id}/commissions/${commissionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchUserCommissions(selectedUser._id);
        alert('Commission removed successfully!');
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error removing commission:', error);
      alert('Error removing commission');
    }
  };

  const resetCustomCommission = () => {
    setCustomCommission({
      operator: '',
      transactionType: 'mobile-recharge',
      commissionType: 'percentage',
      commissionValue: '',
      minCommission: '',
      maxCommission: '',
      description: ''
    });
  };

  if (loading) {
    return <div className="loading">Loading users...</div>;
  }

  return (
    <div className="user-commissions">
      <div className="user-commissions-header">
        <h2>User Commission Management</h2>
      </div>

      <div className="user-commissions-content">
        <div className="users-sidebar">
          <h3>Users</h3>
          <div className="users-list">
            {users.map((user) => (
              <div 
                key={user._id} 
                className={`user-item ${selectedUser?._id === user._id ? 'selected' : ''}`}
                onClick={() => handleUserSelect(user)}
              >
                <div className="user-info">
                  <div className="user-name">{user.name || user.username}</div>
                  <div className="user-email">{user.email}</div>
                  <div className="user-role">{user.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="commissions-main">
          {selectedUser ? (
            <>
              <div className="user-header">
                <div className="user-details">
                  <h3>{selectedUser.name || selectedUser.username}</h3>
                  <p>{selectedUser.email} • {selectedUser.role}</p>
                </div>
                <div className="user-actions">
                  <button 
                    className="btn btn-primary"
                    onClick={() => setShowAssignModal(true)}
                  >
                    Assign Scheme
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => setShowCustomModal(true)}
                  >
                    Add Custom Commission
                  </button>
                </div>
              </div>

              <div className="commissions-section">
                <h4>Current Commissions ({userCommissions.length})</h4>
                
                {userCommissions.length === 0 ? (
                  <div className="no-commissions">
                    <p>No custom commissions assigned. User will use default commission scheme.</p>
                  </div>
                ) : (
                  <div className="commissions-grid">
                    {userCommissions.map((commission) => (
                      <div key={commission._id} className="commission-card">
                        <div className="commission-header">
                          <div className="operator">{commission.operator}</div>
                          <div className="transaction-type">{commission.transactionType}</div>
                          {commission.isCustom && <span className="custom-badge">Custom</span>}
                          {commission.schemeId && <span className="scheme-badge">Scheme</span>}
                        </div>
                        
                        <div className="commission-details">
                          <div className="commission-value">
                            {commission.commissionType === 'percentage' 
                              ? `${commission.commissionValue}%` 
                              : `₹${commission.commissionValue}`
                            }
                          </div>
                          
                          <div className="commission-limits">
                            <span>Min: ₹{commission.minCommission}</span>
                            <span>Max: {commission.maxCommission ? `₹${commission.maxCommission}` : 'None'}</span>
                          </div>
                        </div>

                        {commission.description && (
                          <div className="commission-description">
                            {commission.description}
                          </div>
                        )}

                        <div className="commission-actions">
                          <button 
                            className="btn btn-danger btn-sm"
                            onClick={() => handleRemoveCommission(commission._id)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="no-user-selected">
              <h3>Select a user to manage their commissions</h3>
              <p>Choose a user from the sidebar to view and manage their commission settings.</p>
            </div>
          )}
        </div>
      </div>

      {/* Assign Scheme Modal */}
      {showAssignModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Assign Commission Scheme</h3>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedScheme('');
                }}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Select Commission Scheme</label>
                <select
                  value={selectedScheme}
                  onChange={(e) => setSelectedScheme(e.target.value)}
                >
                  <option value="">Choose a scheme...</option>
                  {schemes.map((scheme) => (
                    <option key={scheme._id} value={scheme._id}>
                      {scheme.schemeName} {scheme.isDefault ? '(Default)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {selectedScheme && (
                <div className="scheme-preview">
                  {(() => {
                    const scheme = schemes.find(s => s._id === selectedScheme);
                    return scheme ? (
                      <div>
                        <h4>Scheme Preview: {scheme.schemeName}</h4>
                        <p>{scheme.description}</p>
                        <div className="commission-rules-preview">
                          {scheme.commissions.map((commission, index) => (
                            <div key={index} className="commission-rule-preview">
                              <span>{commission.operator}</span>
                              <span>{commission.transactionType}</span>
                              <span>
                                {commission.commissionType === 'percentage' 
                                  ? `${commission.commissionValue}%` 
                                  : `₹${commission.commissionValue}`
                                }
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null;
                  })()
                  }
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedScheme('');
                }}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleAssignScheme}
                disabled={!selectedScheme}
              >
                Assign Scheme
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Commission Modal */}
      {showCustomModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Add Custom Commission</h3>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowCustomModal(false);
                  resetCustomCommission();
                }}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>Operator *</label>
                  <select
                    value={customCommission.operator}
                    onChange={(e) => setCustomCommission({ ...customCommission, operator: e.target.value })}
                  >
                    <option value="">Select Operator</option>
                    {operators.map(op => (
                      <option key={op} value={op}>{op}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Transaction Type</label>
                  <select
                    value={customCommission.transactionType}
                    onChange={(e) => setCustomCommission({ ...customCommission, transactionType: e.target.value })}
                  >
                    {transactionTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Commission Type</label>
                  <select
                    value={customCommission.commissionType}
                    onChange={(e) => setCustomCommission({ ...customCommission, commissionType: e.target.value })}
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Commission Value *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder={customCommission.commissionType === 'percentage' ? 'Rate %' : 'Amount ₹'}
                    value={customCommission.commissionValue}
                    onChange={(e) => setCustomCommission({ ...customCommission, commissionValue: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Minimum Commission (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={customCommission.minCommission}
                    onChange={(e) => setCustomCommission({ ...customCommission, minCommission: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Maximum Commission (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="No limit"
                    value={customCommission.maxCommission}
                    onChange={(e) => setCustomCommission({ ...customCommission, maxCommission: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={customCommission.description}
                  onChange={(e) => setCustomCommission({ ...customCommission, description: e.target.value })}
                  rows="3"
                  placeholder="Optional description for this commission rule"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  setShowCustomModal(false);
                  resetCustomCommission();
                }}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleAddCustomCommission}
              >
                Add Commission
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserCommissions;