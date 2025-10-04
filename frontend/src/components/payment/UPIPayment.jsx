import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  Grid
} from '@mui/material';
import {
  QrCode as QrCodeIcon,
  ContentCopy as CopyIcon,
  Payment as PaymentIcon
} from '@mui/icons-material';
import axios from 'axios';

const UPIPayment = ({ amount, onPaymentComplete, transactionId }) => {
  const [barcode, setBarcode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [transactionRef, setTransactionRef] = useState('');
  const [alert, setAlert] = useState({ show: false, message: '', severity: 'info' });

  useEffect(() => {
    fetchDefaultBarcode();
  }, []);

  const fetchDefaultBarcode = async () => {
    try {
      const response = await axios.get('/api/upi-barcodes/default');
      setBarcode(response.data.data.barcode);
      
      // Track usage
      if (response.data.data.barcode) {
        await axios.patch(`/api/upi-barcodes/${response.data.data.barcode._id}`, {
          usageCount: response.data.data.barcode.usageCount + 1,
          lastUsed: new Date()
        });
      }
    } catch (error) {
      setError('Unable to load payment barcode. Please try again later.');
      console.error('Error fetching barcode:', error);
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (message, severity = 'info') => {
    setAlert({ show: true, message, severity });
    setTimeout(() => setAlert({ show: false, message: '', severity: 'info' }), 5000);
  };

  const handleCopyUPI = () => {
    if (barcode?.upiId) {
      navigator.clipboard.writeText(barcode.upiId);
      showAlert('UPI ID copied to clipboard!', 'success');
    }
  };

  const handlePaymentSubmit = () => {
    if (!transactionRef.trim()) {
      showAlert('Please enter transaction reference number', 'error');
      return;
    }

    // Call parent callback with payment details
    if (onPaymentComplete) {
      onPaymentComplete({
        transactionRef: transactionRef.trim(),
        amount,
        upiId: barcode.upiId,
        barcodeName: barcode.name,
        transactionId
      });
    }

    setPaymentDialog(false);
    setTransactionRef('');
    showAlert('Payment details submitted successfully!', 'success');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !barcode) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error || 'No payment barcode available'}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {alert.show && (
        <Alert severity={alert.severity} sx={{ mb: 2 }}>
          {alert.message}
        </Alert>
      )}

      <Card elevation={3}>
        <CardContent sx={{ textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom color="primary">
            <QrCodeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            UPI Payment
          </Typography>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="h6" gutterBottom>
            {barcode.name}
          </Typography>
          
          {amount && (
            <Typography variant="h4" color="primary" gutterBottom>
              ₹{amount}
            </Typography>
          )}
          
          <Box sx={{ my: 3 }}>
            <img
              src={`/uploads/admin-barcodes/${barcode.barcodeImage.filename}`}
              alt={barcode.name}
              style={{
                maxWidth: '100%',
                maxHeight: '300px',
                border: '2px solid #e0e0e0',
                borderRadius: '8px'
              }}
            />
          </Box>
          
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                backgroundColor: '#f5f5f5',
                p: 2,
                borderRadius: 1
              }}>
                <Typography variant="body1" sx={{ mr: 1 }}>
                  UPI ID: <strong>{barcode.upiId}</strong>
                </Typography>
                <Button
                  size="small"
                  startIcon={<CopyIcon />}
                  onClick={handleCopyUPI}
                >
                  Copy
                </Button>
              </Box>
            </Grid>
          </Grid>
          
          {barcode.description && (
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              {barcode.description}
            </Typography>
          )}
          
          <Box sx={{ mb: 2 }}>
            <Chip label="Default Payment Method" color="primary" size="small" />
          </Box>
          
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Scan the QR code or use the UPI ID to make payment
          </Typography>
          
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<PaymentIcon />}
            onClick={() => setPaymentDialog(true)}
            sx={{ mt: 2 }}
          >
            I Have Made Payment
          </Button>
        </CardContent>
      </Card>

      {/* Payment Confirmation Dialog */}
      <Dialog open={paymentDialog} onClose={() => setPaymentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Payment</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Please enter your transaction reference number to confirm the payment.
          </Typography>
          
          <Box sx={{ my: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="body2">
              <strong>Amount:</strong> ₹{amount}
            </Typography>
            <Typography variant="body2">
              <strong>UPI ID:</strong> {barcode.upiId}
            </Typography>
            {transactionId && (
              <Typography variant="body2">
                <strong>Transaction ID:</strong> {transactionId}
              </Typography>
            )}
          </Box>
          
          <TextField
            fullWidth
            label="Transaction Reference Number"
            value={transactionRef}
            onChange={(e) => setTransactionRef(e.target.value)}
            placeholder="Enter UTR/Transaction ID from your payment app"
            margin="normal"
            required
          />
          
          <Typography variant="caption" color="textSecondary">
            This reference number can be found in your UPI payment app after successful payment.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialog(false)}>Cancel</Button>
          <Button 
            onClick={handlePaymentSubmit} 
            variant="contained"
            disabled={!transactionRef.trim()}
          >
            Confirm Payment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UPIPayment;