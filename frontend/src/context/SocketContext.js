import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { currentUser, isAuthenticated } = useAuth();

  const SOCKET_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      // Initialize socket connection
      const newSocket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
      });

      newSocket.on('connect', () => {
        console.log('Connected to server:', newSocket.id);
        setIsConnected(true);
        
        // Join user-specific room
        if (currentUser.role === 'admin') {
          newSocket.emit('join_admin', currentUser.id);
        } else {
          newSocket.emit('join', currentUser.id);
        }
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
      });

      // Listen for new notifications
      newSocket.on('new_notification', (data) => {
        console.log('New notification received:', data);
        
        const { notification, unreadCount: newUnreadCount } = data;
        
        // Update unread count
        setUnreadCount(newUnreadCount);
        
        // Show toast notification
        toast.info(
          <div>
            <strong>{notification.title}</strong>
            <br />
            <span>{notification.message}</span>
          </div>,
          {
            position: 'top-right',
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          }
        );
        
        // Trigger custom event for components to listen to
        window.dispatchEvent(new CustomEvent('newNotification', {
          detail: { notification, unreadCount: newUnreadCount }
        }));
      });

      // Listen for notification updates (mark as read, etc.)
      newSocket.on('notification_updated', (data) => {
        console.log('Notification updated:', data);
        setUnreadCount(data.unreadCount);
        
        // Trigger custom event
        window.dispatchEvent(new CustomEvent('notificationUpdated', {
          detail: data
        }));
      });

      setSocket(newSocket);

      // Cleanup on unmount
      return () => {
        newSocket.close();
        setSocket(null);
        setIsConnected(false);
      };
    } else {
      // Clean up socket if user logs out
      if (socket) {
        socket.close();
        setSocket(null);
        setIsConnected(false);
        setUnreadCount(0);
      }
    }
  }, [isAuthenticated, currentUser, SOCKET_URL]);

  // Function to emit events
  const emit = (event, data) => {
    if (socket && isConnected) {
      socket.emit(event, data);
    } else {
      console.warn('Socket not connected. Cannot emit event:', event);
    }
  };

  // Function to listen to events
  const on = (event, callback) => {
    if (socket) {
      socket.on(event, callback);
    }
  };

  // Function to remove event listeners
  const off = (event, callback) => {
    if (socket) {
      socket.off(event, callback);
    }
  };

  // Function to update unread count manually
  const updateUnreadCount = (count) => {
    setUnreadCount(count);
  };

  const value = {
    socket,
    isConnected,
    unreadCount,
    emit,
    on,
    off,
    updateUnreadCount,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;