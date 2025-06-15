import { ProcessingState } from '../types';
import { CHUNK_SIZE } from './contentProcessor';

/**
 * Utility for processing large files in chunks
 */
export class FileProcessor {
  /**
   * Reads a chunk of content from a file
   * @param filePath Path to the file
   * @param startLine Starting line number (0-based)
   * @returns The chunk of text
   */
  static async readChunk(filePath: string, startLine: number): Promise<string> {
    try {
      // Fetch the file content
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }
      
      const text = await response.text();
      const lines = text.split('\n');
      
      // Calculate end line (don't exceed file length or chunk size)
      const endLine = Math.min(startLine + CHUNK_SIZE, lines.length);
      
      // Extract the chunk
      const chunk = lines.slice(startLine, endLine).join('\n');
      
      // Console log removed
      return chunk;
    } catch (error) {
      // Console log removed
      throw error;
    }
  }

  /**
   * Reads a specific line range from a file
   * @param filePath Path to the file
   * @param startLine Starting line number (0-based)
   * @param endLine Ending line number (exclusive)
   * @returns The content of the specified line range
   */
  static async readLineRange(filePath: string, startLine: number, endLine: number): Promise<string> {
    try {
      // Fetch the file content
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }
      
      const text = await response.text();
      const lines = text.split('\n');
      
      // Ensure endLine doesn't exceed file length
      const actualEndLine = Math.min(endLine, lines.length);
      
      // Extract the specified line range
      const chunk = lines.slice(startLine, actualEndLine).join('\n');
      
      // Console log removed
      return chunk;
    } catch (error) {
      // Console log removed
      throw error;
    }
  }

  // No longer using findLogicalBlockEnd - AI will determine logical blocks

  /**
   * Gets the total number of lines in a file
   * @param filePath Path to the file
   * @returns Total number of lines
   */
  static async getTotalLines(filePath: string): Promise<number> {
    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }
      
      const text = await response.text();
      return text.split('\n').length;
    } catch (error) {
      // Console log removed
      throw error;
    }
  }
  
  /**
   * Gets the entire file content
   * @param filePath Path to the file
   * @returns The entire file content
   */
  static async getEntireFile(filePath: string): Promise<string> {
    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }
      
      return await response.text();
    } catch (error) {
      // Console log removed
      throw error;
    }
  }

  /**
   * Calculates the current progress percentage
   * @param state Current processing state
   * @returns Progress percentage (0-100)
   */
  static calculateProgress(state: ProcessingState): number {
    if (!state.totalLines || state.totalLines <= 0) {
      return 0;
    }
    
    const progress = (state.currentPosition / state.totalLines) * 100;
    return Math.min(Math.max(progress, 0), 100);
  }

  /**
   * Determines if processing is complete
   * @param state Current processing state
   * @returns True if processing is complete
   */
  static isProcessingComplete(state: ProcessingState): boolean {
    return state.currentPosition >= state.totalLines;
  }
}
