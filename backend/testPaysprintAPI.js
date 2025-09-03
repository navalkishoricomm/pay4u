const axios = require('axios');
const fs = require('fs');

// Test Paysprint API endpoints
class PaysprintAPITester {
    constructor() {
        this.baseURL = 'https://api.paysprint.in';
        this.headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'TraePay4U/1.0'
        };
        
        // Add authentication headers if available
        // Note: These would need to be provided by Paysprint
        // this.headers['Authorization'] = 'Bearer YOUR_TOKEN';
        // this.headers['X-API-Key'] = 'YOUR_API_KEY';
    }

    async testEndpoint(endpoint, method = 'GET', data = null) {
        const url = `${this.baseURL}${endpoint}`;
        console.log(`\n🔍 Testing: ${method} ${url}`);
        console.log('=' .repeat(60));
        
        try {
            const config = {
                method,
                url,
                headers: this.headers,
                timeout: 10000
            };
            
            if (data && (method === 'POST' || method === 'PUT')) {
                config.data = data;
            }
            
            const response = await axios(config);
            
            console.log(`✅ Status: ${response.status} ${response.statusText}`);
            console.log(`📄 Response:`);
            console.log(JSON.stringify(response.data, null, 2));
            
            return {
                success: true,
                status: response.status,
                data: response.data,
                headers: response.headers
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
                    error: error.message
                };
            } else {
                console.log(`🔌 Network Error: ${error.message}`);
                return {
                    success: false,
                    error: error.message
                };
            }
        }
    }

    async runTests() {
        console.log('🚀 Paysprint API Testing Started');
        console.log('=' .repeat(60));
        
        const results = {};
        
        // Test endpoints
        const endpoints = [
            { path: '/', name: 'Base API' },
            { path: '/api/v1', name: 'API v1 Base' },
            { path: '/api/v1/service', name: 'Service Endpoint' },
            { path: '/api/v1/service/balance/balance/mainbalance', name: 'Main Balance (NEW)' },
            { path: '/api/v1/dmt', name: 'DMT Base' },
            { path: '/api/v1/dmt/banklist', name: 'Bank List' },
            { path: '/api/v1/dmt/remitter/register', name: 'Remitter Register' },
            { path: '/api/v1/dmt/beneficiary/register', name: 'Beneficiary Register' },
            { path: '/api/v1/dmt/transfer', name: 'Money Transfer' },
            { path: '/api/v1/dmt/status', name: 'Transaction Status' },
            { path: '/api/v1/dmt/balance', name: 'Balance Inquiry' }
        ];
        
        for (const endpoint of endpoints) {
            const result = await this.testEndpoint(endpoint.path);
            results[endpoint.name] = result;
            
            // Add delay between requests
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Generate summary report
        this.generateReport(results);
        
        return results;
    }

    generateReport(results) {
        console.log('\n\n📊 TEST SUMMARY REPORT');
        console.log('=' .repeat(60));
        
        const report = {
            timestamp: new Date().toISOString(),
            baseURL: this.baseURL,
            results: {},
            summary: {
                total: 0,
                successful: 0,
                failed: 0,
                unauthorized: 0,
                notFound: 0
            }
        };
        
        for (const [name, result] of Object.entries(results)) {
            report.results[name] = result;
            report.summary.total++;
            
            if (result.success) {
                report.summary.successful++;
                console.log(`✅ ${name}: ${result.status}`);
            } else {
                report.summary.failed++;
                if (result.status === 401) {
                    report.summary.unauthorized++;
                    console.log(`🔐 ${name}: ${result.status} (Unauthorized)`);
                } else if (result.status === 404) {
                    report.summary.notFound++;
                    console.log(`❌ ${name}: ${result.status} (Not Found)`);
                } else {
                    console.log(`❌ ${name}: ${result.status || 'Network Error'}`);
                }
            }
        }
        
        console.log('\n📈 Statistics:');
        console.log(`   Total Endpoints: ${report.summary.total}`);
        console.log(`   Successful: ${report.summary.successful}`);
        console.log(`   Failed: ${report.summary.failed}`);
        console.log(`   Unauthorized (401): ${report.summary.unauthorized}`);
        console.log(`   Not Found (404): ${report.summary.notFound}`);
        
        // Save report to file
        const reportFile = 'paysprint_api_test_report.json';
        fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
        console.log(`\n💾 Report saved to: ${reportFile}`);
        
        // Generate recommendations
        this.generateRecommendations(report);
    }

    generateRecommendations(report) {
        console.log('\n💡 RECOMMENDATIONS');
        console.log('=' .repeat(60));
        
        if (report.summary.unauthorized > 0) {
            console.log('🔐 Authentication Required:');
            console.log('   - Contact Paysprint support for API credentials');
            console.log('   - Obtain API key, token, or other authentication method');
            console.log('   - Update headers with proper authentication');
        }
        
        if (report.summary.notFound > 0) {
            console.log('\n📍 Endpoint Issues:');
            console.log('   - Some endpoints may not exist or have different paths');
            console.log('   - Check Paysprint API documentation for correct endpoints');
            console.log('   - Verify API version and base URL');
        }
        
        if (report.results['Base API']?.success) {
            console.log('\n✅ Positive Findings:');
            console.log('   - Base API is accessible and responding');
            console.log('   - Server is operational');
            console.log('   - JSON responses are properly formatted');
        }
        
        console.log('\n🎯 Next Steps:');
        console.log('   1. Contact Paysprint support with this test report');
        console.log('   2. Request proper API documentation and credentials');
        console.log('   3. Update authentication headers once credentials are provided');
        console.log('   4. Re-run tests with proper authentication');
    }
}

// Run the tests
async function main() {
    const tester = new PaysprintAPITester();
    
    try {
        await tester.runTests();
    } catch (error) {
        console.error('❌ Test execution failed:', error.message);
    }
}

// Execute if run directly
if (require.main === module) {
    main();
}

module.exports = PaysprintAPITester;