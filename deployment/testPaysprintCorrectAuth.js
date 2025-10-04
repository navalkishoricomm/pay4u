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

// AES Encryption function
function aesEncrypt(text, key, iv) {
    const cipher = crypto.createCipher('aes-128-cbc', key);
    cipher.setAutoPadding(true);
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted;
}

// Generate JWT Token with correct payload
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

async function testCorrectPaysprintAuth() {
    try {
        console.log('🔍 Testing Paysprint with correct authentication...');
        
        // Get Paysprint provider
        const paysprintProvider = await ApiProvider.findOne({ name: 'paysprint' });
        if (!paysprintProvider) {
            console.log('❌ Paysprint provider not found!');
            return;
        }
        
        console.log('Current Base URL:', paysprintProvider.baseUrl);
        console.log('API Key:', paysprintProvider.apiKey);
        console.log('API Secret:', paysprintProvider.apiSecret);
        
        // Extract credentials from headers or use defaults
        const headersMap = new Map(paysprintProvider.headers);
        const partnerId = headersMap.get('PARTNERID') || 'PS001';
        const jwtKey = paysprintProvider.apiSecret; // Use API secret as JWT key
        const aesKey = headersMap.get('AES_KEY') || '060e37d1XXXXXXXX';
        const aesIV = headersMap.get('AES_IV') || '788a4b95XXXXXXXX';
        
        console.log('Partner ID:', partnerId);
        console.log('JWT Key:', jwtKey);
        console.log('AES Key:', aesKey);
        console.log('AES IV:', aesIV);
        
        // Generate JWT token
        const jwtToken = generateJWT(partnerId, jwtKey);
        console.log('Generated JWT Token:', jwtToken);
        
        // Test different endpoint variations based on official documentation
        const testEndpoints = [
            // Based on official docs: https://xyz.xyz.in/service-api/api/v1/service/dmt/...
            {
                name: 'Query Remitter',
                url: `${paysprintProvider.baseUrl}/dmt/remitter/queryremitter`,
                method: 'POST',
                body: {
                    mobile: '9999999999' // Test mobile number
                }
            },
            {
                name: 'DMT Bank List',
                url: `${paysprintProvider.baseUrl}/dmt/banklist`,
                method: 'GET',
                body: {}
            },
            {
                name: 'Balance Check',
                url: `${paysprintProvider.baseUrl}/balance`,
                method: 'GET',
                body: {}
            }
        ];
        
        console.log('\n=== Testing Paysprint Endpoints with Correct Auth ===');
        
        for (const endpoint of testEndpoints) {
            try {
                console.log(`\n🔄 Testing: ${endpoint.name}`);
                console.log(`   URL: ${endpoint.url}`);
                console.log(`   Method: ${endpoint.method}`);
                
                // Prepare request body
                let requestBody = '';
                if (endpoint.method === 'POST' && Object.keys(endpoint.body).length > 0) {
                    // AES encrypt the body if it's a POST request
                    const bodyString = JSON.stringify(endpoint.body);
                    console.log('   Original Body:', bodyString);
                    
                    try {
                        requestBody = aesEncrypt(bodyString, aesKey, aesIV);
                        console.log('   Encrypted Body:', requestBody);
                    } catch (encError) {
                        console.log('   AES Encryption failed, using plain body:', encError.message);
                        requestBody = bodyString;
                    }
                }
                
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
                
                if (endpoint.method === 'POST' && requestBody) {
                    config.data = requestBody;
                }
                
                const response = await axios(config);
                
                console.log(`✅ SUCCESS: ${endpoint.name}`);
                console.log('   Status:', response.status);
                console.log('   Response Headers:', JSON.stringify(response.headers, null, 2));
                console.log('   Response Data:', JSON.stringify(response.data, null, 2));
                
                // If we get a successful response, we found working endpoints
                if (response.status === 200) {
                    console.log('\n🎉 FOUND WORKING ENDPOINT! Authentication is successful.');
                    break;
                }
                
            } catch (error) {
                console.log(`❌ FAILED: ${endpoint.name}`);
                console.log('   Error:', error.message);
                
                if (error.response) {
                    console.log('   Status:', error.response.status);
                    console.log('   Status Text:', error.response.statusText);
                    console.log('   Response Headers:', JSON.stringify(error.response.headers, null, 2));
                    
                    if (error.response.data) {
                        if (typeof error.response.data === 'string' && error.response.data.length < 1000) {
                            console.log('   Response Data:', error.response.data);
                        } else if (typeof error.response.data === 'object') {
                            console.log('   Response Data:', JSON.stringify(error.response.data, null, 2));
                        } else {
                            console.log('   Response Data: [Large response, truncated]');
                        }
                    }
                    
                    // Check if it's not a 404 - might be authentication issue
                    if (error.response.status !== 404) {
                        console.log('   ⚠️  Non-404 error - might be authentication or parameter issue');
                    }
                }
            }
        }
        
        console.log('\n=== Testing Alternative Base URLs ===');
        
        // Test with different base URL structures from documentation
        const alternativeBaseUrls = [
            'https://api.paysprint.in/service-api/api/v1/service',
            'https://sit.paysprint.in/service-api/api/v1/service', // UAT environment
            'https://api.paysprint.in/api/v1/service'
        ];
        
        for (const baseUrl of alternativeBaseUrls) {
            if (baseUrl === paysprintProvider.baseUrl) {
                console.log(`\n⏭️  Skipping ${baseUrl} (already tested)`);
                continue;
            }
            
            try {
                console.log(`\n🔄 Testing alternative base URL: ${baseUrl}`);
                
                const testUrl = `${baseUrl}/dmt/banklist`;
                console.log(`   Testing: ${testUrl}`);
                
                const response = await axios.get(testUrl, {
                    headers: {
                        'Authorization': `Bearer ${jwtToken}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Authorisedkey': paysprintProvider.apiKey
                    },
                    timeout: 10000
                });
                
                console.log(`✅ SUCCESS with alternative URL: ${baseUrl}`);
                console.log('   Status:', response.status);
                console.log('   Response:', JSON.stringify(response.data, null, 2));
                
                console.log(`\n🎯 RECOMMENDATION: Update base URL to ${baseUrl}`);
                break;
                
            } catch (error) {
                console.log(`❌ FAILED: ${baseUrl} - ${error.message}`);
                if (error.response && error.response.status !== 404) {
                    console.log('   Status:', error.response.status);
                    console.log('   Might be worth investigating further');
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Error testing Paysprint authentication:', error);
    } finally {
        mongoose.connection.close();
        console.log('\nDatabase connection closed.');
    }
}

testCorrectPaysprintAuth();