import { ContentProcessor } from '../utils/contentProcessor';
import { ProcessedChunk, ProcessingState, AIAnalysisResult } from '../types';
import { ContentProcessorStorage } from '../utils/storageService';
import localLlmService from './localLlmService';
import geminiService from './geminiService';
import { 
  buildTheoryExtractionPrompt, 
  buildTheoryEnhancementPrompt,
  buildQuestionGenerationPrompt,
  buildTaskGenerationPrompt,
  buildChunkRewritePrompt
} from './promptBuilders/index';
import { buildGeminiAnalysisPrompt } from './geminiPromptBuilder';
import { sanitizeAIResponse } from './sanitizers';

/**
 * Processing stage types
 */
export type ProcessingStage = 
  | 'theory-extraction'
  | 'theory-enhancement'
  | 'question-generation'
  | 'task-generation'
  | 'chunk-rewrite';

/**
 * Processing options for multi-stage processor
 */
export interface MultiStageProcessingOptions {
  useLocalLlm?: boolean;
  localLlmModel?: string;
  useGemini?: boolean;
  geminiApiKey?: string;
  processingDelay?: number;
  chunkSize?: number;
  stage?: ProcessingStage;
  rewriteOptions?: {
    focus?: 'theory' | 'questions' | 'tasks';
    difficulty?: 'easy' | 'medium' | 'hard';
    questionTypes?: Array<'mcq' | 'code' | 'open' | 'flashcard'>;
    enhanceExamples?: boolean;
    simplifyContent?: boolean;
  };
}

/**
 * Multi-stage content processor service
 * Handles the different stages of content processing
 */
export class MultiStageProcessor {
  /**
   * Process content through a specific stage
   * @param stage Processing stage
   * @param content Content to process (chunk or theory blocks)
   * @param options Processing options
   * @returns Processed result
   */
  static async processStage(
    stage: ProcessingStage,
    content: any,
    options: MultiStageProcessingOptions = {}
  ): Promise<any> {
    const { useLocalLlm, localLlmModel, useGemini, geminiApiKey } = options;
    let prompt = '';
    
    // If using Gemini, use the specialized Gemini prompt builder
    if (useGemini) {
      // Console log removed
      const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
      prompt = buildGeminiAnalysisPrompt(contentStr);
    } else {
      // Build prompt based on stage for non-Gemini processing
      switch (stage) {
        case 'theory-extraction':
          prompt = buildTheoryExtractionPrompt(content);
          break;
        case 'theory-enhancement':
          prompt = buildTheoryEnhancementPrompt(content);
          break;
        case 'question-generation':
          prompt = buildQuestionGenerationPrompt(content);
          break;
        case 'task-generation':
          prompt = buildTaskGenerationPrompt(content);
          break;
        case 'chunk-rewrite':
          prompt = buildChunkRewritePrompt(content, options.rewriteOptions || {});
          break;
        default:
          throw new Error(`Unknown processing stage: ${stage}`);
      }
    }
    
    // Process with appropriate service based on options
    let response: string;
   
    // Console log removed
    
    if (useGemini) {
      // Console log removed
      
      // Initialize Gemini service if needed
      if (!geminiService.isInitialized() && geminiApiKey) {
        await geminiService.initialize({ apiKey: geminiApiKey });
      }
      
      // Process with Gemini
      response = await geminiService.processContent(prompt);
      
      // Response backup functionality removed as requested
    } else if (useLocalLlm && localLlmModel) {
      // Console log removed
      response = await localLlmService.processContent(prompt, { 
        model: localLlmModel,
        temperature: 1.0 // Higher temperature for creative tasks
      });
    } else {
      // Console log removed
      // Use ContentProcessor's AI service for cloud processing
      response = await ContentProcessor.processWithAI(content, prompt, options);
    }
    
    // Sanitize and parse response
    return sanitizeAIResponse(response);
  }
  
  /**
   * Process the next chunk in the first stage (theory extraction)
   * @param options Processing options
   * @returns Processed chunk and updated state
   */
  static async processNextChunk(
    options: MultiStageProcessingOptions = {}
  ): Promise<{
    chunk: ProcessedChunk;
    state: ProcessingState;
  }> {
    // Get current state
    const state = await ContentProcessorStorage.getProcessingState();
    
    // Use ContentProcessor to read the next chunk
    const content = await ContentProcessor.readNextChunk(state);
    
    // Process with theory extraction stage
    const result = await this.processStage('theory-extraction', content, options) as AIAnalysisResult;
    
    // Create processed chunk
    const chunk: ProcessedChunk = {
      id: `chunk_${state.currentPosition}_${state.currentPosition + content.split('\n').length}`,
      startLine: state.currentPosition,
      endLine: state.currentPosition + content.split('\n').length,
      processedDate: new Date().toISOString(),
      completed: false,
      ...result
    };
    
    // Save chunk
    await ContentProcessor.saveProcessedChunk(chunk);
    
    // Update state
    state.currentPosition = chunk.endLine;
    await ContentProcessorStorage.saveProcessingState(state);
    
    return { chunk, state };
  }
  
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
    options: MultiStageProcessingOptions = {}
  ): Promise<ProcessedChunk[]> {
    // Console log removed
    const { processingDelay = 10000, chunkSize = 100 } = options; // Default to 10 seconds delay and 100-line chunks
    const processedChunks: ProcessedChunk[] = [];
    
    // Use fixed-size chunks (0-99, 100-199, etc.)
    const linesPerChunk = chunkSize;
    
    // Calculate number of chunks needed
    const calculatedNumChunks = Math.ceil((endLine - startLine + 1) / linesPerChunk);
    
    // Process each chunk
    for (let i = 0; i < calculatedNumChunks; i++) {
      // Calculate chunk boundaries based on fixed 100-line chunks
      const chunkStartLine = startLine + (i * linesPerChunk);
      // For the last chunk, use endLine, otherwise use fixed 99-line chunks
      const chunkEndLine = i === calculatedNumChunks - 1 ? endLine : chunkStartLine + linesPerChunk - 1;
      
      // Console log removed
      
      try {
        // Read content for this chunk
        const chunkContent = await ContentProcessor.readChunk(chunkStartLine, chunkEndLine);
        
        // Process content based on options
        let result: AIAnalysisResult;
        
        // If using Gemini, use analyzeContent directly which now returns parsed JSON
        if (options.useGemini && options.geminiApiKey) {
          // Console log removed
          // Console log removed
          
          // Initialize Gemini service if needed
          if (!geminiService.isInitialized()) {
            await geminiService.initialize({ apiKey: options.geminiApiKey });
          }
          
          // Use geminiService.analyzeContent which uses the specialized Gemini prompt builder
          // and returns a parsed JSON object directly
          // Console log removed
          try {
            result = await geminiService.analyzeContent(chunkContent) as AIAnalysisResult;
            // Console log removed
          } catch (analyzeError) {
            // Console log removed
            throw analyzeError;
          }
        } else {
          // Use regular processStage with theory-extraction for non-Gemini processing
          result = await this.processStage('theory-extraction', chunkContent, options) as AIAnalysisResult;
        }
        
        // Validate the result structure if using Gemini
        if (options.useGemini) {
          if (!result || !result.theory || !Array.isArray(result.theory)) {
            // Console log removed
            // Console log removed
            throw new Error('Invalid response format from Gemini API. Processing stopped.');
          }
        }
        
        // Create processed chunk with a unique timestamp to avoid ID collisions
        const timestamp = Date.now() + i;
        const chunk: ProcessedChunk = {
          id: `chunk_${chunkStartLine}_${chunkEndLine}_${timestamp}`,
          startLine: chunkStartLine,
          endLine: chunkEndLine + 1, // Store as exclusive end line for internal processing
          displayEndLine: chunkEndLine, // Store the actual inclusive end line for display
          theory: result.theory || [],
          questions: result.questions || [],
          tasks: result.tasks || [],
          logicalBlockInfo: result.logicalBlockInfo || { suggestedEndLine: -1 },
          completed: false,
          processedDate: new Date().toISOString()
        };
        
        // Save processed chunk
        await ContentProcessor.saveProcessedChunk(chunk);
        processedChunks.push(chunk);
        
        // Add delay between chunks if specified
        if (processingDelay && i < calculatedNumChunks - 1) {
          // Console log removed
          await new Promise(resolve => setTimeout(resolve, processingDelay * 1000));
        }
      } catch (error) {
        // Console log removed
        // Log the error but continue processing the next chunk instead of stopping
        // Console log removed
        // Don't throw the error, which would stop the entire process
      }
    }
    
    return processedChunks;
  }
  
  /**
   * Enhance theory blocks with examples and explanations
   * @param chunkId ID of the chunk containing theory blocks to enhance
   * @param options Processing options
   * @returns Enhanced chunk
   */
  static async enhanceTheory(
    chunkId: string,
    options: MultiStageProcessingOptions = {}
  ): Promise<ProcessedChunk> {
    // Get the chunk
    const chunk = await ContentProcessor.getChunk(chunkId);
    if (!chunk) {
      throw new Error(`Chunk not found: ${chunkId}`);
    }
    
    // Process each theory block
    const enhancedTheory = [];
    for (const theory of chunk.theory || []) {
      const enhanced = await this.processStage('theory-enhancement', JSON.stringify(theory), options);
      enhancedTheory.push(enhanced);
    }
    
    // Update chunk with enhanced theory
    const enhancedChunk: ProcessedChunk = {
      ...chunk,
      theory: enhancedTheory,
      processedDate: new Date().toISOString()
    };
    
    // Save enhanced chunk
    await ContentProcessor.saveProcessedChunk(enhancedChunk);
    
    return enhancedChunk;
  }
  
  /**
   * Generate questions for a chunk
   * @param chunkId ID of the chunk to generate questions for
   * @param options Processing options
   * @returns Updated chunk with questions
   */
  static async generateQuestions(
    chunkId: string,
    options: MultiStageProcessingOptions = {}
  ): Promise<ProcessedChunk> {
    // Console log removed
    
    // Get the chunk
    const chunk = await ContentProcessor.getChunk(chunkId);
    if (!chunk) {
      // Console log removed
      throw new Error(`Chunk not found: ${chunkId}`);
    }
    
    // Console log removed
    
    // Generate questions based on theory blocks
    const theoryContent = (chunk.theory || []).map(t => JSON.stringify(t)).join('\n\n');
    // Console log removed
    
    try {
      // Console log removed
      const result = await this.processStage('question-generation', theoryContent, options);
      // Console log removed
      
      // Extract questions array from the result - ensure we get the actual array
      let questionsArray;
      if (typeof result === 'object' && result !== null && 'questions' in result && Array.isArray(result.questions)) {
        // The AI returned { questions: [...] } format
        questionsArray = result.questions;
        // Console log removed
      } else {
        // Fallback if the structure is different
        questionsArray = Array.isArray(result) ? result : [];
        // Console log removed
      }
      
      // Update chunk with questions array directly (not nested)
      const updatedChunk: ProcessedChunk = {
        ...chunk,
        questions: questionsArray, // Store the array directly, not nested
        processedDate: new Date().toISOString()
      };
      
      // Console log removed
      
      // Save updated chunk
      await ContentProcessor.saveProcessedChunk(updatedChunk);
      
      return updatedChunk;
    } catch (error) {
      // Console log removed
      throw error;
    }
  }
  
  /**
   * Generate tasks for a chunk
   * @param chunkId ID of the chunk to generate tasks for
   * @param options Processing options
   * @returns Updated chunk with tasks
   */
  static async generateTasks(
    chunkId: string,
    options: MultiStageProcessingOptions = {}
  ): Promise<ProcessedChunk> {
    // Get the chunk
    const chunk = await ContentProcessor.getChunk(chunkId);
    if (!chunk) {
      throw new Error(`Chunk not found: ${chunkId}`);
    }
    
    // Generate tasks based on theory blocks
    const theoryContent = (chunk.theory || []).map(t => JSON.stringify(t)).join('\n\n');
    // Console log removed
    const result = await this.processStage('task-generation', theoryContent, options);
    // Console log removed
    
    // Extract tasks array from the result - ensure we get the actual array
    let tasksArray;
    if (typeof result === 'object' && result !== null && 'tasks' in result && Array.isArray(result.tasks)) {
      // The AI returned { tasks: [...] } format
      tasksArray = result.tasks;
      // Console log removed
    } else {
      // Fallback if the structure is different
      tasksArray = Array.isArray(result) ? result : [];
      // Console log removed
    }
    
    // Update chunk with tasks array directly (not nested)
    const updatedChunk: ProcessedChunk = {
      ...chunk,
      tasks: tasksArray, // Store the array directly, not nested
      processedDate: new Date().toISOString()
    };
    
    // Save updated chunk
    await ContentProcessor.saveProcessedChunk(updatedChunk);
    
    return updatedChunk;
  }
  
  /**
   * Rewrite a chunk with specific options
   * @param chunkId ID of the chunk to rewrite
   * @param options Rewrite options
   * @returns Rewritten chunk
   */
  static async rewriteChunk(
    chunkId: string,
    options: MultiStageProcessingOptions = {}
  ): Promise<ProcessedChunk> {
    // Get the chunk
    const chunk = await ContentProcessor.getChunk(chunkId);
    if (!chunk) {
      throw new Error(`Chunk not found: ${chunkId}`);
    }
    
    // Rewrite chunk with specified options
    const rewrittenChunk = await this.processStage('chunk-rewrite', JSON.stringify(chunk), options) as AIAnalysisResult;
    
    // Update chunk ID and processed date
    const updatedChunk: ProcessedChunk = {
      ...chunk,                  // Keep original chunk properties
      ...rewrittenChunk,        // Apply rewritten content
      id: chunk.id,             // Keep the same ID
      startLine: chunk.startLine,
      endLine: chunk.endLine,
      completed: chunk.completed,
      processedDate: new Date().toISOString()
    };
    
    // Save rewritten chunk
    await ContentProcessor.saveProcessedChunk(updatedChunk);
    
    return updatedChunk;
  }
}
