import React from 'react';
import { Box, LinearProgress, Typography } from '@mui/material';

interface ProcessingProgressProps {
  currentPosition: number;
  totalLines: number;
}

/**
 * Component to display processing progress
 */
const ProcessingProgress: React.FC<ProcessingProgressProps> = ({ 
  currentPosition, 
  totalLines 
}) => {
  // Calculate progress percentage
  const progressPercentage = totalLines > 0 
    ? Math.min(Math.round((currentPosition / totalLines) * 100), 100)
    : 0;

  return (
    <Box sx={{ width: '100%', mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Processed {currentPosition.toLocaleString()} of {totalLines.toLocaleString()} lines
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {progressPercentage}%
        </Typography>
      </Box>
      <LinearProgress 
        variant="determinate" 
        value={progressPercentage} 
        sx={{ height: 10, borderRadius: 1 }}
      />
    </Box>
  );
};

export default ProcessingProgress;
