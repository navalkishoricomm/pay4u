const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/pay4u', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function checkUserPasswords() {
  try {
    console.log('=== Checking User Passwords ===');
    
    const users = await User.find({}).select('name email password');
    
    console.log(`Found ${users.length} users:\n`);
    
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      console.log(`${i + 1}. ${user.name} (${user.email})`);
      
      // Test common passwords
      const testPasswords = ['password123', 'password', '123456', 'admin123'];
      
      for (const testPassword of testPasswords) {
        try {
          const isMatch = await bcrypt.compare(testPassword, user.password);
          if (isMatch) {
            console.log(`   ✅ Password: ${testPassword}`);
            break;
          }
        } catch (error) {
          // Skip if password comparison fails
        }
      }
      
      console.log('');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    mongoose.disconnect();
  }
}

checkUserPasswords();