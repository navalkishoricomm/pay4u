// Test script to check require paths from routes directory
const path = require('path');
const fs = require('fs');

console.log('=== ROUTES DIRECTORY MODULE TEST ===');
console.log('Current working directory:', process.cwd());
console.log('Script location:', __dirname);

// Test different path variations
const pathVariations = [
  '../models/DmtTransaction.js',
  './models/DmtTransaction.js',
  '../../models/DmtTransaction.js'
];

console.log('\n=== PATH VARIATIONS TEST ===');
pathVariations.forEach(testPath => {
  const fullPath = path.resolve(__dirname, testPath);
  const exists = fs.existsSync(fullPath);
  console.log(`${testPath}: ${exists ? 'EXISTS' : 'NOT FOUND'} (${fullPath})`);
  
  if (exists) {
    try {
      const model = require(testPath);
      console.log(`  REQUIRE: SUCCESS - ${model.modelName || 'Model loaded'}`);
    } catch (error) {
      console.log(`  REQUIRE: ERROR - ${error.message}`);
    }
  }
});

console.log('\n=== TEST COMPLETE ===');