const axios = require('axios');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const ApiProvider = require('./models/ApiProvider');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/pay4u', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Generate JWT Token with correct payload for UAT
function generateJWT(partnerId, jwtKey) {
    const payload = {
        timestamp: Math.floor(Date.now() / 1000), // Current timestamp in seconds
        partnerId: partnerId,
        reqid: Math.floor(Math.random() * 1000000).toString() // Unique request ID
    };
    
    console.log('JWT Payload:', payload);
    
    const token = jwt.sign(payload, jwtKey, { algorithm: 'HS256' });
    return token;
}

async function testPaysprintUATFinal() {
    try {
        console.log('🔍 Testing Paysprint UAT with updated credentials...');
        
        // Get updated Paysprint provider
        const paysprintProvider = await ApiProvider.findOne({ name: 'paysprint' });
        if (!paysprintProvider) {
            console.log('❌ Paysprint provider not found!');
            return;
        }
        
        console.log('Current Base URL:', paysprintProvider.baseUrl);
        console.log('API Key:', paysprintProvider.apiKey);
        console.log('API Secret:', paysprintProvider.apiSecret);
        
        // Extract credentials
        const headersMap = new Map(paysprintProvider.headers);
        const partnerId = headersMap.get('PARTNERID') || 'PS0012468';
        const jwtKey = paysprintProvider.apiSecret;
        
        console.log('Partner ID:', partnerId);
        console.log('JWT Key:', jwtKey);
        
        // Generate JWT token
        const jwtToken = generateJWT(partnerId, jwtKey);
        console.log('Generated JWT Token:', jwtToken);
        
        // Test UAT endpoints
        const testEndpoints = [
            {
                name: 'DMT Bank List',
                url: `${paysprintProvider.baseUrl}/dmt/banklist`,
                method: 'GET'
            },
            {
                name: 'Balance Check',
                url: `${paysprintProvider.baseUrl}/balance`,
                method: 'GET'
            },
            {
                name: 'Query Remitter',
                url: `${paysprintProvider.baseUrl}/dmt/remitter/queryremitter`,
                method: 'POST',
                body: {
                    mobile: '9999999999'
                }
            }
        ];
        
        console.log('\n=== Testing Paysprint UAT Endpoints ===');
        
        for (const endpoint of testEndpoints) {
            try {
                console.log(`\n🔄 Testing: ${endpoint.name}`);
                console.log(`   URL: ${endpoint.url}`);
                console.log(`   Method: ${endpoint.method}`);
                
                // Prepare headers
                const headers = {
                    'Authorization': `Bearer ${jwtToken}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorisedkey': paysprintProvider.apiKey
                };
                
                console.log('   Headers:', JSON.stringify(headers, null, 2));
                
                // Make API request
                const config = {
                    method: endpoint.method,
                    url: endpoint.url,
                    headers: headers,
                    timeout: 15000
                };
                
                if (endpoint.method === 'POST' && endpoint.body) {
                    config.data = endpoint.body;
                    console.log('   Request Body:', JSON.stringify(endpoint.body, null, 2));
                }
                
                const response = await axios(config);
                
                console.log(`✅ SUCCESS: ${endpoint.name}`);
                console.log('   Status:', response.status);
                console.log('   Response Headers:', JSON.stringify(response.headers, null, 2));
                console.log('   Response Data:', JSON.stringify(response.data, null, 2));
                
                // If we get a successful response, we found working endpoints
                if (response.status === 200) {
                    console.log('\n🎉 PAYSPRINT UAT AUTHENTICATION SUCCESSFUL!');
                    console.log('   The UAT environment is working with proper credentials.');
                    console.log('   You can now proceed with DMT transactions.');
                    break;
                }
                
            } catch (error) {
                console.log(`❌ FAILED: ${endpoint.name}`);
                console.log('   Error:', error.message);
                
                if (error.response) {
                    console.log('   Status:', error.response.status);
                    console.log('   Status Text:', error.response.statusText);
                    
                    if (error.response.data) {
                        if (typeof error.response.data === 'string' && error.response.data.length < 1000) {
                            console.log('   Response Data:', error.response.data);
                        } else if (typeof error.response.data === 'object') {
                            console.log('   Response Data:', JSON.stringify(error.response.data, null, 2));
                        } else {
                            console.log('   Response Data: [Large response, truncated]');
                        }
                    }
                    
                    // Analyze the error
                    if (error.response.status === 401) {
                        console.log('   ⚠️  Authentication failed - check JWT token or API key');
                    } else if (error.response.status === 403) {
                        console.log('   ⚠️  Forbidden - check partner permissions');
                    } else if (error.response.status === 500) {
                        console.log('   ⚠️  Server error - endpoint exists but has internal issues');
                    } else if (error.response.status === 404) {
                        console.log('   ⚠️  Endpoint not found - check URL structure');
                    }
                }
            }
        }
        
        console.log('\n=== Summary ===');
        console.log('Current Paysprint Configuration:');
        console.log(`   Base URL: ${paysprintProvider.baseUrl}`);
        console.log(`   Partner ID: ${partnerId}`);
        console.log(`   API Key: ${paysprintProvider.apiKey}`);
        console.log('\nNext Steps:');
        console.log('1. If authentication is successful, you can proceed with DMT transactions');
        console.log('2. If still getting errors, you may need to contact Paysprint support for correct UAT credentials');
        console.log('3. Consider testing with production credentials if UAT continues to fail');
        
    } catch (error) {
        console.error('❌ Error testing Paysprint UAT:', error);
    } finally {
        mongoose.connection.close();
        console.log('\nDatabase connection closed.');
    }
}

testPaysprintUATFinal();