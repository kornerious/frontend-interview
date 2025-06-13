import claudeService from '../../../utils/claudeService';
import localLlmService from './localLlmService';
import { AIAnalysisResult } from '../types';
import { buildAnalysisPrompt } from './promptBuilder';
import { processResponse } from './responseProcessor';

/**
 * Content Analyzer that uses either Claude or local LLM models to analyze markdown content
 */
export class ContentAnalyzer {
  /**
   * Process content with a custom prompt
   * @param content Content to process
   * @param prompt Custom prompt to use
   * @param options Optional processing options
   * @returns Raw AI response
   */
  static async processWithPrompt(
    content: string,
    prompt: string,
    options?: { useLocalLlm?: boolean; localLlmModel?: string }
  ): Promise<string> {
    // Determine which service to use
    if (options?.useLocalLlm) {
      // Use local LLM service
      if (!localLlmService.isInitialized()) {
        await localLlmService.initialize({ apiKey: '' });
      }
      
      if (!localLlmService.isInitialized()) {
        throw new Error('Local LLM service could not be initialized. Is Ollama running?');
      }
      
      try {
        console.log(`Processing content with local LLM model: ${options.localLlmModel || 'default'}`);
        
        // Set the model if specified
        if (options.localLlmModel) {
          localLlmService.setDefaultModel(options.localLlmModel);
        }
        
        // Send the prompt to local LLM
        return await localLlmService.processContent(prompt);
      } catch (error) {
        console.error('Error processing content with local LLM:', error);
        throw error;
      }
    } else {
      // Use Claude service
      if (!claudeService.isInitialized()) {
        throw new Error('Claude service is not initialized. Please add your API key in settings.');
      }

      try {
        // Send the prompt to Claude
        return await claudeService.sendMessage(prompt);
      } catch (error) {
        console.error('Error processing content with Claude:', error);
        throw error;
      }
    }
  }
  
  /**
   * Analyzes a chunk of markdown content using Claude or local LLM
   * @param markdownChunk The chunk of markdown content to analyze
   * @param options Optional processing options
   * @returns Structured content categorized as theory, questions, and tasks
   */
  static async analyzeContent(
    markdownChunk: string,
    options?: { useLocalLlm?: boolean; localLlmModel?: string }
  ): Promise<AIAnalysisResult> {
    // Format the prompt
    const prompt = buildAnalysisPrompt(markdownChunk);
    
    // Determine which service to use
    if (options?.useLocalLlm) {
      // Use local LLM service
      if (!localLlmService.isInitialized()) {
        await localLlmService.initialize({ apiKey: '' });
      }
      
      if (!localLlmService.isInitialized()) {
        throw new Error('Local LLM service could not be initialized. Is Ollama running?');
      }
      
      try {
        console.log(`Processing content with local LLM model: ${options.localLlmModel || 'default'}`);
        
        // Set the model if specified
        if (options.localLlmModel) {
          localLlmService.setDefaultModel(options.localLlmModel);
        }
        
        // Send the prompt to local LLM
        const response = await localLlmService.analyzeContent(markdownChunk, prompt);
        
        // Process the response
        return processResponse(response);
      } catch (error) {
        console.error('Error analyzing content with local LLM:', error);
        throw error;
      }
    } else {
      // Use Claude service
      if (!claudeService.isInitialized()) {
        throw new Error('Claude service is not initialized. Please add your API key in settings.');
      }

      try {
        // Send the prompt to Claude
        const response = await claudeService.sendMessage(prompt);
        
        // Process the response
        return processResponse(response);
      } catch (error) {
        console.error('Error analyzing content with Claude:', error);
        throw error;
      }
    }
  }
}
