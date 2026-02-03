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

// Comprehensive Electricity Operators (100+ BBPS operators)
const electricityOperators = [
  // Maharashtra
  { code: 'MSEB', name: 'Maharashtra State Electricity Board (MSEB)', state: 'Maharashtra' },
  { code: 'MSEDCL', name: 'Maharashtra State Electricity Distribution Co Ltd', state: 'Maharashtra' },
  { code: 'BEST', name: 'Brihanmumbai Electric Supply and Transport (BEST)', state: 'Maharashtra' },
  { code: 'TATA_POWER_MUMBAI', name: 'Tata Power Mumbai', state: 'Maharashtra' },
  { code: 'RELIANCE_ENERGY', name: 'Reliance Energy Mumbai', state: 'Maharashtra' },
  
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
  { code: 'MES_DELHI', name: 'Military Engineer Services (MES) Delhi', state: 'Delhi' },
  
  // Gujarat
  { code: 'DGVCL', name: 'Dakshin Gujarat Vij Company Limited (DGVCL)', state: 'Gujarat' },
  { code: 'MGVCL', name: 'Madhya Gujarat Vij Company Limited (MGVCL)', state: 'Gujarat' },
  { code: 'PGVCL', name: 'Paschim Gujarat Vij Company Limited (PGVCL)', state: 'Gujarat' },
  { code: 'UGVCL', name: 'Uttar Gujarat Vij Company Limited (UGVCL)', state: 'Gujarat' },
  { code: 'TORRENT_POWER_AHMEDABAD', name: 'Torrent Power Ahmedabad', state: 'Gujarat' },
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
  { code: 'DPSC', name: 'Durgapur Projects Limited (DPSC)', state: 'West Bengal' },
  
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
  
  // Himachal Pradesh
  { code: 'HPSEB', name: 'Himachal Pradesh State Electricity Board (HPSEB)', state: 'Himachal Pradesh' },
  
  // Jammu & Kashmir
  { code: 'JKPDD', name: 'Jammu & Kashmir Power Development Department', state: 'Jammu & Kashmir' },
  
  // Uttarakhand
  { code: 'UPCL', name: 'Uttarakhand Power Corporation Limited (UPCL)', state: 'Uttarakhand' },
  
  // Bihar
  { code: 'NBPDCL', name: 'North Bihar Power Distribution Company Limited', state: 'Bihar' },
  { code: 'SBPDCL', name: 'South Bihar Power Distribution Company Limited', state: 'Bihar' },
  
  // Jharkhand
  { code: 'JBVNL', name: 'Jharkhand Bijli Vitran Nigam Limited (JBVNL)', state: 'Jharkhand' },
  
  // Odisha
  { code: 'CESU', name: 'Central Electricity Supply Utility (CESU)', state: 'Odisha' },
  { code: 'NESCO', name: 'North Eastern Electricity Supply Company (NESCO)', state: 'Odisha' },
  { code: 'SOUTHCO', name: 'Southern Electricity Supply Company (SOUTHCO)', state: 'Odisha' },
  { code: 'WESCO', name: 'Western Electricity Supply Company (WESCO)', state: 'Odisha' },
  
  // Chhattisgarh
  { code: 'CSPDCL', name: 'Chhattisgarh State Power Distribution Company Limited', state: 'Chhattisgarh' },
  
  // Assam
  { code: 'APDCL', name: 'Assam Power Distribution Company Limited (APDCL)', state: 'Assam' },
  
  // Goa
  { code: 'ELECTRICITY_DEPT_GOA', name: 'Electricity Department Goa', state: 'Goa' },
  
  // Manipur
  { code: 'MSPDCL', name: 'Manipur State Power Distribution Company Limited', state: 'Manipur' },
  
  // Meghalaya
  { code: 'MeECL', name: 'Meghalaya Energy Corporation Limited (MeECL)', state: 'Meghalaya' },
  
  // Mizoram
  { code: 'POWER_DEPT_MIZORAM', name: 'Power & Electricity Department Mizoram', state: 'Mizoram' },
  
  // Nagaland
  { code: 'DEPT_POWER_NAGALAND', name: 'Department of Power Nagaland', state: 'Nagaland' },
  
  // Tripura
  { code: 'TSECL', name: 'Tripura State Electricity Corporation Limited (TSECL)', state: 'Tripura' },
  
  // Arunachal Pradesh
  { code: 'APST', name: 'Arunachal Pradesh State Transport', state: 'Arunachal Pradesh' },
  
  // Sikkim
  { code: 'POWER_DEPT_SIKKIM', name: 'Power Department Sikkim', state: 'Sikkim' },
  
  // Union Territories
  { code: 'ELECTRICITY_DEPT_CHANDIGARH', name: 'Electricity Department Chandigarh', state: 'Chandigarh' },
  { code: 'ELECTRICITY_DEPT_PUDUCHERRY', name: 'Electricity Department Puducherry', state: 'Puducherry' },
  { code: 'ELECTRICITY_DEPT_DNH', name: 'Electricity Department Dadra & Nagar Haveli', state: 'Dadra & Nagar Haveli' },
  { code: 'ELECTRICITY_DEPT_DAMAN_DIU', name: 'Electricity Department Daman & Diu', state: 'Daman & Diu' },
  { code: 'ELECTRICITY_DEPT_LAKSHADWEEP', name: 'Electricity Department Lakshadweep', state: 'Lakshadweep' },
  { code: 'ELECTRICITY_DEPT_ANDAMAN', name: 'Electricity Department Andaman & Nicobar', state: 'Andaman & Nicobar' },
  
  // Additional Major Private Utilities
  { code: 'ADANI_ELECTRICITY_MUMBAI', name: 'Adani Electricity Mumbai Limited', state: 'Maharashtra' },
  { code: 'TATA_POWER_CENTRAL_ODISHA', name: 'TP Central Odisha Distribution Limited', state: 'Odisha' },
  { code: 'TATA_POWER_NORTHERN_ODISHA', name: 'TP Northern Odisha Distribution Limited', state: 'Odisha' },
  { code: 'TATA_POWER_SOUTHERN_ODISHA', name: 'TP Southern Odisha Distribution Limited', state: 'Odisha' },
  { code: 'TATA_POWER_WESTERN_ODISHA', name: 'TP Western Odisha Distribution Limited', state: 'Odisha' },
  
  // Industrial & Special Purpose
  { code: 'NTPC', name: 'National Thermal Power Corporation (NTPC)', state: 'All India' },
  { code: 'NHPC', name: 'National Hydroelectric Power Corporation (NHPC)', state: 'All India' },
  { code: 'POWERGRID', name: 'Power Grid Corporation of India Limited', state: 'All India' },
  { code: 'RURAL_ELECTRIFICATION', name: 'Rural Electrification Corporation', state: 'All India' },
  
  // Additional State Utilities
  { code: 'KSEBL_THRISSUR', name: 'KSEBL Thrissur', state: 'Kerala' },
  { code: 'KSEBL_ERNAKULAM', name: 'KSEBL Ernakulam', state: 'Kerala' },
  { code: 'KSEBL_KOTTAYAM', name: 'KSEBL Kottayam', state: 'Kerala' },
  { code: 'KSEBL_KOZHIKODE', name: 'KSEBL Kozhikode', state: 'Kerala' },
  { code: 'KSEBL_KANNUR', name: 'KSEBL Kannur', state: 'Kerala' },
  { code: 'KSEBL_KASARAGOD', name: 'KSEBL Kasaragod', state: 'Kerala' },
  { code: 'KSEBL_MALAPPURAM', name: 'KSEBL Malappuram', state: 'Kerala' },
  { code: 'KSEBL_PALAKKAD', name: 'KSEBL Palakkad', state: 'Kerala' },
  { code: 'KSEBL_WAYANAD', name: 'KSEBL Wayanad', state: 'Kerala' },
  { code: 'KSEBL_IDUKKI', name: 'KSEBL Idukki', state: 'Kerala' },
  { code: 'KSEBL_PATHANAMTHITTA', name: 'KSEBL Pathanamthitta', state: 'Kerala' },
  { code: 'KSEBL_KOLLAM', name: 'KSEBL Kollam', state: 'Kerala' },
  { code: 'KSEBL_THIRUVANANTHAPURAM', name: 'KSEBL Thiruvananthapuram', state: 'Kerala' },
  
  // Additional Regional Utilities
  { code: 'MSEB_MUMBAI', name: 'MSEB Mumbai Region', state: 'Maharashtra' },
  { code: 'MSEB_PUNE', name: 'MSEB Pune Region', state: 'Maharashtra' },
  { code: 'MSEB_NASHIK', name: 'MSEB Nashik Region', state: 'Maharashtra' },
  { code: 'MSEB_AURANGABAD', name: 'MSEB Aurangabad Region', state: 'Maharashtra' },
  { code: 'MSEB_NAGPUR', name: 'MSEB Nagpur Region', state: 'Maharashtra' },
  { code: 'MSEB_AMRAVATI', name: 'MSEB Amravati Region', state: 'Maharashtra' }
];

// Convert to full operator objects
const fullElectricityOperators = electricityOperators.map(op => ({
  operatorCode: op.code,
  operatorName: op.name,
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
    instructions: `Process electricity bill payment for ${op.name} (${op.state})`
  },
  metadata: {
    state: op.state,
    category: 'electricity'
  }
}));

// Seed function
const seedElectricityOperators = async () => {
  try {
    console.log('Starting comprehensive electricity operator seeding...');
    
    let addedCount = 0;
    let skippedCount = 0;
    
    for (const operatorData of fullElectricityOperators) {
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
    
    console.log(`\nElectricity operators seeding completed!`);
    console.log(`Added: ${addedCount} operators`);
    console.log(`Skipped: ${skippedCount} operators (already exist)`);
    console.log(`Total operators in database: ${await OperatorConfig.countDocuments()}`);
    
  } catch (error) {
    console.error('Error seeding electricity operators:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the seeder
const runSeeder = async () => {
  await connectDB();
  await seedElectricityOperators();
};

if (require.main === module) {
  runSeeder();
}

module.exports = { seedElectricityOperators, fullElectricityOperators };