import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminNotifications.css';

const AdminNotifications = () => {
  const [activeTab, setActiveTab] = useState('send');
  const [notifications, setNotifications] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form states
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'general',
    priority: 'medium',
    sendToAll: false,
    userRole: '',
    recipients: [],
    expiresAt: ''
  });
  
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  
  useEffect(() => {
    if (activeTab === 'manage') {
      fetchNotifications();
    } else if (activeTab === 'stats') {
      fetchStats();
    }
  }, [activeTab]);
  
  useEffect(() => {
    if (userSearch || !formData.sendToAll) {
      fetchUsers();
    }
  }, [userSearch, formData.sendToAll]);
  
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/notifications/admin/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data.data.notifications);
    } catch (err) {
      setError('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/notifications/admin/users?search=${userSearch}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data.data.users);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };
  
  const fetchStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/notifications/admin/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data.data);
    } catch (err) {
      setError('Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleUserSelect = (user) => {
    const isSelected = selectedUsers.find(u => u._id === user._id);
    if (isSelected) {
      setSelectedUsers(prev => prev.filter(u => u._id !== user._id));
    } else {
      setSelectedUsers(prev => [...prev, user]);
    }
  };
  
  const handleSendNotification = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...formData,
        recipients: formData.sendToAll ? [] : selectedUsers.map(u => u._id)
      };
      
      const endpoint = formData.sendToAll || selectedUsers.length > 1 
        ? '/api/notifications/admin/bulk'
        : '/api/notifications/admin/create';
      
      if (!formData.sendToAll && selectedUsers.length === 1) {
        payload.userId = selectedUsers[0]._id;
      }
      
      const response = await axios.post(endpoint, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess(response.data.message || 'Notification sent successfully!');
      
      // Reset form
      setFormData({
        title: '',
        message: '',
        type: 'general',
        priority: 'medium',
        sendToAll: false,
        userRole: '',
        recipients: [],
        expiresAt: ''
      });
      setSelectedUsers([]);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send notification');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteNotification = async (id) => {
    if (!window.confirm('Are you sure you want to delete this notification?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/notifications/admin/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.filter(n => n._id !== id));
      setSuccess('Notification deleted successfully');
    } catch (err) {
      setError('Failed to delete notification');
    }
  };
  
  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };
  
  const getTypeColor = (type) => {
    const colors = {
      info: '#3498db',
      warning: '#f39c12',
      success: '#27ae60',
      error: '#e74c3c',
      announcement: '#9b59b6',
      general: '#95a5a6'
    };
    return colors[type] || colors.general;
  };
  
  const getPriorityColor = (priority) => {
    const colors = {
      low: '#27ae60',
      medium: '#f39c12',
      high: '#e67e22',
      urgent: '#e74c3c'
    };
    return colors[priority] || colors.medium;
  };
  
  return (
    <div className="admin-notifications">
      <div className="admin-notifications-header">
        <h1>Notification Management</h1>
        <p>Send and manage notifications to users</p>
      </div>
      
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'send' ? 'active' : ''}`}
          onClick={() => setActiveTab('send')}
        >
          Send Notification
        </button>
        <button 
          className={`tab ${activeTab === 'manage' ? 'active' : ''}`}
          onClick={() => setActiveTab('manage')}
        >
          Manage Notifications
        </button>
        <button 
          className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          Statistics
        </button>
      </div>
      
      {activeTab === 'send' && (
        <div className="tab-content">
          <form onSubmit={handleSendNotification} className="notification-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="title">Title *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  maxLength={100}
                  placeholder="Enter notification title"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="type">Type</label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                >
                  <option value="general">General</option>
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="success">Success</option>
                  <option value="error">Error</option>
                  <option value="announcement">Announcement</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="priority">Priority</label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="message">Message *</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                required
                maxLength={500}
                rows={4}
                placeholder="Enter notification message"
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    name="sendToAll"
                    checked={formData.sendToAll}
                    onChange={handleInputChange}
                  />
                  Send to all users
                </label>
              </div>
              
              {formData.sendToAll && (
                <div className="form-group">
                  <label htmlFor="userRole">Filter by Role (Optional)</label>
                  <select
                    id="userRole"
                    name="userRole"
                    value={formData.userRole}
                    onChange={handleInputChange}
                  >
                    <option value="">All Roles</option>
                    <option value="user">Users</option>
                    <option value="admin">Admins</option>
                  </select>
                </div>
              )}
              
              <div className="form-group">
                <label htmlFor="expiresAt">Expires At (Optional)</label>
                <input
                  type="datetime-local"
                  id="expiresAt"
                  name="expiresAt"
                  value={formData.expiresAt}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            {!formData.sendToAll && (
              <div className="user-selection">
                <h3>Select Recipients</h3>
                <div className="user-search">
                  <input
                    type="text"
                    placeholder="Search users by name or email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                </div>
                
                <div className="selected-users">
                  <h4>Selected Users ({selectedUsers.length})</h4>
                  <div className="user-chips">
                    {selectedUsers.map(user => (
                      <div key={user._id} className="user-chip">
                        {user.name} ({user.email})
                        <button 
                          type="button"
                          onClick={() => handleUserSelect(user)}
                          className="remove-user"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="user-list">
                  {users.filter(user => !selectedUsers.find(u => u._id === user._id)).map(user => (
                    <div key={user._id} className="user-item" onClick={() => handleUserSelect(user)}>
                      <div className="user-info">
                        <strong>{user.name}</strong>
                        <span>{user.email}</span>
                        <span className="user-role">{user.role}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading || (!formData.sendToAll && selectedUsers.length === 0)}
            >
              {loading ? 'Sending...' : 'Send Notification'}
            </button>
          </form>
        </div>
      )}
      
      {activeTab === 'manage' && (
        <div className="tab-content">
          <div className="notifications-list">
            <h3>All Notifications</h3>
            {loading ? (
              <div className="loading">Loading notifications...</div>
            ) : (
              <div className="notifications-grid">
                {notifications.map(notification => (
                  <div key={notification._id} className="notification-card">
                    <div className="notification-header">
                      <h4>{notification.title}</h4>
                      <div className="notification-meta">
                        <span 
                          className="type-badge"
                          style={{ backgroundColor: getTypeColor(notification.type) }}
                        >
                          {notification.type}
                        </span>
                        <span 
                          className="priority-badge"
                          style={{ backgroundColor: getPriorityColor(notification.priority) }}
                        >
                          {notification.priority}
                        </span>
                      </div>
                    </div>
                    
                    <p className="notification-message">{notification.message}</p>
                    
                    <div className="notification-details">
                      <div className="detail-item">
                        <strong>To:</strong> {notification.user?.name} ({notification.user?.email})
                      </div>
                      <div className="detail-item">
                        <strong>From:</strong> {notification.sender?.name}
                      </div>
                      <div className="detail-item">
                        <strong>Sent:</strong> {formatDate(notification.createdAt)}
                      </div>
                      <div className="detail-item">
                        <strong>Status:</strong> 
                        <span className={`status ${notification.isRead ? 'read' : 'unread'}`}>
                          {notification.isRead ? 'Read' : 'Unread'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="notification-actions">
                      <button 
                        onClick={() => handleDeleteNotification(notification._id)}
                        className="btn btn-danger btn-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {activeTab === 'stats' && (
        <div className="tab-content">
          <div className="stats-container">
            <h3>Notification Statistics</h3>
            {loading ? (
              <div className="loading">Loading statistics...</div>
            ) : stats ? (
              <div className="stats-grid">
                <div className="stat-card">
                  <h4>Overview</h4>
                  <div className="stat-item">
                    <span className="stat-label">Total Notifications:</span>
                    <span className="stat-value">{stats.overview.totalNotifications}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Read:</span>
                    <span className="stat-value">{stats.overview.readNotifications}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Unread:</span>
                    <span className="stat-value">{stats.overview.unreadNotifications}</span>
                  </div>
                </div>
                
                <div className="stat-card">
                  <h4>By Type</h4>
                  {stats.byType.map(item => (
                    <div key={item._id} className="stat-item">
                      <span className="stat-label">{item._id}:</span>
                      <span className="stat-value">{item.count}</span>
                    </div>
                  ))}
                </div>
                
                <div className="stat-card">
                  <h4>By Priority</h4>
                  {stats.byPriority.map(item => (
                    <div key={item._id} className="stat-item">
                      <span className="stat-label">{item._id}:</span>
                      <span className="stat-value">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>No statistics available</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNotifications;