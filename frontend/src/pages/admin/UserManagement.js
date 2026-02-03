import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  SHOW_RECHARGES,
  SHOW_BILL_PAYMENTS,
  SHOW_MONEY_TRANSFER,
  SHOW_AEPS,
  SHOW_VOUCHERS
} from '../../config/featureFlags';
import './UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [editingPerms, setEditingPerms] = useState({});

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/auth/admin/users');
      const fetched = response.data.data.users || [];
      // Ensure featurePermissions exist and seed local editing state
      const normalized = fetched.map(u => ({
        ...u,
        featurePermissions: {
          showRecharges: u.featurePermissions?.showRecharges ?? SHOW_RECHARGES,
          showBillPayments: u.featurePermissions?.showBillPayments ?? SHOW_BILL_PAYMENTS,
          showMoneyTransfer: u.featurePermissions?.showMoneyTransfer ?? SHOW_MONEY_TRANSFER,
          showAEPS: u.featurePermissions?.showAEPS ?? SHOW_AEPS,
          showVouchers: u.featurePermissions?.showVouchers ?? SHOW_VOUCHERS
        }
      }));
      setUsers(normalized);
      const initialEditing = {};
      for (const u of normalized) {
        initialEditing[u._id] = { ...u.featurePermissions };
      }
      setEditingPerms(initialEditing);
      setError('');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser || !newPassword) {
      setError('Please select a user and enter a new password');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    try {
      setResetting(true);
      setError('');
      
      const response = await axios.post('/auth/admin/reset-password', {
        userId: selectedUser._id,
        newPassword: newPassword
      });

      setSuccess(response.data.message);
      setShowResetModal(false);
      setSelectedUser(null);
      setNewPassword('');
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setResetting(false);
    }
  };

  const openResetModal = (user) => {
    setSelectedUser(user);
    setShowResetModal(true);
    setNewPassword('');
    setError('');
    setSuccess('');
  };

  const closeResetModal = () => {
    setShowResetModal(false);
    setSelectedUser(null);
    setNewPassword('');
    setError('');
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="user-management">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-management">
      <div className="page-header">
        <h2>User Management</h2>
        <p>Manage user accounts and reset passwords</p>
      </div>

      {error && (
        <div className="alert alert-error">
          <i className="fas fa-exclamation-triangle"></i>
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <i className="fas fa-check-circle"></i>
          {success}
        </div>
      )}

      <div className="search-section">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search users by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn btn-refresh" onClick={fetchUsers}>
          <i className="fas fa-sync-alt"></i>
          Refresh
        </button>
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Features</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user._id}>
                <td>
                  <div className="user-info">
                    <div className="user-avatar">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span>{user.name}</span>
                  </div>
                </td>
                <td>{user.email}</td>
                <td>{user.phone}</td>
                <td>
                  <span className={`role-badge ${user.role}`}>
                    {user.role.toUpperCase()}
                  </span>
                </td>
                <td>
                  <div className="feature-toggles">
                    {['showRecharges','showBillPayments','showMoneyTransfer','showAEPS','showVouchers'].map(key => (
                      <label key={key} className="toggle-item">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          style={{ opacity: 1, visibility: 'visible', display: 'block', width: '16px', height: '16px', margin: '0 5px 0 0' }}
                          checked={!!editingPerms[user._id]?.[key]}
                          onChange={(e) => {
                            const value = e.target.checked;
                            setEditingPerms(prev => ({
                              ...prev,
                              [user._id]: {
                                ...(prev[user._id] || {}),
                                [key]: value
                              }
                            }));
                          }}
                        />
                        <span className="toggle-label">{key.replace('show','')}</span>
                      </label>
                    ))}
                    <button
                      className="btn btn-primary btn-small"
                      onClick={async () => {
                        try {
                          setError('');
                          const payload = editingPerms[user._id] || {};
                          const res = await axios.patch(`/auth/admin/users/${user._id}/feature-permissions`, payload);
                          setSuccess('Updated features for ' + user.email);
                          // Update local users state with server response
                          const updatedUser = res.data?.data?.user || user;
                          setUsers(prev => prev.map(u => u._id === user._id ? updatedUser : u));
                          setTimeout(() => setSuccess(''), 4000);
                        } catch (err) {
                          setError(err.response?.data?.message || 'Failed to update features');
                        }
                      }}
                      style={{ marginTop: '0.5rem' }}
                    >Save</button>
                  </div>
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                  <button
                    className="btn btn-reset"
                    onClick={() => openResetModal(user)}
                    disabled={user.role === 'admin'}
                    title={user.role === 'admin' ? 'Cannot reset admin password' : 'Reset password'}
                  >
                    <i className="fas fa-key"></i>
                    Reset Password
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="no-users">
            <i className="fas fa-users"></i>
            <p>No users found matching your search criteria</p>
          </div>
        )}
      </div>

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Reset Password</h3>
              <button className="modal-close" onClick={closeResetModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="user-details">
                <div className="user-avatar large">
                  {selectedUser?.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4>{selectedUser?.name}</h4>
                  <p>{selectedUser?.email}</p>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min. 8 characters)"
                  className="form-control"
                  minLength="8"
                />
                <small className="form-text">
                  Password must be at least 8 characters long
                </small>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn btn-secondary" 
                onClick={closeResetModal}
                disabled={resetting}
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger" 
                onClick={handleResetPassword}
                disabled={resetting || !newPassword || newPassword.length < 8}
              >
                {resetting ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Resetting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-key"></i>
                    Reset Password
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;