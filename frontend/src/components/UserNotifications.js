import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';
import './UserNotifications.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const UserNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const { unreadCount, updateUnreadCount } = useSocket();

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      setError(null);
      setSuccess(null);
      try {
        // Ensure Authorization header is present for protected endpoint
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/notifications`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        // API returns { status, results, unreadCount, data: { notifications: [...] } }
        setNotifications(response.data?.data?.notifications || []);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to fetch notifications');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      const token = localStorage.getItem('token');
      await axios.patch(`${API_BASE_URL}/notifications/mark-all-read`, null, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      // Optimistically update UI
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      updateUnreadCount(0);
      setSuccess('All notifications marked as read');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to mark notifications as read');
    } finally {
      setLoading(false);
    }
  };

  if (loading && notifications.length === 0) return <div>Loading notifications...</div>;
  if (error && notifications.length === 0) return <div className="error">{error}</div>;

  return (
    <div className="user-notifications">
      <div className="notifications-header">
        <h2>Your Notifications</h2>
        <span className="unread-badge">Unread: {unreadCount}</span>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="notifications-controls">
        <button className="btn btn-primary" onClick={handleMarkAllRead} disabled={unreadCount === 0}>Mark all as read</button>
      </div>

      {notifications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔔</div>
          <h3>No notifications yet</h3>
          <p>When you receive notifications, they will appear here.</p>
        </div>
      ) : (
        <ul className="notifications-list">
          {notifications.map((n) => (
            <li key={n.id || n._id} className={`notification-item ${n.isRead ? '' : 'unread'}`}>
              <div className="notification-content">
                <div className="notification-header">
                  <h4 className="notification-title">{n.title}</h4>
                  <div className="notification-meta">
                    {n.type && <span className="type-badge" style={{ backgroundColor: '#3b82f6' }}>{n.type}</span>}
                    {n.priority && <span className="priority-badge" style={{ backgroundColor: '#ef4444' }}>{n.priority}</span>}
                  </div>
                </div>
                <p className="notification-message">{n.message}</p>
                <div className="notification-footer">
                  <span className="notification-time">{new Date(n.createdAt).toLocaleString()}</span>
                  {n.isRead && <span className="read-time">Read</span>}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default UserNotifications;