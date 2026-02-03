require('dotenv').config();
const mongoose = require('mongoose');
const OperatorConfig = require('../models/OperatorConfig');

function normalizeName(name) {
  if (!name) return '';
  return name
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ') // collapse whitespace
    .replace(/[^a-z0-9 ]/g, ''); // remove punctuation
}

function scoreOperator(op) {
  let score = 0;
  // Prefer entries wired to API providers
  if (op.primaryApiProvider) score += 100;
  if (op.processingMode === 'api') score += 50;
  if (op.isActive) score += 10;
  // Earlier createdAt preferred to preserve existing references
  const createdAt = op.createdAt ? new Date(op.createdAt).getTime() : Date.now();
  // Lower time (older) -> higher score
  score += Math.max(0, 1_000_000_000_000 - createdAt / 1000);
  // Shorter operatorCode slightly preferred if all else same
  score += 1 / ((op.operatorCode || '').length || 1);
  return score;
}

async function dedupeOperators() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/pay4u', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  console.log('Connected to MongoDB. Starting deduplication...');

  try {
    const all = await OperatorConfig.find({}).lean();
    console.log(`Total operators found: ${all.length}`);

    const byNameType = new Map();
    const byCode = new Map();

    for (const op of all) {
      const keyName = `${normalizeName(op.operatorName)}|${(op.serviceType || '').toLowerCase()}`;
      const keyCode = (op.operatorCode || '').toUpperCase();

      if (!byNameType.has(keyName)) byNameType.set(keyName, []);
      byNameType.get(keyName).push(op);

      if (!byCode.has(keyCode)) byCode.set(keyCode, []);
      byCode.get(keyCode).push(op);
    }

    let removedCount = 0;
    const toRemoveIds = new Set();

    // Dedupe by operatorCode first (should be unique)
    for (const [code, list] of byCode.entries()) {
      if (!code) continue;
      if (list.length > 1) {
        // Keep the best-scored one
        const sorted = list.slice().sort((a, b) => scoreOperator(b) - scoreOperator(a));
        const keep = sorted[0];
        const remove = sorted.slice(1);
        remove.forEach(r => toRemoveIds.add(String(r._id)));
        console.log(`Duplicate operatorCode "${code}" -> keeping ${keep.operatorName} (${keep._id}), removing ${remove.length}`);
      }
    }

    // Then dedupe by normalized operatorName + serviceType
    for (const [key, list] of byNameType.entries()) {
      if (list.length > 1) {
        const sorted = list.slice().sort((a, b) => scoreOperator(b) - scoreOperator(a));
        const keep = sorted[0];
        const remove = sorted.slice(1);
        // Ensure we don't remove the one already kept by code step
        remove.forEach(r => {
          if (String(r._id) !== String(keep._id)) {
            toRemoveIds.add(String(r._id));
          }
        });
        console.log(`Duplicate name+type "${key}" -> keeping ${keep.operatorName} [${keep.operatorCode}] (${keep._id}), removing ${remove.length}`);
      }
    }

    const toDelete = Array.from(toRemoveIds);
    if (toDelete.length === 0) {
      console.log('No duplicates found.');
    } else {
      console.log(`\nPreparing to delete ${toDelete.length} duplicate operator records...`);
      const res = await OperatorConfig.deleteMany({ _id: { $in: toDelete } });
      removedCount = res.deletedCount || 0;
      console.log(`Deleted ${removedCount} duplicates.`);
    }

    const remaining = await OperatorConfig.countDocuments();
    console.log(`\nDeduplication completed. Remaining operators: ${remaining}`);
  } catch (err) {
    console.error('Error during deduplication:', err);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
}

if (require.main === module) {
  dedupeOperators();
}