// In-memory database for development when MongoDB is not available
const bcrypt = require('bcryptjs');

class InMemoryDB {
  constructor() {
    this.users = new Map();
    this.wallets = new Map();
    this.transactions = new Map();
    this.nextUserId = 1;
    this.nextWalletId = 1;
    this.nextTransactionId = 1;
    
    // Initialize with seed data
    this.initializeSeedData();
  }

  async initializeSeedData() {
    try {
      // Create admin user
      const adminPassword = await bcrypt.hash('admin123', 12);
      const adminUser = {
        _id: 'user-' + this.nextUserId++,
        name: 'Admin User',
        email: 'admin@pay4u.com',
        password: adminPassword,
        phone: '9876543210',
        role: 'admin',
        featurePermissions: {
          showRecharges: false,
          showBillPayments: false,
          showMoneyTransfer: true,
          showAEPS: true,
          showVouchers: true
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        active: true
      };
      
      this.users.set(adminUser._id, adminUser);
      
      // Create admin wallet
      const adminWallet = {
        _id: 'wallet-' + this.nextWalletId++,
        user: adminUser._id,
        balance: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      this.wallets.set(adminWallet._id, adminWallet);
      
      // Create test users
      const testUsers = [
        {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
          phone: '1234567890',
          role: 'user'
        },
        {
          name: 'Jane Smith',
          email: 'jane@example.com',
          password: 'password123',
          phone: '0987654321',
          role: 'user'
        },
        {
          name: 'Bob Johnson',
          email: 'bob@example.com',
          password: 'password123',
          phone: '5555555555',
          role: 'user'
        }
      ];
      
      for (const userData of testUsers) {
        const hashedPassword = await bcrypt.hash(userData.password, 12);
        const user = {
          _id: 'user-' + this.nextUserId++,
          name: userData.name,
          email: userData.email,
          password: hashedPassword,
          phone: userData.phone,
          role: userData.role,
          featurePermissions: {
            showRecharges: false,
            showBillPayments: false,
            showMoneyTransfer: true,
            showAEPS: true,
            showVouchers: true
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          active: true
        };
        
        this.users.set(user._id, user);
        
        // Create wallet for each user
        const wallet = {
          _id: 'wallet-' + this.nextWalletId++,
          user: user._id,
          balance: Math.floor(Math.random() * 10000) + 1000,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        this.wallets.set(wallet._id, wallet);
      }
      
      console.log('In-memory database initialized with seed data');
    } catch (error) {
      console.error('Error initializing seed data:', error);
    }
  }

  // User methods
  async findUserByEmail(email) {
    for (const user of this.users.values()) {
      if (user.email === email && user.active !== false) {
        return {
          ...user,
          correctPassword: async (candidatePassword, userPassword) => {
            return await bcrypt.compare(candidatePassword, userPassword);
          },
          changedPasswordAfter: function(JWTTimestamp) {
            if (this.passwordChangedAt) {
              const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
              return JWTTimestamp < changedTimestamp;
            }
            return false;
          }
        };
      }
    }
    return null;
  }

  async findUserById(id) {
    const user = this.users.get(id);
    if (user && user.active !== false) {
      return {
        ...user,
        correctPassword: async (candidatePassword, userPassword) => {
          return await bcrypt.compare(candidatePassword, userPassword);
        },
        changedPasswordAfter: function(JWTTimestamp) {
          if (this.passwordChangedAt) {
            const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
            return JWTTimestamp < changedTimestamp;
          }
          return false;
        }
      };
    }
    return null;
  }

  async createUser(userData) {
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    const user = {
      _id: 'user-' + this.nextUserId++,
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      phone: userData.phone,
      role: userData.role || 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
      active: true
    };
    
    this.users.set(user._id, user);
    return user;
  }

  // Wallet methods
  async findWalletByUserId(userId) {
    for (const wallet of this.wallets.values()) {
      if (wallet.user === userId) {
        return wallet;
      }
    }
    return null;
  }

  async createWallet(walletData) {
    const wallet = {
      _id: 'wallet-' + this.nextWalletId++,
      user: walletData.user,
      balance: walletData.balance || 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.wallets.set(wallet._id, wallet);
    return wallet;
  }

  async updateWalletBalance(userId, newBalance) {
    for (const [walletId, wallet] of this.wallets.entries()) {
      if (wallet.user === userId) {
        wallet.balance = newBalance;
        wallet.updatedAt = new Date();
        this.wallets.set(walletId, wallet);
        return wallet;
      }
    }
    return null;
  }

  // Transaction methods
  async createTransaction(transactionData) {
    const transaction = {
      _id: 'trans-' + this.nextTransactionId++,
      ...transactionData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.transactions.set(transaction._id, transaction);
    return transaction;
  }

  async findTransactionsByUserId(userId) {
    const userTransactions = [];
    for (const transaction of this.transactions.values()) {
      if (transaction.user === userId) {
        userTransactions.push(transaction);
      }
    }
    return userTransactions;
  }

  async findAllTransactions() {
    return Array.from(this.transactions.values());
  }

  async findPendingTransactions() {
    const pendingTransactions = [];
    for (const transaction of this.transactions.values()) {
      if (transaction.status === 'pending') {
        pendingTransactions.push(transaction);
      }
    }
    return pendingTransactions;
  }
}

// Create singleton instance
const inMemoryDB = new InMemoryDB();

module.exports = inMemoryDB;