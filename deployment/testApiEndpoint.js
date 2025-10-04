// Using built-in fetch (Node.js 18+)

// Test the actual API endpoint
const testBeneficiariesAPI = async () => {
  try {
    // Use a valid JWT token (you may need to update this)
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YWQ2NDcxYWQ2YTJjMzE2NWVmOWU5ZSIsImlhdCI6MTc1NjYzOTg4NywiZXhwIjoxNzY0NDE1ODg3fQ.wkVyNNaDI8avpUzyLs4Biw2yeQZvS7787XdM1N3NRIw';
    const remitterId = '68b2cff230906ef156ed8c8b'; // From the logs
    
    console.log('Testing API endpoint:', `http://localhost:5000/api/dmt/remitter/${remitterId}/beneficiaries`);
    
    const response = await fetch(`http://localhost:5000/api/dmt/remitter/${remitterId}/beneficiaries`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));
    
    const data = await response.json();
    console.log('\n=== API Response ===');
    console.log('Full response:', JSON.stringify(data, null, 2));
    
    if (data.data && data.data.beneficiaries && data.data.beneficiaries.length > 0) {
      console.log('\n=== First Beneficiary Analysis ===');
      const firstBen = data.data.beneficiaries[0];
      console.log('_id:', firstBen._id);
      console.log('_id type:', typeof firstBen._id);
      console.log('id:', firstBen.id);
      console.log('id type:', typeof firstBen.id);
      console.log('isVerified:', firstBen.isVerified);
      console.log('isVerified type:', typeof firstBen.isVerified);
      console.log('verificationStatus:', firstBen.verificationStatus);
      console.log('accountHolderName:', firstBen.accountHolderName);
    }
    
  } catch (error) {
    console.error('Error testing API:', error);
  }
};

testBeneficiariesAPI();