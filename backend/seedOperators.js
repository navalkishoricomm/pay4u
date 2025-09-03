const mongoose = require('mongoose');
const OperatorConfig = require('./models/OperatorConfig');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pay4u', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected for operator seeding');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

// Seed operator configurations
const seedOperators = async () => {
  try {
    // Clear existing operator configs
    await OperatorConfig.deleteMany({});
    console.log('Cleared existing operator configurations');

    // Create basic operator configurations
    const operators = [
      {
        operatorCode: 'AIRTEL',
        operatorName: 'Airtel',
        serviceType: 'mobile',
        processingMode: 'manual', // Set to manual for testing approval workflow
        isActive: true,
        minAmount: 10,
        maxAmount: 1000,
        commission: 2.5,
        circles: [
          { name: 'DELHI', isActive: true },
          { name: 'MUMBAI', isActive: true },
          { name: 'KOLKATA', isActive: true },
          { name: 'CHENNAI', isActive: true }
        ],
        allowedAmounts: [10, 20, 50, 100, 200, 500, 1000],
        maintenanceMode: {
          isEnabled: false,
          message: ''
        },
        apiMapping: {
          operatorId: 'AIRTEL',
          operatorName: 'Airtel',
          customFields: new Map()
        }
      },
      {
        operatorCode: 'JIO',
        operatorName: 'Jio',
        serviceType: 'mobile',
        processingMode: 'manual',
        isActive: true,
        minAmount: 10,
        maxAmount: 1000,
        commission: 2.0,
        circles: [
          { name: 'DELHI', isActive: true },
          { name: 'MUMBAI', isActive: true },
          { name: 'KOLKATA', isActive: true },
          { name: 'CHENNAI', isActive: true }
        ],
        allowedAmounts: [10, 20, 50, 100, 200, 500, 1000],
        maintenanceMode: {
          isEnabled: false,
          message: ''
        },
        apiMapping: {
          operatorId: 'JIO',
          operatorName: 'Jio',
          customFields: new Map()
        }
      },
      {
        operatorCode: 'VI',
        operatorName: 'Vi',
        serviceType: 'mobile',
        processingMode: 'manual',
        isActive: true,
        minAmount: 10,
        maxAmount: 1000,
        commission: 2.2,
        circles: [
          { name: 'DELHI', isActive: true },
          { name: 'MUMBAI', isActive: true },
          { name: 'KOLKATA', isActive: true },
          { name: 'CHENNAI', isActive: true }
        ],
        allowedAmounts: [10, 20, 50, 100, 200, 500, 1000],
        maintenanceMode: {
          isEnabled: false,
          message: ''
        },
        apiMapping: {
          operatorId: 'VI',
          operatorName: 'Vi',
          customFields: new Map()
        }
      }
    ];

    for (const operatorData of operators) {
      const operator = await OperatorConfig.create(operatorData);
      console.log(`Created operator: ${operator.operatorName} (${operator.operatorCode})`);
    }

    console.log('Operator configurations seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding operators:', error);
    process.exit(1);
  }
};

// Run seeding
connectDB().then(() => {
  seedOperators();
});