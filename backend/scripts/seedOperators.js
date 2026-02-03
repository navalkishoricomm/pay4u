const mongoose = require('mongoose');
const OperatorConfig = require('../models/OperatorConfig');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pay4u', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Indian telecom circles
const circles = [
  { code: 'ANDHRA_PRADESH', name: 'Andhra Pradesh', isActive: true },
  { code: 'ASSAM', name: 'Assam', isActive: true },
  { code: 'BIHAR_JHARKHAND', name: 'Bihar & Jharkhand', isActive: true },
  { code: 'CHENNAI', name: 'Chennai', isActive: true },
  { code: 'DELHI', name: 'Delhi', isActive: true },
  { code: 'GUJARAT', name: 'Gujarat', isActive: true },
  { code: 'HARYANA', name: 'Haryana', isActive: true },
  { code: 'HIMACHAL_PRADESH', name: 'Himachal Pradesh', isActive: true },
  { code: 'JAMMU_KASHMIR', name: 'Jammu & Kashmir', isActive: true },
  { code: 'KARNATAKA', name: 'Karnataka', isActive: true },
  { code: 'KERALA', name: 'Kerala', isActive: true },
  { code: 'KOLKATA', name: 'Kolkata', isActive: true },
  { code: 'MADHYA_PRADESH', name: 'Madhya Pradesh & Chhattisgarh', isActive: true },
  { code: 'MAHARASHTRA', name: 'Maharashtra & Goa', isActive: true },
  { code: 'MUMBAI', name: 'Mumbai', isActive: true },
  { code: 'NORTH_EAST', name: 'North East', isActive: true },
  { code: 'ORISSA', name: 'Orissa', isActive: true },
  { code: 'PUNJAB', name: 'Punjab', isActive: true },
  { code: 'RAJASTHAN', name: 'Rajasthan', isActive: true },
  { code: 'TAMIL_NADU', name: 'Tamil Nadu', isActive: true },
  { code: 'UP_EAST', name: 'UP East', isActive: true },
  { code: 'UP_WEST', name: 'UP West & Uttarakhand', isActive: true },
  { code: 'WEST_BENGAL', name: 'West Bengal', isActive: true }
];

// BBPS Operators Data
const operators = [
  // Mobile Recharge Operators
  {
    operatorCode: 'AIRTEL',
    operatorName: 'Airtel',
    serviceType: 'mobile',
    processingMode: 'manual',
    isActive: true,
    commission: 2.5,
    minAmount: 10,
    maxAmount: 10000,
    circles: circles,
    manualProcessing: {
      requiresApproval: true,
      approvalTimeout: 24,
      autoApproveAmount: 500,
      instructions: 'Process mobile recharge for Airtel numbers'
    }
  },
  {
    operatorCode: 'JIO',
    operatorName: 'Reliance Jio',
    serviceType: 'mobile',
    processingMode: 'manual',
    isActive: true,
    commission: 2.5,
    minAmount: 10,
    maxAmount: 10000,
    circles: circles,
    manualProcessing: {
      requiresApproval: true,
      approvalTimeout: 24,
      autoApproveAmount: 500,
      instructions: 'Process mobile recharge for Jio numbers'
    }
  },
  {
    operatorCode: 'VI',
    operatorName: 'Vi (Vodafone Idea)',
    serviceType: 'mobile',
    processingMode: 'manual',
    isActive: true,
    commission: 2.5,
    minAmount: 10,
    maxAmount: 10000,
    circles: circles,
    manualProcessing: {
      requiresApproval: true,
      approvalTimeout: 24,
      autoApproveAmount: 500,
      instructions: 'Process mobile recharge for Vi numbers'
    }
  },
  {
    operatorCode: 'BSNL',
    operatorName: 'BSNL',
    serviceType: 'mobile',
    processingMode: 'manual',
    isActive: true,
    commission: 2.5,
    minAmount: 10,
    maxAmount: 10000,
    circles: circles,
    manualProcessing: {
      requiresApproval: true,
      approvalTimeout: 24,
      autoApproveAmount: 500,
      instructions: 'Process mobile recharge for BSNL numbers'
    }
  },
  {
    operatorCode: 'MTNL',
    operatorName: 'MTNL',
    serviceType: 'mobile',
    processingMode: 'manual',
    isActive: true,
    commission: 2.5,
    minAmount: 10,
    maxAmount: 10000,
    circles: [{ code: 'DELHI', name: 'Delhi', isActive: true }, { code: 'MUMBAI', name: 'Mumbai', isActive: true }],
    manualProcessing: {
      requiresApproval: true,
      approvalTimeout: 24,
      autoApproveAmount: 500,
      instructions: 'Process mobile recharge for MTNL numbers (Delhi & Mumbai only)'
    }
  },

  // DTH Operators
  {
    operatorCode: 'TATAPLAY',
    operatorName: 'Tata Play (Tata Sky)',
    serviceType: 'dth',
    processingMode: 'manual',
    isActive: true,
    commission: 2.0,
    minAmount: 100,
    maxAmount: 10000,
    circles: [],
    manualProcessing: {
      requiresApproval: true,
      approvalTimeout: 24,
      autoApproveAmount: 1000,
      instructions: 'Process DTH recharge for Tata Play subscribers'
    }
  },
  {
    operatorCode: 'DISHTV',
    operatorName: 'Dish TV',
    serviceType: 'dth',
    processingMode: 'manual',
    isActive: true,
    commission: 2.0,
    minAmount: 100,
    maxAmount: 10000,
    circles: [],
    manualProcessing: {
      requiresApproval: true,
      approvalTimeout: 24,
      autoApproveAmount: 1000,
      instructions: 'Process DTH recharge for Dish TV subscribers'
    }
  },
  {
    operatorCode: 'AIRTEL_DTH',
    operatorName: 'Airtel Digital TV',
    serviceType: 'dth',
    processingMode: 'manual',
    isActive: true,
    commission: 2.0,
    minAmount: 100,
    maxAmount: 10000,
    circles: [],
    manualProcessing: {
      requiresApproval: true,
      approvalTimeout: 24,
      autoApproveAmount: 1000,
      instructions: 'Process DTH recharge for Airtel Digital TV subscribers'
    }
  },
  {
    operatorCode: 'SUN_DIRECT',
    operatorName: 'Sun Direct',
    serviceType: 'dth',
    processingMode: 'manual',
    isActive: true,
    commission: 2.0,
    minAmount: 100,
    maxAmount: 10000,
    circles: [],
    manualProcessing: {
      requiresApproval: true,
      approvalTimeout: 24,
      autoApproveAmount: 1000,
      instructions: 'Process DTH recharge for Sun Direct subscribers'
    }
  },
  {
    operatorCode: 'D2H',
    operatorName: 'd2h',
    serviceType: 'dth',
    processingMode: 'manual',
    isActive: true,
    commission: 2.0,
    minAmount: 100,
    maxAmount: 10000,
    circles: [],
    manualProcessing: {
      requiresApproval: true,
      approvalTimeout: 24,
      autoApproveAmount: 1000,
      instructions: 'Process DTH recharge for d2h subscribers'
    }
  },

  // Electricity Bill Payment Operators
  {
    operatorCode: 'MSEB',
    operatorName: 'Maharashtra State Electricity Board (MSEB)',
    serviceType: 'electricity',
    processingMode: 'manual',
    isActive: true,
    commission: 1.5,
    minAmount: 100,
    maxAmount: 50000,
    circles: [],
    manualProcessing: {
      requiresApproval: true,
      approvalTimeout: 48,
      autoApproveAmount: 2000,
      instructions: 'Process electricity bill payment for MSEB'
    }
  },
  {
    operatorCode: 'BESCOM',
    operatorName: 'Bangalore Electricity Supply Company (BESCOM)',
    serviceType: 'electricity',
    processingMode: 'manual',
    isActive: true,
    commission: 1.5,
    minAmount: 100,
    maxAmount: 50000,
    circles: [],
    manualProcessing: {
      requiresApproval: true,
      approvalTimeout: 48,
      autoApproveAmount: 2000,
      instructions: 'Process electricity bill payment for BESCOM'
    }
  },
  {
    operatorCode: 'TNEB',
    operatorName: 'Tamil Nadu Electricity Board (TNEB)',
    serviceType: 'electricity',
    processingMode: 'manual',
    isActive: true,
    commission: 1.5,
    minAmount: 100,
    maxAmount: 50000,
    circles: [],
    manualProcessing: {
      requiresApproval: true,
      approvalTimeout: 48,
      autoApproveAmount: 2000,
      instructions: 'Process electricity bill payment for TNEB'
    }
  },
  {
    operatorCode: 'KSEB',
    operatorName: 'Kerala State Electricity Board (KSEB)',
    serviceType: 'electricity',
    processingMode: 'manual',
    isActive: true,
    commission: 1.5,
    minAmount: 100,
    maxAmount: 50000,
    circles: [],
    manualProcessing: {
      requiresApproval: true,
      approvalTimeout: 48,
      autoApproveAmount: 2000,
      instructions: 'Process electricity bill payment for KSEB'
    }
  },
  {
    operatorCode: 'BSES',
    operatorName: 'BSES Delhi',
    serviceType: 'electricity',
    processingMode: 'manual',
    isActive: true,
    commission: 1.5,
    minAmount: 100,
    maxAmount: 50000,
    circles: [],
    manualProcessing: {
      requiresApproval: true,
      approvalTimeout: 48,
      autoApproveAmount: 2000,
      instructions: 'Process electricity bill payment for BSES Delhi'
    }
  },

  // Water Bill Payment Operators
  {
    operatorCode: 'BMC_WATER',
    operatorName: 'Brihanmumbai Municipal Corporation (BMC) Water',
    serviceType: 'water',
    processingMode: 'manual',
    isActive: true,
    commission: 1.0,
    minAmount: 100,
    maxAmount: 25000,
    circles: [],
    manualProcessing: {
      requiresApproval: true,
      approvalTimeout: 48,
      autoApproveAmount: 1500,
      instructions: 'Process water bill payment for BMC Mumbai'
    }
  },
  {
    operatorCode: 'DJB_WATER',
    operatorName: 'Delhi Jal Board (DJB)',
    serviceType: 'water',
    processingMode: 'manual',
    isActive: true,
    commission: 1.0,
    minAmount: 100,
    maxAmount: 25000,
    circles: [],
    manualProcessing: {
      requiresApproval: true,
      approvalTimeout: 48,
      autoApproveAmount: 1500,
      instructions: 'Process water bill payment for Delhi Jal Board'
    }
  },
  {
    operatorCode: 'BWSSB',
    operatorName: 'Bangalore Water Supply and Sewerage Board (BWSSB)',
    serviceType: 'water',
    processingMode: 'manual',
    isActive: true,
    commission: 1.0,
    minAmount: 100,
    maxAmount: 25000,
    circles: [],
    manualProcessing: {
      requiresApproval: true,
      approvalTimeout: 48,
      autoApproveAmount: 1500,
      instructions: 'Process water bill payment for BWSSB Bangalore'
    }
  },

  // Gas Bill Payment Operators
  {
    operatorCode: 'INDANE_GAS',
    operatorName: 'Indane Gas',
    serviceType: 'gas',
    processingMode: 'manual',
    isActive: true,
    commission: 1.0,
    minAmount: 100,
    maxAmount: 15000,
    circles: [],
    manualProcessing: {
      requiresApproval: true,
      approvalTimeout: 48,
      autoApproveAmount: 1000,
      instructions: 'Process gas bill payment for Indane Gas'
    }
  },
  {
    operatorCode: 'BHARAT_GAS',
    operatorName: 'Bharat Gas',
    serviceType: 'gas',
    processingMode: 'manual',
    isActive: true,
    commission: 1.0,
    minAmount: 100,
    maxAmount: 15000,
    circles: [],
    manualProcessing: {
      requiresApproval: true,
      approvalTimeout: 48,
      autoApproveAmount: 1000,
      instructions: 'Process gas bill payment for Bharat Gas'
    }
  },
  {
    operatorCode: 'HP_GAS',
    operatorName: 'HP Gas',
    serviceType: 'gas',
    processingMode: 'manual',
    isActive: true,
    commission: 1.0,
    minAmount: 100,
    maxAmount: 15000,
    circles: [],
    manualProcessing: {
      requiresApproval: true,
      approvalTimeout: 48,
      autoApproveAmount: 1000,
      instructions: 'Process gas bill payment for HP Gas'
    }
  },

  // Broadband Operators
  {
    operatorCode: 'AIRTEL_FIBER',
    operatorName: 'Airtel Xstream Fiber',
    serviceType: 'broadband',
    processingMode: 'manual',
    isActive: true,
    commission: 1.5,
    minAmount: 200,
    maxAmount: 20000,
    circles: [],
    manualProcessing: {
      requiresApproval: true,
      approvalTimeout: 48,
      autoApproveAmount: 2000,
      instructions: 'Process broadband bill payment for Airtel Fiber'
    }
  },
  {
    operatorCode: 'JIO_FIBER',
    operatorName: 'Jio Fiber',
    serviceType: 'broadband',
    processingMode: 'manual',
    isActive: true,
    commission: 1.5,
    minAmount: 200,
    maxAmount: 20000,
    circles: [],
    manualProcessing: {
      requiresApproval: true,
      approvalTimeout: 48,
      autoApproveAmount: 2000,
      instructions: 'Process broadband bill payment for Jio Fiber'
    }
  },
  {
    operatorCode: 'BSNL_BROADBAND',
    operatorName: 'BSNL Broadband',
    serviceType: 'broadband',
    processingMode: 'manual',
    isActive: true,
    commission: 1.5,
    minAmount: 200,
    maxAmount: 20000,
    circles: [],
    manualProcessing: {
      requiresApproval: true,
      approvalTimeout: 48,
      autoApproveAmount: 2000,
      instructions: 'Process broadband bill payment for BSNL Broadband'
    }
  },
  {
    operatorCode: 'ACT_FIBERNET',
    operatorName: 'ACT Fibernet',
    serviceType: 'broadband',
    processingMode: 'manual',
    isActive: true,
    commission: 1.5,
    minAmount: 200,
    maxAmount: 20000,
    circles: [],
    manualProcessing: {
      requiresApproval: true,
      approvalTimeout: 48,
      autoApproveAmount: 2000,
      instructions: 'Process broadband bill payment for ACT Fibernet'
    }
  }
];

// Seed function
const seedOperators = async () => {
  try {
    console.log('Starting operator seeding...');
    
    // Clear existing operators (optional - comment out if you want to keep existing ones)
    // await OperatorConfig.deleteMany({});
    // console.log('Cleared existing operators');
    
    let addedCount = 0;
    let skippedCount = 0;
    
    for (const operatorData of operators) {
      try {
        // Check if operator already exists
        const existingOperator = await OperatorConfig.findOne({ operatorCode: operatorData.operatorCode });
        
        if (existingOperator) {
          console.log(`Operator ${operatorData.operatorCode} already exists, skipping...`);
          skippedCount++;
          continue;
        }
        
        // Create new operator
        const operator = new OperatorConfig(operatorData);
        await operator.save();
        console.log(`Added operator: ${operatorData.operatorCode} - ${operatorData.operatorName}`);
        addedCount++;
      } catch (error) {
        console.error(`Error adding operator ${operatorData.operatorCode}:`, error.message);
      }
    }
    
    console.log(`\nSeeding completed!`);
    console.log(`Added: ${addedCount} operators`);
    console.log(`Skipped: ${skippedCount} operators (already exist)`);
    console.log(`Total operators in database: ${await OperatorConfig.countDocuments()}`);
    
  } catch (error) {
    console.error('Error seeding operators:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the seeder
const runSeeder = async () => {
  await connectDB();
  await seedOperators();
};

if (require.main === module) {
  runSeeder();
}

module.exports = { seedOperators, operators };