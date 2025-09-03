import React, { useState } from 'react';

const AmountInputTest = () => {
  const [amount, setAmount] = useState('');
  const [logs, setLogs] = useState([]);
  
  const addLog = (message) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };
  
  const handleChange = (e) => {
    const { value } = e.target;
    addLog(`Input change: '${value}'`);
    setAmount(value);
  };
  
  const handleFocus = () => {
    addLog('Input focused');
  };
  
  const handleBlur = () => {
    addLog('Input blurred');
  };
  
  const handleKeyDown = (e) => {
    addLog(`Key pressed: ${e.key}`);
  };
  
  const testMaxValue = 10000;
  
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>Amount Input Debug Test</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="amount">Amount:</label>
        <input
          type="number"
          id="amount"
          name="amount"
          value={amount}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          min="1"
          max={testMaxValue}
          step="0.01"
          placeholder="Enter amount"
          style={{
            marginLeft: '10px',
            padding: '8px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            width: '200px'
          }}
        />
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <p><strong>Current Value:</strong> '{amount}'</p>
        <p><strong>Max Value:</strong> {testMaxValue}</p>
        <p><strong>Input Type:</strong> number</p>
      </div>
      
      <div>
        <h3>Event Log:</h3>
        <div style={{
          border: '1px solid #ccc',
          padding: '10px',
          height: '200px',
          overflowY: 'scroll',
          backgroundColor: '#f9f9f9'
        }}>
          {logs.map((log, index) => (
            <div key={index} style={{ fontSize: '12px', marginBottom: '2px' }}>
              {log}
            </div>
          ))}
        </div>
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <button onClick={() => setLogs([])} style={{
          padding: '8px 16px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}>
          Clear Log
        </button>
      </div>
    </div>
  );
};

export default AmountInputTest;