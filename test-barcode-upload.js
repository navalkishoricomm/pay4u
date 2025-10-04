const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Test barcode upload functionality
async function testBarcodeUpload() {
  try {
    console.log('Testing UPI Barcode Upload...');
    
    // First, let's test if we can reach the endpoint
    console.log('\n1. Testing endpoint accessibility...');
    
    try {
      const response = await axios.get('http://localhost:5001/api/upi-barcodes', {
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });
      console.log('GET /api/upi-barcodes:', response.status);
    } catch (error) {
      console.log('GET /api/upi-barcodes Error:', error.response?.status, error.response?.statusText);
      console.log('Error message:', error.response?.data || error.message);
    }
    
    // Test POST endpoint
    console.log('\n2. Testing POST endpoint...');
    
    // Create a simple test image (SVG)
    const testImageContent = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
  <rect width="100" height="100" fill="blue"/>
  <text x="50" y="50" text-anchor="middle" fill="white">QR</text>
</svg>`;
    
    const testImagePath = path.join(__dirname, 'test-barcode.svg');
    fs.writeFileSync(testImagePath, testImageContent);
    
    const formData = new FormData();
    formData.append('barcodeName', 'Test Barcode');
    formData.append('upiId', 'test@upi');
    formData.append('description', 'Test barcode for debugging');
    formData.append('isActive', 'true');
    formData.append('isDefault', 'false');
    formData.append('barcodeImage', fs.createReadStream(testImagePath));
    
    try {
      const response = await axios.post('http://localhost:5001/api/upi-barcodes', formData, {
        headers: {
          ...formData.getHeaders(),
          'Authorization': 'Bearer test-token'
        }
      });
      console.log('POST Success:', response.status, response.data);
    } catch (error) {
      console.log('POST Error:', error.response?.status, error.response?.statusText);
      console.log('Error details:', error.response?.data || error.message);
      console.log('Request URL:', error.config?.url);
    }
    
    // Clean up test file
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run the test
testBarcodeUpload();