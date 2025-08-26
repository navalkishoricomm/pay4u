// Simple in-memory transaction store for development
// In production, this would be replaced with database operations

class TransactionStore {
  constructor() {
    this.transactions = [];
    this.nextId = 1;
  }

  // Add a new transaction
  addTransaction(transactionData) {
    const transaction = {
      _id: `user-trans-${this.nextId++}`,
      ...transactionData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.transactions.push(transaction);
    console.log(`Added transaction: ${transaction._id} - ${transaction.type} - ${transaction.amount}`);
    return transaction;
  }

  // Get all transactions
  getAllTransactions() {
    return [...this.transactions];
  }

  // Get transactions by status
  getTransactionsByStatus(status) {
    return this.transactions.filter(t => t.status === status);
  }

  // Get transactions by type
  getTransactionsByType(type) {
    return this.transactions.filter(t => t.type === type);
  }

  // Get transactions with filters
  getFilteredTransactions(filters = {}) {
    let filtered = [...this.transactions];
    
    if (filters.type) {
      filtered = filtered.filter(t => t.type === filters.type);
    }
    
    if (filters.status) {
      filtered = filtered.filter(t => t.status === filters.status);
    }
    
    if (filters.startDate) {
      const start = new Date(filters.startDate);
      filtered = filtered.filter(t => new Date(t.createdAt) >= start);
    }
    
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      filtered = filtered.filter(t => new Date(t.createdAt) <= end);
    }
    
    if (filters.minAmount) {
      filtered = filtered.filter(t => t.amount >= parseFloat(filters.minAmount));
    }
    
    if (filters.maxAmount) {
      filtered = filtered.filter(t => t.amount <= parseFloat(filters.maxAmount));
    }
    
    return filtered;
  }

  // Update transaction status
  updateTransactionStatus(transactionId, status, notes = '') {
    const transaction = this.transactions.find(t => t._id === transactionId);
    if (transaction) {
      transaction.status = status;
      transaction.notes = notes;
      transaction.updatedAt = new Date();
      console.log(`Updated transaction ${transactionId} status to ${status}`);
      return transaction;
    }
    return null;
  }

  // Get transaction by ID
  getTransactionById(transactionId) {
    return this.transactions.find(t => t._id === transactionId);
  }

  // Get transactions by user ID
  getTransactionsByUserId(userId) {
    return this.transactions.filter(t => 
      t.wallet && t.wallet.user && t.wallet.user._id === userId
    );
  }
}

// Create a singleton instance
const transactionStore = new TransactionStore();

module.exports = transactionStore;