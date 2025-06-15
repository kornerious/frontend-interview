import { create } from 'zustand';
import { ProcessingState, ProcessedChunk } from '../types';
import { ContentProcessor } from '../utils/contentProcessor';
import { MultiStageProcessor, ProcessingStage, MultiStageProcessingOptions } from '../api/multiStageProcessor';

interface ProcessOptions {
  useLocalLlm?: boolean;
  localLlmModel?: string;
}

interface ContentProcessorStore {
  // State
  processingState: ProcessingState | null;
  currentChunk: ProcessedChunk | null;
  allChunks: ProcessedChunk[];
  isLoading: boolean;
  error: string | null;
  currentStage: ProcessingStage;
  
  // Actions
  initialize: () => Promise<void>;
  processNextChunk: (options?: ProcessOptions) => Promise<void>;
  markCurrentChunkCompleted: () => Promise<void>;
  resetProcessing: () => Promise<void>;
  loadAllChunks: () => Promise<void>;
  setCurrentChunk: (chunkId: string) => void;
  
  // Multi-stage processing actions
  setProcessingStage: (stage: ProcessingStage) => void;
  processLineRange: (startLine: number, endLine: number, numChunks: number, options?: MultiStageProcessingOptions) => Promise<void>;
  enhanceTheory: (chunkId: string, options?: MultiStageProcessingOptions) => Promise<void>;
  generateQuestions: (chunkId: string, options?: MultiStageProcessingOptions) => Promise<void>;
  generateTasks: (chunkId: string, options?: MultiStageProcessingOptions) => Promise<void>;
  rewriteChunk: (chunkId: string, options?: MultiStageProcessingOptions) => Promise<void>;
}

export const useContentProcessorStore = create<ContentProcessorStore>((set, get) => ({
  // Initial state
  processingState: null,
  currentChunk: null,
  allChunks: [],
  isLoading: false,
  error: null,
  currentStage: 'theory-extraction',
  
  // Initialize the processor
  initialize: async () => {
    try {
      set({ isLoading: true, error: null });
      
      // Initialize the processor and get initial state
      const state = await ContentProcessor.initialize();
      
      // Load all existing chunks
      const chunks = await ContentProcessor.getAllProcessedContent();
      
      // Find the most recent chunk that's not completed
      const currentChunk = chunks.find(chunk => !chunk.completed) || null;
      
      set({
        processingState: state,
        allChunks: chunks,
        currentChunk,
        isLoading: false
      });
    } catch (error) {
      // Console log removed
      set({
        error: error instanceof Error ? error.message : 'Failed to initialize content processor',
        isLoading: false
      });
    }
  },
  
  // Process the next chunk
  processNextChunk: async (options?: ProcessOptions) => {
    try {
      set({ isLoading: true, error: null });
      
      // Process the next chunk
      const { chunk, state } = await ContentProcessor.processNextChunk({
        useLocalLlm: options?.useLocalLlm || false,
        localLlmModel: options?.localLlmModel || ''
      });
      
      // Update the store
      set(prevState => ({
        processingState: state,
        currentChunk: chunk,
        allChunks: [...prevState.allChunks, chunk],
        isLoading: false
      }));
    } catch (error) {
      // Console log removed
      set({
        error: error instanceof Error ? error.message : 'Failed to process next chunk',
        isLoading: false
      });
    }
  },
  
  // Removed processLineRange, processLineRangeInChunks, and processChunkByIndex methods
  
  // Mark the current chunk as completed
  markCurrentChunkCompleted: async () => {
    const { currentChunk } = get();
    
    if (!currentChunk) {
      return;
    }
    
    try {
      set({ isLoading: true, error: null });
      
      // Mark the chunk as completed
      await ContentProcessor.markChunkAsCompleted(currentChunk.id);
      
      // Update the store
      set(prevState => ({
        currentChunk: {
          ...currentChunk,
          completed: true
        },
        allChunks: prevState.allChunks.map(chunk => 
          chunk.id === currentChunk.id ? { ...chunk, completed: true } : chunk
        ),
        isLoading: false
      }));
    } catch (error) {
      // Console log removed
      set({
        error: error instanceof Error ? error.message : 'Failed to mark chunk as completed',
        isLoading: false
      });
    }
  },
  
  // Reset the processing
  resetProcessing: async () => {
    try {
      set({ isLoading: true, error: null });
      
      // Reset the processor
      const state = await ContentProcessor.resetProcessing();
      
      // Update the store
      set({
        processingState: state,
        currentChunk: null,
        allChunks: [],
        isLoading: false
      });
    } catch (error) {
      // Console log removed
      set({
        error: error instanceof Error ? error.message : 'Failed to reset processing',
        isLoading: false
      });
    }
  },
  
  // Load all processed chunks
  loadAllChunks: async () => {
    try {
      set({ isLoading: true, error: null });
      
      // Get all chunks
      const chunks = await ContentProcessor.getAllProcessedContent();
      
      // Update the store
      set({
        allChunks: chunks,
        isLoading: false
      });
    } catch (error) {
      // Console log removed
      set({
        error: error instanceof Error ? error.message : 'Failed to load all chunks',
        isLoading: false
      });
    }
  },
  
  // Set the current chunk by ID
  setCurrentChunk: (chunkId: string) => {
    const { allChunks } = get();
    const chunk = allChunks.find(c => c.id === chunkId) || null;
    
    if (chunk) {
      set({ currentChunk: chunk });
    }
  },
  
  // Set the current processing stage
  setProcessingStage: (stage: ProcessingStage) => {
    set({ currentStage: stage });
  },
  
  // Process a line range with multi-stage processor
  processLineRange: async (startLine: number, endLine: number, numChunks: number, options?: MultiStageProcessingOptions) => {
    try {
      // Console log removed
      set({ isLoading: true, error: null });
      
      // Process the line range
      const processedChunks = await MultiStageProcessor.processLineRange(
        startLine,
        endLine,
        numChunks,
        {
          ...options
        }
      );
      
      // Update the store with new chunks (replacing existing ones)
      set(prevState => ({
        allChunks: processedChunks, // Replace instead of append
        currentChunk: processedChunks.length > 0 ? processedChunks[0] : prevState.currentChunk,
        isLoading: false
      }));
    } catch (error) {
      // Console log removed
      set({
        error: error instanceof Error ? error.message : 'Failed to process line range',
        isLoading: false
      });
    }
  },
  
  // Enhance theory blocks in a chunk
  enhanceTheory: async (chunkId: string, options?: MultiStageProcessingOptions) => {
    try {
      set({ isLoading: true, error: null });
      
      // Enhance theory blocks
      const enhancedChunk = await MultiStageProcessor.enhanceTheory(chunkId, options);
      
      // Update the store
      set(prevState => ({
        allChunks: prevState.allChunks.map(chunk => 
          chunk.id === chunkId ? enhancedChunk : chunk
        ),
        currentChunk: prevState.currentChunk?.id === chunkId ? enhancedChunk : prevState.currentChunk,
        isLoading: false
      }));
    } catch (error) {
      // Console log removed
      set({
        error: error instanceof Error ? error.message : 'Failed to enhance theory',
        isLoading: false
      });
    }
  },
  
  // Generate questions for a chunk
  generateQuestions: async (chunkId: string, options?: MultiStageProcessingOptions) => {
    try {
      set({ isLoading: true, error: null });
      
      // Generate questions
      const updatedChunk = await MultiStageProcessor.generateQuestions(chunkId, options);
      
      // Update the store
      set(prevState => ({
        allChunks: prevState.allChunks.map(chunk => 
          chunk.id === chunkId ? updatedChunk : chunk
        ),
        currentChunk: prevState.currentChunk?.id === chunkId ? updatedChunk : prevState.currentChunk,
        isLoading: false
      }));
    } catch (error) {
      // Console log removed
      set({
        error: error instanceof Error ? error.message : 'Failed to generate questions',
        isLoading: false
      });
    }
  },
  
  // Generate tasks for a chunk
  generateTasks: async (chunkId: string, options?: MultiStageProcessingOptions) => {
    try {
      set({ isLoading: true, error: null });
      
      // Generate tasks
      const updatedChunk = await MultiStageProcessor.generateTasks(chunkId, options);
      
      // Update the store
      set(prevState => ({
        allChunks: prevState.allChunks.map(chunk => 
          chunk.id === chunkId ? updatedChunk : chunk
        ),
        currentChunk: prevState.currentChunk?.id === chunkId ? updatedChunk : prevState.currentChunk,
        isLoading: false
      }));
    } catch (error) {
      // Console log removed
      set({
        error: error instanceof Error ? error.message : 'Failed to generate tasks',
        isLoading: false
      });
    }
  },
  
  // Rewrite a chunk with specific options
  rewriteChunk: async (chunkId: string, options?: MultiStageProcessingOptions) => {
    try {
      set({ isLoading: true, error: null });
      
      // Rewrite chunk
      const rewrittenChunk = await MultiStageProcessor.rewriteChunk(chunkId, options);
      
      // Update the store
      set(prevState => ({
        allChunks: prevState.allChunks.map(chunk => 
          chunk.id === chunkId ? rewrittenChunk : chunk
        ),
        currentChunk: prevState.currentChunk?.id === chunkId ? rewrittenChunk : prevState.currentChunk,
        isLoading: false
      }));
    } catch (error) {
      // Console log removed
      set({
        error: error instanceof Error ? error.message : 'Failed to rewrite chunk',
        isLoading: false
      });
    }
  },
}));
