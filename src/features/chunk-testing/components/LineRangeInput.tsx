import React, { useState } from 'react';
import { TextField, Button, Box, Typography } from '@mui/material';

interface LineRangeInputProps {
  onProcess: (startLine: number, endLine: number) => void;
  isProcessing: boolean;
}

/**
 * Component for inputting line ranges
 */
const LineRangeInput: React.FC<LineRangeInputProps> = ({ onProcess, isProcessing }) => {
  const [startLine, setStartLine] = useState<number>(1);
  const [endLine, setEndLine] = useState<number>(100);
  const [error, setError] = useState<string | null>(null);

  const handleStartLineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setStartLine(isNaN(value) ? 1 : value);
    validateRange(value, endLine);
  };

  const handleEndLineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setEndLine(isNaN(value) ? 100 : value);
    validateRange(startLine, value);
  };

  const validateRange = (start: number, end: number) => {
    if (start >= end) {
      setError('Start line must be less than end line');
    } else if (end - start > 500) {
      setError('Range too large (max 500 lines)');
    } else {
      setError(null);
    }
  };

  const handleProcess = () => {
    if (!error && startLine < endLine) {
      onProcess(startLine, endLine);
    }
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Line Range</Typography>
      
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          label="Start Line"
          type="number"
          value={startLine}
          onChange={handleStartLineChange}
          disabled={isProcessing}
          fullWidth
        />
        <TextField
          label="End Line"
          type="number"
          value={endLine}
          onChange={handleEndLineChange}
          disabled={isProcessing}
          fullWidth
        />
      </Box>
      
      {error && (
        <Typography color="error" variant="body2" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      
      <Button
        variant="contained"
        color="primary"
        onClick={handleProcess}
        disabled={!!error || isProcessing}
        fullWidth
      >
        {isProcessing ? 'Processing...' : 'Process with Gemini'}
      </Button>
    </Box>
  );
};

export default LineRangeInput;
