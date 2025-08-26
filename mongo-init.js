// MongoDB initialization script for Pay4U application

// Switch to the pay4u_production database
db = db.getSiblingDB('pay4u_production');

// Create collections with indexes for better performance

// Users collection
db.createCollection('users');
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "phone": 1 }, { unique: true });
db.users.createIndex({ "createdAt": 1 });

// Wallets collection
db.createCollection('wallets');
db.wallets.createIndex({ "user": 1 }, { unique: true });
db.wallets.createIndex({ "balance": 1 });

// Transactions collection
db.createCollection('transactions');
db.transactions.createIndex({ "wallet": 1 });
db.transactions.createIndex({ "type": 1 });
db.transactions.createIndex({ "status": 1 });
db.transactions.createIndex({ "createdAt": -1 });
db.transactions.createIndex({ "wallet": 1, "createdAt": -1 });

// Brand Vouchers collection
db.createCollection('brandvouchers');
db.brandvouchers.createIndex({ "brandName": 1 });
db.brandvouchers.createIndex({ "category": 1 });
db.brandvouchers.createIndex({ "isActive": 1 });

// Voucher Denominations collection
db.createCollection('voucherdenominations');
db.voucherdenominations.createIndex({ "brandVoucher": 1 });
db.voucherdenominations.createIndex({ "denomination": 1 });
db.voucherdenominations.createIndex({ "isActive": 1 });

// Voucher Orders collection
db.createCollection('voucherorders');
db.voucherorders.createIndex({ "user": 1 });
db.voucherorders.createIndex({ "status": 1 });
db.voucherorders.createIndex({ "createdAt": -1 });
db.voucherorders.createIndex({ "user": 1, "createdAt": -1 });

// API Providers collection
db.createCollection('apiproviders');
db.apiproviders.createIndex({ "name": 1 }, { unique: true });
db.apiproviders.createIndex({ "isActive": 1 });

// Operator Configurations collection
db.createCollection('operatorconfigurations');
db.operatorconfigurations.createIndex({ "operatorCode": 1 }, { unique: true });
db.operatorconfigurations.createIndex({ "apiProvider": 1 });

// Manual Recharges collection
db.createCollection('manualrecharges');
db.manualrecharges.createIndex({ "user": 1 });
db.manualrecharges.createIndex({ "status": 1 });
db.manualrecharges.createIndex({ "createdAt": -1 });

print('Pay4U database initialized successfully with indexes');
print('Database: pay4u_production');
print('Collections created with appropriate indexes for optimal performance');