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
  maxChunks?: number;
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
    
    // Build prompt based on stage
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
    
    // Process with appropriate service based on options
    let response: string;
    
    if (useGemini) {
      console.log(`Processing stage ${stage} with Gemini API`);
      
      // Initialize Gemini service if needed
      if (!geminiService.isInitialized() && geminiApiKey) {
        await geminiService.initialize({ apiKey: geminiApiKey });
      }
      
      // Process with Gemini
      response = await geminiService.processContent(prompt, {
        temperature: 1.0,
        enableCodeExecution: true,
        maxOutputTokens: 65536
      });
      
      // Response backup functionality removed as requested
    } else if (useLocalLlm && localLlmModel) {
      console.log(`Processing stage ${stage} with local LLM model: ${localLlmModel}`);
      response = await localLlmService.processContent(prompt, { 
        model: localLlmModel,
        temperature: 1.0 // Higher temperature for creative tasks
      });
    } else {
      console.log(`Processing stage ${stage} with cloud AI`);
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
    const { processingDelay = 1000, maxChunks = 1000 } = options;
    const processedChunks: ProcessedChunk[] = [];
    
    // Calculate lines per chunk
    const linesPerChunk = Math.ceil((endLine - startLine + 1) / numChunks);
    
    // Process each chunk
    for (let i = 0; i < numChunks && i < maxChunks; i++) {
      const chunkStartLine = startLine + Math.floor(i * linesPerChunk);
      const chunkEndLine = i === numChunks - 1 ? endLine : startLine + Math.floor((i + 1) * linesPerChunk);
      
      console.log(`Processing chunk ${i + 1}/${numChunks}: lines ${chunkStartLine}-${chunkEndLine}`);
      
      try {
        // Read content for this chunk
        const chunkContent = await ContentProcessor.readChunk(chunkStartLine, chunkEndLine);
        
        // Process with theory extraction stage
        const result = await this.processStage('theory-extraction', chunkContent, options) as AIAnalysisResult;
        
        // Validate the result structure if using Gemini
        if (options.useGemini) {
          if (!result || !result.theory || !Array.isArray(result.theory)) {
            console.error('Invalid response format from Gemini API. Expected theory array.');
            console.error('Received:', JSON.stringify(result).substring(0, 200) + '...');
            throw new Error('Invalid response format from Gemini API. Processing stopped.');
          }
        }
        
        // Create processed chunk
        const chunk: ProcessedChunk = {
          id: `chunk_${chunkStartLine}_${chunkEndLine}`,
          startLine: chunkStartLine,
          endLine: chunkEndLine,
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
        if (processingDelay && i < numChunks - 1) {
          console.log(`Waiting ${processingDelay} seconds before processing next chunk...`);
          await new Promise(resolve => setTimeout(resolve, processingDelay * 1000));
        }
      } catch (error) {
        console.error(`Error processing chunk ${i + 1}/${numChunks}:`, error);
        throw error;
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
    console.log('[DEBUG] Starting generateQuestions for chunk:', chunkId);
    
    // Get the chunk
    const chunk = await ContentProcessor.getChunk(chunkId);
    if (!chunk) {
      console.error('[DEBUG] Chunk not found:', chunkId);
      throw new Error(`Chunk not found: ${chunkId}`);
    }
    
    console.log('[DEBUG] Chunk theory blocks:', chunk.theory);
    
    // Generate questions based on theory blocks
    const theoryContent = (chunk.theory || []).map(t => JSON.stringify(t)).join('\n\n');
    console.log('[DEBUG] Theory content length:', theoryContent.length);
    
    try {
      console.log('[DEBUG] Calling processStage for question-generation');
      const result = await this.processStage('question-generation', theoryContent, options);
      console.log('[DEBUG] Questions received from AI:', result);
      
      // Extract questions array from the result - ensure we get the actual array
      let questionsArray;
      if (typeof result === 'object' && result !== null && 'questions' in result && Array.isArray(result.questions)) {
        // The AI returned { questions: [...] } format
        questionsArray = result.questions;
        console.log('[DEBUG] Extracted questions array from result:', questionsArray);
      } else {
        // Fallback if the structure is different
        questionsArray = Array.isArray(result) ? result : [];
        console.log('[DEBUG] Using result directly as questions array:', questionsArray);
      }
      
      // Update chunk with questions array directly (not nested)
      const updatedChunk: ProcessedChunk = {
        ...chunk,
        questions: questionsArray, // Store the array directly, not nested
        processedDate: new Date().toISOString()
      };
      
      console.log('[DEBUG] Updated chunk with questions:', updatedChunk.questions);
      
      // Save updated chunk
      await ContentProcessor.saveProcessedChunk(updatedChunk);
      
      return updatedChunk;
    } catch (error) {
      console.error('[DEBUG] Error in generateQuestions:', error);
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
    console.log('[DEBUG] Calling processStage for task-generation');
    const result = await this.processStage('task-generation', theoryContent, options);
    console.log('[DEBUG] Tasks received from AI:', result);
    
    // Extract tasks array from the result - ensure we get the actual array
    let tasksArray;
    if (typeof result === 'object' && result !== null && 'tasks' in result && Array.isArray(result.tasks)) {
      // The AI returned { tasks: [...] } format
      tasksArray = result.tasks;
      console.log('[DEBUG] Extracted tasks array from result:', tasksArray);
    } else {
      // Fallback if the structure is different
      tasksArray = Array.isArray(result) ? result : [];
      console.log('[DEBUG] Using result directly as tasks array:', tasksArray);
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
