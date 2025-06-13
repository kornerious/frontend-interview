import React from 'react';
import {
  Box, Typography, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent
} from '@mui/material';

interface ChunkSelectorProps {
  allChunks: Array<{
    id: string;
    startLine: number;
    endLine: number;
    completed: boolean;
  }>;
  currentChunkId: string | null | undefined;
  handleChunkChange: (event: SelectChangeEvent<string>) => void;
}

/**
 * Component for selecting a specific content chunk
 */
const ChunkSelector: React.FC<ChunkSelectorProps> = ({
  allChunks,
  currentChunkId,
  handleChunkChange
}) => {
  if (allChunks.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="subtitle1" gutterBottom>
        Processed Chunks
      </Typography>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel id="chunk-select-label">Select Chunk</InputLabel>
        <Select
          labelId="chunk-select-label"
          id="chunk-select"
          value={currentChunkId || ''}
          label="Select Chunk"
          onChange={handleChunkChange}
        >
          {allChunks.map(chunk => (
            <MenuItem key={chunk.id} value={chunk.id}>
              Lines {chunk.startLine}-{chunk.endLine} {chunk.completed ? '(Completed)' : ''}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default ChunkSelector;
