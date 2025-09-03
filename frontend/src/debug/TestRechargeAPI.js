import React, { useState } from 'react';
import axios from 'axios';

const TestRechargeAPI = () => {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);

  const testWalletBalance = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/wallet/balance');
      setResults(prev => ({
        ...prev,
        walletBalance: {
          success: true,
          data: response.data,
          url: '/wallet/balance'
        }
      }));
    } catch (error) {
      setResults(prev => ({
        ...prev,
        walletBalance: {
          success: false,
          error: error.response?.data || error.message,
          url: '/wallet/balance'
        }
      }));
    }
    setLoading(false);
  };

  const testRechargeProcess = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/transactions/process', {
        type: 'mobile-recharge',
        amount: 10,
        metadata: {
          mobileNumber: '9999999999',
          operator: 'test',
          plan: 'test'
        }
      });
      setResults(prev => ({
        ...prev,
        rechargeProcess: {
          success: true,
          data: response.data,
          url: '/transactions/process'
        }
      }));
    } catch (error) {
      setResults(prev => ({
        ...prev,
        rechargeProcess: {
          success: false,
          error: error.response?.data || error.message,
          url: '/transactions/process'
        }
      }));
    }
    setLoading(false);
  };

  const testRechargeEndpoint = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/recharge/mobile', {
        mobileNumber: '9999999999',
        operator: 'test',
        amount: 10,
        circle: 'test'
      });
      setResults(prev => ({
        ...prev,
        rechargeEndpoint: {
          success: true,
          data: response.data,
          url: '/recharge/mobile'
        }
      }));
    } catch (error) {
      setResults(prev => ({
        ...prev,
        rechargeEndpoint: {
          success: false,
          error: error.response?.data || error.message,
          url: '/recharge/mobile'
        }
      }));
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>Recharge API Test</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={testWalletBalance} 
          disabled={loading}
          style={{ marginRight: '10px', padding: '10px 15px' }}
        >
          Test Wallet Balance
        </button>
        
        <button 
          onClick={testRechargeProcess} 
          disabled={loading}
          style={{ marginRight: '10px', padding: '10px 15px' }}
        >
          Test Recharge Process
        </button>
        
        <button 
          onClick={testRechargeEndpoint} 
          disabled={loading}
          style={{ padding: '10px 15px' }}
        >
          Test Recharge Endpoint
        </button>
      </div>

      {loading && <p>Testing...</p>}

      <div>
        {Object.entries(results).map(([key, result]) => (
          <div key={key} style={{ 
            marginBottom: '20px', 
            padding: '15px', 
            border: '1px solid #ccc',
            borderRadius: '5px',
            backgroundColor: result.success ? '#e8f5e8' : '#ffe8e8'
          }}>
            <h3>{key}</h3>
            <p><strong>URL:</strong> {result.url}</p>
            <p><strong>Status:</strong> {result.success ? 'SUCCESS' : 'FAILED'}</p>
            <pre style={{ 
              backgroundColor: '#f5f5f5', 
              padding: '10px', 
              borderRadius: '3px',
              overflow: 'auto',
              fontSize: '12px'
            }}>
              {JSON.stringify(result.success ? result.data : result.error, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestRechargeAPI;