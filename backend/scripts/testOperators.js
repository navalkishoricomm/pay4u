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

// Test operators
const testOperators = async () => {
  try {
    console.log('=== TESTING OPERATORS ===\n');
    
    // Get total count
    const totalCount = await OperatorConfig.countDocuments();
    console.log(`Total operators in database: ${totalCount}\n`);
    
    // Get operators by service type
    const serviceTypes = ['mobile', 'dth', 'electricity', 'gas', 'water', 'broadband', 'loan', 'insurance', 'landline', 'creditcard', 'postpaid', 'cylinder'];
    
    for (const serviceType of serviceTypes) {
      const operators = await OperatorConfig.find({ serviceType, isActive: true })
        .select('operatorCode operatorName serviceType')
        .sort({ operatorName: 1 });
      
      console.log(`\n=== ${serviceType.toUpperCase()} OPERATORS (${operators.length}) ===`);
      operators.forEach(op => {
        console.log(`- ${op.operatorCode}: ${op.operatorName}`);
      });
    }
    
    // Test grouping functionality
    console.log('\n=== TESTING GROUPING FUNCTIONALITY ===');
    const allOperators = await OperatorConfig.find({ isActive: true })
      .select('operatorCode operatorName serviceType processingMode minAmount maxAmount')
      .sort({ serviceType: 1, operatorName: 1 });
    
    const groupedOperators = allOperators.reduce((acc, operator) => {
      if (!acc[operator.serviceType]) {
        acc[operator.serviceType] = [];
      }
      acc[operator.serviceType].push({
        code: operator.operatorCode,
        name: operator.operatorName,
        processingMode: operator.processingMode,
        minAmount: operator.minAmount,
        maxAmount: operator.maxAmount
      });
      return acc;
    }, {});
    
    console.log('\nGrouped operators structure:');
    Object.keys(groupedOperators).forEach(serviceType => {
      console.log(`${serviceType}: ${groupedOperators[serviceType].length} operators`);
    });
    
    console.log('\n=== TEST COMPLETED SUCCESSFULLY ===');
    
  } catch (error) {
    console.error('Error testing operators:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the test
const runTest = async () => {
  await connectDB();
  await testOperators();
};

if (require.main === module) {
  runTest();
}

module.exports = { testOperators };