import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

// Set axios base URL
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
if (typeof window !== 'undefined') {
  window.__PAY4U_API_BASE__ = axios.defaults.baseURL;
}
console.log('AuthContext - API Base URL:', axios.defaults.baseURL);

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);

  // Check if user is logged in on initial load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Set axios default headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Get user data
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, []);

  // Fetch user data
  const fetchUserData = async () => {
    try {
      // This would be a protected route that returns user data
      const response = await axios.get('/auth/me');
      const userData = response.data.data.user;
      
      setCurrentUser(userData);
      setUserRole(userData.role);
      setIsAuthenticated(true);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user data:', error);
      logout();
      setLoading(false);
    }
  };

  // Register user
  const register = async (userData) => {
    try {
      setError(null);
      const response = await axios.post('/auth/signup', userData);
      const { token, data } = response.data;
      
      // Save token to localStorage
      localStorage.setItem('token', token);
      
      // Set axios default headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setCurrentUser(data.user);
      setUserRole(data.user.role);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed');
      return { success: false, error: error.response?.data?.message || 'Registration failed' };
    }
  };

  // Login user
  const login = async (email, password) => {
    try {
      setError(null);
      console.log('Login attempt - Base URL:', axios.defaults.baseURL);
      console.log('Login attempt - Full URL:', axios.defaults.baseURL + '/auth/login');
      const response = await axios.post('/auth/login', { email, password });
      const { token, data } = response.data;
      
      // Save token to localStorage
      localStorage.setItem('token', token);
      
      // Set axios default headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setCurrentUser(data.user);
      setUserRole(data.user.role);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed');
      return { success: false, error: error.response?.data?.message || 'Login failed' };
    }
  };

  // Logout user
  const logout = () => {
    // Remove token from localStorage
    localStorage.removeItem('token');
    
    // Remove axios default headers
    delete axios.defaults.headers.common['Authorization'];
    
    setCurrentUser(null);
    setUserRole(null);
    setIsAuthenticated(false);
  };

  // Check if user is admin
  const isAdmin = () => {
    return userRole === 'admin';
  };

  const value = {
    currentUser,
    isAuthenticated,
    loading,
    error,
    userRole,
    isAdmin,
    register,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};