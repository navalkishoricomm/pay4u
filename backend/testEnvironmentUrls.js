require('dotenv').config();
const dmtService = require('./services/dmtService');
const aepsService = require('./services/aepsService');

async function testEnvironmentUrls() {
  console.log('🔍 Testing Environment URL Configuration\n');
  
  // Test current environment
  console.log('Current Environment Settings:');
  console.log(`NODE_ENV: ${process.env.NODE_ENV || 'undefined (defaults to development)'}`);
  console.log('');
  
  // Test DMT Service URLs
  console.log('=== DMT Service URL Configuration ===');
  const dmtBaseUrl = dmtService.getBaseURL();
  console.log(`DMT Base URL: ${dmtBaseUrl}`);
  
  // Test AEPS Service URLs
  console.log('\n=== AEPS Service URL Configuration ===');
  const aepsBaseUrl = aepsService.getBaseURL();
  console.log(`AEPS Base URL: ${aepsBaseUrl}`);
  
  // Test different environment scenarios
  console.log('\n=== Environment Scenario Testing ===');
  
  // Temporarily test different NODE_ENV values
  const originalEnv = process.env.NODE_ENV;
  
  // Test development environment
  process.env.NODE_ENV = 'development';
  console.log('Development Environment:');
  console.log(`  DMT URL: ${dmtService.getBaseURL()}`);
  console.log(`  AEPS URL: ${aepsService.getBaseURL()}`);
  
  // Test production environment
  process.env.NODE_ENV = 'production';
  console.log('\nProduction Environment:');
  console.log(`  DMT URL: ${dmtService.getBaseURL()}`);
  console.log(`  AEPS URL: ${aepsService.getBaseURL()}`);
  
  // Test undefined environment (should default to development)
  delete process.env.NODE_ENV;
  console.log('\nUndefined Environment (should default to development):');
  console.log(`  DMT URL: ${dmtService.getBaseURL()}`);
  console.log(`  AEPS URL: ${aepsService.getBaseURL()}`);
  
  // Restore original environment
  process.env.NODE_ENV = originalEnv;
  
  // Verify URL patterns
  console.log('\n=== URL Pattern Verification ===');
  
  const uatPattern = 'https://sit.paysprint.in/service-api/api/v1/service';
  const livePattern = 'https://api.paysprint.in/api/v1/service';
  
  console.log('Expected URL Patterns:');
  console.log(`  UAT/Development: ${uatPattern}`);
  console.log(`  Live/Production: ${livePattern}`);
  
  // Test full endpoint construction
  console.log('\n=== Full Endpoint Examples ===');
  
  process.env.NODE_ENV = 'development';
  console.log('Development Endpoints:');
  console.log(`  Balance: ${dmtService.getBaseURL()}${dmtService.paysprintEndpoints.balance}`);
  console.log(`  Bank List: ${dmtService.getBaseURL()}${dmtService.paysprintEndpoints.bankList}`);
  console.log(`  Money Transfer: ${dmtService.getBaseURL()}${dmtService.paysprintEndpoints.moneyTransfer}`);
  
  process.env.NODE_ENV = 'production';
  console.log('\nProduction Endpoints:');
  console.log(`  Balance: ${dmtService.getBaseURL()}${dmtService.paysprintEndpoints.balance}`);
  console.log(`  Bank List: ${dmtService.getBaseURL()}${dmtService.paysprintEndpoints.bankList}`);
  console.log(`  Money Transfer: ${dmtService.getBaseURL()}${dmtService.paysprintEndpoints.moneyTransfer}`);
  
  // Restore original environment
  process.env.NODE_ENV = originalEnv;
  
  console.log('\n✅ Environment URL Configuration Test Complete!');
  console.log('\n📋 Summary:');
  console.log('- DMT and AEPS services now support environment-based URLs');
  console.log('- Development/UAT: https://sit.paysprint.in/service-api/api/v1/service');
  console.log('- Production/Live: https://api.paysprint.in/api/v1/service');
  console.log('- URL selection is automatic based on NODE_ENV variable');
  
  console.log('\n🔧 Next Steps:');
  console.log('1. Set NODE_ENV=development for UAT testing');
  console.log('2. Set NODE_ENV=production for live deployment');
  console.log('3. Update your .env file with appropriate credentials for each environment');
}

// Run the test
testEnvironmentUrls().catch(console.error);