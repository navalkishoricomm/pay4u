import React, { useState, useEffect } from 'react';
import './VoucherOrderApprovals.css';

const VoucherOrderApprovals = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('pending_approval');

  useEffect(() => {
    fetchOrders();
  }, [currentPage, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/admin/voucher-orders?status=${statusFilter}&page=${currentPage}&limit=10`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await response.json();
      if (data.status === 'success') {
        setOrders(data.data.orders);
        setTotalPages(data.pages);
      } else {
        console.error('Error fetching orders:', data.message);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrder = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/admin/voucher-orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.status === 'success') {
        setSelectedOrder(data.data.order);
        setShowModal(true);
      } else {
        alert('Error fetching order details');
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      alert('Error fetching order details');
    }
  };

  const handleApproveOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to approve this order?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/admin/voucher-orders/${orderId}/approve`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.status === 'success') {
        alert('Order approved successfully');
        fetchOrders();
        setShowModal(false);
      } else {
        alert(data.message || 'Error approving order');
      }
    } catch (error) {
      console.error('Error approving order:', error);
      alert('Error approving order');
    }
  };

  const handleRejectOrder = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/admin/voucher-orders/${selectedOrder._id}/reject`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rejectionReason })
      });

      const data = await response.json();
      if (data.status === 'success') {
        alert('Order rejected successfully');
        fetchOrders();
        setShowModal(false);
        setShowRejectModal(false);
        setRejectionReason('');
      } else {
        alert(data.message || 'Error rejecting order');
      }
    } catch (error) {
      console.error('Error rejecting order:', error);
      alert('Error rejecting order');
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file to upload');
      return;
    }

    try {
      setUploadingFile(true);
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('voucherFile', selectedFile);

      const response = await fetch(`/admin/voucher-orders/${selectedOrder._id}/upload-file`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      if (data.status === 'success') {
        alert('File uploaded successfully');
        setSelectedFile(null);
        // Refresh order details
        handleViewOrder(selectedOrder._id);
      } else {
        alert(data.message || 'Error uploading file');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDownloadFile = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/admin/voucher-orders/${orderId}/download-file`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `voucher-${orderId}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const data = await response.json();
        alert(data.message || 'Error downloading file');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Error downloading file');
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      'pending_approval': 'status-pending',
      'approved': 'status-approved',
      'rejected': 'status-rejected'
    };
    
    const statusLabels = {
      'pending_approval': 'Pending Approval',
      'approved': 'Approved',
      'rejected': 'Rejected'
    };

    return (
      <span className={`status-badge ${statusClasses[status]}`}>
        {statusLabels[status]}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return `₹${amount.toFixed(2)}`;
  };

  if (loading) {
    return <div className="loading">Loading voucher orders...</div>;
  }

  return (
    <div className="voucher-order-approvals">
      <div className="page-header">
        <h2>Voucher Order Approvals</h2>
        <div className="header-controls">
          <select 
            value={statusFilter} 
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="status-filter"
          >
            <option value="pending_approval">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {(orders || []).length === 0 ? (
        <div className="no-orders">
          <p>No voucher orders found for the selected status.</p>
        </div>
      ) : (
        <>
          <div className="orders-table">
            <table>
              <thead>
                <tr>
                  <th>Order Number</th>
                  <th>Customer</th>
                  <th>Email</th>
                  <th>Voucher</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(orders || []).map((order) => (
                  <tr key={order._id}>
                    <td className="order-number">{order.orderNumber}</td>
                    <td>{order.user?.name || 'N/A'}</td>
                    <td>{order.customerEmail}</td>
                    <td>
                      <div className="voucher-info">
                        <div className="brand-name">{order.brandVoucher?.brandName}</div>
                        <div className="denomination">₹{order.voucherDenomination?.denomination} x {order.quantity}</div>
                      </div>
                    </td>
                    <td className="amount">{formatCurrency(order.finalAmount)}</td>
                    <td>{getStatusBadge(order.approvalStatus)}</td>
                    <td>{formatDate(order.createdAt)}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          onClick={() => handleViewOrder(order._id)}
                          className="btn btn-view"
                        >
                          View
                        </button>
                        {order.approvalStatus === 'pending_approval' && (
                          <>
                            <button 
                              onClick={() => handleApproveOrder(order._id)}
                              className="btn btn-approve"
                            >
                              Approve
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="btn btn-secondary"
              >
                Previous
              </button>
              <span className="page-info">
                Page {currentPage} of {totalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="btn btn-secondary"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Order Details Modal */}
      {showModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Order Details - {selectedOrder.orderNumber}</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="close-btn"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="order-details">
                <div className="detail-section">
                  <h4>Customer Information</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Name:</label>
                      <span>{selectedOrder.user?.name || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Email:</label>
                      <span>{selectedOrder.customerEmail}</span>
                    </div>
                    <div className="detail-item">
                      <label>Phone:</label>
                      <span>{selectedOrder.user?.phone || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Voucher Information</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Brand:</label>
                      <span>{selectedOrder.brandVoucher?.brandName}</span>
                    </div>
                    <div className="detail-item">
                      <label>Denomination:</label>
                      <span>₹{selectedOrder.voucherDenomination?.denomination}</span>
                    </div>
                    <div className="detail-item">
                      <label>Quantity:</label>
                      <span>{selectedOrder.quantity}</span>
                    </div>
                    <div className="detail-item">
                      <label>Total Amount:</label>
                      <span className="amount">{formatCurrency(selectedOrder.finalAmount)}</span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Order Status</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Approval Status:</label>
                      {getStatusBadge(selectedOrder.approvalStatus)}
                    </div>
                    <div className="detail-item">
                      <label>Order Date:</label>
                      <span>{formatDate(selectedOrder.createdAt)}</span>
                    </div>
                    {selectedOrder.approvedAt && (
                      <div className="detail-item">
                        <label>Processed Date:</label>
                        <span>{formatDate(selectedOrder.approvedAt)}</span>
                      </div>
                    )}
                    {selectedOrder.approvedBy && (
                      <div className="detail-item">
                        <label>Processed By:</label>
                        <span>{selectedOrder.approvedBy.name}</span>
                      </div>
                    )}
                    {selectedOrder.rejectionReason && (
                      <div className="detail-item full-width">
                        <label>Rejection Reason:</label>
                        <span>{selectedOrder.rejectionReason}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* File Upload Section for Approved Orders */}
                {selectedOrder.approvalStatus === 'approved' && (
                  <div className="detail-section">
                    <h4>Voucher File</h4>
                    {selectedOrder.voucherFilePath ? (
                      <div className="file-actions">
                        <p>✅ Voucher file has been uploaded</p>
                        <button 
                          onClick={() => handleDownloadFile(selectedOrder._id)}
                          className="btn btn-download"
                        >
                          Download File
                        </button>
                      </div>
                    ) : (
                      <div className="file-upload">
                        <p>Upload Excel file containing voucher codes:</p>
                        <input 
                          type="file" 
                          accept=".xlsx,.xls"
                          onChange={(e) => setSelectedFile(e.target.files[0])}
                          className="file-input"
                        />
                        <button 
                          onClick={handleFileUpload}
                          disabled={!selectedFile || uploadingFile}
                          className="btn btn-upload"
                        >
                          {uploadingFile ? 'Uploading...' : 'Upload File'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              {selectedOrder.approvalStatus === 'pending_approval' && (
                <>
                  <button 
                    onClick={() => handleApproveOrder(selectedOrder._id)}
                    className="btn btn-approve"
                  >
                    Approve Order
                  </button>
                  <button 
                    onClick={() => setShowRejectModal(true)}
                    className="btn btn-reject"
                  >
                    Reject Order
                  </button>
                </>
              )}
              <button 
                onClick={() => setShowModal(false)}
                className="btn btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="modal small-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reject Order</h3>
              <button 
                onClick={() => setShowRejectModal(false)}
                className="close-btn"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>Please provide a reason for rejecting this order:</p>
              <textarea 
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason..."
                className="rejection-textarea"
                rows="4"
              />
            </div>
            <div className="modal-footer">
              <button 
                onClick={handleRejectOrder}
                disabled={!rejectionReason.trim()}
                className="btn btn-reject"
              >
                Reject Order
              </button>
              <button 
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoucherOrderApprovals;