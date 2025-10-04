// Test script to verify adminDMT.js can be loaded
console.log('=== ADMIN DMT LOADING TEST ===');
console.log('Current working directory:', process.cwd());

try {
  console.log('Attempting to load adminDMT route...');
  const adminDMT = require('./routes/adminDMT');
  console.log('SUCCESS: adminDMT route loaded successfully');
  console.log('Route type:', typeof adminDMT);
} catch (error) {
  console.log('ERROR loading adminDMT route:');
  console.log('Message:', error.message);
  console.log('Code:', error.code);
  console.log('Stack:', error.stack);
}

console.log('\n=== TEST COMPLETE ===');