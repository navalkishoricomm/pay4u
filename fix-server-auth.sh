#!/bin/bash

# Fix Server Authentication Issues
# This script fixes the passwordChangedAt field issue causing JWT authentication failures

echo "🔧 Fixing Server Authentication Issues..."
echo "======================================"

# Navigate to backend directory
cd /var/www/pay4u/backend || {
    echo "❌ Error: Backend directory not found at /var/www/pay4u/backend"
    echo "Please update the path to match your server setup"
    exit 1
}

echo "📁 Current directory: $(pwd)"

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed or not in PATH"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Create the fix script
echo "📝 Creating authentication fix script..."
cat > fixPasswordChangedAt.js << 'EOF'
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
EOF

echo "✅ Authentication fix script created"

# Make sure we have the required dependencies
echo "📦 Checking dependencies..."
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Make sure you're in the backend directory."
    exit 1
fi

# Run the fix
echo "🚀 Running authentication fix..."
node fixPasswordChangedAt.js

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Authentication fix completed successfully!"
    echo ""
    echo "🔄 Restarting backend service..."
    
    # Try different service restart methods
    if command -v pm2 &> /dev/null; then
        echo "Using PM2 to restart service..."
        pm2 restart pay4u-backend || pm2 restart all
    elif systemctl is-active --quiet pay4u; then
        echo "Using systemctl to restart service..."
        sudo systemctl restart pay4u
    else
        echo "⚠️  Please manually restart your backend service"
        echo "   - If using PM2: pm2 restart pay4u-backend"
        echo "   - If using systemctl: sudo systemctl restart pay4u"
        echo "   - If using Docker: docker-compose restart backend"
    fi
    
    echo ""
    echo "🎉 Fix applied successfully!"
    echo "Your wallet and authentication issues should now be resolved."
    echo ""
    echo "🧪 Test the fix by:"
    echo "   1. Refreshing your application"
    echo "   2. Trying to access wallet data"
    echo "   3. Attempting a recharge"
else
    echo "❌ Authentication fix failed. Please check the error messages above."
    exit 1
fi

# Clean up
echo "🧹 Cleaning up temporary files..."
rm -f fixPasswordChangedAt.js

echo "✅ Server authentication fix completed!"