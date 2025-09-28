import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';
import './UserNotifications.css';

const UserNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const { updateUnreadCount } = useSocket();

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

  // Get auth token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  // Fetch notifications
  const fetchNotifications = async (page = 1, filterType = filter) => {
    try {
      setLoading(true);
      const token = getAuthToken();
      
      if (!token) {
        setError('Please login to view notifications');
        return;
      }

      const params = {
        page,
        limit: 10
      };

      if (filterType !== 'all') {
        params.isRead = filterType === 'read';
      }

      const response = await axios.get(`${API_BASE_URL}/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params
      });

      if (response.data.status === 'success') {
        setNotifications(response.data.data.notifications);
        setTotalPages(response.data.totalPages || 1);
        setCurrentPage(page);
        
        // Fetch unread count
        fetchUnreadCount();
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err.response?.data?.message || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await axios.get(`${API_BASE_URL}/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: {
          isRead: false,
          limit: 1
        }
      });

      if (response.data.status === 'success') {
        setUnreadCount(response.data.totalResults || 0);
      }
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const token = getAuthToken();
      if (!token) return;

      await axios.patch(`${API_BASE_URL}/notifications/${notificationId}/read`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId 
            ? { ...notif, isRead: true, readAt: new Date() }
            : notif
        )
      );
      
      // Update unread count
      const newUnreadCount = Math.max(0, unreadCount - 1);
      setUnreadCount(newUnreadCount);
      updateUnreadCount(newUnreadCount);
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      await axios.patch(`${API_BASE_URL}/notifications/mark-all-read`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Update local state
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true, readAt: new Date() }))
      );
      
      setUnreadCount(0);
      updateUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    if (!window.confirm('Are you sure you want to delete this notification?')) {
      return;
    }

    try {
      const token = getAuthToken();
      if (!token) return;

      await axios.delete(`${API_BASE_URL}/notifications/${notificationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Remove from local state
      setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
    } catch (err) {
      console.error('Error deleting notification:', err);
      setError('Failed to delete notification');
    }
  };

  // Handle filter change
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setCurrentPage(1);
    fetchNotifications(1, newFilter);
  };

  // Handle page change
  const handlePageChange = (page) => {
    fetchNotifications(page);
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 168) { // 7 days
      const days = Math.floor(diffInHours / 24);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Get notification type color
  const getTypeColor = (type) => {
    const colors = {
      info: '#3b82f6',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      system: '#6b7280',
      transaction: '#8b5cf6',
      promotion: '#ec4899'
    };
    return colors[type] || colors.info;
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    const colors = {
      low: '#6b7280',
      medium: '#f59e0b',
      high: '#ef4444',
      urgent: '#dc2626'
    };
    return colors[priority] || colors.medium;
  };

  useEffect(() => {
    fetchNotifications();
    
    // Listen for real-time notification updates
    const handleNewNotification = (event) => {
      const { notification, unreadCount: newUnreadCount } = event.detail;
      
      // Add new notification to the list if we're showing all or unread
      if (filter === 'all' || (filter === 'unread' && !notification.isRead)) {
        setNotifications(prev => [notification, ...prev]);
      }
      
      // Update unread count
      setUnreadCount(newUnreadCount);
      updateUnreadCount(newUnreadCount);
    };
    
    const handleNotificationUpdated = (event) => {
      const { unreadCount: newUnreadCount } = event.detail;
      setUnreadCount(newUnreadCount);
      updateUnreadCount(newUnreadCount);
    };
    
    // Add event listeners
    window.addEventListener('newNotification', handleNewNotification);
    window.addEventListener('notificationUpdated', handleNotificationUpdated);
    
    // Cleanup
    return () => {
      window.removeEventListener('newNotification', handleNewNotification);
      window.removeEventListener('notificationUpdated', handleNotificationUpdated);
    };
  }, [filter, updateUnreadCount]);

  if (loading && notifications.length === 0) {
    return (
      <div className="user-notifications">
        <div className="loading">Loading notifications...</div>
      </div>
    );
  }

  return (
    <div className="user-notifications">
      <div className="notifications-header">
        <h2>Your Notifications</h2>
        {unreadCount > 0 && (
          <div className="unread-badge">
            {unreadCount} unread
          </div>
        )}
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="notifications-controls">
        <div className="filter-tabs">
          <button 
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => handleFilterChange('all')}
          >
            All
          </button>
          <button 
            className={`filter-tab ${filter === 'unread' ? 'active' : ''}`}
            onClick={() => handleFilterChange('unread')}
          >
            Unread ({unreadCount})
          </button>
          <button 
            className={`filter-tab ${filter === 'read' ? 'active' : ''}`}
            onClick={() => handleFilterChange('read')}
          >
            Read
          </button>
        </div>

        {unreadCount > 0 && (
          <button 
            className="btn btn-sm btn-secondary"
            onClick={markAllAsRead}
          >
            Mark All as Read
          </button>
        )}
      </div>

      <div className="notifications-list">
        {notifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No notifications found</h3>
            <p>
              {filter === 'unread' 
                ? "You're all caught up! No unread notifications."
                : filter === 'read'
                ? "No read notifications to display."
                : "You don't have any notifications yet."
              }
            </p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div 
              key={notification._id} 
              className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
              onClick={() => !notification.isRead && markAsRead(notification._id)}
            >
              <div className="notification-content">
                <div className="notification-header">
                  <h4 className="notification-title">{notification.title}</h4>
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
                
                <div className="notification-footer">
                  <span className="notification-time">
                    {formatDate(notification.createdAt)}
                  </span>
                  
                  {notification.isRead && notification.readAt && (
                    <span className="read-time">
                      Read {formatDate(notification.readAt)}
                    </span>
                  )}
                  
                  <div className="notification-actions">
                    {!notification.isRead && (
                      <button 
                        className="btn btn-sm btn-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification._id);
                        }}
                      >
                        Mark as Read
                      </button>
                    )}
                    
                    <button 
                      className="btn btn-sm btn-danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification._id);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
              
              {!notification.isRead && <div className="unread-indicator"></div>}
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button 
            className="btn btn-sm"
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            Previous
          </button>
          
          <span className="page-info">
            Page {currentPage} of {totalPages}
          </span>
          
          <button 
            className="btn btn-sm"
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default UserNotifications;