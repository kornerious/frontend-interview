import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Paper, Alert, AlertTitle, CircularProgress, Divider, Stepper, Step, StepLabel } from '@mui/material';
import { migrateFromGistToFirebase, validateMigration } from '@/utils/migrationUtility';
import { useSettingsStore } from '@/features/progress/useSettingsStore';

const MigrateToFirebasePage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<any | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [tokenFromEnv, setTokenFromEnv] = useState<string | null>(null);
  
  const settings = useSettingsStore(state => state.settings);
  const _initializeFromDatabase = useSettingsStore(state => state._initializeFromDatabase);
  
  // Use either the token from settings or directly from env var
  const hasGithubToken = !!settings.githubGistToken || !!tokenFromEnv;
  
  // Initialize settings and check for token in environment
  useEffect(() => {
    // Initialize the settings store
    _initializeFromDatabase();
    
    // Also directly check environment variables
    if (process.env.NEXT_PUBLIC_GITHUB_GIST_TOKEN) {
      setTokenFromEnv(process.env.NEXT_PUBLIC_GITHUB_GIST_TOKEN);
      console.log('GitHub Gist token found in environment variables');
    } else {
      console.log('No GitHub Gist token found in environment variables');
    }
  }, []);
  
  const steps = ['Check prerequisites', 'Migrate data', 'Validate migration'];
  
  // Initialize Firebase environment variables
  const hasFirebaseConfig = !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  
  const handleMigration = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setErrorDetails(null);
      setSuccess(null);
      setActiveStep(1);
      
      const result = await migrateFromGistToFirebase();
      
      if (result.success) {
        setSuccess(result.message);
        setActiveStep(2);
      } else {
        setError(result.message);
        setErrorDetails(result.details || null);
        setActiveStep(0);
      }
    } catch (err: any) {
      setError(`Migration failed: ${err.message}`);
      setActiveStep(0);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleValidation = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await validateMigration();
      setValidationResult(result);
      
      if (result.success) {
        setSuccess('Validation successful! Your data has been successfully migrated to Firebase.');
      } else {
        setError('Validation failed. Some data might not have been migrated correctly.');
      }
    } catch (err: any) {
      setError(`Validation failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Migrate to Firebase
      </Typography>
      
      {/* Firebase authentication notice */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <AlertTitle>Important Setup Step</AlertTitle>
        <Typography paragraph>
          Before migrating, you must enable <strong>Anonymous Authentication</strong> in your Firebase project:
        </Typography>
        <ol>
          <li>Go to the <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" style={{ fontWeight: 'bold' }}>Firebase Console</a></li>
          <li>Select your project: <strong>{process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}</strong></li>
          <li>Navigate to <strong>Authentication</strong> in the left sidebar</li>
          <li>Click on the <strong>Sign-in method</strong> tab</li>
          <li>Enable the <strong>Anonymous</strong> provider</li>
        </ol>
      </Alert>
      
      <Typography variant="body1" paragraph>
        This tool will migrate your data from GitHub Gists to Firebase for better performance and reliability.
        Firebase provides a more robust database solution capable of handling thousands of answers and information.
      </Typography>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Migration Process
        </Typography>
        
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Prerequisites:
          </Typography>
          
          <Box sx={{ ml: 2 }}>
            <Typography>
              GitHub Gist Token: {hasGithubToken ? 
                <span style={{ color: 'green' }}>✓ Available</span> : 
                <span style={{ color: 'red' }}>✗ Missing</span>
              }
            </Typography>
            
            <Typography>
              Firebase Configuration: {hasFirebaseConfig ? 
                <span style={{ color: 'green' }}>✓ Available</span> : 
                <span style={{ color: 'red' }}>✗ Missing</span>
              }
            </Typography>
          </Box>
          
          {!hasGithubToken && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              You need to add your GitHub Gist token in the settings to migrate your data.
            </Alert>
          )}
          
          {!hasFirebaseConfig && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Firebase configuration is missing. Please make sure you have added the required environment variables.
            </Alert>
          )}
        </Box>
        
        <Divider sx={{ my: 3 }} />
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <AlertTitle>Error</AlertTitle>
            <Typography paragraph>{error}</Typography>
            {errorDetails && (
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                <strong>Details:</strong> {errorDetails}
              </Typography>
            )}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleMigration}
            disabled={isLoading || !hasGithubToken || !hasFirebaseConfig}
          >
            {isLoading && activeStep === 1 ? <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} /> : null}
            Start Migration
          </Button>
          
          <Button 
            variant="outlined" 
            onClick={handleValidation}
            disabled={isLoading || !hasGithubToken || !hasFirebaseConfig || activeStep < 2}
          >
            {isLoading && activeStep === 2 ? <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} /> : null}
            Validate Migration
          </Button>
        </Box>
      </Paper>
      
      {validationResult && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Validation Results
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2">GitHub Gists Data:</Typography>
            <Typography>Programs: {validationResult.details.gist.programs}</Typography>
            <Typography>Progress Records: {validationResult.details.gist.progress}</Typography>
            <Typography>User Answers: {validationResult.details.gist.answers}</Typography>
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2">Firebase Data:</Typography>
            <Typography>Programs: {validationResult.details.firebase.programs}</Typography>
            <Typography>Progress Records: {validationResult.details.firebase.progress}</Typography>
            <Typography>User Answers: {validationResult.details.firebase.answers}</Typography>
          </Box>
          
          <Alert severity={validationResult.success ? "success" : "warning"}>
            {validationResult.message}
          </Alert>
          
          {!validationResult.success && (
            <Button 
              variant="contained" 
              color="secondary" 
              sx={{ mt: 2 }}
              onClick={handleMigration}
            >
              Retry Migration
            </Button>
          )}
          
          {validationResult.success && (
            <Typography sx={{ mt: 2 }}>
              You can now safely switch to using Firebase by updating your app configuration.
            </Typography>
          )}
        </Paper>
      )}
      
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Next Steps After Migration
        </Typography>
        
        <Typography paragraph>
          After successful migration and validation, you should:
        </Typography>
        
        <ol>
          <li>
            <Typography>
              Update your main app to use the Firebase store instead of the Gist store.
            </Typography>
          </li>
          <li>
            <Typography>
              Test your application thoroughly to ensure all data is accessible.
            </Typography>
          </li>
          <li>
            <Typography>
              Once satisfied, you can disable the GitHub Gists integration.
            </Typography>
          </li>
        </ol>
      </Box>
    </Box>
  );
};

export default MigrateToFirebasePage;
