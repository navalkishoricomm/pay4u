/**
 * Server Authentication Fix Script
 * 
 * This script fixes the JWT authentication issue caused by the passwordChangedAt field
 * Run this on your production server to resolve "User recently changed password!" errors
 * 
 * Usage:
 * 1. Copy this file to your server's backend directory
 * 2. Run: node server-auth-fix.js
 * 3. Restart your backend service
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import User model
const User = require('./models/User');

const fixServerAuthentication = async () => {
  console.log('🔧 Starting Server Authentication Fix...');
  console.log('=====================================');
  
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    
    if (!mongoUri) {
      throw new Error('MongoDB URI not found in environment variables. Please check your .env file.');
    }
    
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB successfully');
    
    // Find all users with passwordChangedAt field set
    console.log('🔍 Searching for users with passwordChangedAt field...');
    const usersWithPasswordChanged = await User.find({ 
      passwordChangedAt: { $exists: true } 
    });
    
    console.log(`📊 Found ${usersWithPasswordChanged.length} users with passwordChangedAt field`);
    
    if (usersWithPasswordChanged.length > 0) {
      console.log('\n👥 Affected users:');
      usersWithPasswordChanged.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (${user.name || 'No name'})`);
        console.log(`      Password changed at: ${user.passwordChangedAt}`);
      });
      
      console.log('\n🔧 Clearing passwordChangedAt field for all affected users...');
      
      // Clear the passwordChangedAt field for all users
      const result = await User.updateMany(
        { passwordChangedAt: { $exists: true } },
        { $unset: { passwordChangedAt: 1 } }
      );
      
      console.log(`✅ Successfully cleared passwordChangedAt field for ${result.modifiedCount} users`);
      
    } else {
      console.log('ℹ️  No users found with passwordChangedAt field');
      console.log('   This might mean the issue is already fixed or doesn\'t exist.');
    }
    
    // Verify the fix by checking all users
    console.log('\n🔍 Verifying fix - checking all users...');
    const allUsers = await User.find({}).select('email name passwordChangedAt createdAt');
    
    console.log('\n📋 All users status:');
    allUsers.forEach((user, index) => {
      const status = user.passwordChangedAt ? '❌ HAS passwordChangedAt' : '✅ Clean';
      console.log(`   ${index + 1}. ${user.email}: ${status}`);
    });
    
    console.log('\n🎉 Server Authentication Fix Completed Successfully!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Restart your backend service:');
    console.log('      - PM2: pm2 restart pay4u-backend');
    console.log('      - SystemD: sudo systemctl restart your-service-name');
    console.log('      - Docker: docker-compose restart backend');
    console.log('   2. Test the application:');
    console.log('      - Try accessing wallet data');
    console.log('      - Test transaction history');
    console.log('      - Attempt a recharge');
    console.log('\n✅ Users should now be able to authenticate with existing JWT tokens!');
    
  } catch (error) {
    console.error('\n❌ Error during authentication fix:');
    console.error('   Message:', error.message);
    
    if (error.name === 'MongooseError') {
      console.error('\n🔧 MongoDB Connection Issues:');
      console.error('   - Check if MongoDB is running');
      console.error('   - Verify MONGODB_URI in your .env file');
      console.error('   - Ensure network connectivity to MongoDB');
    }
    
    if (error.message.includes('User')) {
      console.error('\n🔧 User Model Issues:');
      console.error('   - Ensure you\'re running this from the backend directory');
      console.error('   - Check if models/User.js exists');
      console.error('   - Verify the User model is properly exported');
    }
    
    console.error('\nFull error details:', error);
    process.exit(1);
    
  } finally {
    // Close database connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\n🔌 Database connection closed.');
    }
  }
};

// Handle process termination gracefully
process.on('SIGINT', async () => {
  console.log('\n⚠️  Process interrupted. Closing database connection...');
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
  }
  process.exit(0);
});

// Run the fix
console.log('🚀 Initializing Server Authentication Fix...');
fixServerAuthentication().then(() => {
  console.log('\n✅ Script execution completed.');
  process.exit(0);
}).catch((error) => {
  console.error('\n💥 Unexpected error:', error);
  process.exit(1);
});