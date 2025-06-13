import React from 'react';
import { Alert } from '@mui/material';

interface ErrorAlertProps {
  error: string | null;
}

/**
 * Component to display error messages
 */
const ErrorAlert: React.FC<ErrorAlertProps> = ({ error }) => {
  if (!error) {
    return null;
  }

  return (
    <Alert 
      severity="error" 
      sx={{ mb: 2 }}
    >
      {error}
    </Alert>
  );
};

export default ErrorAlert;
