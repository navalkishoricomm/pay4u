import React, { useState, useEffect } from 'react';
import axios from 'axios';
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

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/auth/admin/users');
      setUsers(response.data.data.users);
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