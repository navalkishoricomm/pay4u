require('dotenv').config();
const mongoose = require('mongoose');
const OperatorConfig = require('../models/OperatorConfig');

// Map pairs of duplicate codes to a canonical code to keep
const duplicatesMap = [
  // Landline
  { serviceType: 'landline', canonical: 'AIRTEL_LANDLINE', duplicates: ['AIRTEL_LL'] },
  { serviceType: 'landline', canonical: 'BSNL_LANDLINE', duplicates: ['BSNL_LL'] },
  { serviceType: 'landline', canonical: 'MTNL_LANDLINE', duplicates: ['MTNL_LL'] },
  // Credit Card
  { serviceType: 'creditcard', canonical: 'HDFC_CREDITCARD', duplicates: ['HDFC_CC'] },
  { serviceType: 'creditcard', canonical: 'ICICI_CREDITCARD', duplicates: ['ICICI_CC'] },
  { serviceType: 'creditcard', canonical: 'AXIS_CREDITCARD', duplicates: ['AXIS_CC'] },
  { serviceType: 'creditcard', canonical: 'KOTAK_CREDITCARD', duplicates: ['KOTAK_CC'] },
  { serviceType: 'creditcard', canonical: 'SBI_CC', duplicates: ['SBI_CREDITCARD'] },
  // Postpaid
  { serviceType: 'postpaid', canonical: 'AIRTEL_POSTPAID', duplicates: ['AIRTEL_PP'] },
  { serviceType: 'postpaid', canonical: 'JIO_POSTPAID', duplicates: ['JIO_PP'] },
  { serviceType: 'postpaid', canonical: 'VI_POSTPAID', duplicates: ['VI_PP'] },
  { serviceType: 'postpaid', canonical: 'BSNL_POSTPAID', duplicates: ['BSNL_PP'] },
];

async function enforceCanonicalOperators() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/pay4u', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  console.log('Connected to MongoDB. Enforcing canonical operator codes...');

  try {
    let removed = 0;

    for (const entry of duplicatesMap) {
      const { serviceType, canonical, duplicates } = entry;

      const canon = await OperatorConfig.findOne({ operatorCode: canonical, serviceType });
      if (!canon) {
        console.warn(`Canonical ${canonical} (${serviceType}) not found. Skipping this set.`);
        continue;
      }

      for (const dup of duplicates) {
        const dups = await OperatorConfig.find({ operatorCode: dup, serviceType });
        if (dups.length === 0) continue;

        // If any duplicate has better fields than canonical, consider merging minimal fields
        for (const doc of dups) {
          // Merge allowedAmounts if canonical has none
          if ((!canon.allowedAmounts || canon.allowedAmounts.length === 0) && doc.allowedAmounts && doc.allowedAmounts.length) {
            canon.allowedAmounts = doc.allowedAmounts;
          }
          // Merge circles if canonical has none
          if ((!canon.circles || canon.circles.length === 0) && doc.circles && doc.circles.length) {
            canon.circles = doc.circles;
          }
          // Prefer API mapping if canonical lacks operatorId
          if (!canon.apiMapping || !canon.apiMapping.operatorId) {
            canon.apiMapping = canon.apiMapping || {};
            canon.apiMapping.operatorId = doc.apiMapping && doc.apiMapping.operatorId ? doc.apiMapping.operatorId : canon.apiMapping.operatorId;
          }
        }

        await canon.save();
        const res = await OperatorConfig.deleteMany({ operatorCode: dup, serviceType });
        removed += res.deletedCount || 0;
        console.log(`Removed ${res.deletedCount || 0} duplicates of ${dup} for ${serviceType} (canonical: ${canonical}).`);
      }
    }

    const total = await OperatorConfig.countDocuments();
    console.log(`Done. Removed ${removed} duplicates. Remaining operators: ${total}`);
  } catch (err) {
    console.error('Error enforcing canonical operators:', err);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
}

if (require.main === module) {
  enforceCanonicalOperators();
}