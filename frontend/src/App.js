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
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Wallet from './pages/Wallet';
import MobileRecharge from './pages/MobileRecharge';
import DTHRecharge from './pages/DTHRecharge';
import Recharge from './pages/Recharge';
import BillPayment from './pages/BillPayment';
import BrandVouchers from './pages/BrandVouchers';
import Transactions from './pages/Transactions';
import MoneyTransfer from './pages/MoneyTransfer';
import AEPS from './pages/AEPS';
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
import DMTTransactions from './pages/admin/DMTTransactions';
import UserManagement from './pages/admin/UserManagement';
import AdminNotifications from './pages/AdminNotifications';
import UserNotifications from './components/UserNotifications';
import ChargeSlabManagement from './components/admin/ChargeSlabManagement';
import AuditDashboard from './components/admin/AuditDashboard';
import UPIBarcodeManager from './components/admin/UPIBarcodeManager';

// Context
import { useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { SocketProvider } from './context/SocketContext';
import { LocationProvider } from './contexts/LocationContext';
import {
  SHOW_RECHARGES,
  SHOW_BILL_PAYMENTS,
  SHOW_MONEY_TRANSFER
} from './config/featureFlags';

// Debug Components
import AmountInputTest from './debug/AmountInputTest';
import WalletAPITest from './debug/WalletAPITest';
import TestRechargeAPI from './debug/TestRechargeAPI';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  // Avoid redirecting while auth state is loading
  if (loading) {
    return <div className="loading">Checking session...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

// Home Route Component - redirects authenticated users to dashboard
const HomeRoute = () => {
  const { isAuthenticated, loading, currentUser } = useAuth();
  
  if (loading) {
    return <Home />; // show Home content while session loads
  }
  
  if (isAuthenticated) {
    const perms = (currentUser && currentUser.featurePermissions) || {};
    const normalizeBool = (val, fallback) => {
      if (val === undefined || val === null) return fallback;
      if (typeof val === 'string') {
        const s = val.trim().toLowerCase();
        if (s === 'true') return true;
        if (s === 'false') return false;
      }
      return !!val;
    };
    const SHOW_RECHARGES_EFF = normalizeBool(perms.showRecharges, SHOW_RECHARGES);
    const SHOW_BILL_PAYMENTS_EFF = normalizeBool(perms.showBillPayments, SHOW_BILL_PAYMENTS);
    const SHOW_MONEY_TRANSFER_EFF = normalizeBool(perms.showMoneyTransfer, SHOW_MONEY_TRANSFER);

    // If all three flows are disabled, send users to Brand Vouchers as home
    if (!SHOW_RECHARGES_EFF && !SHOW_BILL_PAYMENTS_EFF && !SHOW_MONEY_TRANSFER_EFF) {
      return <Navigate to="/vouchers" />;
    }

    return <Navigate to="/dashboard" />;
  }
  
  return <Home />;
};

// Admin Route Component
const AdminRoute = ({ children }) => {
  const { isAuthenticated, currentUser, loading } = useAuth();
  
  // Avoid redirecting while auth state is loading
  if (loading) {
    return <div className="loading">Verifying admin access...</div>;
  }
  
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
    <LocationProvider>
      <NotificationProvider>
        <SocketProvider>
        <>
          <Navbar />
          <Notification />
          <main className="container">
          <Routes>
          <Route path="/" element={<HomeRoute />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          
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
          
          {/* Aliases/redirects for quick actions */}
          <Route 
            path="/credit-card" 
            element={
              <ProtectedRoute>
                <Navigate to="/bill-payment?type=credit-card" replace />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/emi-loan" 
            element={
              <ProtectedRoute>
                <Navigate to="/bill-payment?type=loan" replace />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/insurance" 
            element={
              <ProtectedRoute>
                <Navigate to="/bill-payment?type=insurance" replace />
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
            path="/money-transfer" 
            element={
              <ProtectedRoute>
                <MoneyTransfer />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/aeps" 
            element={
              <ProtectedRoute>
                <AEPS />
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
          <Route 
            path="/notifications" 
            element={
              <ProtectedRoute>
                <UserNotifications />
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
             path="/admin/user-management" 
             element={
               <AdminRoute>
                 <UserManagement />
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
             path="/admin/dmt-transactions" 
             element={
               <AdminRoute>
                 <DMTTransactions />
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
           <Route
              path="/admin/notifications"
              element={
                <AdminRoute>
                  <AdminNotifications />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/charge-slabs"
              element={
                <AdminRoute>
                  <ChargeSlabManagement />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/audit"
              element={
                <AdminRoute>
                  <AuditDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/upi-barcodes"
              element={
                <AdminRoute>
                  <UPIBarcodeManager />
                </AdminRoute>
              }
            />
           
           {/* Debug Routes */}
                  <Route path="/debug/amount-input" element={<AmountInputTest />} />
                  <Route path="/debug/wallet-api" element={<WalletAPITest />} />
                  <Route path="/debug/recharge-api" element={<TestRechargeAPI />} />
           
          <Route path="*" element={<NotFound />} />
        </Routes>
        </main>
          <ToastContainer position="bottom-right" autoClose={3000} />
        </>
        </SocketProvider>
      </NotificationProvider>
    </LocationProvider>
  );
}

export default App;