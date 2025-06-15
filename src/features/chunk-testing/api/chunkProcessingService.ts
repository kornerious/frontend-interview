import { v4 as uuidv4 } from 'uuid';
import geminiService from './geminiService';
import { TestChunk } from '../utils/chunkStorage';
import { ContentProcessor } from '../../content-processor/utils/contentProcessor';

/**
 * Service for processing chunks with Gemini and managing Firebase interactions
 */
export class ChunkProcessingService {
  /**
   * Initialize the service
   */
  async initialize() {
    // Ensure Gemini service is initialized
    if (!geminiService.isInitialized()) {
      // No need to pass config if using environment variables
      await geminiService.initialize({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '' });
    }
  }
  
  /**
   * Process content with Gemini and save to Firebase
   * @param startLine Start line of the chunk
   * @param endLine End line of the chunk
   * @param saveChunk Function to save chunk to Firebase
   * @param existingChunkId Optional ID of an existing chunk to update (if null, creates a new chunk)
   * @returns Object containing processed chunk and parsed content
   */
  async processChunkContent(
    startLine: number, 
    endLine: number, 
    saveChunk: (chunk: TestChunk) => Promise<void>,
    existingChunkId?: string
  ) {
    try {
      // We need to get the real content from MyNotes.md without using ContentProcessor's AI
      console.log(`Fetching real content for lines ${startLine}-${endLine} from MyNotes.md`);
      
      // Use ContentProcessor's readChunk method to get the raw content only
      const markdownContent = await ContentProcessor.readChunk(startLine, endLine);
      
      console.log(`Successfully fetched real content: ${markdownContent.length} characters`);
      
      // Log a preview of the content (first 100 chars)
      const contentPreview = markdownContent.substring(0, 100).replace(/\n/g, ' ');
      console.log(`Content preview: ${contentPreview}...`);
      
      if (markdownContent.trim().length === 0) {
        throw new Error(`No content found for lines ${startLine}-${endLine}`);
      }
      
      const chunkRange = `${startLine}-${endLine}`;
      console.log(`Processing content for lines ${chunkRange}`);
      
      // Generate a unique ID for the chunk or use existing ID
      const chunkId = existingChunkId || uuidv4();
      console.log(`Using chunk ID: ${chunkId} (${existingChunkId ? 'existing' : 'new'})`);
      
      // Create or update chunk object
      const chunk: TestChunk = {
        id: chunkId,
        startLine,
        endLine,
        processedDate: new Date().toISOString(),
        content: '', // Will be populated after Gemini processing
        completed: false
      };
      
      // Don't save anything to Firebase until we have a successful response from Gemini
      console.log(`Will save chunk ${chunkId} to Firebase only after successful processing`);
      
      // Process the content with Gemini ONLY - no retries, no placeholder chunks
      console.log(`Sending chunk ${chunkRange} to Gemini for analysis...`);
      console.log(`Is Gemini service initialized: ${geminiService.isInitialized()}`);
      console.log(`Content length being sent to Gemini: ${markdownContent.length} characters`);
      
      let analysisResult = null;
      let error = null;
      
      try {
        // Only use Gemini - no fallbacks to other AI services
        analysisResult = await geminiService.analyzeContent(markdownContent, chunkRange);
        
        if (!analysisResult) {
          throw new Error('Failed to get valid analysis result from Gemini');
        }
        
        console.log(`Successfully received Gemini analysis for chunk ${chunkRange}`);
        
      } catch (err) {
        error = err instanceof Error ? err : new Error(String(err));
        console.error(`Failed to analyze chunk ${chunkRange}:`, error);
        
        // Return without saving anything to Firebase if Gemini response failed
        return {
          chunk: null,
          parsedContent: { theory: [], questions: [], tasks: [] },
          error
        };
      }
      
      // Only proceed if we have a successful result
      
      // Validate the structure of the analyzed content
      if (!analysisResult.theory && !analysisResult.questions && !analysisResult.tasks) {
        console.warn(`AI response for chunk ${chunkRange} is missing expected fields`);
      }
      
      // Successfully parsed the content
      console.log(`Successfully analyzed chunk ${chunkRange}`);
      
      // Extract the theory, questions, and tasks with fallbacks
      const theory = Array.isArray(analysisResult.theory) ? analysisResult.theory : [];
      const questions = Array.isArray(analysisResult.questions) ? analysisResult.questions : [];
      const tasks = Array.isArray(analysisResult.tasks) ? analysisResult.tasks : [];
      
      // Update the chunk with the processed content
      const updatedChunk: TestChunk = {
        ...chunk,
        content: JSON.stringify(analysisResult),
        completed: true
      };
      
      // Save the updated chunk to Firebase - this works for both new and existing chunks
      console.log(`Saving analyzed chunk ${chunkId} to Firebase`);
      await saveChunk(updatedChunk);
      
      return {
        chunk: updatedChunk,
        parsedContent: { theory, questions, tasks }
      };
    } catch (error) {
      console.error(`Error processing chunk ${startLine}-${endLine}:`, error);
      throw error;
    }
  }
}

// Create a singleton instance
export const chunkProcessingService = new ChunkProcessingService();
