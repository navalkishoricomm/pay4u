import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, Shield, Eye, User, Fingerprint, CheckCircle, XCircle } from '../ui/icons';
import { dmtService } from '../../services/dmtService';

const KYCVerification = ({ remitter, onKYCComplete, onCancel }) => {
  const [selectedKycType, setSelectedKycType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [kycData, setKycData] = useState({
    piddata: '',
    wadh: ''
  });

  const kycOptions = [
    {
      type: 'fingerprint',
      label: 'Fingerprint Authentication',
      icon: Fingerprint,
      description: 'Verify using fingerprint biometric'
    },
    {
      type: 'iris',
      label: 'Iris Authentication',
      icon: Eye,
      description: 'Verify using iris biometric'
    },
    {
      type: 'face_auth',
      label: 'Face Authentication',
      icon: User,
      description: 'Verify using facial recognition'
    }
  ];

  const handleKycTypeSelect = (type) => {
    setSelectedKycType(type);
    setError('');
    setSuccess('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setKycData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const simulateBiometricCapture = async (kycType) => {
    // Simulate biometric data capture
    // In a real implementation, this would integrate with biometric devices
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockPidData = `<?xml version="1.0" encoding="UTF-8"?>
<PidData>
  <Resp errCode="0" errInfo="Success" fCount="1" fType="0" nmPoints="36" qScore="75" />
  <DeviceInfo dpId="MANTRA.MSIPL" rdsId="MANTRA.WIN.001" rdsVer="1.0.5" mi="MFS100" mc="MIIEGjCCAwKgAwIBAgIGAWd" />
  <Skey ci="20200615">encrypted_session_key_data</Skey>
  <Hmac>hmac_value</Hmac>
  <Data type="X">biometric_template_data_${kycType}_${Date.now()}</Data>
</PidData>`;
        
        resolve({
          piddata: mockPidData,
          wadh: 'additional_auth_data'
        });
      }, 2000);
    });
  };

  const handleKYCSubmit = async () => {
    if (!selectedKycType) {
      setError('Please select a KYC verification method');
      return;
    }

    if (!remitter || (!remitter.remitterId && !remitter._id)) {
      setError('Remitter information is missing. Please try again.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Simulate biometric capture
      setSuccess('Capturing biometric data...');
      const biometricData = await simulateBiometricCapture(selectedKycType);
      
      setSuccess('Verifying KYC...');
      
      const kycPayload = {
        remitterId: remitter.remitterId || remitter._id,
        kycType: selectedKycType,
        piddata: biometricData.piddata,
        wadh: biometricData.wadh
      };

      console.log('KYC Payload:', kycPayload);
      console.log('Remitter object:', remitter);

      const response = await dmtService.performKYC(kycPayload);

      if (response.success) {
        setSuccess('KYC verification completed successfully!');
        setTimeout(() => {
          onKYCComplete(response.data.remitter);
        }, 1500);
      } else {
        throw new Error(response.message || 'KYC verification failed');
      }
    } catch (error) {
      console.error('KYC verification error:', error);
      setError(error.message || 'KYC verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canPerformKyc = () => {
    if (!remitter) return false;
    
    // Check if KYC is already verified
    if (remitter.kycStatus === 'verified') {
      return false;
    }
    
    // Check attempt limits (max 2 per day)
    const today = new Date().toDateString();
    const lastAttempt = remitter.lastKycAttempt ? new Date(remitter.lastKycAttempt).toDateString() : null;
    const attempts = lastAttempt === today ? (remitter.kycAttempts || 0) : 0;
    
    return attempts < 2;
  };

  if (!remitter) {
    return (
      <Alert>
        <XCircle className="h-4 w-4" />
        <AlertDescription>
          No remitter information available. Please complete registration first.
        </AlertDescription>
      </Alert>
    );
  }

  if (remitter.kycStatus === 'verified') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-green-700">
            KYC Already Verified
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Your KYC verification is complete. You can now proceed with money transfers.
          </p>
        </CardHeader>
        <CardContent>
          <Button onClick={() => onKYCComplete(remitter)} className="w-full">
            Continue to Money Transfer
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!canPerformKyc()) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <XCircle className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-red-700">
            KYC Limit Exceeded
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            You have reached the maximum KYC attempts for today. Please try again tomorrow.
          </p>
        </CardHeader>
        <CardContent>
          <Button onClick={onCancel} variant="outline" className="w-full">
            Go Back
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <Shield className="w-6 h-6 text-blue-600" />
        </div>
        <CardTitle className="text-xl font-semibold text-gray-900">
          KYC Verification Required
        </CardTitle>
        <p className="text-sm text-gray-600 mt-2">
          Complete KYC verification to enable money transfers
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Select Verification Method:</h3>
          
          {kycOptions.map((option) => {
            const IconComponent = option.icon;
            return (
              <div
                key={option.type}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedKycType === option.type
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleKycTypeSelect(option.type)}
              >
                <div className="flex items-center space-x-3">
                  <IconComponent className={`w-5 h-5 ${
                    selectedKycType === option.type ? 'text-blue-600' : 'text-gray-500'
                  }`} />
                  <div className="flex-1">
                    <div className={`font-medium ${
                      selectedKycType === option.type ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {option.label}
                    </div>
                    <div className="text-xs text-gray-500">
                      {option.description}
                    </div>
                  </div>
                  {selectedKycType === option.type && (
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex space-x-3">
          <Button
            onClick={onCancel}
            variant="outline"
            className="flex-1"
            disabled={loading}
          >
            Cancel
          </Button>
          
          <Button
            onClick={handleKYCSubmit}
            className="flex-1"
            disabled={loading || !selectedKycType}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                Verify KYC
              </>
            )}
          </Button>
        </div>
        
        <div className="text-xs text-gray-500 text-center">
          Attempts remaining: {2 - (remitter.kycAttempts || 0)} of 2 today
        </div>
      </CardContent>
    </Card>
  );
};

export default KYCVerification;