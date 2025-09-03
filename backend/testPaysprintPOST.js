const axios = require('axios');
const fs = require('fs');

// Paysprint API POST Request Test with Body Authentication
class PaysprintPOSTTest {
    constructor() {
        this.baseURL = 'https://api.paysprint.in/api/v1/service';
        
        // Paysprint API Credentials
        this.credentials = {
            JWT_KEY: 'UFMwMDMyMTRmZjc5OTQ5MDdjMWNlMDU5NjNjYmI0OTgzZGRlYjY4Yg==',
            AUTHORISED_KEY: 'MTMyZDg1Nzc5MTBiY2Q1YWZlZThmMjZjMGIyMzkyNjM=',
            AES_ENCRYPTION_KEY: 'a901de13133edc22',
            AES_ENCRYPTION_IV: '2a1324e96009b15a'
        };
    }

    async testPOSTWithCredentials(endpoint, bodyVariation) {
        const url = `${this.baseURL}${endpoint}`;
        console.log(`\n🔍 Testing POST: ${bodyVariation.name}`);
        console.log(`📍 Endpoint: ${endpoint}`);
        console.log(`📦 Body:`, JSON.stringify(bodyVariation.body, null, 2));
        console.log('=' .repeat(60));
        
        try {
            const response = await axios({
                method: 'POST',
                url,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'User-Agent': 'TraePay4U/1.0'
                },
                data: bodyVariation.body,
                timeout: 10000
            });
            
            console.log(`✅ Status: ${response.status} ${response.statusText}`);
            console.log(`📄 Response:`);
            console.log(JSON.stringify(response.data, null, 2));
            
            return {
                success: true,
                status: response.status,
                data: response.data,
                bodyConfig: bodyVariation.name
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
                    bodyConfig: bodyVariation.name
                };
            } else {
                console.log(`🔌 Network Error: ${error.message}`);
                return {
                    success: false,
                    error: error.message,
                    bodyConfig: bodyVariation.name
                };
            }
        }
    }

    async runPOSTTests() {
        console.log('🚀 Paysprint API POST Request Testing Started');
        console.log('🔑 Testing with credentials in request body');
        console.log('=' .repeat(60));
        
        const results = {};
        
        // Different body variations to test
        const bodyVariations = [
            {
                name: 'Direct Credentials',
                body: {
                    JWT_KEY: this.credentials.JWT_KEY,
                    AUTHORISED_KEY: this.credentials.AUTHORISED_KEY,
                    AES_ENCRYPTION_KEY: this.credentials.AES_ENCRYPTION_KEY,
                    AES_ENCRYPTION_IV: this.credentials.AES_ENCRYPTION_IV
                }
            },
            {
                name: 'Auth Object',
                body: {
                    auth: {
                        JWT_KEY: this.credentials.JWT_KEY,
                        AUTHORISED_KEY: this.credentials.AUTHORISED_KEY,
                        AES_ENCRYPTION_KEY: this.credentials.AES_ENCRYPTION_KEY,
                        AES_ENCRYPTION_IV: this.credentials.AES_ENCRYPTION_IV
                    }
                }
            },
            {
                name: 'Credentials Object',
                body: {
                    credentials: {
                        jwt_key: this.credentials.JWT_KEY,
                        authorised_key: this.credentials.AUTHORISED_KEY,
                        aes_encryption_key: this.credentials.AES_ENCRYPTION_KEY,
                        aes_encryption_iv: this.credentials.AES_ENCRYPTION_IV
                    }
                }
            },
            {
                name: 'Token Format',
                body: {
                    token: this.credentials.JWT_KEY,
                    api_key: this.credentials.AUTHORISED_KEY,
                    encryption_key: this.credentials.AES_ENCRYPTION_KEY,
                    encryption_iv: this.credentials.AES_ENCRYPTION_IV
                }
            },
            {
                name: 'Paysprint Standard',
                body: {
                    jwt_key: this.credentials.JWT_KEY,
                    authorised_key: this.credentials.AUTHORISED_KEY,
                    aes_encryption_key: this.credentials.AES_ENCRYPTION_KEY,
                    aes_encryption_iv: this.credentials.AES_ENCRYPTION_IV
                }
            }
        ];
        
        // Test the mainbalance endpoint that we know exists
        const endpoint = '/balance/balance/mainbalance';
        
        console.log(`\n\n🎯 TESTING ENDPOINT: ${endpoint}`);
        console.log('=' .repeat(80));
        
        results[endpoint] = {};
        
        for (const bodyVariation of bodyVariations) {
            const result = await this.testPOSTWithCredentials(endpoint, bodyVariation);
            results[endpoint][bodyVariation.name] = result;
            
            // Add delay between requests
            await new Promise(resolve => setTimeout(resolve, 1500));
        }
        
        // If mainbalance works, test other endpoints
        const successfulConfigs = Object.values(results[endpoint]).filter(r => r.success);
        
        if (successfulConfigs.length > 0) {
            console.log('\n🎉 SUCCESS FOUND! Testing other endpoints...');
            
            const otherEndpoints = [
                '/dmt/bank/banklist',
                '/dmt/remitter/register',
                '/dmt/beneficiary/register'
            ];
            
            const workingConfig = bodyVariations.find(bv => 
                results[endpoint][bv.name].success
            );
            
            for (const otherEndpoint of otherEndpoints) {
                console.log(`\n\n🎯 TESTING ENDPOINT: ${otherEndpoint}`);
                console.log('=' .repeat(80));
                
                results[otherEndpoint] = {};
                const result = await this.testPOSTWithCredentials(otherEndpoint, workingConfig);
                results[otherEndpoint][workingConfig.name] = result;
                
                await new Promise(resolve => setTimeout(resolve, 1500));
            }
        }
        
        // Generate report
        this.generatePOSTReport(results);
        
        return results;
    }

    generatePOSTReport(results) {
        console.log('\n\n📊 POST REQUEST TEST SUMMARY');
        console.log('=' .repeat(80));
        
        const report = {
            timestamp: new Date().toISOString(),
            baseURL: this.baseURL,
            testType: 'POST_REQUEST_BODY_AUTH',
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
        for (const [endpoint, bodyResults] of Object.entries(results)) {
            console.log(`\n🎯 ${endpoint}:`);
            
            for (const [bodyName, result] of Object.entries(bodyResults)) {
                report.summary.totalTests++;
                
                if (result.success) {
                    report.summary.successful++;
                    report.summary.workingConfigurations.push({
                        endpoint,
                        bodyConfig: bodyName,
                        status: result.status
                    });
                    console.log(`   ✅ ${bodyName}: ${result.status} - SUCCESS!`);
                } else if (result.status === 401) {
                    report.summary.unauthorized++;
                    console.log(`   🔐 ${bodyName}: ${result.status} (Unauthorized)`);
                } else if (result.status === 404) {
                    report.summary.notFound++;
                    console.log(`   ❌ ${bodyName}: ${result.status} (Not Found)`);
                } else {
                    report.summary.otherErrors++;
                    console.log(`   ⚠️  ${bodyName}: ${result.status || 'Network Error'}`);
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
            console.log('\n🎉 WORKING CONFIGURATIONS FOUND:');
            report.summary.workingConfigurations.forEach(config => {
                console.log(`   ✅ ${config.endpoint} with ${config.bodyConfig}`);
            });
            
            console.log('\n🚀 NEXT STEPS:');
            console.log('   1. Update dmtService.js with working authentication');
            console.log('   2. Test complete DMT workflow');
            console.log('   3. Deploy to production');
        } else {
            console.log('\n🔍 AUTHENTICATION ANALYSIS:');
            if (report.summary.unauthorized > 0) {
                console.log('   - Endpoints exist but authentication format is incorrect');
                console.log('   - May need additional parameters or different encoding');
                console.log('   - Contact Paysprint for exact authentication format');
            }
            if (report.summary.notFound > 0) {
                console.log('   - Some endpoints may not exist or require different paths');
            }
        }
        
        // Save detailed report
        const reportFile = 'paysprint_post_test_report.json';
        fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
        console.log(`\n💾 Detailed report saved to: ${reportFile}`);
    }
}

// Run the POST tests
async function main() {
    const tester = new PaysprintPOSTTest();
    
    try {
        await tester.runPOSTTests();
    } catch (error) {
        console.error('❌ POST test execution failed:', error.message);
    }
}

// Execute if run directly
if (require.main === module) {
    main();
}

module.exports = PaysprintPOSTTest;