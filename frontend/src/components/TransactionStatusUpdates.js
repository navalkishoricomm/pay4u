import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNotification } from '../context/NotificationContext';
import '../styles/transaction-updates.css';

const TransactionStatusUpdates = () => {
  const [recentUpdates, setRecentUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const { info } = useNotification();

  useEffect(() => {
    // Initial fetch
    fetchRecentStatusUpdates();
    
    // Set up polling interval (every 30 seconds)
    const intervalId = setInterval(fetchRecentStatusUpdates, 30000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  const fetchRecentStatusUpdates = async () => {
    try {
      const response = await axios.get('/api/transactions/status-updates');
      const updates = response.data.data.updates;
      
      // Check if there are new updates compared to what we already have
      const newUpdates = updates.filter(update => {
        return !recentUpdates.some(existing => existing._id === update._id);
      });
      
      // If there are new updates, show notifications for them
      if (newUpdates.length > 0 && recentUpdates.length > 0) {
        newUpdates.forEach(update => {
          const statusText = {
            'approved': 'approved ✓',
            'rejected': 'rejected ✗',
            'completed': 'completed ✓',
            'failed': 'failed ✗'
          }[update.status] || update.status;
          
          info(`Transaction ${update.transactionId.substring(0, 8)} has been ${statusText}`);
        });
      }
      
      setRecentUpdates(updates);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching transaction status updates:', error);
      setLoading(false);
    }
  };

  if (loading || recentUpdates.length === 0) {
    return null;
  }

  return (
    <div className="transaction-updates">
      <h3>Recent Transaction Updates</h3>
      <div className="updates-list">
        {recentUpdates.map(update => (
          <div 
            key={update._id} 
            className={`update-item status-${update.status}`}
          >
            <div className="update-header">
              <span className="transaction-id">#{update.transactionId.substring(0, 8)}</span>
              <span className={`status-badge ${update.status}`}>{update.status}</span>
            </div>
            <div className="update-details">
              <div className="amount">₹{update.amount.toFixed(2)}</div>
              <div className="timestamp">{new Date(update.updatedAt).toLocaleString()}</div>
            </div>
            {update.notes && <div className="notes">{update.notes}</div>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransactionStatusUpdates;