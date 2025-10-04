const axios = require('axios');
const fs = require('fs');

// Paysprint API Credentials Test
class PaysprintCredentialsTest {
    constructor() {
        this.baseURL = 'https://api.paysprint.in/api/v1/service';
        
        // Paysprint API Credentials
        this.credentials = {
            JWT_KEY: 'UFMwMDMyMTRmZjc5OTQ5MDdjMWNlMDU5NjNjYmI0OTgzZGRlYjY4Yg==',
            AUTHORISED_KEY: 'MTMyZDg1Nzc5MTBiY2Q1YWZlZThmMjZjMGIyMzkyNjM=',
            AES_ENCRYPTION_KEY: 'a901de13133edc22',
            AES_ENCRYPTION_IV: '2a1324e96009b15a'
        };
        
        // Test different header combinations
        this.headerVariations = [
            {
                name: 'JWT Authorization',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${this.credentials.JWT_KEY}`,
                    'User-Agent': 'TraePay4U/1.0'
                }
            },
            {
                name: 'Authorised Key Header',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-API-Key': this.credentials.AUTHORISED_KEY,
                    'User-Agent': 'TraePay4U/1.0'
                }
            },
            {
                name: 'JWT + Authorised Key',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${this.credentials.JWT_KEY}`,
                    'X-API-Key': this.credentials.AUTHORISED_KEY,
                    'User-Agent': 'TraePay4U/1.0'
                }
            },
            {
                name: 'Paysprint Custom Headers',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'JWT_KEY': this.credentials.JWT_KEY,
                    'AUTHORISED_KEY': this.credentials.AUTHORISED_KEY,
                    'AES_ENCRYPTION_KEY': this.credentials.AES_ENCRYPTION_KEY,
                    'AES_ENCRYPTION_IV': this.credentials.AES_ENCRYPTION_IV,
                    'User-Agent': 'TraePay4U/1.0'
                }
            },
            {
                name: 'All Headers Combined',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${this.credentials.JWT_KEY}`,
                    'X-API-Key': this.credentials.AUTHORISED_KEY,
                    'JWT_KEY': this.credentials.JWT_KEY,
                    'AUTHORISED_KEY': this.credentials.AUTHORISED_KEY,
                    'AES_ENCRYPTION_KEY': this.credentials.AES_ENCRYPTION_KEY,
                    'AES_ENCRYPTION_IV': this.credentials.AES_ENCRYPTION_IV,
                    'User-Agent': 'TraePay4U/1.0'
                }
            }
        ];
    }

    async testEndpointWithHeaders(endpoint, headerConfig) {
        const url = `${this.baseURL}${endpoint}`;
        console.log(`\n🔍 Testing: ${headerConfig.name}`);
        console.log(`📍 Endpoint: ${endpoint}`);
        console.log('=' .repeat(60));
        
        try {
            const response = await axios({
                method: 'GET',
                url,
                headers: headerConfig.headers,
                timeout: 10000
            });
            
            console.log(`✅ Status: ${response.status} ${response.statusText}`);
            console.log(`📄 Response:`);
            console.log(JSON.stringify(response.data, null, 2));
            
            return {
                success: true,
                status: response.status,
                data: response.data,
                headers: response.headers,
                headerConfig: headerConfig.name
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
                    headerConfig: headerConfig.name
                };
            } else {
                console.log(`🔌 Network Error: ${error.message}`);
                return {
                    success: false,
                    error: error.message,
                    headerConfig: headerConfig.name
                };
            }
        }
    }

    async runCredentialTests() {
        console.log('🚀 Paysprint API Credentials Testing Started');
        console.log('🔑 Testing with provided authentication credentials');
        console.log('=' .repeat(60));
        
        const results = {};
        
        // Test endpoints that we know exist
        const testEndpoints = [
            '/balance/balance/mainbalance',
            '/dmt/bank/banklist',
            '/dmt/remitter/register',
            '/dmt/beneficiary/register',
            '/dmt/transfer/transfer'
        ];
        
        for (const endpoint of testEndpoints) {
            console.log(`\n\n🎯 TESTING ENDPOINT: ${endpoint}`);
            console.log('=' .repeat(80));
            
            results[endpoint] = {};
            
            for (const headerConfig of this.headerVariations) {
                const result = await this.testEndpointWithHeaders(endpoint, headerConfig);
                results[endpoint][headerConfig.name] = result;
                
                // Add delay between requests
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        // Generate comprehensive report
        this.generateCredentialReport(results);
        
        return results;
    }

    generateCredentialReport(results) {
        console.log('\n\n📊 CREDENTIAL TEST SUMMARY REPORT');
        console.log('=' .repeat(80));
        
        const report = {
            timestamp: new Date().toISOString(),
            baseURL: this.baseURL,
            credentials: {
                JWT_KEY: this.credentials.JWT_KEY.substring(0, 20) + '...',
                AUTHORISED_KEY: this.credentials.AUTHORISED_KEY.substring(0, 20) + '...',
                AES_ENCRYPTION_KEY: this.credentials.AES_ENCRYPTION_KEY,
                AES_ENCRYPTION_IV: this.credentials.AES_ENCRYPTION_IV
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
        for (const [endpoint, headerResults] of Object.entries(results)) {
            console.log(`\n🎯 ${endpoint}:`);
            
            for (const [headerName, result] of Object.entries(headerResults)) {
                report.summary.totalTests++;
                
                if (result.success) {
                    report.summary.successful++;
                    report.summary.workingConfigurations.push({
                        endpoint,
                        headerConfig: headerName,
                        status: result.status
                    });
                    console.log(`   ✅ ${headerName}: ${result.status} - SUCCESS!`);
                } else if (result.status === 401) {
                    report.summary.unauthorized++;
                    console.log(`   🔐 ${headerName}: ${result.status} (Still Unauthorized)`);
                } else if (result.status === 404) {
                    report.summary.notFound++;
                    console.log(`   ❌ ${headerName}: ${result.status} (Not Found)`);
                } else {
                    report.summary.otherErrors++;
                    console.log(`   ⚠️  ${headerName}: ${result.status || 'Network Error'}`);
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
                console.log(`   ✅ ${config.endpoint} with ${config.headerConfig}`);
            });
        }
        
        // Save detailed report
        const reportFile = 'paysprint_credentials_test_report.json';
        fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
        console.log(`\n💾 Detailed report saved to: ${reportFile}`);
        
        // Generate recommendations
        this.generateCredentialRecommendations(report);
    }

    generateCredentialRecommendations(report) {
        console.log('\n💡 RECOMMENDATIONS');
        console.log('=' .repeat(60));
        
        if (report.summary.successful > 0) {
            console.log('🎉 SUCCESS! Working authentication found!');
            console.log('✅ Next Steps:');
            console.log('   1. Update dmtService.js with working header configuration');
            console.log('   2. Test complete DMT flow with authenticated endpoints');
            console.log('   3. Deploy to production with working credentials');
        } else if (report.summary.unauthorized < report.summary.totalTests) {
            console.log('🔍 Partial Progress:');
            console.log('   - Some endpoints responding differently');
            console.log('   - May need different authentication method');
            console.log('   - Contact Paysprint for correct header format');
        } else {
            console.log('🔐 Authentication Still Required:');
            console.log('   - All endpoints still return 401 Unauthorized');
            console.log('   - Credentials may need different format or encoding');
            console.log('   - May require additional parameters or request body');
            console.log('   - Contact Paysprint support for authentication method');
        }
        
        console.log('\n📋 Additional Actions:');
        console.log('   1. Try POST requests with credentials in request body');
        console.log('   2. Test with different encoding (base64 decode, etc.)');
        console.log('   3. Check if credentials need to be combined or hashed');
        console.log('   4. Verify credentials are for production environment');
    }
}

// Run the credential tests
async function main() {
    const tester = new PaysprintCredentialsTest();
    
    try {
        await tester.runCredentialTests();
    } catch (error) {
        console.error('❌ Credential test execution failed:', error.message);
    }
}

// Execute if run directly
if (require.main === module) {
    main();
}

module.exports = PaysprintCredentialsTest;