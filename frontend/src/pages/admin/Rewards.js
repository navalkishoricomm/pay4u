import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const Rewards = () => {
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newReward, setNewReward] = useState({
    userId: '',
    cardAccountId: '',
    points: 0,
    description: ''
  });

  const fetchRewards = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/enkash/rewards`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRewards(response.data.data);
    } catch (error) {
      console.error('Error fetching rewards:', error);
      toast.error('Failed to load rewards history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRewards();
  }, []);

  const handleIssueReward = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${process.env.REACT_APP_API_URL}/enkash/rewards/issue`, newReward, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Reward Points Issued Successfully');
      setShowModal(false);
      fetchRewards();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to issue rewards');
    }
  };

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Rewards Management</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <i className="fas fa-gift me-2"></i>Issue Rewards
        </button>
      </div>

      {loading ? (
        <div className="text-center">Loading...</div>
      ) : (
        <div className="card shadow-sm">
          <div className="card-header bg-white">
            <h5 className="mb-0">Reward History</h5>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Recipient</th>
                    <th>Points/Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rewards.length > 0 ? (
                    rewards.map((reward, index) => (
                      <tr key={index}>
                        <td>{new Date(reward.date).toLocaleDateString()}</td>
                        <td>{reward.recipient}</td>
                        <td>{reward.amount}</td>
                        <td>
                          <span className="badge bg-success">{reward.status}</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center">No rewards history found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Issue Reward Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Issue Reward Points</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleIssueReward}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">User ID / Card Account ID</label>
                    <input type="text" className="form-control" required 
                      value={newReward.cardAccountId} onChange={(e) => setNewReward({...newReward, cardAccountId: e.target.value})} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Points Amount</label>
                    <input type="number" className="form-control" required 
                      value={newReward.points} onChange={(e) => setNewReward({...newReward, points: e.target.value})} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea className="form-control" 
                      value={newReward.description} onChange={(e) => setNewReward({...newReward, description: e.target.value})}></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Issue</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rewards;
