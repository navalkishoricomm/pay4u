const axios = require('axios');

// Test frontend accessibility
async function testFrontend() {
  try {
    console.log('Testing frontend server...');
    
    // Test main page
    const response = await axios.get('http://localhost:3000');
    console.log('✅ Frontend server responding:', response.status);
    console.log('Content length:', response.data.length);
    
    // Check if HTML contains React app div
    if (response.data.includes('<div id="root">')) {
      console.log('✅ React app container found in HTML');
    } else {
      console.log('❌ React app container NOT found in HTML');
    }
    
    // Check if JavaScript bundle is referenced
    if (response.data.includes('main.16212251.js')) {
      console.log('✅ JavaScript bundle referenced in HTML');
    } else {
      console.log('❌ JavaScript bundle NOT referenced in HTML');
    }
    
    // Test static file access
    const jsResponse = await axios.get('http://localhost:3000/static/js/main.16212251.js');
    console.log('✅ JavaScript bundle accessible:', jsResponse.status);
    console.log('Bundle size:', jsResponse.data.length, 'characters');
    
    console.log('\n🔍 Frontend appears to be working correctly.');
    console.log('If you\'re seeing a blank page, try:');
    console.log('1. Hard refresh (Ctrl+F5 or Ctrl+Shift+R)');
    console.log('2. Clear browser cache');
    console.log('3. Open browser developer tools (F12) and check Console tab for errors');
    console.log('4. Check Network tab for failed requests');
    
  } catch (error) {
    console.error('❌ Frontend test failed:', error.message);
  }
}

testFrontend();