const mongoose = require('mongoose');
require('dotenv').config();

// Import User model
const User = require('./models/User');

const fixPasswordChangedAt = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Find all users with passwordChangedAt field set
    const usersWithPasswordChanged = await User.find({ 
      passwordChangedAt: { $exists: true } 
    });

    console.log(`Found ${usersWithPasswordChanged.length} users with passwordChangedAt field`);

    if (usersWithPasswordChanged.length > 0) {
      // Clear the passwordChangedAt field for all users
      const result = await User.updateMany(
        { passwordChangedAt: { $exists: true } },
        { $unset: { passwordChangedAt: 1 } }
      );

      console.log(`✅ Cleared passwordChangedAt field for ${result.modifiedCount} users`);
      
      // List affected users
      console.log('\nAffected users:');
      usersWithPasswordChanged.forEach(user => {
        console.log(`- ${user.email} (${user.name})`);
      });
    } else {
      console.log('No users found with passwordChangedAt field');
    }

    // Also check for any users that might have this field causing issues
    const allUsers = await User.find({}).select('email name passwordChangedAt');
    console.log('\nAll users status:');
    allUsers.forEach(user => {
      console.log(`- ${user.email}: passwordChangedAt = ${user.passwordChangedAt || 'not set'}`);
    });

    console.log('\n✅ Password authentication fix completed!');
    console.log('Users should now be able to authenticate with existing JWT tokens.');
    
  } catch (error) {
    console.error('❌ Error fixing passwordChangedAt:', error.message);
    console.error('Full error:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
    process.exit(0);
  }
};

// Run the script
fixPasswordChangedAt();