const cron = require('node-cron');
const dmtService = require('../services/dmtService');
const DmtTransaction = require('../models/DmtTransaction');

class JobScheduler {
  constructor() {
    this.jobs = new Map();
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

  // DMT transaction status update job - runs every 5 minutes
  startDmtStatusUpdateJob() {
    const job = cron.schedule('*/5 * * * *', async () => {
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
    console.log('DMT transaction status update job scheduled (every 5 minutes)');
  }

  // Update pending DMT transactions
  async updatePendingDmtTransactions() {
    try {
      // Find transactions that are still pending or processing
      const pendingTransactions = await DmtTransaction.find({
        status: { $in: ['PENDING', 'PROCESSING', 'INITIATED'] },
        paysprintTransactionId: { $exists: true, $ne: null },
        updatedAt: { $lt: new Date(Date.now() - 2 * 60 * 1000) } // Updated more than 2 minutes ago
      }).limit(50); // Process max 50 transactions per run

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

        // Add small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log(`DMT status update completed: ${updatedCount} updated, ${errorCount} errors`);
    } catch (error) {
      console.error('Error in updatePendingDmtTransactions:', error);
    }
  }

  // Manual trigger for DMT status updates (for testing)
  async triggerDmtStatusUpdate() {
    console.log('Manually triggering DMT status update...');
    await this.updatePendingDmtTransactions();
  }
}

module.exports = new JobScheduler();