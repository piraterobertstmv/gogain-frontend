/**
 * KeepAliveService.ts
 * 
 * This service maintains a persistent connection to the backend by sending
 * periodic ping requests. This prevents the backend from spinning down due to inactivity,
 * which is common with free-tier hosting services like Render.com.
 */

// Time between pings in milliseconds (5 minutes)
const PING_INTERVAL = 5 * 60 * 1000; 
let pingInterval: number | null = null;

/**
 * Sends a ping request to the backend
 */
const pingBackend = async () => {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'https://gogain-backend.onrender.com/';
    console.log('Keeping backend alive with ping request');
    
    const response = await fetch(`${apiUrl}ping`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
    
    if (response.ok) {
      console.log('Backend ping successful');
    } else {
      console.warn('Backend ping failed with status:', response.status);
    }
  } catch (error) {
    console.error('Error pinging backend:', error);
  }
};

/**
 * Starts sending periodic ping requests to the backend
 */
export const startKeepAlive = () => {
  if (pingInterval) {
    clearInterval(pingInterval);
  }
  
  // Send an immediate ping
  pingBackend();
  
  // Set up interval for future pings
  pingInterval = window.setInterval(pingBackend, PING_INTERVAL);
  console.log('Keep-alive service started');
  
  return () => {
    if (pingInterval) {
      clearInterval(pingInterval);
      pingInterval = null;
      console.log('Keep-alive service stopped');
    }
  };
};

/**
 * Stops sending ping requests
 */
export const stopKeepAlive = () => {
  if (pingInterval) {
    clearInterval(pingInterval);
    pingInterval = null;
    console.log('Keep-alive service stopped');
  }
}; 