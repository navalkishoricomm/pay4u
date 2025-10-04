const cron = require('node-cron');
const dmtService = require('../services/dmtService');
const DmtTransaction = require('../models/DmtTransaction');

class JobScheduler {
  constructor() {
    this.jobs = new Map();
    this.consecutiveErrors = 0;
    this.maxConsecutiveErrors = 5;
    this.circuitBreakerTimeout = 30 * 60 * 1000; // 30 minutes
    this.lastCircuitBreakerReset = Date.now();
  }

  // Start all scheduled jobs
  startAll() {
    this.startDmtStatusUpdateJob();
    console.log('All scheduled jobs started');
  }

  // Stop all scheduled jobs
  stopAll() {
    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`Stopped job: ${name}`);
    });
    this.jobs.clear();
  }

  // DMT transaction status update job - runs every 15 minutes
  startDmtStatusUpdateJob() {
    const job = cron.schedule('*/15 * * * *', async () => {
      try {
        console.log('Running DMT transaction status update job...');
        await this.updatePendingDmtTransactions();
      } catch (error) {
        console.error('DMT status update job error:', error);
      }
    }, {
      scheduled: false
    });

    this.jobs.set('dmtStatusUpdate', job);
    job.start();
    console.log('DMT transaction status update job scheduled (every 15 minutes)');
  }

  // Update pending DMT transactions
  async updatePendingDmtTransactions() {
    // Circuit breaker: skip if too many consecutive errors
    if (this.consecutiveErrors >= this.maxConsecutiveErrors) {
      const timeSinceLastReset = Date.now() - this.lastCircuitBreakerReset;
      if (timeSinceLastReset < this.circuitBreakerTimeout) {
        console.log(`Circuit breaker active: skipping DMT status update (${this.consecutiveErrors} consecutive errors)`);
        return;
      } else {
        // Reset circuit breaker after timeout
        this.consecutiveErrors = 0;
        this.lastCircuitBreakerReset = Date.now();
        console.log('Circuit breaker reset: resuming DMT status updates');
      }
    }

    try {
      // Find transactions that are still pending or processing
      const pendingTransactions = await DmtTransaction.find({
        status: { $in: ['PENDING', 'PROCESSING', 'INITIATED'] },
        paysprintTransactionId: { $exists: true, $ne: null },
        updatedAt: { $lt: new Date(Date.now() - 2 * 60 * 1000) } // Updated more than 2 minutes ago
      }).limit(20); // Process max 20 transactions per run

      if (pendingTransactions.length === 0) {
        console.log('No pending DMT transactions to update');
        return;
      }

      console.log(`Updating ${pendingTransactions.length} pending DMT transactions`);
      
      const dmtServiceInstance = new dmtService();
      let updatedCount = 0;
      let errorCount = 0;

      for (const transaction of pendingTransactions) {
        try {
          const result = await dmtServiceInstance.checkTransactionStatus(transaction.transactionId);
          
          if (result.success && result.transaction.status !== transaction.status) {
            updatedCount++;
            console.log(`Updated transaction ${transaction.transactionId}: ${transaction.status} -> ${result.transaction.status}`);
            
            // Emit real-time update to user
            if (global.io) {
              global.io.to(`user_${transaction.userId}`).emit('transactionStatusUpdate', {
                transactionId: transaction.transactionId,
                status: result.transaction.status,
                updatedAt: new Date()
              });
            }
          }
        } catch (error) {
          errorCount++;
          console.error(`Error updating transaction ${transaction.transactionId}:`, error.message);
        }

        // Add delay between requests to avoid rate limiting and reduce system load
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      console.log(`DMT status update completed: ${updatedCount} updated, ${errorCount} errors`);
      
      // Reset consecutive errors on successful completion
      if (errorCount === 0) {
        this.consecutiveErrors = 0;
      }
    } catch (error) {
      console.error('Error in updatePendingDmtTransactions:', error);
      this.consecutiveErrors++;
      console.log(`Consecutive errors: ${this.consecutiveErrors}/${this.maxConsecutiveErrors}`);
    }
  }

  // Manual trigger for DMT status updates (for testing)
  async triggerDmtStatusUpdate() {
    console.log('Manually triggering DMT status update...');
    await this.updatePendingDmtTransactions();
  }
}

module.exports = new JobScheduler();