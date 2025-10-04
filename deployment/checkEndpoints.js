const mongoose = require('mongoose');
const ApiProvider = require('./models/ApiProvider');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/pay4u', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function checkEndpoints() {
    try {
        console.log('Connecting to MongoDB...');
        
        // Find Paysprint provider
        const paysprintProvider = await ApiProvider.findOne({ name: 'paysprint' });
        
        if (!paysprintProvider) {
            console.log('Paysprint provider not found!');
            return;
        }
        
        console.log('\n=== PAYSPRINT CONFIGURATION ===');
        console.log('Base URL:', paysprintProvider.baseUrl);
        console.log('\n=== ENDPOINTS ===');
        
        // Display all endpoints
        const endpoints = paysprintProvider.endpoints;
        for (const [key, value] of Object.entries(endpoints)) {
            console.log(`${key}: ${value}`);
        }
        
        console.log('\n=== FULL URLs ===');
        console.log('DMT Remitter Registration:', paysprintProvider.baseUrl + endpoints.dmtRemitterRegistration);
        console.log('DMT Remitter KYC:', paysprintProvider.baseUrl + endpoints.dmtRemitterKyc);
        
    } catch (error) {
        console.error('❌ Error checking endpoints:', error);
    } finally {
        mongoose.connection.close();
        console.log('\nDatabase connection closed.');
    }
}

checkEndpoints();