import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useNotification } from '../context/NotificationContext';
import { useLocation } from '../contexts/LocationContext';
import withLocationPermission from '../hoc/withLocationPermission';

const Wallet = ({ locationData, hasLocationPermission, isLocationAvailable }) => {
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [topupAmount, setTopupAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const [selectedAmount, setSelectedAmount] = useState('');
  const [upiBarcodes, setUpiBarcodes] = useState([]);
  const [selectedBarcode, setSelectedBarcode] = useState(null);
  const [showBarcodes, setShowBarcodes] = useState(false);
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const { success, info, error: showError } = useNotification();
  const { getLocationForAPI } = useLocation();

  // Quick amount options
  const quickAmounts = [100, 200, 500, 1000, 2000, 5000];

  useEffect(() => {
    fetchWalletData();
    fetchPendingTransactions();
    fetchUpiBarcodes();
  }, []);
  
  useEffect(() => {
    // Cleanup function to revoke object URLs
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const fetchWalletData = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/wallet/my-wallet');
      setWalletData(response.data.data.wallet);
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      showError('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingTransactions = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/transactions', {
        params: { status: 'awaiting_approval', type: 'topup' }
      });
      setPendingTransactions(response.data.data.transactions || []);
    } catch (err) {
      console.error('Error fetching pending transactions:', err);
    }
  };

  const fetchUpiBarcodes = async () => {
    try {
      console.log('Attempting to fetch UPI barcodes...');
      const response = await axios.get('http://localhost:5001/api/upi-barcodes/active', {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('UPI Barcodes Response:', response.data);
      const barcodes = response.data.data?.barcodes || response.data.data || [];
      console.log('Parsed barcodes:', barcodes);
      setUpiBarcodes(barcodes);
      // Set default barcode if available
      const defaultBarcode = barcodes.find(barcode => barcode.isDefault);
      console.log('Default barcode found:', defaultBarcode);
      if (defaultBarcode) {
        setSelectedBarcode(defaultBarcode);
        console.log('Selected barcode set to:', defaultBarcode);
      } else if (barcodes.length > 0) {
        // If no default, select the first available barcode
        setSelectedBarcode(barcodes[0]);
        console.log('No default found, selected first barcode:', barcodes[0]);
      }
      alert(`Barcodes loaded: ${barcodes.length}, Selected: ${selectedBarcode ? 'YES' : 'NO'}`);

    } catch (err) {
      console.error('Error fetching UPI barcodes:', err);
      alert(`Error fetching barcodes: ${err.message}`);
    }
  };

  const handleTopup = async (e) => {
    e.preventDefault();
    
    if (!topupAmount || isNaN(topupAmount) || parseFloat(topupAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('amount', parseFloat(topupAmount));
      formData.append('paymentMethod', 'upi');
      
      // Add UPI barcode information
      if (selectedBarcode) {
        formData.append('upiBarcode', JSON.stringify({
          id: selectedBarcode._id,
          name: selectedBarcode.name,
          upiId: selectedBarcode.upiId
        }));
      }
      
      // Add payment screenshot if uploaded
      if (paymentScreenshot) {
        formData.append('paymentScreenshot', paymentScreenshot);
      }
      
      // Add location data if available
      const locationInfo = getLocationForAPI();
      if (locationInfo) {
        formData.append('location', JSON.stringify(locationInfo));
      }
      
      const response = await axios.post('http://localhost:5001/api/wallet/topup', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Update pending transactions
      fetchPendingTransactions();
      
      // Show notification
      info(`Your request to add ₹${topupAmount} has been submitted for approval`);
      setTopupAmount('');
      setSelectedAmount('');
      
      // Reset payment screenshot
      if (paymentScreenshot) {
        setPaymentScreenshot(null);
        setPreviewUrl(null);
        document.getElementById('paymentScreenshot').value = '';
      }
    } catch (error) {
      console.error('Error topping up wallet:', error);
      showError('Failed to top up wallet');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      {/* Mobile-friendly header */}
      <div className="welcome-header">
        <h1><i className="fas fa-wallet"></i> My Wallet</h1>
        <p className="welcome-subtitle">Manage your digital wallet</p>
      </div>
      
      {/* Enhanced wallet card */}
      <div className="wallet-summary">
        <div className="wallet-card">
          <div className="wallet-header">
            <i className="fas fa-wallet wallet-icon"></i>
            <div className="wallet-info">
              <h2>Available Balance</h2>
            </div>
          </div>
          <div className="wallet-balance">
            ₹{walletData?.balance.toFixed(2) || '0.00'}
          </div>
          <p style={{color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.875rem', margin: '0.5rem 0 0 0'}}>
            Last updated: {new Date(walletData?.updatedAt).toLocaleString()}
          </p>
          
          {pendingTransactions.length > 0 && (
            <div className="pending-transactions" style={{marginTop: '1.5rem', padding: '1rem', background: 'rgba(255, 255, 255, 0.1)', borderRadius: 'var(--border-radius)'}}>
              <h3 style={{color: 'rgba(255, 255, 255, 0.9)', fontSize: '1rem', marginBottom: '1rem'}}>Pending Approvals</h3>
              {pendingTransactions.map(transaction => (
                <div key={transaction._id} className="pending-transaction" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid rgba(255, 255, 255, 0.1)'}}>
                  <span style={{color: 'white', fontWeight: '600'}}>₹{transaction.amount.toFixed(2)}</span>
                  <span className="status-badge awaiting" style={{background: '#ffc107', color: '#000', padding: '0.25rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem'}}>Awaiting Approval</span>
                  <span style={{color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.75rem'}}>{new Date(transaction.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Mobile-optimized add money section */}
      <div className="card">
        <div style={{display: 'flex', alignItems: 'center', marginBottom: '1.5rem'}}>
          <i className="fas fa-plus-circle" style={{fontSize: '1.5rem', color: 'var(--primary-color)', marginRight: '0.75rem'}}></i>
          <h2 style={{margin: 0, fontSize: '1.25rem', fontWeight: '700'}}>Add Money to Wallet</h2>
        </div>
        
        <form onSubmit={handleTopup}>
          {/* Quick amount selection */}
          <div className="form-group">
            <label style={{fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', display: 'block'}}>Quick Select Amount</label>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1rem'}}>              
              {quickAmounts.map(amount => (
                <button
                  key={amount}
                  type="button"
                  className={`btn touch-target ${selectedAmount === amount.toString() ? 'btn-primary' : 'btn-outline-primary'}`}
                  style={{padding: '0.75rem 0.5rem', fontSize: '0.875rem', fontWeight: '600'}}
                  onClick={() => {
                    setSelectedAmount(amount.toString());
                    setTopupAmount(amount.toString());
                  }}
                >
                  ₹{amount}
                </button>
              ))}
            </div>
          </div>
          
          {/* Custom amount input */}
          <div className="form-group">
            <label htmlFor="amount" style={{fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', display: 'block'}}>Or Enter Custom Amount (₹)</label>
            <input
              type="number"
              id="amount"
              value={topupAmount}
              onChange={(e) => {
                setTopupAmount(e.target.value);
                setSelectedAmount('');
              }}
              className="form-control touch-target"
              placeholder="Enter amount"
              min="1"
              step="1"
              style={{fontSize: '1rem', padding: '0.875rem'}}
              required
            />
          </div>
          
          {/* Payment methods - UPI only with barcode upload */}
          <div className="form-group">
            <label style={{fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', display: 'block'}}>Payment Method</label>
            <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
              <div className="payment-method active touch-target" style={{display: 'flex', alignItems: 'center', padding: '1rem', border: '2px solid var(--primary-color)', borderRadius: 'var(--border-radius)', background: 'rgba(76, 175, 80, 0.1)'}}>
                <input 
                  type="radio" 
                  id="upi" 
                  name="paymentMethod" 
                  value="upi" 
                  defaultChecked
                  style={{marginRight: '0.75rem', transform: 'scale(1.2)'}}
                />
                <i className="fab fa-google-pay" style={{fontSize: '1.25rem', marginRight: '0.75rem', color: 'var(--primary-color)'}}></i>
                <label htmlFor="upi" style={{fontSize: '1rem', fontWeight: '500', cursor: 'pointer', flex: 1}}>UPI Payment</label>
              </div>
            </div>
          </div>
          
          {/* UPI Barcode Display */}
          <div className="form-group">
            <label style={{fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', display: 'block'}}>UPI Payment QR Code</label>

            
            <div style={{padding: '10px', background: '#f0f0f0', margin: '10px 0', fontSize: '12px'}}>
              Debug Info: selectedBarcode = {selectedBarcode ? 'EXISTS' : 'NULL'}, upiBarcodes length = {upiBarcodes.length}
              {selectedBarcode && <div>Barcode URL: {selectedBarcode.barcodeUrl}</div>}
            </div>
            {selectedBarcode ? (
              <div style={{border: '2px solid var(--primary-color)', borderRadius: 'var(--border-radius)', padding: '1.5rem', textAlign: 'center', background: 'rgba(76, 175, 80, 0.05)'}}>
                <div style={{marginBottom: '1rem'}}>
                  <h3 style={{margin: '0 0 0.5rem 0', fontSize: '1.125rem', fontWeight: '600'}}>{selectedBarcode.name}</h3>
                  <p style={{margin: '0 0 1rem 0', fontSize: '0.875rem', color: 'var(--text-secondary)'}}>UPI ID: {selectedBarcode.upiId}</p>
                </div>
                
                <div style={{display: 'flex', justifyContent: 'center', marginBottom: '1rem'}}>
                  <img 
                    src={selectedBarcode.barcodeUrl}
                    alt={`UPI QR Code for ${selectedBarcode.name}`}
                    style={{maxWidth: '200px', maxHeight: '200px', border: '1px solid #ddd', borderRadius: '8px'}}
                    onError={(e) => {
                      console.error('Failed to load QR code image:', selectedBarcode.barcodeUrl);
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                  <div style={{display: 'none', padding: '2rem', background: '#f8f9fa', borderRadius: '8px', color: '#666'}}>
                    <i className="fas fa-exclamation-triangle" style={{fontSize: '2rem', marginBottom: '0.5rem'}}></i>
                    <p>QR Code not available</p>
                  </div>
                </div>
                
                <div style={{fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.4'}}>
                   <p style={{margin: '0 0 0.5rem 0'}}><i className="fas fa-info-circle" style={{marginRight: '0.5rem'}}></i>Scan this QR code with any UPI app to pay ₹{topupAmount || '0'}</p>
                   <p style={{margin: 0}}>After payment, upload the screenshot below for faster processing</p>
                 </div>
                
                {upiBarcodes.length > 1 && (
                  <button 
                    type="button"
                    className="btn btn-outline-primary"
                    style={{marginTop: '1rem', fontSize: '0.875rem'}}
                    onClick={() => setShowBarcodes(!showBarcodes)}
                  >
                    <i className={`fas ${showBarcodes ? 'fa-eye-slash' : 'fa-eye'}`} style={{marginRight: '0.5rem'}}></i>
                    {showBarcodes ? 'Hide' : 'Show'} Other Payment Options
                  </button>
                )}
              </div>
            ) : (
              <div style={{border: '2px dashed #ccc', borderRadius: 'var(--border-radius)', padding: '1.5rem', textAlign: 'center', background: '#f8f9fa'}}>
                <i className="fas fa-qrcode" style={{fontSize: '2rem', color: '#ccc', marginBottom: '0.5rem'}}></i>
                <p style={{margin: '0.5rem 0', fontSize: '1rem', color: '#666'}}>No UPI QR codes available</p>
                <p style={{margin: 0, fontSize: '0.875rem', color: '#999'}}>Please contact support to set up payment methods</p>
              </div>
            )}
            
            {/* Additional barcode options */}
            {showBarcodes && upiBarcodes.length > 1 && (
              <div style={{marginTop: '1rem', padding: '1rem', background: '#f8f9fa', borderRadius: 'var(--border-radius)'}}>
                <h4 style={{margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: '600'}}>Choose Payment Method:</h4>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem'}}>
                  {upiBarcodes.map(barcode => (
                    <div 
                      key={barcode._id}
                      className={`payment-option ${selectedBarcode?._id === barcode._id ? 'selected' : ''}`}
                      style={{
                        padding: '1rem',
                        border: selectedBarcode?._id === barcode._id ? '2px solid var(--primary-color)' : '1px solid #ddd',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        textAlign: 'center',
                        background: selectedBarcode?._id === barcode._id ? 'rgba(76, 175, 80, 0.1)' : 'white'
                      }}
                      onClick={() => setSelectedBarcode(barcode)}
                    >
                      <h5 style={{margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: '600'}}>{barcode.name}</h5>
                      <p style={{margin: '0', fontSize: '0.75rem', color: 'var(--text-secondary)'}}>{barcode.upiId}</p>
                      {barcode.isDefault && (
                        <span style={{display: 'inline-block', marginTop: '0.5rem', padding: '0.25rem 0.5rem', background: 'var(--primary-color)', color: 'white', borderRadius: '12px', fontSize: '0.625rem'}}>Default</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
           </div>
           
           {/* Payment Screenshot Upload */}
           <div className="form-group" style={{marginTop: '1.5rem'}}>
             <label style={{fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', display: 'block'}}>
               <i className="fas fa-camera" style={{marginRight: '0.5rem', color: 'var(--primary-color)'}}></i>
               Upload Payment Screenshot (Optional)
             </label>
             
             <div style={{border: '2px dashed var(--primary-color)', borderRadius: 'var(--border-radius)', padding: '1.5rem', textAlign: 'center', background: 'rgba(76, 175, 80, 0.05)'}}>
               <input 
                 type="file" 
                 id="paymentScreenshot" 
                 accept="image/*" 
                 style={{display: 'none'}}
                 onChange={(e) => {
                   const file = e.target.files[0];
                   if (file) {
                     setPaymentScreenshot(file);
                     const url = URL.createObjectURL(file);
                     setPreviewUrl(url);
                   }
                 }}
               />
               
               {previewUrl ? (
                 <div>
                   <img 
                     src={previewUrl} 
                     alt="Payment Screenshot Preview" 
                     style={{maxWidth: '200px', maxHeight: '200px', borderRadius: '8px', marginBottom: '1rem'}}
                   />
                   <div style={{display: 'flex', justifyContent: 'center', gap: '0.5rem'}}>
                     <label htmlFor="paymentScreenshot" className="btn btn-outline-primary" style={{cursor: 'pointer', fontSize: '0.875rem'}}>
                       <i className="fas fa-edit" style={{marginRight: '0.5rem'}}></i>
                       Change Image
                     </label>
                     <button 
                       type="button" 
                       className="btn btn-outline-danger" 
                       style={{fontSize: '0.875rem'}}
                       onClick={() => {
                         setPaymentScreenshot(null);
                         setPreviewUrl(null);
                         document.getElementById('paymentScreenshot').value = '';
                       }}
                     >
                       <i className="fas fa-trash" style={{marginRight: '0.5rem'}}></i>
                       Remove
                     </button>
                   </div>
                   <p style={{margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)'}}>
                     File: {paymentScreenshot?.name}
                   </p>
                 </div>
               ) : (
                 <label htmlFor="paymentScreenshot" style={{cursor: 'pointer', display: 'block'}}>
                   <i className="fas fa-cloud-upload-alt" style={{fontSize: '2rem', color: 'var(--primary-color)', marginBottom: '0.5rem'}}></i>
                   <p style={{margin: '0.5rem 0', fontSize: '1rem', fontWeight: '500'}}>Click to upload payment screenshot</p>
                   <p style={{margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)'}}>Upload screenshot of your UPI payment for faster processing</p>
                 </label>
               )}
             </div>
             
             <div style={{marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center'}}>
               <i className="fas fa-info-circle" style={{marginRight: '0.5rem'}}></i>
               Supported formats: JPG, PNG, GIF (Max 5MB)
             </div>
           </div>
           
           {/* Submit button */}
          <button 
            type="submit" 
            className="btn btn-primary btn-block touch-target"
            disabled={isProcessing}
            style={{padding: '1rem', fontSize: '1.125rem', fontWeight: '700', marginTop: '1.5rem'}}
          >
            <i className={`fas ${isProcessing ? 'fa-spinner fa-spin' : 'fa-plus'} btn-icon`}></i>
            {isProcessing ? 'Processing...' : 'Add Money'}
          </button>
          
          {/* Info text */}
          <div style={{marginTop: '1rem', padding: '0.75rem', background: 'var(--light-color)', borderRadius: 'var(--border-radius)', textAlign: 'center'}}>
            <p style={{margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)'}}>
              <i className="fas fa-info-circle" style={{marginRight: '0.5rem'}}></i>
              Note: This is a demo application. No actual payment will be processed.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default withLocationPermission(Wallet, {
  requireLocation: true,
  showLocationInfo: true
});