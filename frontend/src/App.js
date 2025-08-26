import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import './components/admin/admin.css';
import './styles/notification.css';
import './styles/wallet.css';
import './styles/transaction-updates.css';

// Components
import Navbar from './components/layout/Navbar';
import AdminLayout from './components/layout/AdminLayout';
import Notification from './components/Notification';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Wallet from './pages/Wallet';
import MobileRecharge from './pages/MobileRecharge';
import DTHRecharge from './pages/DTHRecharge';
import Recharge from './pages/Recharge';
import BillPayment from './pages/BillPayment';
import BrandVouchers from './pages/BrandVouchers';
import Transactions from './pages/Transactions';
import NotFound from './pages/NotFound';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import PendingTransactions from './pages/admin/PendingTransactions';
import AllTransactions from './pages/admin/AllTransactions';
import CommissionManagement from './pages/admin/CommissionManagement';
import CommissionSchemes from './pages/admin/CommissionSchemes';
import UserCommissions from './pages/admin/UserCommissions';
import VoucherManagement from './pages/admin/VoucherManagement';
import VoucherOrderApprovals from './pages/admin/VoucherOrderApprovals';
import ApiProviders from './pages/admin/ApiProviders';
import OperatorConfig from './pages/admin/OperatorConfig';
import ManualRecharges from './pages/admin/ManualRecharges';

// Context
import { useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

// Home Route Component - redirects authenticated users to dashboard
const HomeRoute = () => {
  const { isAuthenticated } = useAuth();
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }
  
  return <Home />;
};

// Admin Route Component
const AdminRoute = ({ children }) => {
  const { isAuthenticated, currentUser } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (currentUser?.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }
  
  return <AdminLayout>{children}</AdminLayout>;
};

function App() {
  return (
    <NotificationProvider>
      <>
        <Navbar />
        <Notification />
        <main className="container">
          <Routes>
          <Route path="/" element={<HomeRoute />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* User Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/wallet" 
            element={
              <ProtectedRoute>
                <Wallet />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/mobile-recharge" 
            element={
              <ProtectedRoute>
                <MobileRecharge />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dth-recharge" 
            element={
              <ProtectedRoute>
                <DTHRecharge />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/bill-payment" 
            element={
              <ProtectedRoute>
                <BillPayment />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/transactions" 
            element={
              <ProtectedRoute>
                <Transactions />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/vouchers" 
            element={
              <ProtectedRoute>
                <BrandVouchers />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/recharge" 
            element={
              <ProtectedRoute>
                <Recharge />
              </ProtectedRoute>
            } 
          />
          {/* Admin Routes */}
           <Route 
             path="/admin/dashboard" 
             element={
               <AdminRoute>
                 <AdminDashboard />
               </AdminRoute>
             } 
           />
           <Route 
             path="/admin/transactions/pending" 
             element={
               <AdminRoute>
                 <PendingTransactions />
               </AdminRoute>
             } 
           />
           <Route 
             path="/admin/transactions" 
             element={
               <AdminRoute>
                 <AllTransactions />
               </AdminRoute>
             } 
           />
           <Route 
             path="/admin/commissions" 
             element={
               <AdminRoute>
                 <CommissionManagement />
               </AdminRoute>
             } 
           />
           <Route 
             path="/admin/commission-schemes" 
             element={
               <AdminRoute>
                 <CommissionSchemes />
               </AdminRoute>
             } 
           />
           <Route 
             path="/admin/user-commissions" 
             element={
               <AdminRoute>
                 <UserCommissions />
               </AdminRoute>
             } 
           />
           <Route 
             path="/admin/vouchers" 
             element={
               <AdminRoute>
                 <VoucherManagement />
               </AdminRoute>
             } 
           />
           <Route 
             path="/admin/voucher-orders" 
             element={
               <AdminRoute>
                 <VoucherOrderApprovals />
               </AdminRoute>
             } 
           />
           <Route 
             path="/admin/api-providers" 
             element={
               <AdminRoute>
                 <ApiProviders />
               </AdminRoute>
             } 
           />
           <Route 
             path="/admin/operators" 
             element={
               <AdminRoute>
                 <OperatorConfig />
               </AdminRoute>
             } 
           />
           <Route 
             path="/admin/manual-recharges" 
             element={
               <AdminRoute>
                 <ManualRecharges />
               </AdminRoute>
             } 
           />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
        <ToastContainer position="bottom-right" autoClose={3000} />
      </>
    </NotificationProvider>
  );
}

export default App;