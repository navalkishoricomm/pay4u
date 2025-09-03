import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './ChargeSlabManagement.css';

const ChargeSlabManagement = () => {
  const [chargeSlabs, setChargeSlabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSlab, setEditingSlab] = useState(null);
  const [filterMode, setFilterMode] = useState('all');
  const [formData, setFormData] = useState({
    minAmount: '',
    maxAmount: '',
    charge: '',
    transferMode: 'IMPS'
  });

  useEffect(() => {
    fetchChargeSlabs();
  }, [filterMode]);

  const fetchChargeSlabs = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = filterMode !== 'all' ? { transferMode: filterMode } : {};
      
      const response = await axios.get('/admin/charge-slabs', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      
      setChargeSlabs(response.data.data.chargeSlabs);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching charge slabs:', error);
      toast.error('Failed to fetch charge slabs');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (parseFloat(formData.minAmount) >= parseFloat(formData.maxAmount)) {
      toast.error('Minimum amount must be less than maximum amount');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const data = {
        minAmount: parseFloat(formData.minAmount),
        maxAmount: parseFloat(formData.maxAmount),
        charge: parseFloat(formData.charge),
        transferMode: formData.transferMode
      };

      if (editingSlab) {
        await axios.put(`/admin/charge-slabs/${editingSlab._id}`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Charge slab updated successfully');
      } else {
        await axios.post('/admin/charge-slabs', data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Charge slab created successfully');
      }

      resetForm();
      fetchChargeSlabs();
    } catch (error) {
      console.error('Error saving charge slab:', error);
      toast.error(error.response?.data?.message || 'Failed to save charge slab');
    }
  };

  const handleEdit = (slab) => {
    setEditingSlab(slab);
    setFormData({
      minAmount: slab.minAmount.toString(),
      maxAmount: slab.maxAmount.toString(),
      charge: slab.charge.toString(),
      transferMode: slab.transferMode
    });
    setShowAddForm(true);
  };

  const handleDelete = async (slabId) => {
    if (!window.confirm('Are you sure you want to delete this charge slab?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/admin/charge-slabs/${slabId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Charge slab deleted successfully');
      fetchChargeSlabs();
    } catch (error) {
      console.error('Error deleting charge slab:', error);
      toast.error('Failed to delete charge slab');
    }
  };

  const handleToggleStatus = async (slab) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/admin/charge-slabs/${slab._id}`, {
        isActive: !slab.isActive
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Charge slab ${slab.isActive ? 'deactivated' : 'activated'} successfully`);
      fetchChargeSlabs();
    } catch (error) {
      console.error('Error updating charge slab status:', error);
      toast.error('Failed to update charge slab status');
    }
  };

  const resetForm = () => {
    setFormData({
      minAmount: '',
      maxAmount: '',
      charge: '',
      transferMode: 'IMPS'
    });
    setEditingSlab(null);
    setShowAddForm(false);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const testChargeCalculation = async () => {
    const testAmount = prompt('Enter amount to test charge calculation:');
    if (!testAmount || isNaN(testAmount)) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/admin/charge-slabs/calculate', {
        amount: parseFloat(testAmount),
        transferMode: filterMode === 'all' ? 'IMPS' : filterMode
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const { amount, transferMode, charge, totalAmount } = response.data.data;
      toast.success(
        `Amount: ₹${amount} | Mode: ${transferMode} | Charge: ₹${charge} | Total: ₹${totalAmount}`,
        { autoClose: 5000 }
      );
    } catch (error) {
      console.error('Error calculating charge:', error);
      toast.error('Failed to calculate charge');
    }
  };

  if (loading) {
    return <div className="loading">Loading charge slabs...</div>;
  }

  return (
    <div className="charge-slab-management">
      <div className="header">
        <h2>Charge Slab Management</h2>
        <div className="header-actions">
          <select 
            value={filterMode} 
            onChange={(e) => setFilterMode(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Modes</option>
            <option value="IMPS">IMPS Only</option>
            <option value="NEFT">NEFT Only</option>
          </select>
          <button 
            onClick={testChargeCalculation}
            className="btn btn-secondary"
          >
            Test Calculation
          </button>
          <button 
            onClick={() => setShowAddForm(true)}
            className="btn btn-primary"
          >
            Add New Slab
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingSlab ? 'Edit Charge Slab' : 'Add New Charge Slab'}</h3>
              <button onClick={resetForm} className="close-btn">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="slab-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Minimum Amount (₹)</label>
                  <input
                    type="number"
                    name="minAmount"
                    value={formData.minAmount}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="form-group">
                  <label>Maximum Amount (₹)</label>
                  <input
                    type="number"
                    name="maxAmount"
                    value={formData.maxAmount}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Charge (₹)</label>
                  <input
                    type="number"
                    name="charge"
                    value={formData.charge}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="form-group">
                  <label>Transfer Mode</label>
                  <select
                    name="transferMode"
                    value={formData.transferMode}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="IMPS">IMPS</option>
                    <option value="NEFT">NEFT</option>
                  </select>
                </div>
              </div>
              <div className="form-actions">
                <button type="button" onClick={resetForm} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingSlab ? 'Update' : 'Create'} Slab
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="slabs-table">
        <table>
          <thead>
            <tr>
              <th>Amount Range</th>
              <th>Charge</th>
              <th>Transfer Mode</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {chargeSlabs.map((slab) => (
              <tr key={slab._id} className={!slab.isActive ? 'inactive' : ''}>
                <td>₹{slab.minAmount.toLocaleString()} - ₹{slab.maxAmount.toLocaleString()}</td>
                <td>₹{slab.charge}</td>
                <td>
                  <span className={`mode-badge ${slab.transferMode.toLowerCase()}`}>
                    {slab.transferMode}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${slab.isActive ? 'active' : 'inactive'}`}>
                    {slab.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>{new Date(slab.createdAt).toLocaleDateString()}</td>
                <td>
                  <div className="action-buttons">
                    <button 
                      onClick={() => handleEdit(slab)}
                      className="btn btn-sm btn-secondary"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleToggleStatus(slab)}
                      className={`btn btn-sm ${slab.isActive ? 'btn-warning' : 'btn-success'}`}
                    >
                      {slab.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button 
                      onClick={() => handleDelete(slab._id)}
                      className="btn btn-sm btn-danger"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {chargeSlabs.length === 0 && (
          <div className="no-data">
            <p>No charge slabs found. Create your first charge slab to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChargeSlabManagement;