import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminNavbar from './AdminNavbar';

const AdminLayout = ({ children }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect non-admin users
    if (!currentUser || currentUser.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  // Don't render anything until we verify the user is an admin
  if (!currentUser || currentUser.role !== 'admin') {
    return null;
  }

  return (
    <div className="admin-layout">
      <AdminNavbar />
      <div className="admin-content">
        {children}
      </div>
    </div>
  );
};

export default AdminLayout;