import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import './MoneyTransferForm.css';

const MoneyTransferForm = ({ remitterData, beneficiaries, onTransactionComplete }) => {
  const { currentUser } = useAuth();
  
  // Debug props
  console.log('MoneyTransferForm props:', {
    remitterData: {
      remainingLimit: remitterData?.remainingLimit,
      monthlyLimit: remitterData?.monthlyLimit,
      isVerified: remitterData?.isVerified
    },
    beneficiariesCount: beneficiaries?.length
  });
  const [formData, setFormData] = useState({
    beneficiaryId: '',
    amount: '',
    transferMode: 'IMPS',
    purpose: 'Family Support'
  });
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);
  const [charges, setCharges] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  const transferModes = [
    { value: 'IMPS', label: 'IMPS (Immediate)', charge: 5 },
    { value: 'NEFT', label: 'NEFT (Next Working Day)', charge: 3 }
  ];

  const purposes = [
    'Family Support',
    'Education',
    'Medical',
    'Business',
    'Personal',
    'Others'
  ];

  useEffect(() => {
    fetchWalletBalance();
  }, []);

  useEffect(() => {
    if (formData.amount && formData.transferMode) {
      calculateCharges();
    }
  }, [formData.amount, formData.transferMode]);

  useEffect(() => {
    if (formData.beneficiaryId) {
      const beneficiary = beneficiaries.find(b => b._id === formData.beneficiaryId);
      console.log('Selected beneficiary:', {
        id: beneficiary?._id,
        remainingLimit: beneficiary?.remainingLimit,
        isVerified: beneficiary?.isVerified,
        isActive: beneficiary?.isActive
      });
      setSelectedBeneficiary(beneficiary);
    } else {
      setSelectedBeneficiary(null);
    }
  }, [formData.beneficiaryId, beneficiaries]);

  const fetchWalletBalance = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/wallet/balance', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Wallet balance fetched:', data.data?.wallet?.balance || 0);
        setWalletBalance(data.data?.wallet?.balance || 0);
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    }
  };

  const calculateCharges = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/dmt/calculate-charges', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: parseFloat(formData.amount),
          transferMode: formData.transferMode
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCharges(data.data.charges);
        setTotalAmount(data.data.totalAmount);
      }
    } catch (error) {
      console.error('Error calculating charges:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log('Input change:', { name, value, type: e.target.type });
    
    // Debug amount input specifically
    if (name === 'amount') {
      console.log('Amount input change:', {
        value,
        selectedBeneficiary: selectedBeneficiary?.remainingLimit,
        remitterLimit: remitterData?.remainingLimit,
        walletBalance,
        maxValue: selectedBeneficiary ? Math.min(
          selectedBeneficiary.remainingLimit || Infinity,
          remitterData?.remainingLimit || Infinity,
          walletBalance
        ) : walletBalance
      });
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedBeneficiary) {
      toast.error('Please select a beneficiary');
      return;
    }

    if (!selectedBeneficiary.isVerified) {
      toast.error('Selected beneficiary is not verified');
      return;
    }

    if (totalAmount > walletBalance) {
      toast.error('Insufficient wallet balance');
      return;
    }

    if (selectedBeneficiary?.remainingLimit && parseFloat(formData.amount) > selectedBeneficiary.remainingLimit) {
      toast.error('Amount exceeds beneficiary monthly limit');
      return;
    }

    if (remitterData?.remainingLimit && parseFloat(formData.amount) > remitterData.remainingLimit) {
      toast.error('Amount exceeds remitter monthly limit');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/dmt/transaction', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          remitterId: remitterData?.remitterId,
          beneficiaryId: formData.beneficiaryId,
          amount: parseFloat(formData.amount),
          transferMode: formData.transferMode,
          purpose: formData.purpose
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Money transfer initiated successfully!');
        setFormData({
          beneficiaryId: '',
          amount: '',
          transferMode: 'IMPS',
          purpose: 'Family Support'
        });
        setSelectedBeneficiary(null);
        setCharges(0);
        setTotalAmount(0);
        // Refresh wallet balance after successful transaction
        fetchWalletBalance();
        onTransactionComplete();
      } else {
        toast.error(data.message || 'Transfer failed');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifiedBeneficiaries = beneficiaries.filter(b => b.isVerified && b.isActive);

  if (verifiedBeneficiaries.length === 0) {
    return (
      <div className="money-transfer-form">
        <div className="no-beneficiaries">
          <h3>No Verified Beneficiaries</h3>
          <p>You need to add and verify at least one beneficiary before you can send money.</p>
          <p>Go to the "Manage Beneficiaries" tab to add beneficiaries.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="money-transfer-form">
      <div className="transfer-header">
        <h2>Send Money</h2>
        <div className="wallet-info">
          <span className="wallet-balance">Wallet Balance: ₹{walletBalance.toLocaleString()}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="transfer-form">
        <div className="form-section">
          <h3>Beneficiary Details</h3>
          
          <div className="form-group">
            <label htmlFor="beneficiaryId">Select Beneficiary *</label>
            <select
              id="beneficiaryId"
              name="beneficiaryId"
              value={formData.beneficiaryId}
              onChange={handleInputChange}
              required
            >
              <option value="">Choose a beneficiary</option>
              {verifiedBeneficiaries.map((beneficiary) => (
                <option key={beneficiary._id} value={beneficiary._id}>
                  {beneficiary.accountHolderName} - {beneficiary.accountNumber.slice(-4)}
                </option>
              ))}
            </select>
          </div>

          {selectedBeneficiary && (
            <div className="beneficiary-details">
              <div className="detail-row">
                <span>Account Holder:</span>
                <span>{selectedBeneficiary.accountHolderName}</span>
              </div>
              <div className="detail-row">
                <span>Account Number:</span>
                <span>{selectedBeneficiary.accountNumber}</span>
              </div>
              <div className="detail-row">
                <span>IFSC Code:</span>
                <span>{selectedBeneficiary.ifscCode}</span>
              </div>
              <div className="detail-row">
                <span>Bank Name:</span>
                <span>{selectedBeneficiary.bankName}</span>
              </div>
              <div className="detail-row">
                <span>Monthly Limit:</span>
                <span>₹{selectedBeneficiary.monthlyLimit?.toLocaleString()}</span>
              </div>
              <div className="detail-row">
                <span>Remaining Limit:</span>
                <span>₹{selectedBeneficiary.remainingLimit?.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>

        <div className="form-section">
          <h3>Transfer Details</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="amount">Amount *</label>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                min="1"
                max={selectedBeneficiary ? Math.min(
                  selectedBeneficiary.remainingLimit || Infinity,
                  remitterData?.remainingLimit || Infinity,
                  walletBalance
                ) : walletBalance}
                step="0.01"
                placeholder="Enter amount"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="transferMode">Transfer Mode *</label>
              <select
                id="transferMode"
                name="transferMode"
                value={formData.transferMode}
                onChange={handleInputChange}
                required
              >
                {transferModes.map((mode) => (
                  <option key={mode.value} value={mode.value}>
                    {mode.label} (₹{mode.charge} charge)
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="purpose">Purpose *</label>
            <select
              id="purpose"
              name="purpose"
              value={formData.purpose}
              onChange={handleInputChange}
              required
            >
              {purposes.map((purpose) => (
                <option key={purpose} value={purpose}>
                  {purpose}
                </option>
              ))}
            </select>
          </div>
        </div>

        {formData.amount && (
          <div className="amount-summary">
            <div className="summary-row">
              <span>Transfer Amount:</span>
              <span>₹{parseFloat(formData.amount || 0).toLocaleString()}</span>
            </div>
            <div className="summary-row">
              <span>Service Charges:</span>
              <span>₹{charges.toLocaleString()}</span>
            </div>
            <div className="summary-row total">
              <span>Total Amount:</span>
              <span>₹{totalAmount.toLocaleString()}</span>
            </div>
          </div>
        )}

        <div className="form-actions">
          <button 
            type="submit" 
            className="btn-transfer"
            disabled={loading || !formData.amount || !formData.beneficiaryId || totalAmount > walletBalance}
          >
            {loading ? 'Processing...' : 'Send Money'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MoneyTransferForm;