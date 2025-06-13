import { ProcessedChunk, ProcessingState } from '../types';
import { ContentProcessor } from './contentProcessor';

/**
 * Utility class for processing content chunks
 * This is a wrapper around ContentProcessor to provide a cleaner API
 */
export class ChunkProcessor {
  /**
   * Process a specific line range with multiple chunks
   * @param startLine Starting line number
   * @param endLine Ending line number
   * @param numChunks Number of chunks to divide the range into
   * @param options Processing options
   * @returns Array of processed chunks
   */
  static async processLineRange(
    startLine: number,
    endLine: number,
    numChunks: number,
    options?: {
      useLocalLlm?: boolean;
      localLlmModel?: string;
      processingDelay?: number;
    }
  ): Promise<ProcessedChunk[]> {
    // Use the existing ContentProcessor to process the line range
    return ContentProcessor.processLineRange(
      startLine,
      endLine,
      numChunks,
      options
    );
  }
}
