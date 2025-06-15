import { ProcessingState, ProcessedChunk } from '../types';
import firebaseService from '@/utils/firebaseService';

/**
 * Content Processor Storage Service
 * Handles storage and retrieval of content processor state and processed chunks
 * Uses Firebase for persistence
 */
export class ContentProcessorStorage {
  // Firebase document paths
  private static readonly CONTENT_PROCESSOR_KEY = 'contentProcessor';
  private static readonly STATE_KEY = 'processingState';
  private static readonly CHUNKS_KEY = 'chunks';

  /**
   * Save the current processing state
   */
  static async saveProcessingState(state: ProcessingState): Promise<void> {
    try {
      // Get existing settings
      const settings = await firebaseService.getSettings() || {};
      
      // Update content processor state
      await firebaseService.saveSettings({
        [this.CONTENT_PROCESSOR_KEY]: {
          ...(settings[this.CONTENT_PROCESSOR_KEY] || {}),
          [this.STATE_KEY]: state
        }
      });
    } catch (error) {
      // Console log removed
      throw error;
    }
  }

  /**
   * Get the current processing state
   */
  static async getProcessingState(): Promise<ProcessingState> {
    try {
      // Get settings from Firebase
      const settings = await firebaseService.getSettings();
      const state = settings?.[this.CONTENT_PROCESSOR_KEY]?.[this.STATE_KEY];
      
      // Return default state if not found
      if (!state) {
        return {
          currentPosition: 0,
          totalLines: 0,
          isProcessing: false,
          error: null
        };
      }
      
      return state as ProcessingState;
    } catch (error) {
      // Console log removed
      // Return default state on error
      return {
        currentPosition: 0,
        totalLines: 0,
        isProcessing: false,
        error: null
      };
    }
  }

  /**
   * Save a processed chunk
   */
  static async saveProcessedChunk(chunk: ProcessedChunk): Promise<void> {
    try {
      // Get existing settings
      const settings = await firebaseService.getSettings() || {};
      const contentProcessor = settings[this.CONTENT_PROCESSOR_KEY] || {};
      const chunks = contentProcessor[this.CHUNKS_KEY] || {};
      
      // Update the chunk
      chunks[chunk.id] = chunk;
      
      // Save back to Firebase
      await firebaseService.saveSettings({
        [this.CONTENT_PROCESSOR_KEY]: {
          ...contentProcessor,
          [this.CHUNKS_KEY]: chunks
        }
      });
    } catch (error) {
      // Console log removed
      throw error;
    }
  }

  /**
   * Get a processed chunk by ID
   */
  static async getProcessedChunk(id: string): Promise<ProcessedChunk | null> {
    try {
      const settings = await firebaseService.getSettings();
      const chunks = settings?.[this.CONTENT_PROCESSOR_KEY]?.[this.CHUNKS_KEY] || {};
      
      return chunks[id] || null;
    } catch (error) {
      // Console log removed
      return null;
    }
  }

  /**
   * Get all processed chunks
   */
  static async getAllProcessedChunks(): Promise<ProcessedChunk[]> {
    try {
      const settings = await firebaseService.getSettings();
      const chunks = settings?.[this.CONTENT_PROCESSOR_KEY]?.[this.CHUNKS_KEY] || {};
      
      // Convert object to array
      const chunkArray = Object.values(chunks) as ProcessedChunk[];
      
      // Sort chunks by startLine
      return chunkArray.sort((a, b) => a.startLine - b.startLine);
    } catch (error) {
      // Console log removed
      return [];
    }
  }
  
  /**
   * Clear all processed chunks
   */
  static async clearAllProcessedChunks(): Promise<void> {
    try {
      // Get existing settings
      const settings = await firebaseService.getSettings() || {};
      
      // Clear chunks but keep other content processor settings
      await firebaseService.saveSettings({
        [this.CONTENT_PROCESSOR_KEY]: {
          ...(settings[this.CONTENT_PROCESSOR_KEY] || {}),
          [this.CHUNKS_KEY]: {}
        }
      });
      
      // Console log removed
    } catch (error) {
      // Console log removed
      throw error;
    }
  }

  /**
   * Mark a chunk as completed
   */
  static async markChunkAsCompleted(id: string): Promise<void> {
    try {
      // Get the chunk
      const chunk = await this.getProcessedChunk(id);
      
      if (chunk) {
        // Mark as completed
        chunk.completed = true;
        
        // Save the updated chunk
        await this.saveProcessedChunk(chunk);
      }
    } catch (error) {
      // Console log removed
      throw error;
    }
  }

  /**
   * Reset the processing state
   */
  static async resetProcessingState(): Promise<void> {
    try {
      // Get existing settings
      const settings = await firebaseService.getSettings() || {};
      
      // Clear the content processor data
      await firebaseService.saveSettings({
        [this.CONTENT_PROCESSOR_KEY]: null
      });
    } catch (error) {
      // Console log removed
      throw error;
    }
  }
}
