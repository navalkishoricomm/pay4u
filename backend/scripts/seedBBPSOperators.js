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

// --- DATA SOURCES ---

// 1. Electricity Operators (Comprehensive List)
const electricityOperators = [
  // Maharashtra
  { code: 'MSEB', name: 'Maharashtra State Electricity Board (MSEB)', state: 'Maharashtra' },
  { code: 'MSEDCL', name: 'Maharashtra State Electricity Distribution Co Ltd', state: 'Maharashtra' },
  { code: 'BEST', name: 'Brihanmumbai Electric Supply and Transport (BEST)', state: 'Maharashtra' },
  { code: 'TATA_POWER_MUMBAI', name: 'Tata Power Mumbai', state: 'Maharashtra' },
  { code: 'RELIANCE_ENERGY', name: 'Reliance Energy Mumbai', state: 'Maharashtra' },
  { code: 'ADANI_MUMBAI', name: 'Adani Electricity Mumbai Limited', state: 'Maharashtra' },
  
  // Karnataka
  { code: 'BESCOM', name: 'Bangalore Electricity Supply Company (BESCOM)', state: 'Karnataka' },
  { code: 'MESCOM', name: 'Mangalore Electricity Supply Company (MESCOM)', state: 'Karnataka' },
  { code: 'HESCOM', name: 'Hubli Electricity Supply Company (HESCOM)', state: 'Karnataka' },
  { code: 'CHESCOM', name: 'Chamundeshwari Electricity Supply Corporation (CHESCOM)', state: 'Karnataka' },
  { code: 'GESCOM', name: 'Gulbarga Electricity Supply Company (GESCOM)', state: 'Karnataka' },
  
  // Tamil Nadu
  { code: 'TNEB', name: 'Tamil Nadu Electricity Board (TNEB)', state: 'Tamil Nadu' },
  { code: 'TANGEDCO', name: 'Tamil Nadu Generation and Distribution Corporation (TANGEDCO)', state: 'Tamil Nadu' },
  
  // Kerala
  { code: 'KSEB', name: 'Kerala State Electricity Board (KSEB)', state: 'Kerala' },
  
  // Delhi
  { code: 'BSES_RAJDHANI', name: 'BSES Rajdhani Power Limited', state: 'Delhi' },
  { code: 'BSES_YAMUNA', name: 'BSES Yamuna Power Limited', state: 'Delhi' },
  { code: 'TATA_POWER_DDL', name: 'Tata Power Delhi Distribution Limited', state: 'Delhi' },
  { code: 'NDMC', name: 'New Delhi Municipal Council (NDMC)', state: 'Delhi' },
  
  // Gujarat
  { code: 'DGVCL', name: 'Dakshin Gujarat Vij Company Limited (DGVCL)', state: 'Gujarat' },
  { code: 'MGVCL', name: 'Madhya Gujarat Vij Company Limited (MGVCL)', state: 'Gujarat' },
  { code: 'PGVCL', name: 'Paschim Gujarat Vij Company Limited (PGVCL)', state: 'Gujarat' },
  { code: 'UGVCL', name: 'Uttar Gujarat Vij Company Limited (UGVCL)', state: 'Gujarat' },
  { code: 'TORRENT_AHMEDABAD', name: 'Torrent Power Ahmedabad', state: 'Gujarat' },
  { code: 'TORRENT_POWER_SURAT', name: 'Torrent Power Surat', state: 'Gujarat' },
  
  // Uttar Pradesh
  { code: 'UPPCL', name: 'Uttar Pradesh Power Corporation Limited (UPPCL)', state: 'Uttar Pradesh' },
  { code: 'PVVNL', name: 'Paschimanchal Vidyut Vitran Nigam Limited (PVVNL)', state: 'Uttar Pradesh' },
  { code: 'DVVNL', name: 'Dakshinanchal Vidyut Vitran Nigam Limited (DVVNL)', state: 'Uttar Pradesh' },
  { code: 'MVVNL', name: 'Madhyanchal Vidyut Vitran Nigam Limited (MVVNL)', state: 'Uttar Pradesh' },
  { code: 'PUVVNL', name: 'Purvanchal Vidyut Vitran Nigam Limited (PUVVNL)', state: 'Uttar Pradesh' },
  
  // West Bengal
  { code: 'WBSEDCL', name: 'West Bengal State Electricity Distribution Company Limited (WBSEDCL)', state: 'West Bengal' },
  { code: 'CESC', name: 'Calcutta Electric Supply Corporation (CESC)', state: 'West Bengal' },
  
  // Rajasthan
  { code: 'JVVNL', name: 'Jaipur Vidyut Vitran Nigam Limited (JVVNL)', state: 'Rajasthan' },
  { code: 'AVVNL', name: 'Ajmer Vidyut Vitran Nigam Limited (AVVNL)', state: 'Rajasthan' },
  { code: 'JDVVNL', name: 'Jodhpur Vidyut Vitran Nigam Limited (JDVVNL)', state: 'Rajasthan' },
  
  // Madhya Pradesh
  { code: 'MPMKVVCL', name: 'Madhya Pradesh Madhya Kshetra Vidyut Vitaran Company Limited', state: 'Madhya Pradesh' },
  { code: 'MPPKVVCL', name: 'Madhya Pradesh Paschim Kshetra Vidyut Vitaran Company Limited', state: 'Madhya Pradesh' },
  { code: 'MPPUVVCL', name: 'Madhya Pradesh Purva Kshetra Vidyut Vitaran Company Limited', state: 'Madhya Pradesh' },
  
  // Andhra Pradesh
  { code: 'APSPDCL', name: 'Andhra Pradesh Southern Power Distribution Company Limited', state: 'Andhra Pradesh' },
  { code: 'APEPDCL', name: 'Andhra Pradesh Eastern Power Distribution Company Limited', state: 'Andhra Pradesh' },
  
  // Telangana
  { code: 'TSSPDCL', name: 'Telangana State Southern Power Distribution Company Limited', state: 'Telangana' },
  { code: 'TSNPDCL', name: 'Telangana State Northern Power Distribution Company Limited', state: 'Telangana' },
  
  // Haryana
  { code: 'DHBVN', name: 'Dakshin Haryana Bijli Vitran Nigam (DHBVN)', state: 'Haryana' },
  { code: 'UHBVN', name: 'Uttar Haryana Bijli Vitran Nigam (UHBVN)', state: 'Haryana' },
  
  // Punjab
  { code: 'PSPCL', name: 'Punjab State Power Corporation Limited (PSPCL)', state: 'Punjab' },
  
  // Bihar
  { code: 'NBPDCL', name: 'North Bihar Power Distribution Company Limited', state: 'Bihar' },
  { code: 'SBPDCL', name: 'South Bihar Power Distribution Company Limited', state: 'Bihar' },
  
  // Odisha
  { code: 'CESU', name: 'Central Electricity Supply Utility (CESU)', state: 'Odisha' },
  { code: 'NESCO', name: 'North Eastern Electricity Supply Company (NESCO)', state: 'Odisha' },
  { code: 'SOUTHCO', name: 'Southern Electricity Supply Company (SOUTHCO)', state: 'Odisha' },
  { code: 'WESCO', name: 'Western Electricity Supply Company (WESCO)', state: 'Odisha' },
  
  // Others
  { code: 'CSPDCL', name: 'Chhattisgarh State Power Distribution Company Limited', state: 'Chhattisgarh' },
  { code: 'APDCL', name: 'Assam Power Distribution Company Limited (APDCL)', state: 'Assam' },
  { code: 'ELECTRICITY_DEPT_GOA', name: 'Electricity Department Goa', state: 'Goa' },
  { code: 'JBVNL', name: 'Jharkhand Bijli Vitran Nigam Limited (JBVNL)', state: 'Jharkhand' },
  { code: 'HPSEB', name: 'Himachal Pradesh State Electricity Board (HPSEB)', state: 'Himachal Pradesh' },
  { code: 'JKPDD', name: 'Jammu & Kashmir Power Development Department', state: 'Jammu & Kashmir' },
  { code: 'UPCL', name: 'Uttarakhand Power Corporation Limited (UPCL)', state: 'Uttarakhand' }
];

// 2. Gas Operators
const gasOperators = [
  { code: 'INDANE_GAS', name: 'Indane Gas', min: 100, max: 15000 },
  { code: 'BHARAT_GAS', name: 'Bharat Gas', min: 100, max: 15000 },
  { code: 'HP_GAS', name: 'HP Gas', min: 100, max: 15000 },
  { code: 'IGL', name: 'Indraprastha Gas Limited (IGL)', min: 100, max: 15000 },
  { code: 'MGL', name: 'Mahanagar Gas Limited (MGL)', min: 100, max: 15000 },
  { code: 'GGL', name: 'Gujarat Gas Limited', min: 100, max: 15000 },
  { code: 'ADANI_GAS', name: 'Adani Gas', min: 100, max: 15000 },
  { code: 'SABARMATI_GAS', name: 'Sabarmati Gas', min: 100, max: 15000 },
  { code: 'VADODARA_GAS', name: 'Vadodara Gas', min: 100, max: 15000 }
];

// 3. Water Operators
const waterOperators = [
  { code: 'BMC_WATER', name: 'Brihanmumbai Municipal Corporation (BMC) Water', min: 100, max: 25000 },
  { code: 'DJB_WATER', name: 'Delhi Jal Board (DJB)', min: 100, max: 25000 },
  { code: 'BWSSB', name: 'Bangalore Water Supply and Sewerage Board (BWSSB)', min: 100, max: 25000 },
  { code: 'HMWSSB', name: 'Hyderabad Metropolitan Water Supply and Sewerage Board', min: 100, max: 25000 },
  { code: 'KWA', name: 'Kerala Water Authority', min: 100, max: 25000 },
  { code: 'MC_GURUGRAM', name: 'Municipal Corporation Gurugram', min: 100, max: 25000 },
  { code: 'MC_LUDHIANA', name: 'Municipal Corporation Ludhiana', min: 100, max: 25000 },
  { code: 'PUNE_MUNICIPAL', name: 'Pune Municipal Corporation', min: 100, max: 25000 }
];

// 4. Broadband Operators
const broadbandOperators = [
  { code: 'AIRTEL_FIBER', name: 'Airtel Xstream Fiber', min: 200, max: 20000 },
  { code: 'JIO_FIBER', name: 'Jio Fiber', min: 200, max: 20000 },
  { code: 'BSNL_BROADBAND', name: 'BSNL Broadband', min: 200, max: 20000 },
  { code: 'ACT_FIBERNET', name: 'ACT Fibernet', min: 200, max: 20000 },
  { code: 'HATHWAY', name: 'Hathway Broadband', min: 200, max: 20000 },
  { code: 'TIKONA', name: 'Tikona Broadband', min: 200, max: 20000 },
  { code: 'TATAPLAY_FIBER', name: 'Tata Play Fiber', min: 200, max: 20000 },
  { code: 'SPECTRANET', name: 'Spectra', min: 200, max: 20000 },
  { code: 'EXCITEL', name: 'Excitel Broadband', min: 200, max: 20000 },
  { code: 'GTPL_BROADBAND', name: 'GTPL Broadband', min: 200, max: 20000 }
];

// 5. Loan Operators
const loanOperators = [
  { code: 'HDFC_LOAN', name: 'HDFC Bank Loan', min: 500, max: 100000 },
  { code: 'ICICI_LOAN', name: 'ICICI Bank Loan', min: 500, max: 100000 },
  { code: 'SBI_LOAN', name: 'State Bank of India Loan', min: 500, max: 100000 },
  { code: 'AXIS_LOAN', name: 'Axis Bank Loan', min: 500, max: 100000 },
  { code: 'BAJAJ_FINSERV', name: 'Bajaj Finserv Loan', min: 500, max: 100000 },
  { code: 'KOTAK_LOAN', name: 'Kotak Mahindra Bank Loan', min: 500, max: 100000 },
  { code: 'IDFC_FIRST_LOAN', name: 'IDFC FIRST Bank Loan', min: 500, max: 100000 },
  { code: 'TATA_CAPITAL', name: 'Tata Capital Financial Services', min: 500, max: 100000 },
  { code: 'L_AND_T_FINANCE', name: 'L&T Finance', min: 500, max: 100000 },
  { code: 'MUTHOOT_FINANCE', name: 'Muthoot Finance', min: 500, max: 100000 },
  { code: 'HOME_CREDIT', name: 'Home Credit India', min: 500, max: 100000 }
];

// 6. Insurance Operators
const insuranceOperators = [
  { code: 'LIC_PREMIUM', name: 'Life Insurance Corporation (LIC)', min: 500, max: 200000 },
  { code: 'HDFC_LIFE', name: 'HDFC Life Insurance', min: 500, max: 200000 },
  { code: 'ICICI_PRUDENTIAL', name: 'ICICI Prudential Life Insurance', min: 500, max: 200000 },
  { code: 'SBI_LIFE', name: 'SBI Life Insurance', min: 500, max: 200000 },
  { code: 'BAJAJ_ALLIANZ', name: 'Bajaj Allianz Life Insurance', min: 500, max: 200000 },
  { code: 'MAX_LIFE', name: 'Max Life Insurance', min: 500, max: 200000 },
  { code: 'TATA_AIA', name: 'Tata AIA Life Insurance', min: 500, max: 200000 },
  { code: 'KOTAK_LIFE', name: 'Kotak Mahindra Life Insurance', min: 500, max: 200000 },
  { code: 'BIRLA_SUN_LIFE', name: 'Aditya Birla Sun Life Insurance', min: 500, max: 200000 },
  { code: 'PNB_METLIFE', name: 'PNB MetLife India Insurance', min: 500, max: 200000 }
];

// 7. Landline Operators
const landlineOperators = [
  { code: 'BSNL_LANDLINE', name: 'BSNL Landline', min: 100, max: 10000 },
  { code: 'MTNL_LANDLINE', name: 'MTNL Landline', min: 100, max: 10000 },
  { code: 'AIRTEL_LANDLINE', name: 'Airtel Landline', min: 100, max: 10000 },
  { code: 'TATA_TELESERVICES', name: 'Tata Teleservices', min: 100, max: 10000 }
];

// 8. Credit Card Operators
const creditCardOperators = [
  { code: 'HDFC_CREDITCARD', name: 'HDFC Bank Credit Card', min: 500, max: 500000 },
  { code: 'ICICI_CREDITCARD', name: 'ICICI Bank Credit Card', min: 500, max: 500000 },
  { code: 'SBI_CREDITCARD', name: 'SBI Credit Card', min: 500, max: 500000 },
  { code: 'AXIS_CREDITCARD', name: 'Axis Bank Credit Card', min: 500, max: 500000 },
  { code: 'KOTAK_CREDITCARD', name: 'Kotak Mahindra Bank Credit Card', min: 500, max: 500000 },
  { code: 'AMEX_CREDITCARD', name: 'American Express Credit Card', min: 500, max: 500000 },
  { code: 'INDUSIND_CREDITCARD', name: 'IndusInd Bank Credit Card', min: 500, max: 500000 },
  { code: 'RBL_CREDITCARD', name: 'RBL Bank Credit Card', min: 500, max: 500000 },
  { code: 'CITI_CREDITCARD', name: 'Citi Bank Credit Card', min: 500, max: 500000 }
];

// 9. Mobile Postpaid Operators
const postpaidOperators = [
  { code: 'AIRTEL_POSTPAID', name: 'Airtel Postpaid', min: 100, max: 25000 },
  { code: 'JIO_POSTPAID', name: 'Jio Postpaid', min: 100, max: 25000 },
  { code: 'VI_POSTPAID', name: 'Vi Postpaid', min: 100, max: 25000 },
  { code: 'BSNL_POSTPAID', name: 'BSNL Postpaid', min: 100, max: 25000 }
];

// 10. LPG Cylinder Operators
const cylinderOperators = [
  { code: 'INDANE_CYLINDER', name: 'Indane Gas Cylinder Booking', min: 500, max: 2000 },
  { code: 'BHARAT_CYLINDER', name: 'Bharat Gas Cylinder Booking', min: 500, max: 2000 },
  { code: 'HP_CYLINDER', name: 'HP Gas Cylinder Booking', min: 500, max: 2000 }
];

// --- HELPER FUNCTION ---

const createOperatorObject = (data, serviceType, commission, instructionsPrefix) => ({
  operatorCode: data.code,
  operatorName: data.name,
  serviceType: serviceType,
  processingMode: 'manual',
  isActive: true,
  commission: commission,
  minAmount: data.min || 100,
  maxAmount: data.max || 50000,
  circles: [],
  manualProcessing: {
    requiresApproval: true,
    approvalTimeout: 48,
    autoApproveAmount: serviceType === 'electricity' ? 2000 : 1000,
    instructions: `${instructionsPrefix} for ${data.name}`
  },
  metadata: {
    state: data.state || 'All India',
    category: serviceType
  },
  bbps: {
    isBBPS: true,
    billerId: data.code // Using code as placeholder ID
  }
});

// --- MAIN SEEDER ---

const seedBBPSOperators = async () => {
  try {
    console.log('Starting Master BBPS Operator Seeding...');
    
    // Arrays of operators to process
    const categories = [
      { data: electricityOperators, type: 'electricity', comm: 1.5, instr: 'Process electricity bill' },
      { data: gasOperators, type: 'gas', comm: 1.0, instr: 'Process gas bill' },
      { data: waterOperators, type: 'water', comm: 1.0, instr: 'Process water bill' },
      { data: broadbandOperators, type: 'broadband', comm: 1.5, instr: 'Process broadband bill' },
      { data: loanOperators, type: 'loan', comm: 0.5, instr: 'Process loan repayment' },
      { data: insuranceOperators, type: 'insurance', comm: 1.0, instr: 'Process insurance premium' },
      { data: landlineOperators, type: 'landline', comm: 1.5, instr: 'Process landline bill' },
      { data: creditCardOperators, type: 'creditcard', comm: 0.8, instr: 'Process credit card payment' },
      { data: postpaidOperators, type: 'postpaid', comm: 2.0, instr: 'Process postpaid bill' },
      { data: cylinderOperators, type: 'cylinder', comm: 1.0, instr: 'Process LPG cylinder booking' }
    ];

    let totalAdded = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    for (const category of categories) {
      console.log(`\nProcessing ${category.type.toUpperCase()} operators...`);
      
      for (const item of category.data) {
        try {
          // Check if exists
          const existing = await OperatorConfig.findOne({ operatorCode: item.code });
          
          if (existing) {
            // Optional: Update existing to ensure BBPS flag is set
            // await OperatorConfig.updateOne({ operatorCode: item.code }, { $set: { 'bbps.isBBPS': true } });
            console.log(`Skipped (Exists): ${item.name}`);
            totalSkipped++;
            continue;
          }

          // Create new
          const operatorData = createOperatorObject(item, category.type, category.comm, category.instr);
          const operator = new OperatorConfig(operatorData);
          await operator.save();
          console.log(`Added: ${item.name}`);
          totalAdded++;
        } catch (err) {
          console.error(`Error adding ${item.name}:`, err.message);
          totalErrors++;
        }
      }
    }

    console.log('\n==========================================');
    console.log('SEEDING SUMMARY');
    console.log('==========================================');
    console.log(`Total Added: ${totalAdded}`);
    console.log(`Total Skipped: ${totalSkipped}`);
    console.log(`Total Errors: ${totalErrors}`);
    console.log('==========================================');

    const finalCount = await OperatorConfig.countDocuments();
    console.log(`Total Operators in DB: ${finalCount}`);

  } catch (error) {
    console.error('Fatal error during seeding:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Execute if run directly
if (require.main === module) {
  connectDB().then(seedBBPSOperators);
}

module.exports = { seedBBPSOperators };
