// pages/NotFound.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: 'center', padding: '100px 20px' }}>
      <h1>404 - Page Not Found</h1>
      <p>Sorry, the page you're looking for doesn't exist.</p>
      <button
        onClick={() => window.location.href = 'https://scenith.in'}
        style={{
          padding: '10px 20px',
          background: 'linear-gradient(90deg, #3B82F6, #8B5CF6)',
          color: '#FFFFFF',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
        }}
      >
        Return to Home
      </button>
    </div>
  );
};

export default NotFound;