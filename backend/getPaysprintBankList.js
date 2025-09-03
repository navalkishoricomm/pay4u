const axios = require('axios');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const ApiProvider = require('./models/ApiProvider');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/pay4u', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Generate JWT Token
function generateJWT(partnerId, jwtKey) {
    const payload = {
        timestamp: Math.floor(Date.now() / 1000),
        partnerId: partnerId,
        reqid: Math.floor(Math.random() * 1000000).toString()
    };
    
    console.log('JWT Payload:', payload);
    return jwt.sign(payload, jwtKey, { algorithm: 'HS256' });
}

async function getPaysprintBankList() {
    try {
        console.log('🏦 Fetching Paysprint Bank List...');
        
        // Get Paysprint provider
        const paysprintProvider = await ApiProvider.findOne({ name: 'paysprint' });
        if (!paysprintProvider) {
            console.log('❌ Paysprint provider not found!');
            return;
        }
        
        console.log('Base URL:', paysprintProvider.baseUrl);
        
        // Extract credentials
        const headersMap = new Map(paysprintProvider.headers);
        const partnerId = headersMap.get('PARTNERID') || 'PS0012468';
        const jwtKey = paysprintProvider.apiSecret;
        
        // Generate JWT token
        const jwtToken = generateJWT(partnerId, jwtKey);
        
        // Prepare request
        const bankListUrl = `${paysprintProvider.baseUrl}/dmt/banklist`;
        console.log('Bank List URL:', bankListUrl);
        
        const headers = {
            'Authorization': `Bearer ${jwtToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorisedkey': paysprintProvider.apiKey
        };
        
        console.log('Request Headers:', JSON.stringify(headers, null, 2));
        
        // Log request details for production debugging
        const requestLog = {
            timestamp: new Date().toISOString(),
            url: bankListUrl,
            method: 'GET',
            headers: headers,
            partnerId: partnerId,
            jwtPayload: {
                timestamp: Math.floor(Date.now() / 1000),
                partnerId: partnerId,
                reqid: Math.floor(Math.random() * 1000000).toString()
            }
        };
        
        console.log('\n=== REQUEST LOG (for Paysprint Support) ===');
        console.log(JSON.stringify(requestLog, null, 2));
        
        // Make API request
        const response = await axios.get(bankListUrl, {
            headers: headers,
            timeout: 15000
        });
        
        console.log('\n✅ SUCCESS: Bank List Retrieved!');
        console.log('Status:', response.status);
        console.log('Response Headers:', JSON.stringify(response.headers, null, 2));
        
        // Log response details
        const responseLog = {
            timestamp: new Date().toISOString(),
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            data: response.data
        };
        
        console.log('\n=== RESPONSE LOG (for Paysprint Support) ===');
        console.log(JSON.stringify(responseLog, null, 2));
        
        // Save logs to file for Paysprint support
        const logData = {
            request: requestLog,
            response: responseLog
        };
        
        fs.writeFileSync('paysprint_banklist_logs.json', JSON.stringify(logData, null, 2));
        console.log('\n📄 Logs saved to: paysprint_banklist_logs.json');
        
        // Analyze bank list data
        if (response.data && response.data.data) {
            const banks = response.data.data;
            console.log('\n🏦 BANK LIST ANALYSIS:');
            console.log(`Total Banks: ${banks.length}`);
            
            // Display first 10 banks with their IDs
            console.log('\nFirst 10 Banks:');
            banks.slice(0, 10).forEach((bank, index) => {
                console.log(`${index + 1}. ${bank.bankname} (ID: ${bank.id || bank.bankid || bank.bank_id})`);
            });
            
            // Save bank list to file
            fs.writeFileSync('paysprint_banks.json', JSON.stringify(banks, null, 2));
            console.log('\n📄 Complete bank list saved to: paysprint_banks.json');
            
            // Create bank ID mapping
            const bankMapping = {};
            banks.forEach(bank => {
                const bankId = bank.id || bank.bankid || bank.bank_id;
                const bankName = bank.bankname || bank.bank_name || bank.name;
                if (bankId && bankName) {
                    bankMapping[bankName.toLowerCase()] = bankId;
                }
            });
            
            fs.writeFileSync('paysprint_bank_mapping.json', JSON.stringify(bankMapping, null, 2));
            console.log('📄 Bank ID mapping saved to: paysprint_bank_mapping.json');
            
            console.log('\n🎯 NEXT STEPS:');
            console.log('1. Use the bank IDs from paysprint_bank_mapping.json in your requests');
            console.log('2. Share paysprint_banklist_logs.json with Paysprint support if needed');
            
        } else {
            console.log('\n⚠️ Unexpected response format:');
            console.log(JSON.stringify(response.data, null, 2));
        }
        
    } catch (error) {
        console.error('\n❌ Error fetching bank list:', error.message);
        
        // Log error details for Paysprint support
        const errorLog = {
            timestamp: new Date().toISOString(),
            error: {
                message: error.message,
                status: error.response?.status,
                statusText: error.response?.statusText,
                headers: error.response?.headers,
                data: error.response?.data
            }
        };
        
        console.log('\n=== ERROR LOG (for Paysprint Support) ===');
        console.log(JSON.stringify(errorLog, null, 2));
        
        fs.writeFileSync('paysprint_banklist_error_logs.json', JSON.stringify(errorLog, null, 2));
        console.log('\n📄 Error logs saved to: paysprint_banklist_error_logs.json');
        
        if (error.response) {
            console.log('\nResponse Details:');
            console.log('Status:', error.response.status);
            console.log('Status Text:', error.response.statusText);
            
            if (error.response.data) {
                if (typeof error.response.data === 'string' && error.response.data.length < 2000) {
                    console.log('Response Data:', error.response.data);
                } else if (typeof error.response.data === 'object') {
                    console.log('Response Data:', JSON.stringify(error.response.data, null, 2));
                }
            }
        }
    } finally {
        mongoose.connection.close();
        console.log('\nDatabase connection closed.');
    }
}

getPaysprintBankList();