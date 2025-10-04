const express = require('express');
const mongoose = require('mongoose');

// Test if all required modules can be loaded
try {
  console.log('Testing module imports...');
  
  // Test the problematic adminDMT route
  const adminDMT = require('./routes/adminDMT');
  console.log('✅ adminDMT route loaded successfully');
  
  // Test other key modules
  const server = require('./server');
  console.log('✅ Server module loaded successfully');
  
  console.log('\n🎉 All modules loaded successfully! Backend should start without import errors.');
  
} catch (error) {
  console.error('❌ Module loading failed:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

process.exit(0);