import React, { useState } from 'react';
import { 
  Box, Button, CircularProgress, TextField, Typography, 
  FormControl, InputLabel, Select, MenuItem, SelectChangeEvent,
  Checkbox, FormControlLabel, FormGroup, Chip
} from '@mui/material';
import { ChunkProcessor } from '../utils/chunkProcessor';
import { useContentProcessorStore } from '../store/useContentProcessorStore';
import { ContentProcessorStorage } from '../utils/storageService';
import { ProcessingStage, MultiStageProcessingOptions } from '../api/multiStageProcessor';

interface LineRangeProcessorProps {
  useLocalLlm: boolean;
  localLlmInitialized: boolean;
  selectedModel: string;
}

type QuestionType = 'mcq' | 'code' | 'open' | 'flashcard';
type DifficultyLevel = 'easy' | 'medium' | 'hard';
type FocusArea = 'theory' | 'questions' | 'tasks';

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
  
  // Multi-stage processing state
  const [processingStage, setProcessingStage] = useState<ProcessingStage>('theory-extraction');
  const [selectedChunkId, setSelectedChunkId] = useState<string>('');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [focusArea, setFocusArea] = useState<FocusArea>('theory');
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>(['mcq', 'code', 'open', 'flashcard']);
  const [enhanceExamples, setEnhanceExamples] = useState<boolean>(true);
  const [simplifyContent, setSimplifyContent] = useState<boolean>(false);
  
  // Get store actions for multi-stage processing
  const { processLineRange: storeProcessLineRange, enhanceTheory, generateQuestions, generateTasks, rewriteChunk, setProcessingStage: setStoreProcessingStage } = useContentProcessorStore();
  
  // Handle processing stage change
  const handleProcessingStageChange = (event: SelectChangeEvent<string>) => {
    setProcessingStage(event.target.value as ProcessingStage);
  };
  
  // Handle chunk selection change
  const handleChunkChange = (event: SelectChangeEvent<string>) => {
    setSelectedChunkId(event.target.value);
  };
  
  // Handle difficulty change
  const handleDifficultyChange = (event: SelectChangeEvent<string>) => {
    setDifficulty(event.target.value as DifficultyLevel);
  };
  
  // Handle focus area change
  const handleFocusAreaChange = (event: SelectChangeEvent<string>) => {
    setFocusArea(event.target.value as FocusArea);
  };
  
  // Handle question type toggle
  const handleQuestionTypeToggle = (type: QuestionType) => {
    setQuestionTypes(prev => {
      if (prev.includes(type)) {
        return prev.filter(t => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };
  
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
      
      // Use the store action to process the line range
      const options: MultiStageProcessingOptions = {
        processingDelay,
        maxChunks: numChunks,
        useLocalLlm: useLocalLlm && localLlmInitialized,
        localLlmModel: useLocalLlm && localLlmInitialized ? selectedModel : undefined,
        stage: 'theory-extraction'
      };
      
      // Process the line range and get all processed chunks
      await storeProcessLineRange(startLine, endLine, numChunks, options);
      
      // Get all processed chunks after processing
      const allProcessedChunks = await ContentProcessorStorage.getAllProcessedChunks();
      console.log(`Found ${allProcessedChunks.length} total processed chunks`);
      
      // Force update the UI with all processed chunks
      useContentProcessorStore.setState({ allChunks: allProcessedChunks });
      
      // Set the current chunk to the first one so user can see results
      if (allProcessedChunks.length > 0) {
        // Get the first chunk ID and set it as current
        useContentProcessorStore.setState({ currentChunk: allProcessedChunks[0] });
        setSelectedChunkId(allProcessedChunks[0].id);
      }
    } catch (error) {
      console.error('Error processing line range:', error);
      alert(`Error processing line range: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsProcessingRange(false);
    }
  };
  
  // Process a chunk with the selected stage
  const processChunkWithStage = async () => {
    if (!selectedChunkId) {
      alert('Please select a chunk to process');
      return;
    }
    
    try {
      setIsProcessingRange(true);
      
      const options: MultiStageProcessingOptions = {
        useLocalLlm: useLocalLlm && localLlmInitialized,
        localLlmModel: useLocalLlm && localLlmInitialized ? selectedModel : undefined,
        rewriteOptions: {
          difficulty,
          focus: focusArea,
          questionTypes,
          enhanceExamples,
          simplifyContent
        }
      };
      
      console.log(`Processing chunk ${selectedChunkId} with stage: ${processingStage}`);
      
      // Call the appropriate function based on the selected stage
      switch (processingStage) {
        case 'theory-enhancement':
          await enhanceTheory(selectedChunkId, options);
          break;
        case 'question-generation':
          await generateQuestions(selectedChunkId, options);
          break;
        case 'task-generation':
          await generateTasks(selectedChunkId, options);
          break;
        case 'chunk-rewrite':
          await rewriteChunk(selectedChunkId, options);
          break;
        default:
          alert(`Unsupported processing stage: ${processingStage}`);
          return;
      }
      
      // Get all processed chunks after processing
      const allProcessedChunks = await ContentProcessorStorage.getAllProcessedChunks();
      
      // Force update the UI with all processed chunks
      useContentProcessorStore.setState({ allChunks: allProcessedChunks });
      
      // Find and set the current chunk to the one we just processed
      const processedChunk = allProcessedChunks.find(chunk => chunk.id === selectedChunkId);
      if (processedChunk) {
        useContentProcessorStore.setState({ currentChunk: processedChunk });
      }
      
      alert(`Successfully processed chunk with ${processingStage}`);
    } catch (error) {
      console.error(`Error processing chunk with ${processingStage}:`, error);
      alert(`Error processing chunk: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsProcessingRange(false);
    }
  };

  // Get all chunks for selection
  const { allChunks } = useContentProcessorStore();

  return (
    <Box sx={{ mb: 4, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
      <Typography variant="h6" gutterBottom>
        Multi-Stage Content Processing
      </Typography>
      
      {/* Initial content processing section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle1" gutterBottom>
          1. Initial Content Processing
        </Typography>
        
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
            label="Num Chunks"
            type="number"
            size="small"
            value={numChunks}
            onChange={(e) => setNumChunks(parseInt(e.target.value) || 1)}
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
        </Box>
        
        <Button
          variant="contained"
          onClick={processLineRange}
          disabled={isProcessingRange}
          startIcon={isProcessingRange ? <CircularProgress size={20} /> : null}
          sx={{ mb: 2 }}
        >
          {isProcessingRange ? 'Processing...' : 'Process Line Range'}
        </Button>
      </Box>
      <Typography variant="caption" color="text.secondary">
        This will process the specified line range divided into the specified number of chunks with configurable delay between chunks.
      </Typography>
    </Box>
  );
};

export default LineRangeProcessor;
