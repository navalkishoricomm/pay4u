const mongoose = require('mongoose');
const dmtService = require('./services/dmtService');
const productionLogger = require('./utils/productionLogger');
const fs = require('fs');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/pay4u', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function testBankListWithLogging() {
    try {
        console.log('🏦 Testing Bank List with Production Logging...');
        
        // Initialize DMT service
        await dmtService.initialize();
        
        console.log('✅ DMT Service initialized');
        console.log('API Provider:', dmtService.apiProvider.name);
        console.log('Base URL:', dmtService.apiProvider.baseUrl);
        
        // Test bank list endpoint
        console.log('\n🔄 Fetching bank list...');
        
        try {
            const response = await dmtService.makeApiRequest('/dmt/banklist', {}, 'GET');
            
            console.log('\n✅ Bank List Response:');
            console.log('Success:', response.success);
            console.log('Status:', response.status);
            
            if (response.success && response.data) {
                console.log('Response Data:', JSON.stringify(response.data, null, 2));
                
                // Extract bank information if available
                if (response.data.data && Array.isArray(response.data.data)) {
                    const banks = response.data.data;
                    console.log(`\n📊 Found ${banks.length} banks`);
                    
                    // Show first 5 banks
                    console.log('\nFirst 5 banks:');
                    banks.slice(0, 5).forEach((bank, index) => {
                        const bankId = bank.id || bank.bankid || bank.bank_id;
                        const bankName = bank.bankname || bank.bank_name || bank.name;
                        console.log(`${index + 1}. ${bankName} (ID: ${bankId})`);
                    });
                    
                    // Create bank mapping
                    const bankMapping = {};
                    banks.forEach(bank => {
                        const bankId = bank.id || bank.bankid || bank.bank_id;
                        const bankName = bank.bankname || bank.bank_name || bank.name;
                        if (bankId && bankName) {
                            bankMapping[bankName.toLowerCase().replace(/\s+/g, '_')] = {
                                id: bankId,
                                name: bankName,
                                ifsc: bank.ifsc || bank.ifsc_code
                            };
                        }
                    });
                    
                    // Save bank mapping
                    fs.writeFileSync('bank_mapping.json', JSON.stringify(bankMapping, null, 2));
                    console.log('\n📄 Bank mapping saved to: bank_mapping.json');
                    
                } else {
                    console.log('\n⚠️ Unexpected response format - no bank data found');
                }
            } else {
                console.log('\n❌ Bank list request failed');
                console.log('Error:', response.error);
            }
            
        } catch (error) {
            console.error('\n❌ Error fetching bank list:', error.message);
        }
        
        // Test other endpoints
        console.log('\n🔄 Testing other endpoints...');
        
        const testEndpoints = [
            { name: 'Balance Check', endpoint: '/balance', method: 'GET' },
            { name: 'Query Remitter', endpoint: '/dmt/remitter/queryremitter', method: 'POST', data: { mobile: '9999999999' } }
        ];
        
        for (const test of testEndpoints) {
            try {
                console.log(`\n🔄 Testing: ${test.name}`);
                const response = await dmtService.makeApiRequest(test.endpoint, test.data || {}, test.method);
                
                console.log(`✅ ${test.name} - Status: ${response.status}`);
                if (response.success) {
                    console.log('Response:', JSON.stringify(response.data, null, 2));
                } else {
                    console.log('Error:', response.error);
                }
            } catch (error) {
                console.log(`❌ ${test.name} failed:`, error.message);
            }
        }
        
        // Generate support logs
        console.log('\n📋 Generating support logs...');
        const supportLogFile = productionLogger.getLogsForSupport();
        
        if (supportLogFile) {
            console.log(`✅ Support logs generated: ${supportLogFile}`);
            console.log('\n📧 Send this file to Paysprint support for debugging');
        }
        
        console.log('\n🎯 SUMMARY:');
        console.log('1. All API requests and responses have been logged');
        console.log('2. Production logs are available in the production_logs directory');
        console.log('3. Bank mapping (if successful) is saved to bank_mapping.json');
        console.log('4. Support logs are ready for Paysprint team');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        mongoose.connection.close();
        console.log('\nDatabase connection closed.');
    }
}

testBankListWithLogging();