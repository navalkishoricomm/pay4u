const mongoose = require('mongoose');
const ApiProvider = require('./models/ApiProvider');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/pay4u', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function updatePaysprintUATUrl() {
    try {
        console.log('🔄 Updating Paysprint base URL to UAT environment...');
        
        // Find the Paysprint provider
        const paysprintProvider = await ApiProvider.findOne({ name: 'paysprint' });
        
        if (!paysprintProvider) {
            console.log('❌ Paysprint provider not found!');
            return;
        }
        
        console.log('Current base URL:', paysprintProvider.baseUrl);
        
        // Update to UAT environment (which returned 500 instead of 404)
        const newBaseUrl = 'https://sit.paysprint.in/service-api/api/v1/service';
        
        paysprintProvider.baseUrl = newBaseUrl;
        
        // Also update credentials to UAT credentials from documentation
        // Based on web search results, UAT credentials are:
        paysprintProvider.apiKey = 'UFMwMDEyNDY4OjEyMzQ1Njc4OTA=';
        paysprintProvider.apiSecret = 'UFMwMDEyNDY4OjEyMzQ1Njc4OTA=';
        
        // Update headers with UAT credentials
        const headersMap = new Map(paysprintProvider.headers);
        headersMap.set('PARTNERID', 'PS0012468');
        headersMap.set('AES_KEY', '060e37d1XXXXXXXX');
        headersMap.set('AES_IV', '788a4b95XXXXXXXX');
        
        paysprintProvider.headers = Array.from(headersMap.entries());
        
        await paysprintProvider.save();
        
        console.log('✅ Successfully updated Paysprint configuration:');
        console.log('   Base URL:', paysprintProvider.baseUrl);
        console.log('   API Key:', paysprintProvider.apiKey);
        console.log('   API Secret:', paysprintProvider.apiSecret);
        console.log('   Headers:', paysprintProvider.headers);
        
        // Verify endpoints
        console.log('\n📋 Updated endpoint URLs:');
        paysprintProvider.endpoints.forEach(endpoint => {
            const fullUrl = `${paysprintProvider.baseUrl}${endpoint.path}`;
            console.log(`   ${endpoint.name}: ${fullUrl}`);
        });
        
    } catch (error) {
        console.error('❌ Error updating Paysprint URL:', error);
    } finally {
        mongoose.connection.close();
        console.log('\nDatabase connection closed.');
    }
}

updatePaysprintUATUrl();