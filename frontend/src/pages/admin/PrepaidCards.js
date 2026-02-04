import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const PrepaidCards = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newCard, setNewCard] = useState({
    firstName: '',
    lastName: '',
    mobile: '',
    email: '',
    amount: 0
  });

  // Fetch Cards
  const fetchCards = async () => {
    try {
      const token = localStorage.getItem('token'); // Assuming auth token is stored here
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/enkash/cards`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCards(response.data.data);
    } catch (error) {
      console.error('Error fetching cards:', error);
      toast.error('Failed to load prepaid cards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const handleCreateCard = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${process.env.REACT_APP_API_URL}/enkash/cards/create`, newCard, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Prepaid Card Created Successfully');
      setShowModal(false);
      fetchCards();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create card');
    }
  };

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Prepaid Cards Management</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <i className="fas fa-plus me-2"></i>Issue New Card
        </button>
      </div>

      {loading ? (
        <div className="text-center">Loading...</div>
      ) : (
        <div className="card shadow-sm">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Card ID</th>
                    <th>Holder Name</th>
                    <th>Balance</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cards.length > 0 ? (
                    cards.map((card, index) => (
                      <tr key={index}>
                        <td>{card.cardId || 'N/A'}</td>
                        <td>{card.holder || 'N/A'}</td>
                        <td>₹{card.balance || 0}</td>
                        <td>
                          <span className={`badge bg-${card.status === 'Active' ? 'success' : 'secondary'}`}>
                            {card.status || 'Unknown'}
                          </span>
                        </td>
                        <td>
                          <button className="btn btn-sm btn-info me-2">Details</button>
                          <button className="btn btn-sm btn-warning">Top-up</button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center">No cards found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Create Card Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Issue New Prepaid Card</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleCreateCard}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">First Name</label>
                    <input type="text" className="form-control" required 
                      value={newCard.firstName} onChange={(e) => setNewCard({...newCard, firstName: e.target.value})} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Last Name</label>
                    <input type="text" className="form-control" required 
                      value={newCard.lastName} onChange={(e) => setNewCard({...newCard, lastName: e.target.value})} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Mobile</label>
                    <input type="tel" className="form-control" required 
                      value={newCard.mobile} onChange={(e) => setNewCard({...newCard, mobile: e.target.value})} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Initial Amount</label>
                    <input type="number" className="form-control" 
                      value={newCard.amount} onChange={(e) => setNewCard({...newCard, amount: e.target.value})} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Issue Card</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrepaidCards;
