import React, { useState } from 'react';
import { Box, Button, CircularProgress, TextField, Typography } from '@mui/material';
import { ChunkProcessor } from '../utils/chunkProcessor';
import { useContentProcessorStore } from '../store/useContentProcessorStore';
import { ContentProcessorStorage } from '../utils/storageService';

interface LineRangeProcessorProps {
  useLocalLlm: boolean;
  localLlmInitialized: boolean;
  selectedModel: string;
}

/**
 * Component for processing specific line ranges in chunks
 */
const LineRangeProcessor: React.FC<LineRangeProcessorProps> = ({
  useLocalLlm,
  localLlmInitialized,
  selectedModel,
}) => {
  // Line range state
  const [startLine, setStartLine] = useState(0);
  const [endLine, setEndLine] = useState(1000);
  const [numChunks, setNumChunks] = useState(10);
  const [processingDelay, setProcessingDelay] = useState(1);
  const [isProcessingRange, setIsProcessingRange] = useState(false);
  
  // Process a specific line range with AI-determined logical blocks
  const processLineRange = async () => {
    try {
      // Validate inputs
      if (startLine < 0 || endLine <= startLine || numChunks <= 0 || processingDelay < 0) {
        alert('Please enter valid line range, number of chunks, and delay');
        return;
      }
      
      setIsProcessingRange(true);
      console.log(`Processing lines ${startLine}-${endLine} with AI-determined logical blocks, up to ${numChunks} chunks with ${processingDelay}s delay...`);
      
      // Use the ChunkProcessor utility to process the line range
      const options = {
        processingDelay,
        useLocalLlm: useLocalLlm && localLlmInitialized,
        localLlmModel: useLocalLlm && localLlmInitialized ? selectedModel : undefined
      };
      
      // Process the line range and get all processed chunks
      const processedChunks = await ChunkProcessor.processLineRange(startLine, endLine, numChunks, options);
      console.log(`Processed ${processedChunks.length} chunks from line range ${startLine}-${endLine}`);
      
      // Get all processed chunks after processing
      const allProcessedChunks = await ContentProcessorStorage.getAllProcessedChunks();
      console.log(`Found ${allProcessedChunks.length} total processed chunks`);
      
      // Force update the UI with all processed chunks
      useContentProcessorStore.setState({ allChunks: allProcessedChunks });
      
      // Set the current chunk to the first one so user can see results
      if (processedChunks.length > 0) {
        // Get the first chunk ID and set it as current
        const firstChunkId = processedChunks[0].id;
        useContentProcessorStore.getState().setCurrentChunk(firstChunkId);
      }
      
      setIsProcessingRange(false);
      console.log(`Line range processing complete. Processed ${processedChunks.length} chunks from line ${startLine} to ${endLine}.`);
    } catch (err) {
      console.error('Error processing line range:', err);
      setIsProcessingRange(false);
      alert(`Error processing line range: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <Box sx={{ width: '100%', mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
      <Typography variant="subtitle1" gutterBottom>
        Process Line Range in Chunks
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <TextField
          label="Start Line"
          type="number"
          value={startLine}
          onChange={(e) => setStartLine(parseInt(e.target.value) || 0)}
          InputProps={{ inputProps: { min: 0 } }}
          size="small"
          sx={{ width: 120, mr: 2 }}
        />
        <TextField
          label="End Line"
          type="number"
          value={endLine}
          onChange={(e) => setEndLine(parseInt(e.target.value) || 0)}
          InputProps={{ inputProps: { min: 0 } }}
          size="small"
          sx={{ width: 120, mr: 2 }}
        />
        <TextField
          label="Number of Chunks"
          type="number"
          value={numChunks}
          onChange={(e) => setNumChunks(parseInt(e.target.value) || 1)}
          InputProps={{ inputProps: { min: 1 } }}
          size="small"
          sx={{ width: 120, mr: 2 }}
        />
        <TextField
          label="Delay (seconds)"
          type="number"
          value={processingDelay}
          onChange={(e) => setProcessingDelay(parseInt(e.target.value) || 0)}
          InputProps={{ inputProps: { min: 0 } }}
          size="small"
          sx={{ width: 120, mr: 2 }}
        />
        <Button
          variant="contained"
          color="secondary"
          onClick={processLineRange}
          disabled={isProcessingRange}
          sx={{ ml: 2 }}
        >
          {isProcessingRange ? (
            <>
              <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
              Processing Line Range...
            </>
          ) : (
            "Process Line Range"
          )}
        </Button>
      </Box>
      <Typography variant="caption" color="text.secondary">
        This will process the specified line range divided into the specified number of chunks with configurable delay between chunks.
      </Typography>
    </Box>
  );
};

export default LineRangeProcessor;
