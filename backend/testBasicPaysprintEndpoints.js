const axios = require('axios');
const mongoose = require('mongoose');
const ApiProvider = require('./models/ApiProvider');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/pay4u', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function testBasicEndpoints() {
    try {
        console.log('🔍 Testing basic Paysprint endpoints...');
        
        // Get Paysprint provider
        const paysprintProvider = await ApiProvider.findOne({ name: 'paysprint' });
        if (!paysprintProvider) {
            console.log('❌ Paysprint provider not found!');
            return;
        }
        
        console.log('Base URL:', paysprintProvider.baseUrl);
        
        // Initialize DMT service
        const dmtService = require('./services/dmtService');
        await dmtService.initialize();
        
        // Test different basic endpoints that might exist
        const testEndpoints = [
            '/checkip',
            '/check-ip', 
            '/ip-check',
            '/balance',
            '/check-balance',
            '/status',
            '/ping',
            '/health',
            '/',
            '/api/checkip',
            '/api/balance'
        ];
        
        console.log('\n=== Testing Basic Endpoints ===');
        
        for (const endpoint of testEndpoints) {
            try {
                console.log(`\n🔄 Testing: ${paysprintProvider.baseUrl}${endpoint}`);
                
                const response = await dmtService.makeApiRequest(endpoint, 'GET', {});
                console.log(`✅ SUCCESS: ${endpoint}`);
                console.log('Response:', JSON.stringify(response, null, 2));
                break; // If we find a working endpoint, stop testing
                
            } catch (error) {
                console.log(`❌ FAILED: ${endpoint} - ${error.message}`);
                if (error.response && error.response.status !== 404) {
                    console.log('   Status:', error.response.status);
                    console.log('   Headers:', error.response.headers);
                    if (error.response.data && typeof error.response.data === 'string' && error.response.data.length < 500) {
                        console.log('   Response:', error.response.data.substring(0, 200));
                    }
                }
            }
        }
        
        console.log('\n=== Testing with different base URLs ===');
        
        // Test different base URL variations
        const baseUrlVariations = [
            'https://api.paysprint.in',
            'https://api.paysprint.in/api',
            'https://api.paysprint.in/v1',
            'https://paysprint.in/api',
            'https://sit.paysprint.in'
        ];
        
        for (const baseUrl of baseUrlVariations) {
            try {
                console.log(`\n🔄 Testing base URL: ${baseUrl}/checkip`);
                
                const response = await axios.get(`${baseUrl}/checkip`, {
                    headers: {
                        'Authorization': `Bearer ${paysprintProvider.apiKey}`,
                        'Content-Type': 'application/json',
                        ...Object.fromEntries(paysprintProvider.headers)
                    },
                    timeout: 10000
                });
                
                console.log(`✅ SUCCESS with base URL: ${baseUrl}`);
                console.log('Response:', response.data);
                break;
                
            } catch (error) {
                console.log(`❌ FAILED: ${baseUrl} - ${error.message}`);
            }
        }
        
    } catch (error) {
        console.error('❌ Error testing endpoints:', error);
    } finally {
        mongoose.connection.close();
        console.log('\nDatabase connection closed.');
    }
}

testBasicEndpoints();