import React, { useState, useEffect } from 'react';
import './AuditDashboard.css';

const AuditDashboard = () => {
  const [auditData, setAuditData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [locationStats, setLocationStats] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    page: 1,
    limit: 50,
    transactionType: '',
    transactionStatus: '',
    userMobile: '',
    ipAddress: '',
    minAmount: '',
    maxAmount: '',
    minRiskScore: '',
    maxRiskScore: '',
    startDate: '',
    endDate: '',
    country: '',
    city: '',
    hasVpn: '',
    hasProxy: '',
    hasTor: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNext: false,
    hasPrev: false
  });

  // Fetch audit data
  const fetchAuditData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams();
      
      // Add non-empty filters to query params
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          queryParams.append(key, value);
        }
      });
      
      const response = await fetch(`/api/admin/audit/transactions?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAuditData(data.data.transactions);
        setPagination(data.data.pagination);
      } else {
        setError(data.message || 'Failed to fetch audit data');
      }
    } catch (err) {
      setError('Error fetching audit data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch analytics data
  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const [fraudResponse, locationResponse] = await Promise.all([
        fetch('/api/admin/audit/analytics/fraud?days=30', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('/api/admin/audit/analytics/location?days=30', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);
      
      const fraudData = await fraudResponse.json();
      const locationData = await locationResponse.json();
      
      if (fraudData.success) {
        setAnalytics(fraudData.data.analytics);
      }
      
      if (locationData.success) {
        setLocationStats(locationData.data.locationStats);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 50,
      transactionType: '',
      transactionStatus: '',
      userMobile: '',
      ipAddress: '',
      minAmount: '',
      maxAmount: '',
      minRiskScore: '',
      maxRiskScore: '',
      startDate: '',
      endDate: '',
      country: '',
      city: '',
      hasVpn: '',
      hasProxy: '',
      hasTor: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
  };

  // Export data to CSV
  const exportToCSV = async () => {
    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams();
      
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.transactionType) queryParams.append('transactionType', filters.transactionType);
      if (filters.minRiskScore) queryParams.append('minRiskScore', filters.minRiskScore);
      
      const response = await fetch(`/api/admin/audit/export/csv?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transaction-audit-${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        setError('Failed to export data');
      }
    } catch (err) {
      setError('Error exporting data: ' + err.message);
    }
  };

  // View transaction details
  const viewTransactionDetails = (transaction) => {
    setSelectedTransaction(transaction);
    setShowModal(true);
  };

  // Get risk score color
  const getRiskScoreColor = (score) => {
    if (score >= 80) return '#dc3545'; // Red
    if (score >= 60) return '#fd7e14'; // Orange
    if (score >= 40) return '#ffc107'; // Yellow
    if (score >= 20) return '#20c997'; // Teal
    return '#28a745'; // Green
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN');
  };

  useEffect(() => {
    fetchAuditData();
  }, [filters]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div className="audit-dashboard">
      <div className="dashboard-header">
        <h1>Transaction Audit Dashboard</h1>
        <div className="header-actions">
          <button onClick={exportToCSV} className="btn btn-export">
            Export CSV
          </button>
          <button onClick={fetchAnalytics} className="btn btn-refresh">
            Refresh Analytics
          </button>
        </div>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="analytics-cards">
          <div className="analytics-card">
            <h3>Total Transactions</h3>
            <div className="card-value">{analytics.totalTransactions || 0}</div>
          </div>
          <div className="analytics-card high-risk">
            <h3>High Risk Transactions</h3>
            <div className="card-value">{analytics.highRiskTransactions || 0}</div>
          </div>
          <div className="analytics-card vpn">
            <h3>VPN Detected</h3>
            <div className="card-value">{analytics.vpnTransactions || 0}</div>
          </div>
          <div className="analytics-card proxy">
            <h3>Proxy Detected</h3>
            <div className="card-value">{analytics.proxyTransactions || 0}</div>
          </div>
          <div className="analytics-card amount">
            <h3>Total Amount</h3>
            <div className="card-value">{formatCurrency(analytics.totalAmount || 0)}</div>
          </div>
          <div className="analytics-card risk">
            <h3>Avg Risk Score</h3>
            <div className="card-value">{(analytics.averageRiskScore || 0).toFixed(1)}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters-section">
        <h3>Filters</h3>
        <div className="filters-grid">
          <div className="filter-group">
            <label>Transaction Type</label>
            <select 
              value={filters.transactionType} 
              onChange={(e) => handleFilterChange('transactionType', e.target.value)}
            >
              <option value="">All Types</option>
              <option value="DMT">DMT</option>
              <option value="AEPS">AEPS</option>
              <option value="RECHARGE">Recharge</option>
              <option value="VOUCHER">Voucher</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Status</label>
            <select 
              value={filters.transactionStatus} 
              onChange={(e) => handleFilterChange('transactionStatus', e.target.value)}
            >
              <option value="">All Status</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILED">Failed</option>
              <option value="PENDING">Pending</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>User Mobile</label>
            <input 
              type="text" 
              value={filters.userMobile} 
              onChange={(e) => handleFilterChange('userMobile', e.target.value)}
              placeholder="Enter mobile number"
            />
          </div>
          
          <div className="filter-group">
            <label>IP Address</label>
            <input 
              type="text" 
              value={filters.ipAddress} 
              onChange={(e) => handleFilterChange('ipAddress', e.target.value)}
              placeholder="Enter IP address"
            />
          </div>
          
          <div className="filter-group">
            <label>Min Amount</label>
            <input 
              type="number" 
              value={filters.minAmount} 
              onChange={(e) => handleFilterChange('minAmount', e.target.value)}
              placeholder="Min amount"
            />
          </div>
          
          <div className="filter-group">
            <label>Max Amount</label>
            <input 
              type="number" 
              value={filters.maxAmount} 
              onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
              placeholder="Max amount"
            />
          </div>
          
          <div className="filter-group">
            <label>Min Risk Score</label>
            <input 
              type="number" 
              value={filters.minRiskScore} 
              onChange={(e) => handleFilterChange('minRiskScore', e.target.value)}
              placeholder="0-100"
              min="0"
              max="100"
            />
          </div>
          
          <div className="filter-group">
            <label>Max Risk Score</label>
            <input 
              type="number" 
              value={filters.maxRiskScore} 
              onChange={(e) => handleFilterChange('maxRiskScore', e.target.value)}
              placeholder="0-100"
              min="0"
              max="100"
            />
          </div>
          
          <div className="filter-group">
            <label>Start Date</label>
            <input 
              type="datetime-local" 
              value={filters.startDate} 
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <label>End Date</label>
            <input 
              type="datetime-local" 
              value={filters.endDate} 
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <label>Country</label>
            <input 
              type="text" 
              value={filters.country} 
              onChange={(e) => handleFilterChange('country', e.target.value)}
              placeholder="Country code (e.g., IN)"
            />
          </div>
          
          <div className="filter-group">
            <label>City</label>
            <input 
              type="text" 
              value={filters.city} 
              onChange={(e) => handleFilterChange('city', e.target.value)}
              placeholder="City name"
            />
          </div>
        </div>
        
        <div className="filter-actions">
          <button onClick={clearFilters} className="btn btn-clear">
            Clear All Filters
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="loading">
          Loading audit data...
        </div>
      )}

      {/* Audit Data Table */}
      {!loading && auditData.length > 0 && (
        <div className="audit-table-container">
          <table className="audit-table">
            <thead>
              <tr>
                <th>Date/Time</th>
                <th>Type</th>
                <th>Name</th>
                <th>User Mobile</th>
                <th>Amount</th>
                <th>Status</th>
                <th>IP Address</th>
                <th>Location</th>
                <th>Risk Score</th>
                <th>Security Flags</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {auditData.map((transaction) => (
                <tr key={transaction._id}>
                  <td>{formatDate(transaction.createdAt)}</td>
                  <td>
                    <span className={`transaction-type ${transaction.transactionType.toLowerCase()}`}>
                      {transaction.transactionType}
                    </span>
                  </td>
                  <td>{transaction.userId?.name || 'N/A'}</td>
                  <td>{transaction.userMobile || 'N/A'}</td>
                  <td>{formatCurrency(transaction.transactionAmount)}</td>
                  <td>
                    <span className={`status ${transaction.transactionStatus.toLowerCase()}`}>
                      {transaction.transactionStatus}
                    </span>
                  </td>
                  <td>{transaction.ipAddress}</td>
                  <td>
                    {transaction.location?.address?.city || transaction.location?.address?.country
                      ? `${transaction.location.address.city || 'Unknown City'}, ${transaction.location.address.country || 'Unknown Country'}`
                      : 'Location not available'
                    }
                  </td>
                  <td>
                    <span 
                      className="risk-score"
                      style={{ color: getRiskScoreColor(transaction.securityFlags?.riskScore || 0) }}
                    >
                      {transaction.securityFlags?.riskScore || 0}
                    </span>
                  </td>
                  <td>
                    <div className="security-flags">
                      {transaction.securityFlags?.isVpnDetected && <span className="flag vpn">VPN</span>}
                      {transaction.securityFlags?.isProxyDetected && <span className="flag proxy">PROXY</span>}
                      {transaction.securityFlags?.isTorDetected && <span className="flag tor">TOR</span>}
                      {transaction.securityFlags?.fraudFlags?.length > 0 && (
                        <span className="flag fraud">FRAUD</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <button 
                      onClick={() => viewTransactionDetails(transaction)}
                      className="btn btn-view"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={!pagination.hasPrev}
            className="btn btn-pagination"
          >
            Previous
          </button>
          
          <span className="pagination-info">
            Page {pagination.currentPage} of {pagination.totalPages} 
            ({pagination.totalCount} total records)
          </span>
          
          <button 
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={!pagination.hasNext}
            className="btn btn-pagination"
          >
            Next
          </button>
        </div>
      )}

      {/* No Data */}
      {!loading && auditData.length === 0 && (
        <div className="no-data">
          No audit data found for the selected filters.
        </div>
      )}

      {/* Transaction Details Modal */}
      {showModal && selectedTransaction && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Transaction Audit Details</h2>
              <button onClick={() => setShowModal(false)} className="modal-close">&times;</button>
            </div>
            
            <div className="modal-body">
              <div className="details-grid">
                <div className="detail-section">
                  <h3>Transaction Information</h3>
                  <div className="detail-item">
                    <label>Transaction ID:</label>
                    <span>{selectedTransaction.transactionId}</span>
                  </div>
                  <div className="detail-item">
                    <label>Reference:</label>
                    <span>{selectedTransaction.transactionReference}</span>
                  </div>
                  <div className="detail-item">
                    <label>Type:</label>
                    <span>{selectedTransaction.transactionType}</span>
                  </div>
                  <div className="detail-item">
                    <label>Amount:</label>
                    <span>{formatCurrency(selectedTransaction.transactionAmount)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Status:</label>
                    <span>{selectedTransaction.transactionStatus}</span>
                  </div>
                </div>
                
                <div className="detail-section">
                  <h3>User Information</h3>
                  <div className="detail-item">
                    <label>Name:</label>
                    <span>{selectedTransaction.userId?.name || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Mobile:</label>
                    <span>{selectedTransaction.userMobile || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>User ID:</label>
                    <span>{selectedTransaction.userId?._id || selectedTransaction.userId}</span>
                  </div>
                </div>
                
                <div className="detail-section">
                  <h3>Device & Network</h3>
                  <div className="detail-item">
                    <label>IP Address:</label>
                    <span>{selectedTransaction.ipAddress}</span>
                  </div>
                  <div className="detail-item">
                    <label>Device Fingerprint:</label>
                    <span>{selectedTransaction.deviceFingerprint || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>User Agent:</label>
                    <span className="user-agent">{selectedTransaction.userAgent}</span>
                  </div>
                </div>
                
                <div className="detail-section">
                  <h3><i className="fas fa-map-marker-alt me-2"></i>Location Details</h3>
                  {selectedTransaction.location && selectedTransaction.location.latitude && selectedTransaction.location.longitude ? (
                    <>
                      <div className="detail-item">
                        <label>Precise Coordinates:</label>
                        <span className="coordinate-display">
                          <strong>{parseFloat(selectedTransaction.location.latitude).toFixed(6)}, {parseFloat(selectedTransaction.location.longitude).toFixed(6)}</strong>
                          {selectedTransaction.location.accuracy && (
                            <small className="text-muted ms-2">(±{Math.round(selectedTransaction.location.accuracy)}m accuracy)</small>
                          )}
                        </span>
                      </div>
                      
                      {selectedTransaction.location.altitude && (
                        <div className="detail-item">
                          <label>Altitude:</label>
                          <span>{Math.round(selectedTransaction.location.altitude)}m above sea level</span>
                        </div>
                      )}
                      
                      <div className="detail-item">
                        <label>Address:</label>
                        <span>
                          {selectedTransaction.location.address ? (
                            <div className="address-display">
                              {selectedTransaction.location.address.city && (
                                <div><strong>City:</strong> {selectedTransaction.location.address.city}</div>
                              )}
                              {selectedTransaction.location.address.state && (
                                <div><strong>State:</strong> {selectedTransaction.location.address.state}</div>
                                              )}
                              {selectedTransaction.location.address.country && (
                                <div><strong>Country:</strong> {selectedTransaction.location.address.country}</div>
                              )}
                              {selectedTransaction.location.address.postalCode && (
                                <div><strong>Postal Code:</strong> {selectedTransaction.location.address.postalCode}</div>
                              )}
                            </div>
                          ) : 'Address not available'}
                        </span>
                      </div>
                      
                      <div className="detail-item">
                        <label>Map View:</label>
                        <span>
                          <a 
                            href={`https://www.google.com/maps?q=${selectedTransaction.location.latitude},${selectedTransaction.location.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-outline-primary"
                          >
                            <i className="fas fa-external-link-alt me-1"></i>
                            View on Google Maps
                          </a>
                        </span>
                      </div>
                      
                      {selectedTransaction.location.timezone && (
                        <div className="detail-item">
                          <label>Timezone:</label>
                          <span>{selectedTransaction.location.timezone}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="alert alert-warning">
                      <i className="fas fa-exclamation-triangle me-2"></i>
                      <strong>Location not available</strong>
                      <br />
                      <small>This transaction was completed without precise location data.</small>
                    </div>
                  )}
                </div>
                
                <div className="detail-section">
                  <h3>Security Analysis</h3>
                  <div className="detail-item">
                    <label>Risk Score:</label>
                    <span 
                      style={{ 
                        color: getRiskScoreColor(selectedTransaction.securityFlags?.riskScore || 0),
                        fontWeight: 'bold'
                      }}
                    >
                      {selectedTransaction.securityFlags?.riskScore || 0}/100
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>VPN Detected:</label>
                    <span>{selectedTransaction.securityFlags?.isVpnDetected ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Proxy Detected:</label>
                    <span>{selectedTransaction.securityFlags?.isProxyDetected ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Tor Detected:</label>
                    <span>{selectedTransaction.securityFlags?.isTorDetected ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Fraud Flags:</label>
                    <span>
                      {selectedTransaction.securityFlags?.fraudFlags?.length > 0
                        ? selectedTransaction.securityFlags.fraudFlags.join(', ')
                        : 'None'
                      }
                    </span>
                  </div>
                </div>
                
                <div className="detail-section">
                  <h3>Browser Information</h3>
                  {selectedTransaction.browserInfo && (
                    <>
                      <div className="detail-item">
                        <label>Browser:</label>
                        <span>{selectedTransaction.browserInfo.name} {selectedTransaction.browserInfo.version}</span>
                      </div>
                      <div className="detail-item">
                        <label>Platform:</label>
                        <span>{selectedTransaction.browserInfo.platform}</span>
                      </div>
                      <div className="detail-item">
                        <label>Screen Resolution:</label>
                        <span>{selectedTransaction.browserInfo.screenResolution || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <label>Language:</label>
                        <span>{selectedTransaction.browserInfo.language || 'N/A'}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditDashboard;