const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testDeleteAPI() {
  try {
    // First, login to get the token
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'mukgarg11@gmail.com',
        password: '12345678'
      })
    });
    
    const loginData = await loginResponse.json();
    if (!loginResponse.ok) {
      console.error('Login failed:', loginData);
      return;
    }
    
    const token = loginData.token;
    console.log('Login successful, got token');
    
    // Test getting beneficiaries first
    const remitterId = '68b2cff230906ef156ed8c8b'; // From our test
    const getBeneficiariesResponse = await fetch(`http://localhost:5000/api/dmt/remitter/${remitterId}/beneficiaries`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const beneficiariesData = await getBeneficiariesResponse.json();
    console.log('\n=== Get Beneficiaries Response ===');
    console.log('Status:', getBeneficiariesResponse.status);
    console.log('Response:', JSON.stringify(beneficiariesData, null, 2));
    
    if (beneficiariesData.data && beneficiariesData.data.beneficiaries && beneficiariesData.data.beneficiaries.length > 0) {
      const firstBeneficiary = beneficiariesData.data.beneficiaries[0];
      console.log('\n=== Testing Delete API ===');
      console.log('Attempting to delete beneficiary:', firstBeneficiary.accountHolderName);
      console.log('Beneficiary ID:', firstBeneficiary._id);
      
      // Test delete API
      const deleteResponse = await fetch(`http://localhost:5000/api/dmt/beneficiary/${firstBeneficiary._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const deleteData = await deleteResponse.json();
      console.log('\n=== Delete Response ===');
      console.log('Status:', deleteResponse.status);
      console.log('Response:', JSON.stringify(deleteData, null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testDeleteAPI();