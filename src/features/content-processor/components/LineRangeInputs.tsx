import React from 'react';
import { Box, TextField, Typography } from '@mui/material';

interface LineRangeInputsProps {
  startLine: number;
  endLine: number;
  processingDelay: number;
  setStartLine: (value: number) => void;
  setEndLine: (value: number) => void;
  setProcessingDelay: (value: number) => void;
}

/**
 * Component for line range input controls
 */
const LineRangeInputs: React.FC<LineRangeInputsProps> = ({
  startLine,
  endLine,
  processingDelay,
  setStartLine,
  setEndLine,
  setProcessingDelay,
}) => {
  // Calculate number of chunks based on line range (1 chunk per 100 lines)
  const calculatedNumChunks = Math.max(1, Math.ceil((endLine - startLine) / 100));

  return (
    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
      <TextField
        label="Start Line"
        type="number"
        size="small"
        value={startLine}
        onChange={(e) => setStartLine(parseInt(e.target.value) || 0)}
        sx={{ width: 120 }}
      />
      <TextField
        label="End Line"
        type="number"
        size="small"
        value={endLine}
        onChange={(e) => setEndLine(parseInt(e.target.value) || 0)}
        sx={{ width: 120 }}
      />
      <TextField
        label="Delay (s)"
        type="number"
        size="small"
        value={processingDelay}
        onChange={(e) => setProcessingDelay(parseInt(e.target.value) || 0)}
        sx={{ width: 120 }}
      />
      <Typography variant="caption" sx={{ alignSelf: 'center', ml: 1 }}>
        {`Chunks: ${calculatedNumChunks}`}
      </Typography>
    </Box>
  );
};

export default LineRangeInputs;
