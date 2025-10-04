const bcrypt = require('bcryptjs');
const { MongoClient } = require('mongodb');

async function fixAdminPassword() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('pay4u_production');
    const usersCollection = db.collection('users');
    
    // Find admin user
    const adminUser = await usersCollection.findOne({ email: 'admin@pay4u.co.in' });
    if (!adminUser) {
      console.log('❌ Admin user not found!');
      return;
    }
    
    console.log('📋 Current admin user:');
    console.log('  Email:', adminUser.email);
    console.log('  Role:', adminUser.role);
    console.log('  Current hash:', adminUser.password.substring(0, 20) + '...');
    
    // Hash password with cost factor 12 using bcryptjs
    const plainPassword = '12345678';
    const hashedPassword = await bcrypt.hash(plainPassword, 12);
    
    console.log('🔐 New hash (bcryptjs, cost 12):', hashedPassword.substring(0, 20) + '...');
    
    // Update admin password
    const result = await usersCollection.updateOne(
      { email: 'admin@pay4u.co.in' },
      { $set: { password: hashedPassword } }
    );
    
    console.log('✅ Update result - Modified count:', result.modifiedCount);
    
    // Test the password
    const testResult = await bcrypt.compare(plainPassword, hashedPassword);
    console.log('✅ Password verification test:', testResult);
    
    // Verify in database
    const updatedAdmin = await usersCollection.findOne({ email: 'admin@pay4u.co.in' });
    const dbTestResult = await bcrypt.compare(plainPassword, updatedAdmin.password);
    console.log('✅ Database verification:', dbTestResult);
    
    console.log('\n🎉 Admin password has been fixed!');
    console.log('📧 Email: admin@pay4u.co.in');
    console.log('🔑 Password: 12345678');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

fixAdminPassword();