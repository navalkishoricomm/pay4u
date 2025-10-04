// Test script to diagnose module loading issues
const path = require('path');
const fs = require('fs');

console.log('=== MODULE LOADING DIAGNOSTIC ===');
console.log('Current working directory:', process.cwd());
console.log('Node.js version:', process.version);
console.log('Platform:', process.platform);

// Test file existence
const modelFiles = [
  './models/DmtTransaction.js',
  './models/DmtRemitter.js',
  './models/DmtBeneficiary.js'
];

console.log('\n=== FILE EXISTENCE CHECK ===');
modelFiles.forEach(file => {
  const fullPath = path.resolve(__dirname, file);
  const exists = fs.existsSync(fullPath);
  console.log(`${file}: ${exists ? 'EXISTS' : 'NOT FOUND'} (${fullPath})`);
});

// Test require statements
console.log('\n=== REQUIRE TEST ===');
modelFiles.forEach(file => {
  try {
    const model = require(file);
    console.log(`${file}: SUCCESS - ${model.modelName || 'Model loaded'}`);
  } catch (error) {
    console.log(`${file}: ERROR - ${error.message}`);
    console.log(`Error code: ${error.code}`);
    console.log(`Error stack: ${error.stack}`);
  }
});

// Test case sensitivity
console.log('\n=== CASE SENSITIVITY TEST ===');
const caseTestFiles = [
  './models/dmttransaction.js',
  './models/DMTTransaction.js',
  './models/DmtTransaction.js'
];

caseTestFiles.forEach(file => {
  const fullPath = path.resolve(__dirname, file);
  const exists = fs.existsSync(fullPath);
  console.log(`${file}: ${exists ? 'EXISTS' : 'NOT FOUND'}`);
});

console.log('\n=== DIAGNOSTIC COMPLETE ===');