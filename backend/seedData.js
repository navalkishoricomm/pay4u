const mongoose = require('mongoose');
const User = require('./models/User');
const Wallet = require('./models/Wallet');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pay4u', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected for seeding');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

// Seed data
const seedData = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Wallet.deleteMany({});
    console.log('Cleared existing data');

    // Create admin user
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@pay4u.com',
      password: 'admin123',
      phone: '9876543210',
      role: 'admin'
    });

    // Create admin wallet
    await Wallet.create({
      user: adminUser._id,
      balance: 0
    });

    console.log('Admin user created:', adminUser.email);

    // Create test users
    const testUsers = [
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        phone: '1234567890',
        role: 'user'
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: 'password123',
        phone: '0987654321',
        role: 'user'
      },
      {
        name: 'Bob Johnson',
        email: 'bob@example.com',
        password: 'password123',
        phone: '5555555555',
        role: 'user'
      }
    ];

    for (const userData of testUsers) {
      const user = await User.create(userData);
      
      // Create wallet for each user with some initial balance
      await Wallet.create({
        user: user._id,
        balance: Math.floor(Math.random() * 10000) + 1000 // Random balance between 1000-11000
      });
      
      console.log('Test user created:', user.email);
    }

    console.log('Seed data created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

// Run seeding
connectDB().then(() => {
  seedData();
});