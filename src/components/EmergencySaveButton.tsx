import React, { useState } from 'react';
import { Button, CircularProgress, Snackbar, Alert } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { useProgressStore } from '@/features/progress/useProgressStoreFirebase';
import { saveProgram } from '@/utils/emergencySave';

/**
 * Emergency Save Button Component
 * 
 * This component provides a direct save button that bypasses all optimizations
 * and directly saves the current program to GitHub Gist with retries.
 * It's useful as a safety feature if the user feels their progress isn't being saved.
 */
const EmergencySaveButton: React.FC = () => {
  const { currentProgram } = useProgressStore();
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  
  const handleEmergencySave = async () => {
    if (!currentProgram) {
      setShowError(true);
      return;
    }
    
    setLoading(true);
    try {
      // Use the emergency save functionality to directly save the program
      const success = await saveProgram(currentProgram);
      
      if (success) {
        setShowSuccess(true);
      } else {
        setShowError(true);
      }
    } catch (error) {
      console.error('Error during emergency save:', error);
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCloseSuccess = () => {
    setShowSuccess(false);
  };
  
  const handleCloseError = () => {
    setShowError(false);
  };
  
  return (
    <>
      <Button
        variant="outlined"
        color="error"
        startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
        onClick={handleEmergencySave}
        disabled={loading || !currentProgram}
        sx={{ ml: 1 }}
      >
        Emergency Save
      </Button>
      
      <Snackbar
        open={showSuccess}
        autoHideDuration={4000}
        onClose={handleCloseSuccess}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSuccess} severity="success">
          Program saved successfully!
        </Alert>
      </Snackbar>
      
      <Snackbar
        open={showError}
        autoHideDuration={4000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseError} severity="error">
          {!currentProgram ? 
            'No active program to save.' : 
            'Failed to save program. Please try again.'}
        </Alert>
      </Snackbar>
    </>
  );
};

export default EmergencySaveButton;
