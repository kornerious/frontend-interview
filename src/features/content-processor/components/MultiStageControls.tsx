import React from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { ProcessingStage } from '../api/multiStageProcessor';

interface MultiStageControlsProps {
  currentStage: ProcessingStage;
  isLoading: boolean;
  enhanceTheory: (chunkId: string, options?: any) => void;
  generateQuestions: (chunkId: string, options?: any) => void;
  generateTasks: (chunkId: string, options?: any) => void;
  setProcessingStage: (stage: ProcessingStage) => void;
  setRewriteDialogOpen: (open: boolean) => void;
  currentChunkId: string;
  useLocalLlm: boolean;
  selectedModel: string;
}

/**
 * Controls for multi-stage content processing
 */
const MultiStageControls: React.FC<MultiStageControlsProps> = ({
  currentStage,
  isLoading,
  enhanceTheory,
  generateQuestions,
  generateTasks,
  setProcessingStage,
  setRewriteDialogOpen,
  currentChunkId,
  useLocalLlm,
  selectedModel
}) => {
  return (
    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Typography variant="subtitle2">Multi-Stage Processing:</Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button 
          variant={currentStage === 'theory-enhancement' ? 'contained' : 'outlined'}
          size="small"
          color="primary"
          onClick={() => {
            setProcessingStage('theory-enhancement');
            enhanceTheory(currentChunkId, {
              useLocalLlm,
              localLlmModel: selectedModel
            });
          }}
          disabled={isLoading}
        >
          Enhance Theory
        </Button>
        
        <Button 
          variant={currentStage === 'question-generation' ? 'contained' : 'outlined'}
          size="small"
          color="primary"
          onClick={() => {
            setProcessingStage('question-generation');
            generateQuestions(currentChunkId, {
              useLocalLlm,
              localLlmModel: selectedModel
            });
          }}
          disabled={isLoading}
        >
          Generate Questions
        </Button>
        
        <Button 
          variant={currentStage === 'task-generation' ? 'contained' : 'outlined'}
          size="small"
          color="primary"
          onClick={() => {
            setProcessingStage('task-generation');
            generateTasks(currentChunkId, {
              useLocalLlm,
              localLlmModel: selectedModel
            });
          }}
          disabled={isLoading}
        >
          Generate Tasks
        </Button>
        
        <Button 
          variant={currentStage === 'chunk-rewrite' ? 'contained' : 'outlined'}
          size="small"
          color="secondary"
          onClick={() => {
            setProcessingStage('chunk-rewrite');
            setRewriteDialogOpen(true);
          }}
          disabled={isLoading}
        >
          Rewrite Chunk
        </Button>
      </Box>
      
      {/* Show current processing stage */}
      {isLoading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
          <CircularProgress size={16} />
          <Typography variant="body2" color="text.secondary">
            Processing with {currentStage.replace('-', ' ')}...
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default MultiStageControls;
