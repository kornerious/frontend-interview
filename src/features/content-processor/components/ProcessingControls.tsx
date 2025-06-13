import React from 'react';
import { Box, Button, CircularProgress, FormControlLabel, Switch } from '@mui/material';

interface ProcessingControlsProps {
  isLoading: boolean;
  progressPercentage: number;
  useLocalLlm: boolean;
  setUseLocalLlm: (value: boolean) => void;
  localLlmInitialized: boolean;
  selectedModel: string;
  currentChunkCompleted: boolean;
  handleProcessNextChunk: () => void;
  handleMarkCompleted: () => void;
}

/**
 * Component for content processing controls
 */
const ProcessingControls: React.FC<ProcessingControlsProps> = ({
  isLoading,
  progressPercentage,
  useLocalLlm,
  setUseLocalLlm,
  localLlmInitialized,
  selectedModel,
  currentChunkCompleted,
  handleProcessNextChunk,
  handleMarkCompleted,
}) => {
  return (
    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
      {/* Mark completed button */}
      <Button
        variant="contained"
        color="primary"
        onClick={handleMarkCompleted}
        disabled={isLoading || currentChunkCompleted}
      >
        {isLoading ? (
          <>
            <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
            Processing...
          </>
        ) : (
          "I'm Done - Process Next Chunk"
        )}
      </Button>
      
      {/* Skip button */}
      <Button
        variant="outlined"
        onClick={handleProcessNextChunk}
        disabled={isLoading || progressPercentage >= 100}
      >
        Skip & Process Next Chunk
      </Button>
      
      {/* LLM toggle */}
      <FormControlLabel
        control={
          <Switch
            checked={useLocalLlm}
            onChange={(e) => setUseLocalLlm(e.target.checked)}
            color="primary"
          />
        }
        label={`Use Local LLM ${useLocalLlm && localLlmInitialized ? `(${selectedModel})` : ''}`}
      />
    </Box>
  );
};

export default ProcessingControls;
