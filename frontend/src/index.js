import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { BrowserRouter as Router } from 'react-router-dom';

const root = ReactDOM.createRoot(document.getElementById('root'));
// In development, avoid React.StrictMode to prevent double effects
// that can appear as flickering or rapid redirects during auth init.
const isDev = process.env.NODE_ENV !== 'production';
const appTree = (
  <Router>
    <AuthProvider>
      <App />
    </AuthProvider>
  </Router>
);

root.render(isDev ? appTree : <React.StrictMode>{appTree}</React.StrictMode>);