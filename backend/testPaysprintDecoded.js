const axios = require('axios');
const fs = require('fs');

// Paysprint API Test with Decoded Credentials
class PaysprintDecodedTest {
    constructor() {
        this.baseURL = 'https://api.paysprint.in/api/v1/service';
        
        // Original Base64 Encoded Credentials
        this.originalCredentials = {
            JWT_KEY: 'UFMwMDMyMTRmZjc5OTQ5MDdjMWNlMDU5NjNjYmI0OTgzZGRlYjY4Yg==',
            AUTHORISED_KEY: 'MTMyZDg1Nzc5MTBiY2Q1YWZlZThmMjZjMGIyMzkyNjM=',
            AES_ENCRYPTION_KEY: 'a901de13133edc22',
            AES_ENCRYPTION_IV: '2a1324e96009b15a'
        };
        
        // Decode Base64 credentials
        this.decodedCredentials = {
            JWT_KEY: Buffer.from(this.originalCredentials.JWT_KEY, 'base64').toString('utf8'),
            AUTHORISED_KEY: Buffer.from(this.originalCredentials.AUTHORISED_KEY, 'base64').toString('utf8'),
            AES_ENCRYPTION_KEY: this.originalCredentials.AES_ENCRYPTION_KEY,
            AES_ENCRYPTION_IV: this.originalCredentials.AES_ENCRYPTION_IV
        };
        
        console.log('🔓 Decoded Credentials:');
        console.log('JWT_KEY (decoded):', this.decodedCredentials.JWT_KEY);
        console.log('AUTHORISED_KEY (decoded):', this.decodedCredentials.AUTHORISED_KEY);
        console.log('AES_ENCRYPTION_KEY:', this.decodedCredentials.AES_ENCRYPTION_KEY);
        console.log('AES_ENCRYPTION_IV:', this.decodedCredentials.AES_ENCRYPTION_IV);
    }

    async testWithDecodedCredentials(endpoint, testConfig) {
        const url = `${this.baseURL}${endpoint}`;
        console.log(`\n🔍 Testing: ${testConfig.name}`);
        console.log(`📍 Endpoint: ${endpoint}`);
        console.log(`📦 Method: ${testConfig.method}`);
        
        if (testConfig.body) {
            console.log(`📦 Body:`, JSON.stringify(testConfig.body, null, 2));
        }
        if (testConfig.headers && Object.keys(testConfig.headers).length > 2) {
            console.log(`📦 Headers:`, JSON.stringify(testConfig.headers, null, 2));
        }
        
        console.log('=' .repeat(60));
        
        try {
            const config = {
                method: testConfig.method,
                url,
                headers: testConfig.headers || {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'User-Agent': 'TraePay4U/1.0'
                },
                timeout: 10000
            };
            
            if (testConfig.body) {
                config.data = testConfig.body;
            }
            
            const response = await axios(config);
            
            console.log(`✅ Status: ${response.status} ${response.statusText}`);
            console.log(`📄 Response:`);
            console.log(JSON.stringify(response.data, null, 2));
            
            return {
                success: true,
                status: response.status,
                data: response.data,
                testConfig: testConfig.name
            };
            
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
            
            if (error.response) {
                console.log(`📊 Status: ${error.response.status} ${error.response.statusText}`);
                console.log(`📄 Response:`);
                console.log(JSON.stringify(error.response.data, null, 2));
                
                return {
                    success: false,
                    status: error.response.status,
                    data: error.response.data,
                    error: error.message,
                    testConfig: testConfig.name
                };
            } else {
                console.log(`🔌 Network Error: ${error.message}`);
                return {
                    success: false,
                    error: error.message,
                    testConfig: testConfig.name
                };
            }
        }
    }

    async runDecodedTests() {
        console.log('🚀 Paysprint API Decoded Credentials Testing Started');
        console.log('🔓 Testing with base64 decoded credentials');
        console.log('=' .repeat(60));
        
        const results = {};
        
        // Test configurations with decoded credentials
        const testConfigs = [
            {
                name: 'POST - Decoded Direct',
                method: 'POST',
                body: {
                    JWT_KEY: this.decodedCredentials.JWT_KEY,
                    AUTHORISED_KEY: this.decodedCredentials.AUTHORISED_KEY,
                    AES_ENCRYPTION_KEY: this.decodedCredentials.AES_ENCRYPTION_KEY,
                    AES_ENCRYPTION_IV: this.decodedCredentials.AES_ENCRYPTION_IV
                }
            },
            {
                name: 'POST - Decoded Standard Format',
                method: 'POST',
                body: {
                    jwt_key: this.decodedCredentials.JWT_KEY,
                    authorised_key: this.decodedCredentials.AUTHORISED_KEY,
                    aes_encryption_key: this.decodedCredentials.AES_ENCRYPTION_KEY,
                    aes_encryption_iv: this.decodedCredentials.AES_ENCRYPTION_IV
                }
            },
            {
                name: 'Headers - Decoded JWT Bearer',
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${this.decodedCredentials.JWT_KEY}`,
                    'X-API-Key': this.decodedCredentials.AUTHORISED_KEY,
                    'User-Agent': 'TraePay4U/1.0'
                }
            },
            {
                name: 'Headers - Original + Decoded Mix',
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'JWT_KEY': this.decodedCredentials.JWT_KEY,
                    'AUTHORISED_KEY': this.decodedCredentials.AUTHORISED_KEY,
                    'AES_ENCRYPTION_KEY': this.decodedCredentials.AES_ENCRYPTION_KEY,
                    'AES_ENCRYPTION_IV': this.decodedCredentials.AES_ENCRYPTION_IV,
                    'User-Agent': 'TraePay4U/1.0'
                }
            },
            {
                name: 'POST - Mixed Original/Decoded',
                method: 'POST',
                body: {
                    jwt_key: this.decodedCredentials.JWT_KEY,
                    authorised_key: this.decodedCredentials.AUTHORISED_KEY,
                    JWT_KEY: this.originalCredentials.JWT_KEY,
                    AUTHORISED_KEY: this.originalCredentials.AUTHORISED_KEY,
                    aes_encryption_key: this.decodedCredentials.AES_ENCRYPTION_KEY,
                    aes_encryption_iv: this.decodedCredentials.AES_ENCRYPTION_IV
                }
            },
            {
                name: 'POST - Auth Object Decoded',
                method: 'POST',
                body: {
                    auth: {
                        jwt_key: this.decodedCredentials.JWT_KEY,
                        authorised_key: this.decodedCredentials.AUTHORISED_KEY,
                        aes_encryption_key: this.decodedCredentials.AES_ENCRYPTION_KEY,
                        aes_encryption_iv: this.decodedCredentials.AES_ENCRYPTION_IV
                    }
                }
            }
        ];
        
        // Test the mainbalance endpoint
        const endpoint = '/balance/balance/mainbalance';
        
        console.log(`\n\n🎯 TESTING ENDPOINT: ${endpoint}`);
        console.log('=' .repeat(80));
        
        results[endpoint] = {};
        
        for (const testConfig of testConfigs) {
            const result = await this.testWithDecodedCredentials(endpoint, testConfig);
            results[endpoint][testConfig.name] = result;
            
            // If we find a working configuration, test other endpoints
            if (result.success) {
                console.log('\n🎉 SUCCESS! Testing other endpoints with this configuration...');
                
                const otherEndpoints = [
                    '/dmt/bank/banklist',
                    '/dmt/remitter/register'
                ];
                
                for (const otherEndpoint of otherEndpoints) {
                    console.log(`\n🎯 Testing ${otherEndpoint} with working config...`);
                    const otherResult = await this.testWithDecodedCredentials(otherEndpoint, testConfig);
                    
                    if (!results[otherEndpoint]) {
                        results[otherEndpoint] = {};
                    }
                    results[otherEndpoint][testConfig.name] = otherResult;
                    
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                
                break; // Stop testing other configs if we found a working one
            }
            
            // Add delay between requests
            await new Promise(resolve => setTimeout(resolve, 1500));
        }
        
        // Generate report
        this.generateDecodedReport(results);
        
        return results;
    }

    generateDecodedReport(results) {
        console.log('\n\n📊 DECODED CREDENTIALS TEST SUMMARY');
        console.log('=' .repeat(80));
        
        const report = {
            timestamp: new Date().toISOString(),
            baseURL: this.baseURL,
            testType: 'DECODED_CREDENTIALS_TEST',
            originalCredentials: {
                JWT_KEY: this.originalCredentials.JWT_KEY.substring(0, 20) + '...',
                AUTHORISED_KEY: this.originalCredentials.AUTHORISED_KEY.substring(0, 20) + '...'
            },
            decodedCredentials: {
                JWT_KEY: this.decodedCredentials.JWT_KEY,
                AUTHORISED_KEY: this.decodedCredentials.AUTHORISED_KEY
            },
            results: results,
            summary: {
                totalTests: 0,
                successful: 0,
                unauthorized: 0,
                notFound: 0,
                otherErrors: 0,
                workingConfigurations: []
            }
        };
        
        // Analyze results
        for (const [endpoint, testResults] of Object.entries(results)) {
            console.log(`\n🎯 ${endpoint}:`);
            
            for (const [testName, result] of Object.entries(testResults)) {
                report.summary.totalTests++;
                
                if (result.success) {
                    report.summary.successful++;
                    report.summary.workingConfigurations.push({
                        endpoint,
                        testConfig: testName,
                        status: result.status
                    });
                    console.log(`   ✅ ${testName}: ${result.status} - SUCCESS!`);
                } else if (result.status === 401) {
                    report.summary.unauthorized++;
                    console.log(`   🔐 ${testName}: ${result.status} (Unauthorized)`);
                } else if (result.status === 404) {
                    report.summary.notFound++;
                    console.log(`   ❌ ${testName}: ${result.status} (Not Found)`);
                } else {
                    report.summary.otherErrors++;
                    console.log(`   ⚠️  ${testName}: ${result.status || 'Network Error'}`);
                }
            }
        }
        
        console.log('\n📈 Overall Statistics:');
        console.log(`   Total Tests: ${report.summary.totalTests}`);
        console.log(`   Successful: ${report.summary.successful}`);
        console.log(`   Still Unauthorized: ${report.summary.unauthorized}`);
        console.log(`   Not Found: ${report.summary.notFound}`);
        console.log(`   Other Errors: ${report.summary.otherErrors}`);
        
        if (report.summary.workingConfigurations.length > 0) {
            console.log('\n🎉 BREAKTHROUGH! WORKING AUTHENTICATION FOUND!');
            console.log('✅ Working Configurations:');
            report.summary.workingConfigurations.forEach(config => {
                console.log(`   🚀 ${config.endpoint} with ${config.testConfig}`);
            });
            
            console.log('\n🚀 IMMEDIATE NEXT STEPS:');
            console.log('   1. Update dmtService.js with working authentication method');
            console.log('   2. Test complete DMT workflow with all endpoints');
            console.log('   3. Deploy to production environment');
            console.log('   4. Update documentation with working authentication');
        } else {
            console.log('\n🔍 FINAL ANALYSIS:');
            console.log('   - Decoded credentials still return authentication errors');
            console.log('   - API endpoints exist but require different authentication method');
            console.log('   - Possible issues:');
            console.log('     * Credentials may be for different environment (sandbox vs production)');
            console.log('     * Additional parameters required (merchant_id, partner_id, etc.)');
            console.log('     * Different authentication flow (OAuth, signature-based, etc.)');
            console.log('     * Credentials may need to be combined or hashed');
            console.log('\n📞 RECOMMENDED ACTION:');
            console.log('   Contact Paysprint support with:');
            console.log('   - Your merchant/partner ID');
            console.log('   - Request for API authentication documentation');
            console.log('   - Sample working request format');
        }
        
        // Save detailed report
        const reportFile = 'paysprint_decoded_test_report.json';
        fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
        console.log(`\n💾 Detailed report saved to: ${reportFile}`);
    }
}

// Run the decoded tests
async function main() {
    const tester = new PaysprintDecodedTest();
    
    try {
        await tester.runDecodedTests();
    } catch (error) {
        console.error('❌ Decoded test execution failed:', error.message);
    }
}

// Execute if run directly
if (require.main === module) {
    main();
}

module.exports = PaysprintDecodedTest;