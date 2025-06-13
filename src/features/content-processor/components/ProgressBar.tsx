import React from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';

interface ProgressBarProps {
  progressPercentage: number;
  completedChunks: number;
  totalChunks: number;
}

/**
 * Component to display processing progress
 */
const ProgressBar: React.FC<ProgressBarProps> = ({
  progressPercentage,
  completedChunks,
  totalChunks
}) => {
  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Processing Progress
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {Math.round(progressPercentage)}% ({completedChunks}/{totalChunks} chunks)
        </Typography>
      </Box>
      <LinearProgress 
        variant="determinate" 
        value={progressPercentage} 
        sx={{ height: 8, borderRadius: 1 }}
      />
    </Box>
  );
};

export default ProgressBar;
