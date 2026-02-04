import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { currentUser } = useAuth();
  const [otpSent, setOtpSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [changing, setChanging] = useState(false);
  const [form, setForm] = useState({ otp: '', password: '', confirmPassword: '' });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const sendOtp = async () => {
    try {
      setSending(true);
      await axios.post('/auth/password-otp');
      setOtpSent(true);
      toast.success('OTP sent to your email');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setSending(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (!form.otp || !form.password || !form.confirmPassword) {
      toast.error('Fill all fields');
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    try {
      setChanging(true);
      await axios.post('/auth/change-password-with-otp', { otp: form.otp, password: form.password });
      toast.success('Password changed successfully');
      setForm({ otp: '', password: '', confirmPassword: '' });
      setOtpSent(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setChanging(false);
    }
  };

  return (
    <div className="container mt-4">
      <div className="mb-4">
        <h1>Profile</h1>
        <p className="text-muted">Manage your account settings</p>
      </div>

      <div className="card mb-4">
        <h2 className="mb-4">Personal Information</h2>
        <div className="form-group">
          <label className="form-label">Name</label>
          <input className="form-control" value={currentUser?.name || ''} readOnly disabled />
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-control" value={currentUser?.email || ''} readOnly disabled />
        </div>
        <div className="form-group">
          <label className="form-label">Phone</label>
          <input className="form-control" value={currentUser?.phone || ''} readOnly disabled />
        </div>
      </div>

      <div className="card">
        <h2 className="mb-4">Security</h2>
        <h3 className="mb-2">Change Password</h3>
        <p className="text-muted mb-4">We will send a One Time Password (OTP) to your registered email to verify it's you.</p>
        
        {!otpSent ? (
          <button className="btn btn-primary" onClick={sendOtp} disabled={sending}>
            {sending ? 'Sending OTP...' : 'Send OTP to Email'}
          </button>
        ) : (
          <form onSubmit={changePassword} className="animate-fade-in">
            <div className="form-group">
              <label className="form-label">Enter OTP</label>
              <input
                type="text"
                name="otp"
                value={form.otp}
                onChange={handleChange}
                className="form-control"
                placeholder="Enter 6-digit OTP"
                maxLength="6"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="form-control"
                placeholder="Minimum 8 characters"
                minLength="8"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                className="form-control"
                placeholder="Re-enter new password"
                minLength="8"
                required
              />
            </div>
            <div className="flex gap-4">
              <button type="submit" className="btn btn-primary" disabled={changing}>
                {changing ? 'Updating Password...' : 'Update Password'}
              </button>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setOtpSent(false)}
                disabled={changing}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Profile;
