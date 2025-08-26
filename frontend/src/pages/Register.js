import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const { name, email, phone, password, confirmPassword } = formData;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!name || !email || !phone || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    
    if (!/^\d{10}$/.test(phone)) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const userData = {
        name,
        email,
        phone,
        password,
      };
      
      const result = await register(userData);
      
      if (result.success) {
        toast.success('Registration successful');
        navigate('/dashboard');
      } else {
        toast.error(result.error || 'Registration failed');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h1 className="form-title">Create an Account</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Full Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={name}
            onChange={handleChange}
            className="form-control"
            placeholder="Enter your full name"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={handleChange}
            className="form-control"
            placeholder="Enter your email"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="phone">Phone Number</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={phone}
            onChange={handleChange}
            className="form-control"
            placeholder="Enter your 10-digit phone number"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={handleChange}
            className="form-control"
            placeholder="Enter your password (min. 8 characters)"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={confirmPassword}
            onChange={handleChange}
            className="form-control"
            placeholder="Confirm your password"
            required
          />
        </div>
        
        <button 
          type="submit" 
          className="btn btn-primary btn-block"
          disabled={isLoading}
        >
          {isLoading ? 'Registering...' : 'Register'}
        </button>
      </form>
      
      <p className="mt-3 text-center">
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
};

export default Register;