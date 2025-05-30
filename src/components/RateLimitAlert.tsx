import React, { useState, useEffect } from 'react';
import { Alert, Snackbar, Button } from '@mui/material';

// Define a callback type for subscribers
type RateLimitCallback = (state: { isRateLimited: boolean; resetTime: number | null; message: string }) => void;

// Global rate limit state that can be accessed from anywhere
interface RateLimitState {
  isRateLimited: boolean;
  resetTime: number | null;
  message: string;
  setRateLimited: (options: { 
    isRateLimited: boolean; 
    resetTime?: number | null; 
    message?: string; 
  }) => void;
  subscribers: RateLimitCallback[];
  subscribe: (callback: RateLimitCallback) => () => void;
}

// Create the global state object
const createRateLimitState = (): RateLimitState => {
  // Initialize with private properties
  const state: RateLimitState = {
    isRateLimited: false,
    resetTime: null,
    message: '',
    subscribers: [],
    setRateLimited: function({ isRateLimited, resetTime, message }) {
      this.isRateLimited = isRateLimited;
      if (resetTime !== undefined) this.resetTime = resetTime;
      if (message) this.message = message;
      
      // Notify all subscribers
      this.subscribers.forEach(callback => callback({
        isRateLimited, 
        resetTime: this.resetTime, 
        message: this.message
      }));
    },
    subscribe: function(callback: RateLimitCallback) {
      this.subscribers.push(callback);
      return () => {
        this.subscribers = this.subscribers.filter(cb => cb !== callback);
      };
    }
  };
  
  return state;
};

// Export the singleton instance
export const rateLimitState = createRateLimitState();

/**
 * Detect rate limit errors from GitHub API responses
 */
export function detectRateLimit(error: any): boolean {
  if (error?.message?.includes('API rate limit exceeded')) {
    // Extract reset time if available
    let resetTime = null;
    if (error.response?.headers?.['x-ratelimit-reset']) {
      resetTime = parseInt(error.response.headers['x-ratelimit-reset']) * 1000;
    }
    
    // Get readable time until reset
    let timeMessage = '';
    if (resetTime) {
      const resetDate = new Date(resetTime);
      const minutes = Math.round((resetTime - Date.now()) / 1000 / 60);
      if (minutes > 0) {
        timeMessage = ` Rate limits will reset in approximately ${minutes} minutes (${resetDate.toLocaleTimeString()}).`;
      } else {
        timeMessage = ` Rate limits will reset soon (${resetDate.toLocaleTimeString()}).`;
      }
    }
    
    // Set global rate limit state
    rateLimitState.setRateLimited({
      isRateLimited: true, 
      resetTime,
      message: `GitHub API rate limit exceeded.${timeMessage} Some features may be unavailable until then.`
    });
    
    // Auto-reset after rate limit expiration
    if (resetTime) {
      const now = Date.now();
      const timeUntilReset = Math.max(0, resetTime - now);
      setTimeout(() => {
        rateLimitState.setRateLimited({ isRateLimited: false });
      }, timeUntilReset + 5000); // Add 5 seconds buffer
    } else {
      // If no reset time available, use a default timeout
      setTimeout(() => {
        rateLimitState.setRateLimited({ isRateLimited: false });
      }, 60000); // Default to 1 minute
    }
    
    return true;
  }
  return false;
}

/**
 * Component that displays a rate limit alert when triggered
 */
const RateLimitAlert: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [resetTime, setResetTime] = useState<number | null>(null);
  
  useEffect(() => {
    // Subscribe to rate limit state changes
    const unsubscribe = rateLimitState.subscribe((state) => {
      setOpen(state.isRateLimited);
      setMessage(state.message);
      setResetTime(state.resetTime);
    });
    
    // Initialize from current state
    setOpen(rateLimitState.isRateLimited);
    setMessage(rateLimitState.message);
    setResetTime(rateLimitState.resetTime);
    
    // Cleanup subscription
    return unsubscribe;
  }, []);
  
  // Format remaining time
  const getTimeRemaining = () => {
    if (!resetTime) return '';
    
    const now = Date.now();
    const remainingMs = Math.max(0, resetTime - now);
    const minutes = Math.floor(remainingMs / 1000 / 60);
    const seconds = Math.floor((remainingMs / 1000) % 60);
    
    return `${minutes}m ${seconds}s`;
  };
  
  return (
    <Snackbar
      open={open}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      key="top-center"
    >
      <Alert 
        severity="error" 
        variant="filled"
        action={
          resetTime && (
            <Button color="inherit" size="small">
              Reset in {getTimeRemaining()}
            </Button>
          )
        }
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default RateLimitAlert;
