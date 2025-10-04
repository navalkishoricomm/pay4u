const mongoose = require('mongoose');
const ApiProvider = require('./models/ApiProvider');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/pay4u', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function updatePaysprintUrl() {
    try {
        console.log('Connecting to MongoDB...');
        
        // Find Paysprint provider (lowercase)
        const paysprintProvider = await ApiProvider.findOne({ name: 'paysprint' });
        
        if (!paysprintProvider) {
            console.log('Paysprint provider not found!');
            return;
        }
        
        console.log('Current Base URL:', paysprintProvider.baseUrl);
        
        // Update with correct UAT URL based on GitHub documentation
        const newBaseUrl = 'https://sit.paysprint.in/service-api';
        
        await ApiProvider.updateOne(
            { name: 'paysprint' },
            { 
                $set: { 
                    baseUrl: newBaseUrl
                }
            }
        );
        
        console.log('✅ Successfully updated Paysprint base URL to:', newBaseUrl);
        
        // Verify the update
        const updatedProvider = await ApiProvider.findOne({ name: 'paysprint' });
        if (updatedProvider) {
            console.log('Verified new Base URL:', updatedProvider.baseUrl);
        } else {
            console.log('Could not verify update - provider not found');
        }
        
    } catch (error) {
        console.error('❌ Error updating Paysprint URL:', error);
    } finally {
        mongoose.connection.close();
        console.log('Database connection closed.');
    }
}

updatePaysprintUrl();