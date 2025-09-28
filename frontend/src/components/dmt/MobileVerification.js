import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, Phone, CheckCircle, XCircle } from '../ui/icons';
import { dmtService } from '../../services/dmtService';

const MobileVerification = ({ onVerificationComplete }) => {
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleMobileVerification = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate mobile number format
      if (!/^[6-9]\d{9}$/.test(mobile)) {
        throw new Error('Please enter a valid 10-digit mobile number starting with 6-9');
      }

      const response = await dmtService.verifyMobile(mobile);
      
      if (response.success) {
        const { exists, canUse, isOwner, remitter, message } = response.data;
        
        if (exists && canUse) {
          // Remitter exists and can be used by any user
          const successMessage = isOwner ? 
            'Mobile number verified successfully!' : 
            'Mobile number verified! You can use this remitter.';
          setSuccess(successMessage);
          setTimeout(() => {
            onVerificationComplete({
              verified: true,
              remitter: remitter,
              needsRegistration: false,
              isOwner: isOwner
            });
          }, 1000);
        } else if (exists && !canUse) {
          // This case should not happen with our new logic, but keeping for safety
          setError(message || 'This remitter cannot be used');
        } else {
          // Mobile number not registered - needs registration
          setSuccess('Mobile number available for registration!');
          setTimeout(() => {
            onVerificationComplete({
              verified: true,
              mobile: mobile,
              needsRegistration: true
            });
          }, 1000);
        }
      } else {
        throw new Error(response.message || 'Failed to verify mobile number');
      }
    } catch (error) {
      console.error('Mobile verification error:', error);
      setError(error.message || 'Failed to verify mobile number. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <Phone className="w-6 h-6 text-blue-600" />
        </div>
        <CardTitle className="text-xl font-semibold text-gray-900">
          Verify Mobile Number
        </CardTitle>
        <p className="text-sm text-gray-600 mt-2">
          Enter your mobile number to check remitter status
        </p>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleMobileVerification} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mobile">Mobile Number</Label>
            <Input
              id="mobile"
              type="tel"
              placeholder="Enter 10-digit mobile number"
              value={mobile}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                setMobile(value);
              }}
              maxLength={10}
              className="text-center text-lg tracking-wider"
              disabled={loading}
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

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading || mobile.length !== 10}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify Mobile Number'
            )}
          </Button>
        </form>

        <div className="mt-4 text-xs text-gray-500 text-center">
          <p>• If you're a new user, you'll be guided to register</p>
          <p>• If you're an existing user, your details will be loaded</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MobileVerification;