import React from 'react';
import { Box, Typography, Paper, Divider } from '@mui/material';
import { TestChunk } from '../utils/chunkStorage';

interface ChunkViewerProps {
  chunk: TestChunk | null;
}

/**
 * Component for viewing chunk content
 */
const ChunkViewer: React.FC<ChunkViewerProps> = ({ chunk }) => {
  if (!chunk) {
    return (
      <Paper >
        <Typography variant="body1">No chunk selected</Typography>
      </Paper>
    );
  }

  return (
    <Paper >
      <Typography variant="h6" gutterBottom>
        Chunk: Lines {chunk.startLine}-{chunk.endLine}
      </Typography>
      
      <Box sx={{ mb: 1 }}>
        <Typography variant="subtitle2" color="text.secondary">
          ID: {chunk.id}
        </Typography>
        <Typography variant="subtitle2" color="text.secondary">
          Processed: {new Date(chunk.processedDate).toLocaleString()}
        </Typography>
        <Typography variant="subtitle2" color="text.secondary">
          Status: {chunk.completed ? 'Completed' : 'Processing'}
        </Typography>
      </Box>
    </Paper>
  );
};

export default ChunkViewer;
