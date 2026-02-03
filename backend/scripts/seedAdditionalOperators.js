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

// Additional BBPS Operators Data
const additionalOperators = [
  // Loan Repayment Operators
  {
    operatorCode: 'HDFC_LOAN',
    operatorName: 'HDFC Bank Loan',
    serviceType: 'loan',
    processingMode: 'manual',
    isActive: true,
    commission: 0.5,
    minAmount: 500,
    maxAmount: 100000,
    circles: [],
    manualProcessing: {
      requiresApproval: true,
      approvalTimeout: 72,
      autoApproveAmount: 5000,
      instructions: 'Process loan repayment for HDFC Bank'
    }
  },
  {
    operatorCode: 'ICICI_LOAN',
    operatorName: 'ICICI Bank Loan',
    serviceType: 'loan',
    processingMode: 'manual',
    isActive: true,
    commission: 0.5,
    minAmount: 500,
    maxAmount: 100000,
    circles: [],
    manualProcessing: {
      requiresApproval: true,
      approvalTimeout: 72,
      autoApproveAmount: 5000,
      instructions: 'Process loan repayment for ICICI Bank'
    }
  },
  {
    operatorCode: 'SBI_LOAN',
    operatorName: 'State Bank of India Loan',
    serviceType: 'loan',
    processingMode: 'manual',
    isActive: true,
    commission: 0.5,
    minAmount: 500,
    maxAmount: 100000,
    circles: [],
    manualProcessing: {
      requiresApproval: true,
      approvalTimeout: 72,
      autoApproveAmount: 5000,
      instructions: 'Process loan repayment for State Bank of India'
    }
  },
  {
    operatorCode: 'AXIS_LOAN',
    operatorName: 'Axis Bank Loan',
    serviceType: 'loan',
    processingMode: 'manual',
    isActive: true,
    commission: 0.5,
    minAmount: 500,
    maxAmount: 100000,
    circles: [],
    manualProcessing: {
      requiresApproval: true,
      approvalTimeout: 72,
      autoApproveAmount: 5000,
      instructions: 'Process loan repayment for Axis Bank'
    }
  },
  {
    operatorCode: 'BAJAJ_FINSERV',
    operatorName: 'Bajaj Finserv Loan',
    serviceType: 'loan',
    processingMode: 'manual',
    isActive: true,
    commission: 0.5,
    minAmount: 500,
    maxAmount: 100000,
    circles: [],
    manualProcessing: {
      requiresApproval: true,
      approvalTimeout: 72,
      autoApproveAmount: 5000,
      instructions: 'Process loan repayment for Bajaj Finserv'
    }
  },

  // Insurance Premium Operators
  {
    operatorCode: 'LIC_PREMIUM',
    operatorName: 'Life Insurance Corporation (LIC)',
    serviceType: 'insurance',
    processingMode: 'manual',
    isActive: true,
    commission: 1.0,
    minAmount: 500,
    maxAmount: 200000,
    circles: [],
    manualProcessing: {
      requiresApproval: true,
      approvalTimeout: 72,
      autoApproveAmount: 10000,
      instructions: 'Process insurance premium payment for LIC'
    }
  },
  {
    operatorCode: 'HDFC_LIFE',
    operatorName: 'HDFC Life Insurance',
    serviceType: 'insurance',
    processingMode: 'manual',
    isActive: true,
    commission: 1.0,
    minAmount: 500,
    maxAmount: 200000,
    circles: [],
    manualProcessing: {
      requiresApproval: true,
      approvalTimeout: 72,
      autoApproveAmount: 10000,
      instructions: 'Process insurance premium payment for HDFC Life'
    }
  },
  {
    operatorCode: 'ICICI_PRUDENTIAL',
    operatorName: 'ICICI Prudential Life Insurance',
    serviceType: 'insurance',
    processingMode: 'manual',
    isActive: true,
    commission: 1.0,
    minAmount: 500,
    maxAmount: 200000,
    circles: [],
    manualProcessing: {
      requiresApproval: true,
      approvalTimeout: 72,
      autoApproveAmount: 10000,
      instructions: 'Process insurance premium payment for ICICI Prudential'
    }
  },
  {
    operatorCode: 'SBI_LIFE',
    operatorName: 'SBI Life Insurance',
    serviceType: 'insurance',
    processingMode: 'manual',
    isActive: true,
    commission: 1.0,
    minAmount: 500,
    maxAmount: 200000,
    circles: [],
    manualProcessing: {
      requiresApproval: true,
      approvalTimeout: 72,
      autoApproveAmount: 10000,
      instructions: 'Process insurance premium payment for SBI Life'
    }
  },
  {
    operatorCode: 'BAJAJ_ALLIANZ',
    operatorName: 'Bajaj Allianz Life Insurance',
    serviceType: 'insurance',
    processingMode: 'manual',
    isActive: true,
    commission: 1.0,
    minAmount: 500,
    maxAmount: 200000,
    circles: [],
    manualProcessing: {
      requiresApproval: true,
      approvalTimeout: 72,
      autoApproveAmount: 10000,
      instructions: 'Process insurance premium payment for Bajaj Allianz'
    }
  },

  // Landline Operators
  {
    operatorCode: 'BSNL_LANDLINE',
    operatorName: 'BSNL Landline',
    serviceType: 'landline',
    processingMode: 'manual',
    isActive: true,
    commission: 1.5,
    minAmount: 100,
    maxAmount: 10000,
    circles: [],
    manualProcessing: {
      requiresApproval: true,
      approvalTimeout: 48,
      autoApproveAmount: 1000,
      instructions: 'Process landline bill payment for BSNL'
    }
  },
  {
    operatorCode: 'MTNL_LANDLINE',
    operatorName: 'MTNL Landline',
    serviceType: 'landline',
    processingMode: 'manual',
    isActive: true,
    commission: 1.5,
    minAmount: 100,
    maxAmount: 10000,
    circles: [],
    manualProcessing: {
      requiresApproval: true,
      approvalTimeout: 48,
      autoApproveAmount: 1000,
      instructions: 'Process landline bill payment for MTNL (Delhi & Mumbai)'
    }
  },
  {
    operatorCode: 'AIRTEL_LANDLINE',
    operatorName: 'Airtel Landline',
    serviceType: 'landline',
    processingMode: 'manual',
    isActive: true,
    commission: 1.5,
    minAmount: 100,
    maxAmount: 10000,
    circles: [],
    manualProcessing: {
      requiresApproval: true,
      approvalTimeout: 48,
      autoApproveAmount: 1000,
      instructions: 'Process landline bill payment for Airtel'
    }
  },

  // Credit Card Operators
  {
    operatorCode: 'HDFC_CREDITCARD',
    operatorName: 'HDFC Bank Credit Card',
    serviceType: 'creditcard',
    processingMode: 'manual',
    isActive: true,
    commission: 0.8,
    minAmount: 500,
    maxAmount: 500000,
    circles: [],
    manualProcessing: {
      requiresApproval: true,
      approvalTimeout: 72,
      autoApproveAmount: 10000,
      instructions: 'Process credit card payment for HDFC Bank'
    }
  },
  {
    operatorCode: 'ICICI_CREDITCARD',
    operatorName: 'ICICI Bank Credit Card',
    serviceType: 'creditcard',
    processingMode: 'manual',
    isActive: true,
    commission: 0.8,
    minAmount: 500,
    maxAmount: 500000,
    circles: [],
    manualProcessing: {
      requiresApproval: true,
      approvalTimeout: 72,
      autoApproveAmount: 10000,
      instructions: 'Process credit card payment for ICICI Bank'
    }
  },
  {
    operatorCode: 'SBI_CREDITCARD',
    operatorName: 'SBI Credit Card',
    serviceType: 'creditcard',
    processingMode: 'manual',
    isActive: true,
    commission: 0.8,
    minAmount: 500,
    maxAmount: 500000,
    circles: [],
    manualProcessing: {
      requiresApproval: true,
      approvalTimeout: 72,
      autoApproveAmount: 10000,
      instructions: 'Process credit card payment for SBI'
    }
  },
  {
    operatorCode: 'AXIS_CREDITCARD',
    operatorName: 'Axis Bank Credit Card',
    serviceType: 'creditcard',
    processingMode: 'manual',
    isActive: true,
    commission: 0.8,
    minAmount: 500,
    maxAmount: 500000,
    circles: [],
    manualProcessing: {
      requiresApproval: true,
      approvalTimeout: 72,
      autoApproveAmount: 10000,
      instructions: 'Process credit card payment for Axis Bank'
    }
  },
  {
    operatorCode: 'KOTAK_CREDITCARD',
    operatorName: 'Kotak Mahindra Bank Credit Card',
    serviceType: 'creditcard',
    processingMode: 'manual',
    isActive: true,
    commission: 0.8,
    minAmount: 500,
    maxAmount: 500000,
    circles: [],
    manualProcessing: {
      requiresApproval: true,
      approvalTimeout: 72,
      autoApproveAmount: 10000,
      instructions: 'Process credit card payment for Kotak Mahindra Bank'
    }
  },

  // Mobile Postpaid Operators
  {
    operatorCode: 'AIRTEL_POSTPAID',
    operatorName: 'Airtel Postpaid',
    serviceType: 'postpaid',
    processingMode: 'manual',
    isActive: true,
    commission: 2.0,
    minAmount: 100,
    maxAmount: 25000,
    circles: [],
    manualProcessing: {
      requiresApproval: true,
      approvalTimeout: 48,
      autoApproveAmount: 2000,
      instructions: 'Process postpaid bill payment for Airtel'
    }
  },
  {
    operatorCode: 'JIO_POSTPAID',
    operatorName: 'Jio Postpaid',
    serviceType: 'postpaid',
    processingMode: 'manual',
    isActive: true,
    commission: 2.0,
    minAmount: 100,
    maxAmount: 25000,
    circles: [],
    manualProcessing: {
      requiresApproval: true,
      approvalTimeout: 48,
      autoApproveAmount: 2000,
      instructions: 'Process postpaid bill payment for Jio'
    }
  },
  {
    operatorCode: 'VI_POSTPAID',
    operatorName: 'Vi Postpaid',
    serviceType: 'postpaid',
    processingMode: 'manual',
    isActive: true,
    commission: 2.0,
    minAmount: 100,
    maxAmount: 25000,
    circles: [],
    manualProcessing: {
      requiresApproval: true,
      approvalTimeout: 48,
      autoApproveAmount: 2000,
      instructions: 'Process postpaid bill payment for Vi'
    }
  },
  {
    operatorCode: 'BSNL_POSTPAID',
    operatorName: 'BSNL Postpaid',
    serviceType: 'postpaid',
    processingMode: 'manual',
    isActive: true,
    commission: 2.0,
    minAmount: 100,
    maxAmount: 25000,
    circles: [],
    manualProcessing: {
      requiresApproval: true,
      approvalTimeout: 48,
      autoApproveAmount: 2000,
      instructions: 'Process postpaid bill payment for BSNL'
    }
  },

  // Cylinder Booking Operators
  {
    operatorCode: 'INDANE_CYLINDER',
    operatorName: 'Indane Gas Cylinder Booking',
    serviceType: 'cylinder',
    processingMode: 'manual',
    isActive: true,
    commission: 1.0,
    minAmount: 800,
    maxAmount: 2000,
    circles: [],
    manualProcessing: {
      requiresApproval: true,
      approvalTimeout: 48,
      autoApproveAmount: 1200,
      instructions: 'Process cylinder booking for Indane Gas'
    }
  },
  {
    operatorCode: 'BHARAT_CYLINDER',
    operatorName: 'Bharat Gas Cylinder Booking',
    serviceType: 'cylinder',
    processingMode: 'manual',
    isActive: true,
    commission: 1.0,
    minAmount: 800,
    maxAmount: 2000,
    circles: [],
    manualProcessing: {
      requiresApproval: true,
      approvalTimeout: 48,
      autoApproveAmount: 1200,
      instructions: 'Process cylinder booking for Bharat Gas'
    }
  },
  {
    operatorCode: 'HP_CYLINDER',
    operatorName: 'HP Gas Cylinder Booking',
    serviceType: 'cylinder',
    processingMode: 'manual',
    isActive: true,
    commission: 1.0,
    minAmount: 800,
    maxAmount: 2000,
    circles: [],
    manualProcessing: {
      requiresApproval: true,
      approvalTimeout: 48,
      autoApproveAmount: 1200,
      instructions: 'Process cylinder booking for HP Gas'
    }
  },

  // Additional Broadband Operators
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
    operatorCode: 'HATHWAY',
    operatorName: 'Hathway Broadband',
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
      instructions: 'Process broadband bill payment for Hathway'
    }
  },
  {
    operatorCode: 'TIKONA',
    operatorName: 'Tikona Broadband',
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
      instructions: 'Process broadband bill payment for Tikona'
    }
  }
];

// Seed function
const seedAdditionalOperators = async () => {
  try {
    console.log('Starting additional operator seeding...');
    
    let addedCount = 0;
    let skippedCount = 0;
    
    for (const operatorData of additionalOperators) {
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
    
    console.log(`\nAdditional seeding completed!`);
    console.log(`Added: ${addedCount} operators`);
    console.log(`Skipped: ${skippedCount} operators (already exist)`);
    console.log(`Total operators in database: ${await OperatorConfig.countDocuments()}`);
    
  } catch (error) {
    console.error('Error seeding additional operators:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the seeder
const runSeeder = async () => {
  await connectDB();
  await seedAdditionalOperators();
};

if (require.main === module) {
  runSeeder();
}

module.exports = { seedAdditionalOperators, additionalOperators };