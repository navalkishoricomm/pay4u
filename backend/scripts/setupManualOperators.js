const mongoose = require('mongoose');
const ApiProvider = require('../models/ApiProvider');
const OperatorConfig = require('../models/OperatorConfig');
require('dotenv').config();

const manualProviderData = {
  name: 'MANUAL',
  displayName: 'Manual Processing',
  baseUrl: 'https://manual.local', // Dummy URL
  apiKey: 'MANUAL_KEY',
  authType: 'custom',
  endpoints: {
    mobileRecharge: '/manual/recharge',
    dthRecharge: '/manual/recharge',
    checkStatus: '/manual/status'
  },
  isActive: true,
  supportedServices: ['mobile', 'dth']
};

const mobileOperators = [
  { name: 'Airtel', code: 'AIRTEL' },
  { name: 'Jio', code: 'JIO' },
  { name: 'Vodafone Idea', code: 'VI' },
  { name: 'BSNL', code: 'BSNL' }
];

const dthOperators = [
  { name: 'Tata Play', code: 'TATAPLAY' },
  { name: 'Airtel Digital TV', code: 'AIRTEL_DTH' },
  { name: 'Dish TV', code: 'DISHTV' },
  { name: 'Sun Direct', code: 'SUNDIRECT' },
  { name: 'D2H', code: 'D2H' }
];

async function setupManualOperators() {
  try {
    await mongoose.connect(process.env.DATABASE_URI || 'mongodb://localhost:27017/pay4u');
    console.log('Connected to MongoDB');

    // 1. Create or Get Manual API Provider
    let manualProvider = await ApiProvider.findOne({ name: 'MANUAL' });
    if (!manualProvider) {
      manualProvider = await ApiProvider.create(manualProviderData);
      console.log('Created Manual API Provider');
    } else {
      console.log('Manual API Provider already exists');
      // Update supported services if needed
      manualProvider.supportedServices = ['mobile', 'dth'];
      await manualProvider.save();
    }

    // 2. Setup Mobile Operators
    for (const op of mobileOperators) {
      await OperatorConfig.findOneAndUpdate(
        { operatorCode: op.code },
        {
          operatorName: op.name,
          serviceType: 'mobile',
          processingMode: 'manual',
          primaryApiProvider: manualProvider._id,
          isActive: true,
          minAmount: 10,
          maxAmount: 10000,
          // Dummy circles (usually this would be more detailed)
          circles: [{ code: 'ALL', name: 'All India' }]
        },
        { upsert: true, new: true }
      );
      console.log(`Configured Mobile Operator: ${op.name}`);
    }

    // 3. Setup DTH Operators
    for (const op of dthOperators) {
      await OperatorConfig.findOneAndUpdate(
        { operatorCode: op.code },
        {
          operatorName: op.name,
          serviceType: 'dth',
          processingMode: 'manual',
          primaryApiProvider: manualProvider._id,
          isActive: true,
          minAmount: 10,
          maxAmount: 10000,
          circles: [{ code: 'ALL', name: 'All India' }]
        },
        { upsert: true, new: true }
      );
      console.log(`Configured DTH Operator: ${op.name}`);
    }

    console.log('Setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

setupManualOperators();
