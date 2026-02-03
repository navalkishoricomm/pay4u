const mongoose = require('mongoose');
const OperatorConfig = require('../models/OperatorConfig');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pay4u', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Comprehensive operators for all service types
const allOperators = [
  // Water operators
  { operatorCode: 'BWSSB', operatorName: 'Bangalore Water Supply and Sewerage Board', serviceType: 'water', state: 'Karnataka', processingMode: 'manual', commission: 1.5, minAmount: 50, maxAmount: 10000 },
  { operatorCode: 'DJB', operatorName: 'Delhi Jal Board', serviceType: 'water', state: 'Delhi', processingMode: 'manual', commission: 1.5, minAmount: 50, maxAmount: 10000 },
  { operatorCode: 'MCGM', operatorName: 'Municipal Corporation of Greater Mumbai', serviceType: 'water', state: 'Maharashtra', processingMode: 'manual', commission: 1.5, minAmount: 50, maxAmount: 10000 },
  { operatorCode: 'HMWSSB', operatorName: 'Hyderabad Metropolitan Water Supply', serviceType: 'water', state: 'Telangana', processingMode: 'manual', commission: 1.5, minAmount: 50, maxAmount: 10000 },
  { operatorCode: 'CMWSSB', operatorName: 'Chennai Metropolitan Water Supply', serviceType: 'water', state: 'Tamil Nadu', processingMode: 'manual', commission: 1.5, minAmount: 50, maxAmount: 10000 },
  { operatorCode: 'PHED_RAJ', operatorName: 'Public Health Engineering Department Rajasthan', serviceType: 'water', state: 'Rajasthan', processingMode: 'manual', commission: 1.5, minAmount: 50, maxAmount: 10000 },
  { operatorCode: 'KWSSB', operatorName: 'Karnataka Water Supply and Sewerage Board', serviceType: 'water', state: 'Karnataka', processingMode: 'manual', commission: 1.5, minAmount: 50, maxAmount: 10000 },
  { operatorCode: 'GWSSB', operatorName: 'Gujarat Water Supply and Sewerage Board', serviceType: 'water', state: 'Gujarat', processingMode: 'manual', commission: 1.5, minAmount: 50, maxAmount: 10000 },
  { operatorCode: 'UPJN', operatorName: 'Uttar Pradesh Jal Nigam', serviceType: 'water', state: 'Uttar Pradesh', processingMode: 'manual', commission: 1.5, minAmount: 50, maxAmount: 10000 },
  { operatorCode: 'PHED_HAR', operatorName: 'Public Health Engineering Department Haryana', serviceType: 'water', state: 'Haryana', processingMode: 'manual', commission: 1.5, minAmount: 50, maxAmount: 10000 },

  // Gas operators
  { operatorCode: 'IGL', operatorName: 'Indraprastha Gas Limited', serviceType: 'gas', state: 'Delhi', processingMode: 'manual', commission: 1.0, minAmount: 100, maxAmount: 5000 },
  { operatorCode: 'MGL', operatorName: 'Mahanagar Gas Limited', serviceType: 'gas', state: 'Maharashtra', processingMode: 'manual', commission: 1.0, minAmount: 100, maxAmount: 5000 },
  { operatorCode: 'GAIL', operatorName: 'Gas Authority of India Limited', serviceType: 'gas', state: 'All India', processingMode: 'manual', commission: 1.0, minAmount: 100, maxAmount: 5000 },
  { operatorCode: 'GSPC', operatorName: 'Gujarat State Petronet Limited', serviceType: 'gas', state: 'Gujarat', processingMode: 'manual', commission: 1.0, minAmount: 100, maxAmount: 5000 },
  { operatorCode: 'AGCL', operatorName: 'Assam Gas Company Limited', serviceType: 'gas', state: 'Assam', processingMode: 'manual', commission: 1.0, minAmount: 100, maxAmount: 5000 },
  { operatorCode: 'BPCL_GAS', operatorName: 'Bharat Petroleum Corporation Limited Gas', serviceType: 'gas', state: 'All India', processingMode: 'manual', commission: 1.0, minAmount: 100, maxAmount: 5000 },
  { operatorCode: 'HPCL_GAS', operatorName: 'Hindustan Petroleum Corporation Limited Gas', serviceType: 'gas', state: 'All India', processingMode: 'manual', commission: 1.0, minAmount: 100, maxAmount: 5000 },
  { operatorCode: 'IOCL_GAS', operatorName: 'Indian Oil Corporation Limited Gas', serviceType: 'gas', state: 'All India', processingMode: 'manual', commission: 1.0, minAmount: 100, maxAmount: 5000 },

  // Broadband operators
  { operatorCode: 'BSNL_BB', operatorName: 'BSNL Broadband', serviceType: 'broadband', state: 'All India', processingMode: 'manual', commission: 2.0, minAmount: 100, maxAmount: 5000 },
  { operatorCode: 'AIRTEL_BB', operatorName: 'Airtel Broadband', serviceType: 'broadband', state: 'All India', processingMode: 'manual', commission: 2.0, minAmount: 100, maxAmount: 5000 },
  { operatorCode: 'JIO_FIBER', operatorName: 'Jio Fiber', serviceType: 'broadband', state: 'All India', processingMode: 'manual', commission: 2.0, minAmount: 100, maxAmount: 5000 },
  { operatorCode: 'ACT_BB', operatorName: 'ACT Fibernet', serviceType: 'broadband', state: 'All India', processingMode: 'manual', commission: 2.0, minAmount: 100, maxAmount: 5000 },
  { operatorCode: 'HATHWAY', operatorName: 'Hathway Broadband', serviceType: 'broadband', state: 'All India', processingMode: 'manual', commission: 2.0, minAmount: 100, maxAmount: 5000 },
  { operatorCode: 'TIKONA', operatorName: 'Tikona Broadband', serviceType: 'broadband', state: 'All India', processingMode: 'manual', commission: 2.0, minAmount: 100, maxAmount: 5000 },
  { operatorCode: 'SPECTRA', operatorName: 'Spectra Broadband', serviceType: 'broadband', state: 'All India', processingMode: 'manual', commission: 2.0, minAmount: 100, maxAmount: 5000 },
  { operatorCode: 'RAILWIRE', operatorName: 'RailWire Broadband', serviceType: 'broadband', state: 'All India', processingMode: 'manual', commission: 2.0, minAmount: 100, maxAmount: 5000 },

  // Loan operators
  { operatorCode: 'HDFC_LOAN', operatorName: 'HDFC Bank Loan', serviceType: 'loan', state: 'All India', processingMode: 'manual', commission: 0.5, minAmount: 500, maxAmount: 50000 },
  { operatorCode: 'ICICI_LOAN', operatorName: 'ICICI Bank Loan', serviceType: 'loan', state: 'All India', processingMode: 'manual', commission: 0.5, minAmount: 500, maxAmount: 50000 },
  { operatorCode: 'SBI_LOAN', operatorName: 'State Bank of India Loan', serviceType: 'loan', state: 'All India', processingMode: 'manual', commission: 0.5, minAmount: 500, maxAmount: 50000 },
  { operatorCode: 'AXIS_LOAN', operatorName: 'Axis Bank Loan', serviceType: 'loan', state: 'All India', processingMode: 'manual', commission: 0.5, minAmount: 500, maxAmount: 50000 },
  { operatorCode: 'KOTAK_LOAN', operatorName: 'Kotak Mahindra Bank Loan', serviceType: 'loan', state: 'All India', processingMode: 'manual', commission: 0.5, minAmount: 500, maxAmount: 50000 },
  { operatorCode: 'PNB_LOAN', operatorName: 'Punjab National Bank Loan', serviceType: 'loan', state: 'All India', processingMode: 'manual', commission: 0.5, minAmount: 500, maxAmount: 50000 },
  { operatorCode: 'BOB_LOAN', operatorName: 'Bank of Baroda Loan', serviceType: 'loan', state: 'All India', processingMode: 'manual', commission: 0.5, minAmount: 500, maxAmount: 50000 },
  { operatorCode: 'CANARA_LOAN', operatorName: 'Canara Bank Loan', serviceType: 'loan', state: 'All India', processingMode: 'manual', commission: 0.5, minAmount: 500, maxAmount: 50000 },

  // Insurance operators
  { operatorCode: 'LIC_INDIA', operatorName: 'Life Insurance Corporation of India', serviceType: 'insurance', state: 'All India', processingMode: 'manual', commission: 1.0, minAmount: 500, maxAmount: 25000 },
  { operatorCode: 'HDFC_LIFE', operatorName: 'HDFC Life Insurance', serviceType: 'insurance', state: 'All India', processingMode: 'manual', commission: 1.0, minAmount: 500, maxAmount: 25000 },
  { operatorCode: 'ICICI_LIFE', operatorName: 'ICICI Prudential Life Insurance', serviceType: 'insurance', state: 'All India', processingMode: 'manual', commission: 1.0, minAmount: 500, maxAmount: 25000 },
  { operatorCode: 'SBI_LIFE', operatorName: 'SBI Life Insurance', serviceType: 'insurance', state: 'All India', processingMode: 'manual', commission: 1.0, minAmount: 500, maxAmount: 25000 },
  { operatorCode: 'BAJAJ_LIFE', operatorName: 'Bajaj Allianz Life Insurance', serviceType: 'insurance', state: 'All India', processingMode: 'manual', commission: 1.0, minAmount: 500, maxAmount: 25000 },
  { operatorCode: 'MAX_LIFE', operatorName: 'Max Life Insurance', serviceType: 'insurance', state: 'All India', processingMode: 'manual', commission: 1.0, minAmount: 500, maxAmount: 25000 },
  { operatorCode: 'TATA_AIA', operatorName: 'Tata AIA Life Insurance', serviceType: 'insurance', state: 'All India', processingMode: 'manual', commission: 1.0, minAmount: 500, maxAmount: 25000 },

  // Landline operators
  { operatorCode: 'BSNL_LANDLINE', operatorName: 'BSNL Landline', serviceType: 'landline', state: 'All India', processingMode: 'manual', commission: 2.0, minAmount: 100, maxAmount: 2000 },
  { operatorCode: 'MTNL_LANDLINE', operatorName: 'MTNL Landline', serviceType: 'landline', state: 'Delhi/Mumbai', processingMode: 'manual', commission: 2.0, minAmount: 100, maxAmount: 2000 },
  { operatorCode: 'AIRTEL_LANDLINE', operatorName: 'Airtel Landline', serviceType: 'landline', state: 'All India', processingMode: 'manual', commission: 2.0, minAmount: 100, maxAmount: 2000 },
  { operatorCode: 'TATA_LANDLINE', operatorName: 'Tata Teleservices Landline', serviceType: 'landline', state: 'All India', processingMode: 'manual', commission: 2.0, minAmount: 100, maxAmount: 2000 },

  // Credit Card operators
  { operatorCode: 'HDFC_CREDITCARD', operatorName: 'HDFC Bank Credit Card', serviceType: 'creditcard', state: 'All India', processingMode: 'manual', commission: 0.5, minAmount: 100, maxAmount: 50000 },
  { operatorCode: 'ICICI_CREDITCARD', operatorName: 'ICICI Bank Credit Card', serviceType: 'creditcard', state: 'All India', processingMode: 'manual', commission: 0.5, minAmount: 100, maxAmount: 50000 },
  { operatorCode: 'SBI_CC', operatorName: 'State Bank of India Credit Card', serviceType: 'creditcard', state: 'All India', processingMode: 'manual', commission: 0.5, minAmount: 100, maxAmount: 50000 },
  { operatorCode: 'AXIS_CREDITCARD', operatorName: 'Axis Bank Credit Card', serviceType: 'creditcard', state: 'All India', processingMode: 'manual', commission: 0.5, minAmount: 100, maxAmount: 50000 },
  { operatorCode: 'KOTAK_CREDITCARD', operatorName: 'Kotak Mahindra Bank Credit Card', serviceType: 'creditcard', state: 'All India', processingMode: 'manual', commission: 0.5, minAmount: 100, maxAmount: 50000 },
  { operatorCode: 'CITI_CREDITCARD', operatorName: 'Citibank Credit Card', serviceType: 'creditcard', state: 'All India', processingMode: 'manual', commission: 0.5, minAmount: 100, maxAmount: 50000 },
  { operatorCode: 'AMEX_CREDITCARD', operatorName: 'American Express Credit Card', serviceType: 'creditcard', state: 'All India', processingMode: 'manual', commission: 0.5, minAmount: 100, maxAmount: 50000 },
  { operatorCode: 'BOB_CREDITCARD', operatorName: 'Bank of Baroda Credit Card', serviceType: 'creditcard', state: 'All India', processingMode: 'manual', commission: 0.5, minAmount: 100, maxAmount: 50000 },

  // Postpaid operators
  { operatorCode: 'AIRTEL_POSTPAID', operatorName: 'Airtel Postpaid', serviceType: 'postpaid', state: 'All India', processingMode: 'manual', commission: 2.5, minAmount: 100, maxAmount: 5000 },
  { operatorCode: 'JIO_POSTPAID', operatorName: 'Jio Postpaid', serviceType: 'postpaid', state: 'All India', processingMode: 'manual', commission: 2.5, minAmount: 100, maxAmount: 5000 },
  { operatorCode: 'VI_POSTPAID', operatorName: 'Vi Postpaid', serviceType: 'postpaid', state: 'All India', processingMode: 'manual', commission: 2.5, minAmount: 100, maxAmount: 5000 },
  { operatorCode: 'BSNL_POSTPAID', operatorName: 'BSNL Postpaid', serviceType: 'postpaid', state: 'All India', processingMode: 'manual', commission: 2.5, minAmount: 100, maxAmount: 5000 },

  // Cylinder operators
  { operatorCode: 'IOCL_CYL', operatorName: 'Indian Oil Corporation LPG', serviceType: 'cylinder', state: 'All India', processingMode: 'manual', commission: 1.0, minAmount: 500, maxAmount: 2000 },
  { operatorCode: 'BPCL_CYL', operatorName: 'Bharat Petroleum Corporation LPG', serviceType: 'cylinder', state: 'All India', processingMode: 'manual', commission: 1.0, minAmount: 500, maxAmount: 2000 },
  { operatorCode: 'HPCL_CYL', operatorName: 'Hindustan Petroleum Corporation LPG', serviceType: 'cylinder', state: 'All India', processingMode: 'manual', commission: 1.0, minAmount: 500, maxAmount: 2000 }
];

async function seedAllOperators() {
  try {
    console.log('Starting to seed all operators...');
    
    let addedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const operatorData of allOperators) {
      try {
        // Check if operator already exists
        const existingOperator = await OperatorConfig.findOne({ 
          operatorCode: operatorData.operatorCode 
        });

        if (existingOperator) {
          console.log(`Skipped: ${operatorData.operatorName} (${operatorData.operatorCode}) - already exists`);
          skippedCount++;
          continue;
        }

        // Create new operator
        const operator = new OperatorConfig(operatorData);
        await operator.save();
        console.log(`Added: ${operatorData.operatorName} (${operatorData.serviceType})`);
        addedCount++;
      } catch (error) {
        console.error(`Error adding ${operatorData.operatorName}:`, error.message);
        errorCount++;
      }
    }

    // Get total count
    const totalOperators = await OperatorConfig.countDocuments();
    
    console.log('\n=== SEEDING SUMMARY ===');
    console.log(`✅ Added: ${addedCount} operators`);
    console.log(`⏭️  Skipped: ${skippedCount} operators (already exist)`);
    console.log(`❌ Errors: ${errorCount} operators`);
    console.log(`📊 Total operators in database: ${totalOperators}`);
    
    // Show count by service type
    console.log('\n=== OPERATORS BY SERVICE TYPE ===');
    const serviceTypes = ['mobile', 'dth', 'electricity', 'water', 'gas', 'broadband', 'loan', 'insurance', 'landline', 'creditcard', 'postpaid', 'cylinder'];
    
    for (const serviceType of serviceTypes) {
      const count = await OperatorConfig.countDocuments({ serviceType });
      console.log(`${serviceType.toUpperCase()}: ${count} operators`);
    }
    
  } catch (error) {
    console.error('Error seeding operators:', error);
  } finally {
    mongoose.connection.close();
    console.log('\nDatabase connection closed.');
  }
}

seedAllOperators();