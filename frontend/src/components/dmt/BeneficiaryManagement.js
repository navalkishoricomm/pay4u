import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { dmtService } from '../../services/dmtService';
import './BeneficiaryManagement.css';

const BeneficiaryManagement = ({ remitterId, beneficiaries, onBeneficiaryAdded }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    mobile: ''
  });
  const [loading, setLoading] = useState(false);
  const [verifyingBeneficiary, setVerifyingBeneficiary] = useState(null);
  const [deletingBeneficiary, setDeletingBeneficiary] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await dmtService.addBeneficiary({
        ...formData,
        remitterId: remitterId
      });
      
      toast.success('Beneficiary added successfully!');
      setFormData({
        accountHolderName: '',
        accountNumber: '',
        ifscCode: '',
        bankName: '',
        mobile: ''
      });
      setShowAddForm(false);
      onBeneficiaryAdded();
    } catch (error) {
      console.error('Add beneficiary error:', error);
      toast.error(error.message || 'Failed to add beneficiary. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyBeneficiary = async (beneficiaryId) => {
    console.log('=== VERIFY BUTTON CLICKED ===');
    console.log('Verifying beneficiary with ID:', beneficiaryId);
    console.log('ID type:', typeof beneficiaryId);
    console.log('ID value:', beneficiaryId);
    console.log('Current verifying state:', verifyingBeneficiary);
    
    setVerifyingBeneficiary(beneficiaryId);

    try {
      console.log('Calling dmtService.verifyBeneficiary...');
      const result = await dmtService.verifyBeneficiary(beneficiaryId);
      console.log('Verify API result:', result);
      toast.success('Beneficiary verified successfully!');
      onBeneficiaryAdded(); // Refresh the list
    } catch (error) {
      console.error('Verify beneficiary error:', error);
      toast.error(error.message || 'Verification failed. Please try again.');
    } finally {
      setVerifyingBeneficiary(null);
    }
  };

  const handleDeleteBeneficiary = async (beneficiaryId) => {
    console.log('=== DELETE BUTTON CLICKED ===');
    console.log('Deleting beneficiary with ID:', beneficiaryId);
    console.log('ID type:', typeof beneficiaryId);
    console.log('ID value:', beneficiaryId);
    console.log('Current deleting state:', deletingBeneficiary);
    
    if (!window.confirm('Are you sure you want to delete this beneficiary?')) {
      console.log('User cancelled deletion');
      return;
    }

    setDeletingBeneficiary(beneficiaryId);

    try {
      console.log('Calling dmtService.deleteBeneficiary...');
      const result = await dmtService.deleteBeneficiary(beneficiaryId);
      console.log('Delete API result:', result);
      toast.success('Beneficiary deleted successfully!');
      onBeneficiaryAdded(); // Refresh the list
    } catch (error) {
      console.error('Delete beneficiary error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setDeletingBeneficiary(null);
    }
  };

  const getBankNameFromIFSC = async (ifsc) => {
    if (ifsc.length === 11) {
      try {
        const response = await fetch(`https://ifsc.razorpay.com/${ifsc}`);
        if (response.ok) {
          const data = await response.json();
          setFormData(prev => ({
            ...prev,
            bankName: data.BANK
          }));
        }
      } catch (error) {
        console.log('Could not fetch bank name');
      }
    }
  };

  const handleIFSCChange = (e) => {
    const ifsc = e.target.value.toUpperCase();
    setFormData(prev => ({
      ...prev,
      ifscCode: ifsc
    }));
    getBankNameFromIFSC(ifsc);
  };

  return (
    <div className="beneficiary-management">
      <div className="beneficiary-header">
        <h2>Manage Beneficiaries</h2>
        <button 
          className="btn-add-beneficiary"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : 'Add New Beneficiary'}
        </button>
      </div>

      {showAddForm && (
        <div className="add-beneficiary-form">
          <h3>Add New Beneficiary</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="accountHolderName">Account Holder Name *</label>
                <input
                  type="text"
                  id="accountHolderName"
                  name="accountHolderName"
                  value={formData.accountHolderName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="mobile">Mobile Number *</label>
                <input
                  type="tel"
                  id="mobile"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleInputChange}
                  pattern="[0-9]{10}"
                  required
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="accountNumber">Account Number *</label>
                <input
                  type="text"
                  id="accountNumber"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="ifscCode">IFSC Code *</label>
                <input
                  type="text"
                  id="ifscCode"
                  name="ifscCode"
                  value={formData.ifscCode}
                  onChange={handleIFSCChange}
                  placeholder="e.g., SBIN0001234"
                  pattern="[A-Z]{4}0[A-Z0-9]{6}"
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="bankName">Bank Name</label>
              <input
                type="text"
                id="bankName"
                name="bankName"
                value={formData.bankName}
                onChange={handleInputChange}
                placeholder="Will be auto-filled from IFSC"
                readOnly
              />
            </div>
            
            <div className="form-actions">
              <button 
                type="submit" 
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Adding...' : 'Add Beneficiary'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="beneficiaries-list">
        <h3>Your Beneficiaries ({beneficiaries.length})</h3>
        
        {beneficiaries.length === 0 ? (
          <div className="no-beneficiaries">
            <p>No beneficiaries added yet. Add your first beneficiary to start sending money.</p>
          </div>
        ) : (
          <div className="beneficiaries-grid">
            {beneficiaries.map((beneficiary, index) => {
              console.log(`=== RENDERING BENEFICIARY ${index + 1} ===`);
              console.log('Beneficiary data:', beneficiary);
              console.log('Beneficiary _id:', beneficiary._id);
              console.log('Beneficiary isVerified:', beneficiary.isVerified);
              return (
              <div key={beneficiary._id} className="beneficiary-card">
                <div className="beneficiary-info">
                  <h4>{beneficiary.accountHolderName}</h4>
                  <p><strong>Account:</strong> {beneficiary.accountNumber}</p>
                  <p><strong>IFSC:</strong> {beneficiary.ifscCode}</p>
                  <p><strong>Bank:</strong> {beneficiary.bankName}</p>
                  <p><strong>Mobile:</strong> {beneficiary.mobile}</p>
                  <p><strong>Monthly Limit:</strong> ₹{beneficiary.monthlyLimit?.toLocaleString()}</p>
                  <p><strong>Remaining:</strong> ₹{beneficiary.remainingLimit?.toLocaleString()}</p>
                </div>
                
                <div className="beneficiary-status">
                  <span className={`status-badge ${beneficiary.isVerified ? 'verified' : 'pending'}`}>
                    {beneficiary.isVerified ? 'Verified' : 'Pending Verification'}
                  </span>
                  
                  <span className={`status-badge ${beneficiary.isActive ? 'active' : 'inactive'}`}>
                    {beneficiary.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div className="beneficiary-actions">
                  {!beneficiary.isVerified && (
                    <button 
                      className="btn-verify"
                      onClick={() => {
                        console.log('Verify button clicked for beneficiary:', beneficiary);
                        console.log('Beneficiary _id:', beneficiary._id);
                        console.log('Beneficiary _id type:', typeof beneficiary._id);
                        handleVerifyBeneficiary(beneficiary._id);
                      }}
                      disabled={verifyingBeneficiary === beneficiary._id}
                    >
                      {verifyingBeneficiary === beneficiary._id ? 'Verifying...' : 'Verify'}
                    </button>
                  )}
                  
                  <button 
                    className="btn-delete"
                    onClick={() => {
                      console.log('Delete button clicked for beneficiary:', beneficiary);
                      console.log('Beneficiary _id:', beneficiary._id);
                      console.log('Beneficiary _id type:', typeof beneficiary._id);
                      handleDeleteBeneficiary(beneficiary._id);
                    }}
                    disabled={deletingBeneficiary === beneficiary._id}
                  >
                    {deletingBeneficiary === beneficiary._id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BeneficiaryManagement;