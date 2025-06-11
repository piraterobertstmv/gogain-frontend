import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = 'Loading...' }) => {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center p-4">
      <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
        <span className="visually-hidden">Loading...</span>
      </div>
      {message && (
        <div className="mt-3 text-center">
          <p>{message}</p>
          <p className="text-muted small">This might take a moment if the server is starting up.</p>
        </div>
      )}
    </div>
  );
}; 