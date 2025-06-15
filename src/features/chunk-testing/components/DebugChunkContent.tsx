import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { TestChunk } from '../utils/chunkStorage';

interface DebugChunkContentProps {
  chunk: TestChunk | null;
}

/**
 * Debug component to display raw chunk content
 */
const DebugChunkContent: React.FC<DebugChunkContentProps> = ({ chunk }) => {
  if (!chunk) {
    return null;
  }

  let parsedContent = null;
  let parseError = null;
  
  try {
    if (chunk.content) {
      parsedContent = JSON.parse(chunk.content);
    }
  } catch (error) {
    parseError = error instanceof Error ? error.message : 'Unknown error';
  }

  return (
    <Paper sx={{ p: 2, mt: 2, bgcolor: '#f5f5f5' }}>
      <Typography variant="h6" gutterBottom>Debug: Chunk Content</Typography>
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2">Has Content: {chunk.content ? 'Yes' : 'No'}</Typography>
        {parseError && (
          <Typography variant="subtitle2" color="error">Parse Error: {parseError}</Typography>
        )}
      </Box>
      
      {parsedContent && (
        <Box>
          <Typography variant="subtitle2">Parsed Content:</Typography>
          <Typography variant="body2">
            Theory: {parsedContent.theory?.length || 0} items
          </Typography>
          <Typography variant="body2">
            Questions: {parsedContent.questions?.length || 0} items
          </Typography>
          <Typography variant="body2">
            Tasks: {parsedContent.tasks?.length || 0} items
          </Typography>
        </Box>
      )}
      
      {chunk.content && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2">Raw Content (first 200 chars):</Typography>
          <Box 
            component="pre" 
            sx={{ 
              p: 1, 
              bgcolor: '#eaeaea', 
              borderRadius: 1, 
              fontSize: '0.75rem',
              maxHeight: '100px',
              overflow: 'auto'
            }}
          >
            {chunk.content.substring(0, 200)}...
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default DebugChunkContent;
