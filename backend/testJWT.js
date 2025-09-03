const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const ApiProvider = require('./models/ApiProvider');

console.log('MongoDB URI:', process.env.MONGO_URI ? 'Found' : 'Not found');

async function testJWTGeneration() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Get Paysprint API provider
        const provider = await ApiProvider.findOne({ name: 'paysprint' });
        if (!provider) {
            console.log('Paysprint provider not found');
            return;
        }

        console.log('\n=== Paysprint API Provider ===');
        console.log('API Key:', provider.apiKey);
        console.log('API Secret:', provider.apiSecret);
        console.log('Auth Type:', provider.authType);
        console.log('Base URL:', provider.baseUrl);
        console.log('Headers:', provider.headers);
        console.log('Is Active:', provider.isActive);

        // Generate JWT according to Paysprint documentation
        // JWT Payload should be:
        // {
        //   "timestamp": 1541044257000,
        //   "partnerId": "PROVIDED BY PAYSPRINT",
        //   "reqid": "122333" // unique integer for each request
        // }
        
        const currentTimestamp = Math.floor(Date.now() / 1000); // Current timestamp in seconds
        const payload = {
            timestamp: currentTimestamp,
            partnerId: provider.headers.get('X-Partner-Id') || 'UNKNOWN',
            reqid: Math.floor(Math.random() * 1000000).toString()
        };

        console.log('\n=== JWT Payload ===');
        console.log(JSON.stringify(payload, null, 2));

        // Generate JWT using HS256 algorithm with API Secret
        const token = jwt.sign(payload, provider.apiSecret, { algorithm: 'HS256' });
        
        console.log('\n=== Generated JWT Token ===');
        console.log(token);

        // Verify the token
        try {
            const decoded = jwt.verify(token, provider.apiSecret, { algorithm: 'HS256' });
            console.log('\n=== JWT Verification ===');
            console.log('Token is valid');
            console.log('Decoded payload:', JSON.stringify(decoded, null, 2));
        } catch (verifyError) {
            console.log('\n=== JWT Verification Failed ===');
            console.log('Error:', verifyError.message);
        }

        // Test what our current dmtService generates
        const dmtService = require('./services/dmtService');
        await dmtService.initialize();
        
        console.log('\n=== Current dmtService Headers ===');
        const headers = dmtService.buildHeaders();
        console.log(JSON.stringify(headers, null, 2));

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

testJWTGeneration();