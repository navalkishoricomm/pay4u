import React, { useState, useEffect } from 'react';

const WalletAPITest = () => {
  const [walletData, setWalletData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState('');

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    setToken(storedToken || 'No token found');
  }, []);

  const testWalletAPI = async () => {
    setLoading(true);
    setError(null);
    setWalletData(null);

    try {
      const token = localStorage.getItem('token');
      console.log('Using token:', token ? token.substring(0, 50) + '...' : 'No token');
      
      const response = await fetch('/wallet/balance', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok) {
        setWalletData(data);
      } else {
        setError(`API Error: ${response.status} - ${data.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(`Network Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testAlternativeEndpoint = async () => {
    setLoading(true);
    setError(null);
    setWalletData(null);

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/wallet/my-wallet', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Alternative endpoint response status:', response.status);
      const data = await response.json();
      console.log('Alternative endpoint response data:', data);

      if (response.ok) {
        setWalletData(data);
      } else {
        setError(`API Error: ${response.status} - ${data.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Alternative endpoint fetch error:', err);
      setError(`Network Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>Wallet API Test</h2>
      
      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
        <h3>Current Token:</h3>
        <p style={{ wordBreak: 'break-all', fontSize: '12px' }}>
          {token.length > 100 ? token.substring(0, 100) + '...' : token}
        </p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={testWalletAPI} 
          disabled={loading}
          style={{ 
            padding: '10px 20px', 
            marginRight: '10px',
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Testing...' : 'Test /wallet/balance'}
        </button>
        
        <button 
          onClick={testAlternativeEndpoint} 
          disabled={loading}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#28a745', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Testing...' : 'Test /wallet/my-wallet'}
        </button>
      </div>

      {error && (
        <div style={{ 
          padding: '10px', 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          border: '1px solid #f5c6cb', 
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          <h3>Error:</h3>
          <p>{error}</p>
        </div>
      )}

      {walletData && (
        <div style={{ 
          padding: '10px', 
          backgroundColor: '#d4edda', 
          color: '#155724', 
          border: '1px solid #c3e6cb', 
          borderRadius: '5px'
        }}>
          <h3>Success! Wallet Data:</h3>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>
            {JSON.stringify(walletData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default WalletAPITest;