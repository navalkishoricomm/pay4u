import React, { createContext, useState, useContext, useEffect } from 'react';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  // Add a new notification
  const addNotification = (message, type = 'info', timeout = 5000) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newNotification = {
      id,
      message,
      type, // 'success', 'error', 'info', 'warning'
      timestamp: new Date(),
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Auto remove notification after timeout
    if (timeout) {
      setTimeout(() => {
        removeNotification(id);
      }, timeout);
    }

    return id;
  };

  // Remove a notification by id
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  // Clear all notifications
  const clearNotifications = () => {
    setNotifications([]);
  };

  // Helper methods for different notification types
  const success = (message, timeout) => addNotification(message, 'success', timeout);
  const error = (message, timeout) => addNotification(message, 'error', timeout);
  const info = (message, timeout) => addNotification(message, 'info', timeout);
  const warning = (message, timeout) => addNotification(message, 'warning', timeout);

  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    success,
    error,
    info,
    warning,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};