import React, { useState } from 'react';
import { 
  Box, Typography, SelectChangeEvent,
} from '@mui/material';
import { useContentProcessorStore } from '../store/useContentProcessorStore';
import { ProcessingStage, MultiStageProcessingOptions } from '../api/multiStageProcessor';

// Import extracted components
import LineRangeInputs from './LineRangeInputs';
import ProcessingButtons from './ProcessingButtons';
import SequentialProcessor from './SequentialProcessor';
import ChunkProcessor from './ChunkProcessor';

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
  const [processingDelay, setProcessingDelay] = useState(10);
  const [isProcessingRange, setIsProcessingRange] = useState(false);
  const [isSequentialProcessing, setIsSequentialProcessing] = useState(false);
  const [isCompleteProcessing, setIsCompleteProcessing] = useState(false);
  const [isProcessingWithGemini, setIsProcessingWithGemini] = useState(false);
  
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
  
  // Import ContentProcessorStorage for accessing chunks
  const { ContentProcessorStorage } = require('../utils/storageService');
  
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
      if (startLine < 0 || endLine <= startLine || processingDelay < 0) {
        alert('Please enter valid line range and delay');
        return;
      }
      
      // Use fixed 100-line chunks
      const lineCount = endLine - startLine;
      const chunkSize = 100;
      const calculatedNumChunks = Math.ceil(lineCount / chunkSize);
      
      setIsProcessingRange(true);
      console.log(`Processing lines ${startLine}-${endLine} with fixed 100-line chunks, ${calculatedNumChunks} chunks with ${processingDelay}s delay...`);
      
      // Use the store action to process the line range
      const options: MultiStageProcessingOptions = {
        processingDelay,
        chunkSize,
        useLocalLlm: useLocalLlm && localLlmInitialized,
        localLlmModel: useLocalLlm && localLlmInitialized ? selectedModel : undefined,
        stage: 'theory-extraction'
      };
      
      await storeProcessLineRange(startLine, endLine, calculatedNumChunks, options);
      
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
    return ChunkProcessor.processChunkWithStage({
      selectedChunkId,
      processingStage,
      useLocalLlm,
      localLlmInitialized,
      selectedModel,
      enhanceTheory,
      generateQuestions,
      generateTasks,
      rewriteChunk,
      setIsProcessingRange,
      rewriteOptions: {
        difficulty,
        focus: focusArea,
        questionTypes,
        enhanceExamples,
        simplifyContent
      }
    });
  };
  
  // Process all chunks sequentially with theory enhancement, question generation, and task generation
  const processAllChunksSequentially = async () => {
    return await SequentialProcessor.processAllChunksSequentially({
      startLine,
      endLine,
      processingDelay,
      useLocalLlm,
      localLlmInitialized,
      selectedModel,
      setIsSequentialProcessing,
      storeProcessLineRange,
      enhanceTheory,
      generateQuestions,
      generateTasks,
      setStoreProcessingStage: setProcessingStage,
      setSelectedChunkId: setSelectedChunkId
    });
  };
  
  // Process line range with Gemini API
  const processLineRangeWithGemini = async () => {
    try {
      // Validate inputs
      if (startLine < 0 || endLine <= startLine || processingDelay < 0) {
        alert('Please enter valid line range and delay');
        return;
      }
      
      // Get API key from environment variable
      const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      
      // Validate API key
      if (!geminiApiKey) {
        alert('Gemini API key not found in environment variables. Please add NEXT_PUBLIC_GEMINI_API_KEY to your .env file.');
        return;
      }
      
      // Calculate number of chunks based on line range (1 chunk per 100 lines)
      const lineCount = endLine - startLine;
      const calculatedNumChunks = Math.max(1, Math.ceil(lineCount / 100));
      
      setIsProcessingWithGemini(true);
      
      console.log(`Processing line range ${startLine}-${endLine} with Gemini API...`);
      
      // Process line range with Gemini API
      await storeProcessLineRange(startLine, endLine, calculatedNumChunks, {
        useGemini: true,
        geminiApiKey: geminiApiKey,
        processingDelay: processingDelay
      });
      
      console.log('Processing with Gemini API completed');
      
      // Load all chunks to get the latest data
      await useContentProcessorStore.getState().loadAllChunks();
      
      // Get the latest chunks after processing
      const allChunks = useContentProcessorStore.getState().allChunks;
      
      // Find chunks that match our line range
      const relevantChunks = allChunks.filter(chunk => 
        chunk.startLine >= startLine && chunk.endLine <= endLine
      );
      
      console.log(`Found ${relevantChunks.length} processed chunks in the line range`);
      
      // Set the first chunk as current if available
      if (relevantChunks.length > 0) {
        // Get the first chunk ID and set it as current
        useContentProcessorStore.setState({ currentChunk: relevantChunks[0] });
        setSelectedChunkId(relevantChunks[0].id);
      }
    } catch (error) {
      console.error('Error processing with Gemini:', error);
      alert(`Error processing with Gemini: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsProcessingWithGemini(false);
    }
  };
  
  // Complete end-to-end processing: Process Line Range followed by All Stages Sequentially
  const processCompleteEndToEnd = async () => {
    try {
      setIsCompleteProcessing(true);
      console.log(`Starting complete end-to-end processing for lines ${startLine}-${endLine}...`);
      
      // First process the line range
      await processLineRange();
      
      // Then process all stages sequentially
      await processAllChunksSequentially();
      
      console.log('Complete end-to-end processing finished successfully!');
      return true;
    } catch (error) {
      console.error('Error during complete processing:', error);
      alert(`Error during complete processing: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    } finally {
      setIsCompleteProcessing(false);
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
        
        {/* Line range inputs component */}
        <LineRangeInputs
          startLine={startLine}
          endLine={endLine}
          processingDelay={processingDelay}
          setStartLine={setStartLine}
          setEndLine={setEndLine}
          setProcessingDelay={setProcessingDelay}
        />
        

        
        {/* Processing buttons component */}
        <ProcessingButtons
          isProcessingRange={isProcessingRange}
          isSequentialProcessing={isSequentialProcessing}
          isCompleteProcessing={isCompleteProcessing}
          isProcessingWithGemini={isProcessingWithGemini}
          onProcessLineRange={processLineRange}
          onProcessAllSequentially={processAllChunksSequentially}
          onCompleteProcessing={processCompleteEndToEnd}
          onProcessWithGemini={processLineRangeWithGemini}
        />
      </Box>
      <Typography variant="caption" color="text.secondary">
        This will process the specified line range divided into chunks (1 chunk per 100 lines) with configurable delay between chunks.
        Use "Process All Stages Sequentially" to automatically enhance theory, generate questions, and generate tasks for all chunks.
      </Typography>
    </Box>
  );
};

export default LineRangeProcessor;
