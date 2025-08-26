import React from 'react';
import { useNotification } from '../context/NotificationContext';
import '../styles/notification.css';

const Notification = () => {
  const { notifications, removeNotification } = useNotification();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="notification-container">
      {notifications.map((notification) => (
        <div 
          key={notification.id} 
          className={`notification notification-${notification.type}`}
        >
          <div className="notification-content">
            <span className="notification-message">{notification.message}</span>
          </div>
          <button 
            className="notification-close" 
            onClick={() => removeNotification(notification.id)}
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
};

export default Notification;