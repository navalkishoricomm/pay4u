const testAuth = async () => {
  try {
    // Test login
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'testuser@pay4u.com',
        password: 'testpass123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);
    
    if (loginData.token) {
      console.log('Login successful, testing mobile verification...');
      
      // Test mobile verification with authentication
      const verifyResponse = await fetch('http://localhost:5000/api/dmt/remitter/verify-mobile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${loginData.token}`
        },
        body: JSON.stringify({
          mobile: '9876543210'
        })
      });
      
      const verifyData = await verifyResponse.json();
      console.log('Mobile verification response:', verifyData);
      
      if (verifyResponse.ok) {
        console.log('✅ Mobile verification working correctly!');
      } else {
        console.log('❌ Mobile verification failed:', verifyData);
      }
    } else {
      console.log('❌ Login failed:', loginData);
    }
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
};

testAuth();