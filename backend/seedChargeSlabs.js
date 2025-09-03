const mongoose = require('mongoose');
const ChargeSlab = require('./models/ChargeSlab');
const User = require('./models/User');
require('dotenv').config();

const defaultChargeSlabs = [
  // IMPS Charges
  { minAmount: 100, maxAmount: 1000, charge: 10, transferMode: 'IMPS' },
  { minAmount: 1001, maxAmount: 5000, charge: 25, transferMode: 'IMPS' },
  { minAmount: 5001, maxAmount: 10000, charge: 50, transferMode: 'IMPS' },
  { minAmount: 10001, maxAmount: 25000, charge: 100, transferMode: 'IMPS' },
  { minAmount: 25001, maxAmount: 50000, charge: 150, transferMode: 'IMPS' },
  
  // NEFT Charges (typically lower than IMPS)
  { minAmount: 100, maxAmount: 1000, charge: 5, transferMode: 'NEFT' },
  { minAmount: 1001, maxAmount: 5000, charge: 15, transferMode: 'NEFT' },
  { minAmount: 5001, maxAmount: 10000, charge: 30, transferMode: 'NEFT' },
  { minAmount: 10001, maxAmount: 25000, charge: 60, transferMode: 'NEFT' },
  { minAmount: 25001, maxAmount: 50000, charge: 100, transferMode: 'NEFT' }
];

const seedChargeSlabs = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pay4u', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Find an admin user to assign as creator
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.error('No admin user found. Please create an admin user first.');
      process.exit(1);
    }

    console.log('Clearing existing charge slabs...');
    await ChargeSlab.deleteMany({});

    console.log('Creating default charge slabs...');
    const slabsWithCreator = defaultChargeSlabs.map(slab => ({
      ...slab,
      createdBy: adminUser._id
    }));

    const createdSlabs = await ChargeSlab.insertMany(slabsWithCreator);
    console.log(`Successfully created ${createdSlabs.length} charge slabs:`);
    
    // Group by transfer mode for display
    const impSlabs = createdSlabs.filter(slab => slab.transferMode === 'IMPS');
    const neftSlabs = createdSlabs.filter(slab => slab.transferMode === 'NEFT');
    
    console.log('\nIMPS Charge Slabs:');
    impSlabs.forEach(slab => {
      console.log(`  ₹${slab.minAmount} - ₹${slab.maxAmount}: ₹${slab.charge}`);
    });
    
    console.log('\nNEFT Charge Slabs:');
    neftSlabs.forEach(slab => {
      console.log(`  ₹${slab.minAmount} - ₹${slab.maxAmount}: ₹${slab.charge}`);
    });

    console.log('\nCharge slabs seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding charge slabs:', error);
    process.exit(1);
  }
};

// Test charge calculation
const testChargeCalculation = async () => {
  const testAmounts = [500, 1500, 7500, 15000, 30000];
  const transferModes = ['IMPS', 'NEFT'];
  
  console.log('\nTesting charge calculations:');
  for (const mode of transferModes) {
    console.log(`\n${mode} Charges:`);
    for (const amount of testAmounts) {
      const charge = await ChargeSlab.findChargeForAmount(amount, mode);
      console.log(`  ₹${amount}: ₹${charge} (Total: ₹${amount + charge})`);
    }
  }
};

if (require.main === module) {
  seedChargeSlabs().then(() => {
    testChargeCalculation().then(() => {
      mongoose.connection.close();
    });
  });
}

module.exports = { seedChargeSlabs, defaultChargeSlabs };