import { create } from 'zustand';
import { TestChunk, TestChunkStorage } from '../utils/chunkStorage';

interface ChunkTestingState {
  // Chunks
  chunks: TestChunk[];
  currentChunk: TestChunk | null;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadAllChunks: () => Promise<void>;
  saveChunk: (chunk: TestChunk) => Promise<void>;
  deleteChunk: (chunkId: string) => Promise<void>;
  clearAllChunks: () => Promise<void>;
  setCurrentChunk: (chunk: TestChunk | null) => void;
}

export const useChunkTestingStore = create<ChunkTestingState>((set, get) => ({
  // Initial state
  chunks: [],
  currentChunk: null,
  isLoading: false,
  error: null,
  
  // Load all chunks
  loadAllChunks: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const chunks = await TestChunkStorage.getAllChunks();
      
      set({
        chunks,
        currentChunk: chunks.length > 0 ? chunks[0] : null,
        isLoading: false
      });
      
      console.log(`Loaded ${chunks.length} chunks into store`);
    } catch (error) {
      console.error('Error loading chunks:', error);
      set({
        error: error instanceof Error ? error.message : 'Unknown error loading chunks',
        isLoading: false
      });
    }
  },
  
  // Save a chunk
  saveChunk: async (chunk: TestChunk) => {
    try {
      set({ isLoading: true, error: null });
      
      await TestChunkStorage.saveChunk(chunk);
      
      // Reload all chunks to ensure UI is in sync
      const chunks = await TestChunkStorage.getAllChunks();
      
      set({
        chunks,
        currentChunk: chunks.find(c => c.id === chunk.id) || get().currentChunk,
        isLoading: false
      });
      
      console.log(`Saved chunk ${chunk.id} and updated store`);
    } catch (error) {
      console.error('Error saving chunk:', error);
      set({
        error: error instanceof Error ? error.message : 'Unknown error saving chunk',
        isLoading: false
      });
    }
  },
  
  // Delete a chunk
  deleteChunk: async (chunkId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      await TestChunkStorage.deleteChunk(chunkId);
      
      // Reload all chunks to ensure UI is in sync
      const chunks = await TestChunkStorage.getAllChunks();
      
      set({
        chunks,
        currentChunk: chunks.length > 0 ? chunks[0] : null,
        isLoading: false
      });
      
      console.log(`Deleted chunk ${chunkId} and updated store`);
    } catch (error) {
      console.error('Error deleting chunk:', error);
      set({
        error: error instanceof Error ? error.message : 'Unknown error deleting chunk',
        isLoading: false
      });
    }
  },
  
  // Clear all chunks
  clearAllChunks: async () => {
    try {
      set({ isLoading: true, error: null });
      
      await TestChunkStorage.clearAllChunks();
      
      set({
        chunks: [],
        currentChunk: null,
        isLoading: false
      });
      
      console.log('Cleared all chunks and updated store');
    } catch (error) {
      console.error('Error clearing chunks:', error);
      set({
        error: error instanceof Error ? error.message : 'Unknown error clearing chunks',
        isLoading: false
      });
    }
  },
  
  // Set current chunk
  setCurrentChunk: (chunk: TestChunk | null) => {
    set({ currentChunk: chunk });
  }
}));
