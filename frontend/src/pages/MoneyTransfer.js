import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Alert, AlertDescription } from '../components/ui/alert';
import MobileVerification from '../components/dmt/MobileVerification';
import RemitterRegistration from '../components/dmt/RemitterRegistration';
import BeneficiaryManagement from '../components/dmt/BeneficiaryManagement';
import MoneyTransferForm from '../components/dmt/MoneyTransferForm';
import TransactionHistory from '../components/dmt/TransactionHistory';
import { dmtService } from '../services/dmtService';
import { useAuth } from '../context/AuthContext';

// Simple toast notification function
const toast = {
  success: (message) => {
    console.log('Success:', message);
    // You can replace this with a proper toast library later
    alert(message);
  },
  error: (message) => {
    console.log('Error:', message);
    alert('Error: ' + message);
  }
};

const MoneyTransfer = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const [currentStep, setCurrentStep] = useState('mobile_verification'); // mobile_verification, registration, dashboard
  const [remitter, setRemitter] = useState(null);
  const [remitterData, setRemitterData] = useState(null);
  const [verificationData, setVerificationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('transfer');
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Debug authentication and state
  useEffect(() => {
    console.log('Auth status:', { isAuthenticated, currentUser, token: localStorage.getItem('token') });
    console.log('Current step:', currentStep);
    console.log('Remitter:', remitter);
    console.log('Beneficiaries count:', beneficiaries.length);
  }, [isAuthenticated, currentUser, currentStep, remitter, beneficiaries]);

  // Load beneficiaries when remitter is available
  useEffect(() => {
    if (remitter?.remitterId) {
      loadBeneficiaries(remitter.remitterId);
    }
  }, [remitter?.remitterId, refreshTrigger]);

  const handleMobileVerification = (data) => {
    setVerificationData(data);
    
    if (data.needsRegistration) {
      // Mobile number is available for registration
      setCurrentStep('registration');
    } else {
      // Remitter exists - check KYC status
      setRemitter(data.remitter);
      
      // If KYC is not verified, go to registration step to trigger KYC flow
      if (data.remitter?.kycStatus !== 'verified') {
        setCurrentStep('registration');
      } else {
        // KYC verified, go directly to dashboard
        setCurrentStep('dashboard');
        if (data.remitter?.remitterId) {
          loadBeneficiaries(data.remitter.remitterId);
        }
      }
    }
  };

  const handleRegistrationComplete = (newRemitter) => {
    setRemitter(newRemitter);
    setCurrentStep('dashboard');
    if (newRemitter?.remitterId) {
      loadBeneficiaries(newRemitter.remitterId);
    }
  };

  const loadBeneficiaries = async (remitterId) => {
    console.log('Loading beneficiaries for remitterId:', remitterId);
    try {
      const data = await dmtService.getBeneficiaries(remitterId);
      console.log('Beneficiaries API response:', data);
      setBeneficiaries(data.data.beneficiaries || []);
      console.log('Set beneficiaries state:', data.data.beneficiaries || []);
    } catch (error) {
      console.error('Error loading beneficiaries:', error);
    }
  };

  const handleRemitterRegistered = (newRemitterData) => {
    setRemitterData(newRemitterData);
    setRefreshTrigger(prev => prev + 1);
    toast.success('Remitter registered successfully!');
  };

  const handleBeneficiaryAdded = () => {
    setRefreshTrigger(prev => prev + 1);
    toast.success('Beneficiary added successfully!');
  };

  const handleTransactionComplete = () => {
    setRefreshTrigger(prev => prev + 1);
    setActiveTab('history');
  };

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Authentication Required</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Please log in to access the Money Transfer service.
              </p>
              <button 
                onClick={() => window.location.href = '/login'}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
              >
                Go to Login
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  // Show mobile verification step
  if (currentStep === 'mobile_verification') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">DMT Money Transfer</h1>
            <p className="text-gray-600">Fast, secure, and reliable money transfer service</p>
          </div>
          <MobileVerification onVerificationComplete={handleMobileVerification} />
        </div>
      </div>
    );
  }

  // Show registration step
  if (currentStep === 'registration') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Remitter Registration</h1>
            <p className="text-gray-600">Complete your registration to start transferring money</p>
          </div>
          <RemitterRegistration 
            initialMobile={verificationData?.mobile}
            existingRemitter={remitter}
            onRegistrationComplete={handleRegistrationComplete} 
          />
        </div>
      </div>
    );
  }

  // Show main dashboard
  return (
    <div className="container mx-auto px-3 py-2">
      <div className="max-w-6xl mx-auto">
        {/* Compact Header with remitter info */}
        <Card className="mb-3 shadow-sm">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <span>💸</span>
              DMT Money Transfer
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="bg-blue-50 p-2 rounded-md">
                <h3 className="font-semibold text-blue-900 text-xs">Remitter</h3>
                <p className="text-blue-700 font-medium text-sm">{remitter?.firstName} {remitter?.lastName}</p>
                <p className="text-xs text-blue-600">{remitter?.mobile}</p>
              </div>
              <div className="bg-green-50 p-2 rounded-md">
                <h3 className="font-semibold text-green-900 text-xs">Monthly Limit</h3>
                <p className="text-green-700 font-bold text-sm">₹{remitter?.monthlyLimit?.toLocaleString()}</p>
              </div>
              <div className="bg-orange-50 p-2 rounded-md">
                <h3 className="font-semibold text-orange-900 text-xs">Used</h3>
                <p className="text-orange-700 font-bold text-sm">₹{remitter?.monthlyUsed?.toLocaleString()}</p>
              </div>
              <div className="bg-purple-50 p-2 rounded-md">
                <h3 className="font-semibold text-purple-900 text-xs">Remaining</h3>
                <p className="text-purple-700 font-bold text-sm">₹{remitter?.remainingLimit?.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Main tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-3">
            <TabsTrigger value="transfer" className="flex items-center gap-1.5 flex-1">
              💸 Send Money
            </TabsTrigger>
            <TabsTrigger value="beneficiaries" className="flex items-center gap-1.5 flex-1">
              👥 Beneficiaries
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-1.5 flex-1">
              📋 History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transfer" className="mt-2">
            <MoneyTransferForm 
              remitterData={remitter}
              beneficiaries={beneficiaries}
              onTransactionComplete={() => {
                setRefreshTrigger(prev => prev + 1);
              }}
            />
          </TabsContent>
          
          <TabsContent value="beneficiaries" className="mt-2">
            <BeneficiaryManagement 
              remitterId={remitter?.remitterId}
              beneficiaries={beneficiaries}
              onBeneficiaryAdded={() => {
                if (remitter?.remitterId) {
                  loadBeneficiaries(remitter.remitterId);
                }
              }}
            />
          </TabsContent>
          
          <TabsContent value="history" className="mt-2">
            <TransactionHistory remitterId={remitter?.remitterId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MoneyTransfer;