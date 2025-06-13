import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import LocalLlmSelector from './LocalLlmSelector';
import { SelectChangeEvent } from '@mui/material';

interface ModelSelectorProps {
  useLocalLlm: boolean;
  localLlmInitialized: boolean;
  selectedModel: string;
  handleToggleLocalLlm: () => void;
  handleModelChange: (event: SelectChangeEvent<string>) => void;
  isLoading: boolean;
}

/**
 * Component for selecting and initializing local LLM models
 */
const ModelSelector: React.FC<ModelSelectorProps> = ({
  useLocalLlm,
  localLlmInitialized,
  selectedModel,
  handleToggleLocalLlm,
  handleModelChange,
  isLoading
}) => {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle1" gutterBottom>
        AI Model Selection
      </Typography>
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Button
          variant={useLocalLlm ? 'contained' : 'outlined'}
          color={useLocalLlm ? 'primary' : 'inherit'}
          size="small"
          onClick={handleToggleLocalLlm}
          disabled={isLoading}
        >
          {useLocalLlm ? 'Using Local LLM' : 'Use Cloud AI'}
        </Button>
        
        {useLocalLlm && (
          <Typography variant="body2" color={localLlmInitialized ? 'success.main' : 'error.main'}>
            {localLlmInitialized ? 'Local LLM Ready' : 'Local LLM Not Initialized'}
          </Typography>
        )}
      </Box>
      
      {/* Local LLM selector */}
      {useLocalLlm && (
        <LocalLlmSelector 
          onModelSelect={(model: string) => {
            // Create a mock SelectChangeEvent to satisfy the type requirements
            const mockEvent = {
              target: { value: model },
            } as SelectChangeEvent<string>;
            handleModelChange(mockEvent);
          }}
        />
      )}
    </Box>
  );
};

export default ModelSelector;
