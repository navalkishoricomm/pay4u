const mongoose = require('mongoose');
const ApiProvider = require('./models/ApiProvider');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/pay4u', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function listProviders() {
    try {
        console.log('Connecting to MongoDB...');
        
        // Find all providers
        const providers = await ApiProvider.find({});
        
        console.log('\n=== ALL API PROVIDERS ===');
        providers.forEach((provider, index) => {
            console.log(`${index + 1}. Name: "${provider.name}"`);
            console.log(`   Base URL: ${provider.baseUrl}`);
            console.log(`   Active: ${provider.isActive}`);
            console.log('---');
        });
        
    } catch (error) {
        console.error('❌ Error listing providers:', error);
    } finally {
        mongoose.connection.close();
        console.log('Database connection closed.');
    }
}

listProviders();