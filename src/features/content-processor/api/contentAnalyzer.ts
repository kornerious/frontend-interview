import claudeService from '../../../utils/claudeService';
import { AIAnalysisResult } from '../types';
import { buildAnalysisPrompt } from './promptBuilder';
import { processResponse } from './responseProcessor';

/**
 * Content Analyzer that uses Claude to analyze markdown content
 */
export class ContentAnalyzer {
  /**
   * Analyzes a chunk of markdown content using Claude
   * @param markdownChunk The chunk of markdown content to analyze
   * @returns Structured content categorized as theory, questions, and tasks
   */
  static async analyzeContent(markdownChunk: string): Promise<AIAnalysisResult> {
    // Ensure Claude service is initialized
    if (!claudeService.isInitialized()) {
      throw new Error('Claude service is not initialized. Please add your API key in settings.');
    }

    try {
      // Format the prompt for Claude
      const prompt = buildAnalysisPrompt(markdownChunk);
      
      // Send the prompt to Claude
      const response = await claudeService.sendMessage(prompt);
      
      // Process the response
      return processResponse(response);
    } catch (error) {
      console.error('Error analyzing content with Claude:', error);
      return {
        theory: [],
        questions: [],
        tasks: []
      };
    }
  }
}
