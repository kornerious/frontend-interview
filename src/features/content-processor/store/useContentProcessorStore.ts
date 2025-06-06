import { create } from 'zustand';
import { ProcessingState, ProcessedChunk } from '../types';
import { ContentProcessor } from '../utils/contentProcessor';

interface ContentProcessorStore {
  // State
  processingState: ProcessingState | null;
  currentChunk: ProcessedChunk | null;
  allChunks: ProcessedChunk[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  initialize: () => Promise<void>;
  processNextChunk: () => Promise<void>;
  markCurrentChunkCompleted: () => Promise<void>;
  resetProcessing: () => Promise<void>;
  loadAllChunks: () => Promise<void>;
}

export const useContentProcessorStore = create<ContentProcessorStore>((set, get) => ({
  // Initial state
  processingState: null,
  currentChunk: null,
  allChunks: [],
  isLoading: false,
  error: null,
  
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
      console.error('Error initializing content processor store:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to initialize content processor',
        isLoading: false
      });
    }
  },
  
  // Process the next chunk
  processNextChunk: async () => {
    try {
      set({ isLoading: true, error: null });
      
      // Process the next chunk
      const { chunk, state } = await ContentProcessor.processNextChunk();
      
      // Update the store
      set(prevState => ({
        processingState: state,
        currentChunk: chunk,
        allChunks: [...prevState.allChunks, chunk],
        isLoading: false
      }));
    } catch (error) {
      console.error('Error processing next chunk:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to process next chunk',
        isLoading: false
      });
    }
  },
  
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
      console.error('Error marking chunk as completed:', error);
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
      console.error('Error resetting processing:', error);
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
      console.error('Error loading chunks:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to load chunks',
        isLoading: false
      });
    }
  }
}));
