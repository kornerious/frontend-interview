import React from 'react';
import { Box, Button, CircularProgress } from '@mui/material';

interface ProcessingButtonsProps {
  isProcessingRange: boolean;
  isSequentialProcessing: boolean;
  isCompleteProcessing: boolean;
  isProcessingWithGemini: boolean;
  onProcessLineRange: () => void;
  onProcessAllSequentially: () => void;
  onCompleteProcessing: () => void;
  onProcessWithGemini: () => void;
}

/**
 * Component for processing action buttons
 */
const ProcessingButtons: React.FC<ProcessingButtonsProps> = ({
  isProcessingRange,
  isSequentialProcessing,
  isCompleteProcessing,
  isProcessingWithGemini,
  onProcessLineRange,
  onProcessAllSequentially,
  onCompleteProcessing,
  onProcessWithGemini,
}) => {
  return (
    <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
      <Button
        variant="contained"
        onClick={onProcessLineRange}
        disabled={isProcessingRange || isSequentialProcessing || isCompleteProcessing || isProcessingWithGemini}
        startIcon={isProcessingRange ? <CircularProgress size={20} /> : null}
      >
        {isProcessingRange ? 'Processing...' : 'Process Line Range'}
      </Button>
      
      <Button
        variant="contained"
        color="info"
        onClick={onProcessWithGemini}
        disabled={isProcessingRange || isSequentialProcessing || isCompleteProcessing || isProcessingWithGemini}
        startIcon={isProcessingWithGemini ? <CircularProgress size={20} /> : null}
        sx={{ bgcolor: '#2196f3', '&:hover': { bgcolor: '#1976d2' } }}
      >
        {isProcessingWithGemini ? 'Processing with Gemini...' : 'Process Line Range with Gemini'}
      </Button>
      
      <Button
        variant="contained"
        color="secondary"
        onClick={onProcessAllSequentially}
        disabled={isProcessingRange || isSequentialProcessing || isCompleteProcessing || isProcessingWithGemini}
        startIcon={isSequentialProcessing ? <CircularProgress size={20} /> : null}
      >
        {isSequentialProcessing ? 'Processing Sequentially...' : 'Process All Stages Sequentially'}
      </Button>

      <Button
        variant="contained"
        color="primary"
        onClick={onCompleteProcessing}
        disabled={isProcessingRange || isSequentialProcessing || isCompleteProcessing || isProcessingWithGemini}
        startIcon={isCompleteProcessing ? <CircularProgress size={20} /> : null}
        sx={{ bgcolor: 'success.main', '&:hover': { bgcolor: 'success.dark' } }}
      >
        {isCompleteProcessing ? 'Complete Processing...' : 'Complete End-to-End Processing'}
      </Button>
    </Box>
  );
};

export default ProcessingButtons;
