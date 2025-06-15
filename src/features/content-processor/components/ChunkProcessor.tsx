import React from 'react';
import { MultiStageProcessingOptions, ProcessingStage } from '../api/multiStageProcessor';
import { ContentProcessorStorage } from '../utils/storageService';
import { useContentProcessorStore } from '../store/useContentProcessorStore';

interface ChunkProcessorProps {
  selectedChunkId: string;
  processingStage: ProcessingStage;
  useLocalLlm: boolean;
  localLlmInitialized: boolean;
  selectedModel: string;
  enhanceTheory: (chunkId: string, options?: MultiStageProcessingOptions) => Promise<void>;
  generateQuestions: (chunkId: string, options?: MultiStageProcessingOptions) => Promise<void>;
  generateTasks: (chunkId: string, options?: MultiStageProcessingOptions) => Promise<void>;
  rewriteChunk: (chunkId: string, options?: MultiStageProcessingOptions) => Promise<void>;
  setIsProcessingRange: (value: boolean) => void;
  rewriteOptions: {
    difficulty: 'easy' | 'medium' | 'hard';
    focus: 'theory' | 'questions' | 'tasks';
    questionTypes: ('mcq' | 'code' | 'open' | 'flashcard')[];
    enhanceExamples: boolean;
    simplifyContent: boolean;
  };
}

/**
 * Service for processing individual chunks
 */
const ChunkProcessor = {
  /**
   * Process a chunk with the selected stage
   */
  processChunkWithStage: async ({
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
    rewriteOptions
  }: ChunkProcessorProps) => {
    try {
      // Validate chunk selection
      if (!selectedChunkId) {
        alert('Please select a chunk to process');
        return false;
      }
      
      setIsProcessingRange(true);
      
      // Prepare options for processing
      const options: MultiStageProcessingOptions = {
        useLocalLlm: useLocalLlm && localLlmInitialized,
        localLlmModel: useLocalLlm && localLlmInitialized ? selectedModel : undefined,
        rewriteOptions
      };
      
      // Console log removed
      
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
          return false;
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
      return true;
    } catch (error) {
      // Console log removed
      alert(`Error processing chunk: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    } finally {
      setIsProcessingRange(false);
    }
  }
};

export default ChunkProcessor;
