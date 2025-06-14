import React, { useState, useEffect } from 'react';
import { 
  Box, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Button, 
  Typography, 
  Paper, 
  CircularProgress,
  Snackbar,
  Alert,
  TextField,
  Divider
} from '@mui/material';
import localLlmService, { LOCAL_LLM_MODELS } from '../api/localLlmService';

interface LocalLlmSelectorProps {
  onModelSelect: (model: string) => void;
  onProcessContent?: (content: string, model: string) => Promise<void>;
  sampleContent?: string;
}

const LocalLlmSelector: React.FC<LocalLlmSelectorProps> = ({ 
  onModelSelect, 
  onProcessContent,
  sampleContent = "# Sample Markdown\n\nThis is a test to see if the local LLM is working correctly."
}) => {
  const [selectedModel, setSelectedModel] = useState<string>(LOCAL_LLM_MODELS.DEEPSEEK_CODER_V2);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [customServerUrl, setCustomServerUrl] = useState<string>('http://localhost:11434');
  // No test content needed anymore

  // Initialize and fetch available models
  useEffect(() => {
    const initService = async () => {
      try {
        setIsLoading(true);
        
        // Initialize with empty config since we don't need API keys for local LLM
        const initialized = await localLlmService.initialize({ apiKey: '' });
        setIsInitialized(initialized);
        
        if (initialized) {
          // Set custom server URL if needed
          localLlmService.setBaseUrl(customServerUrl);
          
          // Fetch available models
          const models = await localLlmService.listModels();
          setAvailableModels(models);
          setSuccess('Local LLM service initialized successfully');
        } else {
          setError('Failed to initialize Local LLM service. Is Ollama running?');
        }
      } catch (err) {
        setError(`Error initializing Local LLM service: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setIsLoading(false);
      }
    };

    initService();
  }, [customServerUrl]);

  // Handle model change
  const handleModelChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const model = event.target.value as string;
    setSelectedModel(model);
    onModelSelect(model);
    localLlmService.setDefaultModel(model);
  };

  // Handle model selection
  const handleModelSelect = () => {
    setSuccess(`Model selected: ${selectedModel}`);
    console.log(`Selected model: ${selectedModel}`);
  };

  // Handle process content button click
  const handleProcessContent = async () => {
    if (onProcessContent) {
      try {
        setIsLoading(true);
        setError(null);
        // Use the sample content or actual content from parent component
        await onProcessContent(sampleContent, selectedModel);
        setSuccess('Content processed successfully');
      } catch (err) {
        setError(`Error processing content: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handle server URL update
  const handleUpdateServerUrl = () => {
    localLlmService.setBaseUrl(customServerUrl);
    setSuccess(`Server URL updated to ${customServerUrl}`);
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Local LLM Configuration
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          label="Ollama Server URL"
          value={customServerUrl}
          onChange={(e) => setCustomServerUrl(e.target.value)}
          margin="normal"
          variant="outlined"
          size="small"
        />
        <Button 
          variant="outlined" 
          onClick={handleUpdateServerUrl}
          disabled={isLoading}
          sx={{ mt: 1 }}
        >
          Update Server URL
        </Button>
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel id="model-select-label">Model</InputLabel>
        <Select
          labelId="model-select-label"
          value={selectedModel}
          onChange={handleModelChange as any}
          label="Model"
          disabled={isLoading || !isInitialized}
        >
          {Object.entries(LOCAL_LLM_MODELS).map(([key, value]) => (
            <MenuItem key={key} value={value}>
              {value} {availableModels.includes(value) ? '✓' : '❌'}
            </MenuItem>
          ))}
          
          {/* Show any additional models found on the server */}
          {availableModels
            .filter(model => !Object.values(LOCAL_LLM_MODELS).includes(model))
            .map(model => (
              <MenuItem key={model} value={model}>
                {model} ✓
              </MenuItem>
            ))
          }
        </Select>
      </FormControl>
      
      <Box sx={{ mb: 2 }}>
        <Button 
          variant="contained" 
          onClick={handleModelSelect}
          disabled={isLoading || !isInitialized}
        >
          Apply Model Selection
        </Button>
      </Box>
      
      <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
        Status: {isInitialized ? 'Initialized' : 'Not Initialized'}
      </Typography>
      
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError(null)}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
      
      <Snackbar 
        open={!!success} 
        autoHideDuration={3000} 
        onClose={() => setSuccess(null)}
      >
        <Alert onClose={() => setSuccess(null)} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default LocalLlmSelector;
