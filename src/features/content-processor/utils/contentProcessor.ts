import { ContentAnalyzer } from '../api/contentAnalyzer';
import { FileProcessor } from './fileProcessor';
import { ContentProcessorStorage } from './storageService';
import { ProcessingState, ProcessedChunk } from '../types';
export const CHUNK_SIZE = 100; 

/**
 * Main content processor service
 */
export class ContentProcessor {
  // Path to the large markdown file
  private static readonly FILE_PATH = '/data/MyNotes.md';

  /**
   * Initializes the content processor
   * @returns The initial processing state
   */
  static async initialize(): Promise<ProcessingState> {
    try {
      // Get current state or create default
      let state = await ContentProcessorStorage.getProcessingState();
      
      // If we don't have total lines yet, get them
      if (!state.totalLines || state.totalLines <= 0) {
        const totalLines = await FileProcessor.getTotalLines(this.FILE_PATH);
        state = {
          ...state,
          totalLines,
          currentPosition: 0
        };
        await ContentProcessorStorage.saveProcessingState(state);
      }
      
      return state;
    } catch (error) {
      console.error('Error initializing content processor:', error);
      throw error;
    }
  }
  
  /**
   * Processes the next logical block of the file
   * @param options Optional processing options for using local LLM
   * @returns The processed chunk and updated state
   */
  static async processNextChunk(options?: {
    useLocalLlm?: boolean;
    localLlmModel?: string;
  }): Promise<{
    chunk: ProcessedChunk;
    state: ProcessingState;
  }> {
    try {
      // Get current state
      let state = await ContentProcessorStorage.getProcessingState();
      
      // Check if we've reached the end of the file
      if (FileProcessor.isProcessingComplete(state)) {
        throw new Error('Processing is already complete');
      }
      
      // Update state to indicate processing has started
      state = {
        ...state,
        isProcessing: true,
        error: null
      };
      await ContentProcessorStorage.saveProcessingState(state);
      
      // Read the next chunk for AI to analyze
      const content = await FileProcessor.readChunk(
        this.FILE_PATH,
        state.currentPosition
      );
      
      // Get the initial number of lines read
      const initialLinesRead = content.split('\n').length;
      
      // Process the chunk with AI and get logical block information
      const analysisResult = await ContentAnalyzer.analyzeContent(content, {
        useLocalLlm: options?.useLocalLlm,
        localLlmModel: options?.localLlmModel
      });
      
      // Determine the actual number of lines to process based on AI's suggestion
      let linesRead = initialLinesRead;
      if (analysisResult.logicalBlockInfo && analysisResult.logicalBlockInfo.suggestedEndLine > 0) {
        // AI has suggested a specific end line for the logical block
        linesRead = analysisResult.logicalBlockInfo.suggestedEndLine;
        console.log(`AI suggested ending logical block at line ${linesRead} (${linesRead - state.currentPosition} lines)`);
      }
      
      // Create a processed chunk
      const chunk: ProcessedChunk = {
        id: `chunk_${state.currentPosition}_${Date.now()}`,
        startLine: state.currentPosition,
        endLine: state.currentPosition + linesRead,
        processedDate: new Date().toISOString(),
        completed: false,
        ...analysisResult
      };
      
      // Save the processed chunk
      await ContentProcessorStorage.saveProcessedChunk(chunk);
      
      // Update the processing state
      const newPosition = Math.min(state.currentPosition + linesRead, state.totalLines);
      state = {
        ...state,
        currentPosition: newPosition,
        isProcessing: false,
        lastProcessedDate: new Date().toISOString()
      };
      await ContentProcessorStorage.saveProcessingState(state);
      
      return { chunk, state };
    } catch (error) {
      console.error('Error processing next chunk:', error);
      
      // Update state to indicate error
      const state = await ContentProcessorStorage.getProcessingState();
      const errorState: ProcessingState = {
        ...state,
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      await ContentProcessorStorage.saveProcessingState(errorState);
      
      throw error;
    }
  }
  
  /**
   * Gets all processed content
   * @returns All processed chunks
   */
  static async getAllProcessedContent(): Promise<ProcessedChunk[]> {
    return ContentProcessorStorage.getAllProcessedChunks();
  }
  
  /**
   * Marks a chunk as completed (user has finished working with it)
   * @param chunkId The ID of the chunk to mark as completed
   */
  static async markChunkAsCompleted(chunkId: string): Promise<void> {
    return ContentProcessorStorage.markChunkAsCompleted(chunkId);
  }
  
  /**
   * Resets the processing state (starts over)
   */
  static async resetProcessing(): Promise<ProcessingState> {
    await ContentProcessorStorage.resetProcessingState();
    return this.initialize();
  }
  
  /**
   * Gets the current processing progress percentage
   * @returns Progress percentage (0-100)
   */
  static async getProgress(): Promise<number> {
    const state = await ContentProcessorStorage.getProcessingState();
    return FileProcessor.calculateProgress(state);
  }
}
