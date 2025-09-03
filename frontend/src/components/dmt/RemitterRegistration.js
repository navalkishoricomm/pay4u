import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, UserPlus, CheckCircle, XCircle } from '../ui/icons';
import { dmtService } from '../../services/dmtService';
import KYCVerification from './KYCVerification';

const RemitterRegistration = ({ initialMobile, existingRemitter, onRegistrationComplete }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    mobile: initialMobile || '',
    address: '',
    pincode: '',
    dateOfBirth: '',
    gstState: ''
  });

  useEffect(() => {
    if (initialMobile) {
      setFormData(prev => ({ ...prev, mobile: initialMobile }));
    }
  }, [initialMobile]);

  // Handle existing remitter with pending KYC
  useEffect(() => {
    if (existingRemitter && existingRemitter.kycStatus !== 'verified') {
      setRegisteredRemitter(existingRemitter);
      setShowKYC(true);
    }
  }, [existingRemitter]);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [showKYC, setShowKYC] = useState(false);
  const [registeredRemitter, setRegisteredRemitter] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await dmtService.registerRemitter(formData);

      if (response.success) {
        if (response.data.requiresOtp) {
          setOtpSent(true);
          setSuccess('OTP sent to your mobile number');
        } else {
          setSuccess('Registration completed successfully!');
          setTimeout(() => {
            onRegistrationComplete(response.data.remitter);
          }, 1000);
        }
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setOtpLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await dmtService.verifyRemitterOTP({
        mobile: formData.mobile,
        otp: otp
      });

      if (response.success) {
        setSuccess('OTP verified successfully!');
        setRegisteredRemitter(response.data.remitter);
        
        // Check if KYC is required
        if (response.data.remitter.kycStatus !== 'verified') {
          setTimeout(() => {
            setShowKYC(true);
          }, 1000);
        } else {
          setTimeout(() => {
            onRegistrationComplete(response.data.remitter);
          }, 1000);
        }
      } else {
        throw new Error(response.message || 'OTP verification failed');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      setError(error.message || 'OTP verification failed. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const resendOtp = async () => {
    setOtpLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/dmt/remitter/resend-otp', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ mobile: formData.mobile })
      });

      if (response.ok) {
        setSuccess('OTP resent successfully');
      } else {
        setError('Failed to resend OTP');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleKYCComplete = (updatedRemitter) => {
    setSuccess('KYC verification completed successfully!');
    setTimeout(() => {
      onRegistrationComplete(updatedRemitter);
    }, 1000);
  };

  const handleKYCCancel = () => {
    setShowKYC(false);
    setOtpSent(false);
    setOtp('');
    setRegisteredRemitter(null);
  };

  // Show KYC verification if required
  if (showKYC && registeredRemitter) {
    return (
      <KYCVerification
        remitter={registeredRemitter}
        onKYCComplete={handleKYCComplete}
        onCancel={handleKYCCancel}
      />
    );
  }

  if (otpSent) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Verify OTP
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Enter the OTP sent to {formData.mobile}
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">OTP</Label>
              <Input
                id="otp"
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setOtp(value);
                }}
                maxLength={6}
                className="text-center text-lg tracking-wider"
                disabled={otpLoading}
              />
            </div>

            {error && (
              <Alert className="border-red-200 bg-red-50">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">
                  {success}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex gap-2">
              <Button 
                type="submit" 
                className="flex-1"
                disabled={otpLoading || otp.length !== 6}
              >
                {otpLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify OTP'
                )}
              </Button>
              
              <Button 
                type="button" 
                variant="outline"
                onClick={resendOtp}
                disabled={otpLoading}
              >
                Resend
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <UserPlus className="w-6 h-6 text-blue-600" />
        </div>
        <CardTitle className="text-xl font-semibold text-gray-900">
          Remitter Registration
        </CardTitle>
        <p className="text-sm text-gray-600 mt-2">
          Complete your registration to start transferring money
        </p>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                name="firstName"
                type="text"
                placeholder="Enter first name"
                value={formData.firstName}
                onChange={handleInputChange}
                disabled={loading}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                name="lastName"
                type="text"
                placeholder="Enter last name"
                value={formData.lastName}
                onChange={handleInputChange}
                disabled={loading}
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number *</Label>
              <Input
                id="mobile"
                name="mobile"
                type="tel"
                placeholder="10-digit mobile number"
                value={formData.mobile}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setFormData(prev => ({ ...prev, mobile: value }));
                }}
                maxLength={10}
                disabled={loading || initialMobile}
                required
              />
              {initialMobile && (
                <p className="text-xs text-gray-500">Mobile number verified</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth *</Label>
              <Input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                disabled={loading}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="address">Address *</Label>
            <textarea
              id="address"
              name="address"
              placeholder="Enter complete address"
              value={formData.address}
              onChange={handleInputChange}
              rows={3}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={loading}
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pincode">Pincode *</Label>
              <Input
                id="pincode"
                name="pincode"
                type="text"
                placeholder="6-digit pincode"
                value={formData.pincode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setFormData(prev => ({ ...prev, pincode: value }));
                }}
                maxLength={6}
                disabled={loading}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="gstState">GST State Code *</Label>
              <Input
                id="gstState"
                name="gstState"
                type="text"
                value={formData.gstState}
                onChange={handleInputChange}
                placeholder="e.g., 07 for Delhi"
                pattern="[0-9]{2}"
                disabled={loading}
                required
              />
            </div>
          </div>
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registering...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Register as Remitter
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default RemitterRegistration;