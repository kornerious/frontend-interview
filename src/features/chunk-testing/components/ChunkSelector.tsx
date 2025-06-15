import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import { TestChunk } from '../utils/chunkStorage';

interface ChunkSelectorProps {
  chunks: TestChunk[];
  currentChunkId: string | null;
  onChunkSelect: (chunkId: string) => void;
}

/**
 * Simple dropdown for selecting chunks
 */
const ChunkSelector: React.FC<ChunkSelectorProps> = ({ chunks, currentChunkId, onChunkSelect }) => {
  if (chunks.length === 0) {
    return null;
  }

  const handleChange = (event: SelectChangeEvent) => {
    onChunkSelect(event.target.value);
  };

  return (
    <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
      <InputLabel id="chunk-select-label">Select Chunk</InputLabel>
      <Select
        labelId="chunk-select-label"
        id="chunk-select"
        value={currentChunkId || ''}
        label="Select Chunk"
        onChange={handleChange}
      >
        {chunks.map((chunk) => (
          <MenuItem key={chunk.id} value={chunk.id}>
            Lines {chunk.startLine}-{chunk.endLine} (ID: {chunk.id})
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default ChunkSelector;
