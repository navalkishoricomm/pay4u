import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const AdminDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is admin
    if (currentUser?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }

    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/admin/dashboard-stats');
        setStats(response.data.data.stats);
        setLoading(false);
      } catch (err) {
        setError('Failed to load dashboard statistics');
        setLoading(false);
        console.error('Error fetching admin dashboard stats:', err);
      }
    };

    fetchDashboardStats();
  }, [currentUser, navigate]);

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!stats) {
    return <div className="loading">Loading dashboard data...</div>;
  }

  return (
    <div className="admin-dashboard" style={{
      padding: window.innerWidth <= 768 ? '0.5rem' : '1rem',
      backgroundColor: '#f8f9fa',
      minHeight: '100vh'
    }}>
      {/* Mobile-Friendly Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '0.5rem',
        borderRadius: '6px',
        marginBottom: '0.5rem',
        textAlign: 'center',
        boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{
          margin: '0',
          fontSize: '1.1rem',
          fontWeight: '700'
        }}>Admin Dashboard</h1>
        <p style={{
          margin: '0.1rem 0 0 0',
          opacity: '0.9',
          fontSize: '0.7rem'
        }}>Welcome back, {currentUser?.name}</p>
      </div>
      
      {stats && (
        <div className="dashboard-stats">
          <div style={{
            display: 'grid',
            gridTemplateColumns: window.innerWidth <= 768 ? 'repeat(auto-fit, minmax(120px, 1fr))' : 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: window.innerWidth <= 768 ? '0.4rem' : '1rem',
            marginBottom: window.innerWidth <= 768 ? '0.5rem' : '1rem'
          }}>
            <div style={{
                background: 'white',
                padding: window.innerWidth <= 768 ? '0.4rem' : '1rem',
                borderRadius: window.innerWidth <= 768 ? '6px' : '8px',
                boxShadow: window.innerWidth <= 768 ? '0 1px 3px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.1)',
                textAlign: 'center',
                border: '1px solid #e9ecef'
              }}>
              <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: window.innerWidth <= 768 ? '0.15rem' : '0.5rem'
                }}>
                <i className="fas fa-users" style={{
                    fontSize: window.innerWidth <= 768 ? '0.6rem' : '1.5rem',
                    color: '#28a745',
                    marginRight: window.innerWidth <= 768 ? '0.15rem' : '0.5rem'
                  }}></i>
                <h3 style={{
                    margin: '0',
                    fontSize: window.innerWidth <= 768 ? '0.55rem' : '1rem',
                    color: '#495057'
                  }}>Users</h3>
              </div>
              <div style={{
                  fontSize: window.innerWidth <= 768 ? '1.4rem' : '2rem',
                  fontWeight: '700',
                  color: '#28a745',
                  marginBottom: window.innerWidth <= 768 ? '0.2rem' : '0.5rem'
                }}>{stats.totalUsers}</div>
                <div style={{
                  fontSize: window.innerWidth <= 768 ? '0.65rem' : '0.9rem',
                  color: '#6c757d'
                }}>Active: {stats.activeUsers}</div>
            </div>
            
            <div style={{
                background: 'white',
                padding: window.innerWidth <= 768 ? '0.4rem' : '1rem',
                borderRadius: window.innerWidth <= 768 ? '6px' : '8px',
                boxShadow: window.innerWidth <= 768 ? '0 1px 3px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.1)',
                textAlign: 'center',
                border: '1px solid #e9ecef'
              }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '0.15rem'
              }}>
                <i className="fas fa-exchange-alt" style={{
                  fontSize: '0.6rem',
                  color: '#007bff',
                  marginRight: '0.15rem'
                }}></i>
                <h3 style={{
                  margin: '0',
                  fontSize: '0.55rem',
                  color: '#495057'
                }}>Transactions</h3>
              </div>
              <div style={{
                fontSize: '1.4rem',
                fontWeight: '700',
                color: '#007bff',
                marginBottom: '0.2rem'
              }}>{stats.totalTransactions}</div>
              <div style={{
                fontSize: '0.65rem',
                color: '#6c757d'
              }}>₹{stats.totalTransactionAmount ? stats.totalTransactionAmount.toLocaleString() : '0'}</div>
            </div>
            
            <div style={{
              background: 'white',
              padding: '0.4rem',
              borderRadius: '6px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              textAlign: 'center',
              border: '1px solid #e9ecef'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '0.15rem'
              }}>
                <i className="fas fa-clock" style={{
                  fontSize: '0.6rem',
                  color: '#ffc107',
                  marginRight: '0.15rem'
                }}></i>
                <h3 style={{
                  margin: '0',
                  fontSize: '0.55rem',
                  color: '#495057'
                }}>Pending Approvals</h3>
              </div>
              <div style={{
                fontSize: '1.4rem',
                fontWeight: '700',
                color: '#ffc107',
                marginBottom: '0.2rem'
              }}>{stats.pendingApprovals}</div>
              <div style={{
                fontSize: '0.65rem',
                color: '#6c757d'
              }}>Needs Review</div>
            </div>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '0.4rem',
            marginBottom: '0.5rem'
          }}>
            <div style={{
              background: 'white',
              padding: '0.4rem',
              borderRadius: '6px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #e9ecef'
            }}>
              <h3 style={{
                margin: '0 0 0.3rem 0',
                fontSize: '0.55rem',
                color: '#495057',
                display: 'flex',
                alignItems: 'center'
              }}>
                <i className="fas fa-chart-bar" style={{
                  marginRight: '0.15rem',
                  color: '#007bff',
                  fontSize: '0.6rem'
                }}></i>
                Transactions by Type
              </h3>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.2rem'
              }}>
                {Object.entries(stats.transactionsByType || {}).map(([type, count]) => (
                  <div key={type} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.25rem',
                      background: '#f8f9fa',
                      borderRadius: '4px',
                      border: '1px solid #e9ecef'
                    }}>
                    <span style={{
                        fontSize: '0.55rem',
                        fontWeight: '500',
                        color: '#495057',
                        textTransform: 'capitalize'
                      }}>{type.replace('-', ' ')}</span>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <div style={{
                          width: '60px',
                          height: '8px',
                          background: '#e9ecef',
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${(count / stats.totalTransactions) * 100}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #007bff, #0056b3)',
                            borderRadius: '4px'
                          }}></div>
                        </div>
                        <span style={{
                          fontSize: '0.55rem',
                          fontWeight: '600',
                          color: '#007bff',
                          minWidth: '30px',
                          textAlign: 'right'
                        }}>{count}</span>
                      </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div style={{
              background: 'white',
              padding: '0.4rem',
              borderRadius: '6px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #e9ecef'
            }}>
              <h3 style={{
                margin: '0 0 0.3rem 0',
                fontSize: '0.55rem',
                color: '#495057',
                display: 'flex',
                alignItems: 'center'
              }}>
                <i className="fas fa-chart-pie" style={{
                  marginRight: '0.15rem',
                  color: '#28a745',
                  fontSize: '0.6rem'
                }}></i>
                Transactions by Status
              </h3>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.2rem'
              }}>
                {Object.entries(stats.transactionsByStatus || {}).map(([status, count]) => {
                  const statusColors = {
                    completed: '#28a745',
                    pending: '#ffc107',
                    failed: '#dc3545',
                    awaiting_approval: '#fd7e14',
                    approved: '#20c997',
                    rejected: '#6f42c1'
                  };
                  return (
                    <div key={status} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.25rem',
                      background: '#f8f9fa',
                      borderRadius: '4px',
                      border: '1px solid #e9ecef'
                    }}>
                      <span style={{
                        fontSize: '0.55rem',
                        fontWeight: '500',
                        color: '#495057',
                        textTransform: 'capitalize'
                      }}>{status.replace('_', ' ')}</span>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <div style={{
                          width: '60px',
                          height: '8px',
                          background: '#e9ecef',
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${(count / stats.totalTransactions) * 100}%`,
                            height: '100%',
                            background: statusColors[status] || '#6c757d',
                            borderRadius: '4px'
                          }}></div>
                        </div>
                        <span style={{
                          fontSize: '0.55rem',
                          fontWeight: '600',
                          color: statusColors[status] || '#6c757d',
                          minWidth: '30px',
                          textAlign: 'right'
                        }}>{count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* Quick Actions Section */}
          <div style={{
            marginBottom: '0.5rem'
          }}>
            <h3 style={{
              margin: '0 0 0.3rem 0',
              fontSize: '0.6rem',
              color: '#495057',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center'
            }}>
              <i className="fas fa-bolt" style={{
                marginRight: '0.2rem',
                color: '#007bff',
                fontSize: '0.6rem'
              }}></i>
              Quick Actions
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '0.3rem'
            }}>
              <button
                onClick={() => navigate('/admin/api-providers')}
                style={{
                  background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '0.4rem',
                  borderRadius: '6px',
                  fontSize: '0.55rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 1px 3px rgba(40,167,69,0.3)',
                  textAlign: 'center'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 8px rgba(40,167,69,0.4)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 1px 3px rgba(40,167,69,0.3)';
                }}
              >
                <i className="fas fa-plug" style={{marginBottom: '0.1rem', display: 'block'}}></i>
                API Providers
              </button>
              
              <button
                onClick={() => navigate('/admin/operators')}
                style={{
                  background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '0.4rem',
                  borderRadius: '6px',
                  fontSize: '0.55rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 1px 3px rgba(0,123,255,0.3)',
                  textAlign: 'center'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 8px rgba(0,123,255,0.4)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 1px 3px rgba(0,123,255,0.3)';
                }}
              >
                <i className="fas fa-cogs" style={{marginBottom: '0.1rem', display: 'block'}}></i>
                Operator Config
              </button>
              
              <button
                onClick={() => navigate('/admin/manual-recharges')}
                style={{
                  background: 'linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '0.4rem',
                  borderRadius: '6px',
                  fontSize: '0.55rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 1px 3px rgba(255,193,7,0.3)',
                  textAlign: 'center'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 8px rgba(255,193,7,0.4)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 1px 3px rgba(255,193,7,0.3)';
                }}
              >
                <i className="fas fa-hand-paper" style={{marginBottom: '0.1rem', display: 'block'}}></i>
                Manual Recharges
              </button>
              
              <button
                onClick={() => navigate('/admin/user-management')}
                style={{
                  background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '0.4rem',
                  borderRadius: '6px',
                  fontSize: '0.55rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 1px 3px rgba(231,76,60,0.3)',
                  textAlign: 'center'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 8px rgba(231,76,60,0.4)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 1px 3px rgba(231,76,60,0.3)';
                }}
              >
                <i className="fas fa-users-cog" style={{marginBottom: '0.1rem', display: 'block'}}></i>
                User Management
              </button>
              
              <button
                onClick={() => navigate('/admin/transactions')}
                style={{
                  background: 'linear-gradient(135deg, #6f42c1 0%, #495057 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '0.4rem',
                  borderRadius: '6px',
                  fontSize: '0.55rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 1px 3px rgba(111,66,193,0.3)',
                  textAlign: 'center'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 8px rgba(111,66,193,0.4)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 1px 3px rgba(111,66,193,0.3)';
                }}
              >
                <i className="fas fa-list" style={{marginBottom: '0.1rem', display: 'block'}}></i>
                All Transactions
              </button>
            </div>
          </div>
          
          <div style={{
            background: 'white',
            padding: '0.4rem',
            borderRadius: '6px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e9ecef'
          }}>
            <h3 style={{
              margin: '0 0 0.3rem 0',
              fontSize: '0.55rem',
              color: '#495057',
              display: 'flex',
              alignItems: 'center'
            }}>
              <i className="fas fa-history" style={{
                marginRight: '0.15rem',
                color: '#6f42c1',
                fontSize: '0.6rem'
              }}></i>
              Recent Transactions
            </h3>
            
            {/* Mobile-friendly transaction cards */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.2rem'
            }}>
              {(stats.recentTransactions || []).map(transaction => {
                const statusColors = {
                  completed: '#28a745',
                  pending: '#ffc107',
                  failed: '#dc3545',
                  awaiting_approval: '#fd7e14',
                  approved: '#20c997',
                  rejected: '#6f42c1'
                };
                return (
                  <div key={transaction._id} style={{
                    padding: '0.4rem',
                    background: '#f8f9fa',
                    borderRadius: '4px',
                    border: '1px solid #e9ecef',
                    transition: 'all 0.3s ease'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '0.2rem'
                    }}>
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.1rem'
                      }}>
                        <span style={{
                          fontSize: '0.5rem',
                          color: '#6c757d',
                          fontFamily: 'monospace'
                        }}>ID: {transaction._id ? transaction._id.substring(0, 8) + '...' : 'N/A'}</span>
                        <span style={{
                          fontSize: '0.6rem',
                          fontWeight: '600',
                          color: '#495057'
                        }}>{transaction.userName}</span>
                      </div>
                      <span style={{
                        display: 'inline-block',
                        padding: '0.1rem 0.3rem',
                        borderRadius: '8px',
                        fontSize: '0.5rem',
                        fontWeight: '600',
                        color: 'white',
                        background: statusColors[transaction.status] || '#6c757d',
                        textTransform: 'capitalize'
                      }}>
                        {transaction.status.replace('_', ' ')}
                      </span>
                    </div>
                    
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '0.3rem',
                      fontSize: '0.55rem'
                    }}>
                      <div>
                        <span style={{
                          color: '#6c757d',
                          display: 'block',
                          marginBottom: '0.05rem'
                        }}>Type</span>
                        <span style={{
                          color: '#495057',
                          fontWeight: '500',
                          textTransform: 'capitalize'
                        }}>{transaction.type.replace('-', ' ')}</span>
                      </div>
                      
                      <div>
                        <span style={{
                          color: '#6c757d',
                          display: 'block',
                          marginBottom: '0.1rem'
                        }}>Amount</span>
                        <span style={{
                          color: '#007bff',
                          fontWeight: '700',
                          fontSize: '0.65rem'
                        }}>₹{transaction.amount}</span>
                      </div>
                      
                      <div style={{
                        gridColumn: '1 / -1'
                      }}>
                        <span style={{
                          color: '#6c757d',
                          display: 'block',
                          marginBottom: '0.1rem'
                        }}>Date</span>
                        <span style={{
                          color: '#495057',
                          fontSize: '0.5rem'
                        }}>{transaction.createdAt ? new Date(transaction.createdAt).toLocaleString() : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div style={{
              marginTop: '0.3rem',
              textAlign: 'center'
            }}>
              <button 
                onClick={() => navigate('/admin/transactions')}
                style={{
                  background: 'linear-gradient(135deg, #6c757d 0%, #495057 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '0.3rem 1rem',
                  borderRadius: '4px',
                  fontSize: '0.6rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 1px 6px rgba(108,117,125,0.3)'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(108,117,125,0.4)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 8px rgba(108,117,125,0.3)';
                }}
              >
                <i className="fas fa-list" style={{marginRight: '0.5rem'}}></i>
                View All Transactions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;