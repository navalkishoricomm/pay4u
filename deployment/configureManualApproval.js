const mongoose = require('mongoose');
const OperatorConfig = require('./models/OperatorConfig');

async function configureManualApproval() {
  try {
    // Connect to database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pay4u');
    }
    console.log('🔗 Connected to database');

    // Update all operators to require manual approval for all amounts
    const result = await OperatorConfig.updateMany(
      {}, // Update all operators
      {
        $set: {
          'manualProcessing.requiresApproval': true,
          'manualProcessing.autoApproveAmount': 0, // No auto-approval for any amount
          processingMode: 'manual' // Ensure all operators use manual processing
        }
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} operators to require manual approval`);

    // Verify the changes
    const operators = await OperatorConfig.find({}, 'operatorCode operatorName processingMode manualProcessing');
    console.log('\n📋 Current operator configurations:');
    operators.forEach(op => {
      console.log(`${op.operatorCode}: ${op.processingMode} mode, requiresApproval: ${op.manualProcessing.requiresApproval}, autoApproveAmount: ${op.manualProcessing.autoApproveAmount}`);
    });

    console.log('\n🎯 All operators now require manual approval for all recharge amounts!');

  } catch (error) {
    console.error('❌ Error configuring manual approval:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

configureManualApproval();