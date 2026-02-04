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

  // Production-ready socket URL configuration
  const getSocketURL = () => {
    // If explicitly defined in env, use it
    if (process.env.REACT_APP_SOCKET_URL) {
      return process.env.REACT_APP_SOCKET_URL;
    }
    
    if (process.env.NODE_ENV === 'production') {
      // In production, use the same origin as the frontend (relative path)
      // This assumes Nginx proxies /socket.io to the backend
      return window.location.origin;
    }
    
    return process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5001';
  };

  const SOCKET_URL = getSocketURL();

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      // Initialize socket connection with production-ready configuration
      const newSocket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        upgrade: true,
        rememberUpgrade: true,
        timeout: 20000,
        forceNew: false,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        maxReconnectionAttempts: 5
      });

      newSocket.on('connect', () => {
        console.log('Connected to server:', newSocket.id);
        setIsConnected(true);
        
        // Join user-specific room
        const userId = currentUser?._id || currentUser?.id;
        if (!userId) {
          console.warn('Socket join skipped: missing userId on currentUser', currentUser);
        } else if (currentUser.role === 'admin') {
          newSocket.emit('join_admin', userId);
        } else {
          newSocket.emit('join', userId);
        }
      });

      // Listen for initial unread count from server
      newSocket.on('unread_count', (data) => {
        console.log('Initial unread_count received:', data);
        const count = typeof data === 'number' ? data : data?.count;
        if (typeof count === 'number') {
          setUnreadCount(count);
          // Broadcast to window for any listeners
          window.dispatchEvent(new CustomEvent('unreadCount', { detail: { unreadCount: count } }));
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