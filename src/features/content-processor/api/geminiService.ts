import axios from 'axios';
import { AIConfig } from '../../../utils/aiService';
import { buildGeminiAnalysisPrompt } from './geminiPromptBuilder';
import { sanitizeAIResponse } from './sanitizers/aiResponseSanitizer';

// Gemini API configuration
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent';

export interface GeminiOptions {
  temperature?: number;
  maxOutputTokens?: number;
  apiKey?: string;
  enableCodeExecution?: boolean;
}

class GeminiService {
  private apiKey: string | null = null;
  private initialized: boolean = false;

  constructor() {
    // Try to initialize with environment variable
    this.initializeWithEnvVar();
  }

  /**
   * Initialize with environment variable
   */
  private initializeWithEnvVar(): void {
    try {
      const envApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (envApiKey) {
        this.apiKey = envApiKey;
        this.initialized = true;
        // Console log removed
      }
    } catch (error) {
      console.error('Error initializing Gemini service with environment variable:', error);
    }
  }

  /**
   * Initialize the Gemini service with config
   */
  async initialize(config: AIConfig): Promise<boolean> {
    try {
      if (!config.apiKey) {
        console.error('Gemini API key is required');
        return false;
      }
      
      this.apiKey = config.apiKey;
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Error initializing Gemini service:', error);
      return false;
    }
  }

  /**
   * Check if the service is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Process content with Gemini API
   * @param content The content to process
   * @param config Optional configuration to override default settings
   */
  async processContent(
    content: string,
    config?: {
      temperature?: number;
      maxOutputTokens?: number;
      topP?: number;
    }
  ): Promise<string> {
    if (!this.initialized || !this.apiKey) {
      throw new Error('Gemini service is not initialized or missing API key');
    }

    try {
      // Processing content with Gemini 2.5 Flash Preview
      // Content length tracking removed
      
      // Prepare request payload according to Gemini 2.5 Flash API documentation
      const requestPayload = {
        contents: [
          { role: "user",
          parts: [
              {
                text: content
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 1.0,
          maxOutputTokens: 65000,
          topP: 0.95,
        },
      };
      
      // Request payload logging removed
      // Request payload details removed
      
      // Make the API request with better error handling
      // API request logging removed
      
      const response = await axios.post(
        `${GEMINI_API_URL}?key=${this.apiKey}`,
        requestPayload,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 600000 // 10 minute timeout
        }
      );
      
      // Response logging removed
      
      // Validate response structure
      if (!response.data || !response.data.candidates || !response.data.candidates[0] ||
          !response.data.candidates[0].content || !response.data.candidates[0].content.parts ||
          !response.data.candidates[0].content.parts[0] || !response.data.candidates[0].content.parts[0].text) {
        throw new Error('Invalid response structure from Gemini API');
      }
      
      // Extract the text from the response
      const responseText = response.data.candidates[0].content.parts[0].text;
      // Get chunk info from the request payload if available
      const chunkInfo = content.includes('lines') ? content.match(/lines (\d+)-(\d+)/) : null;
      const chunkRange = chunkInfo ? `chunk ${chunkInfo[1]}-${chunkInfo[2]}` : 'current chunk';
      
      // Keep only this one console log showing chunk info and last 100 symbols
      console.log(`Gemini response for ${chunkRange}: ...${responseText.slice(-100)}`);
      
      return responseText;
    } catch (error) {
      // Type-safe error handling
      if (axios.isAxiosError(error)) {
        const errorMessage = `Gemini API error: ${error.response?.status || 'unknown'} - ${error.response?.statusText || error.message}`;
        throw new Error(errorMessage);
      } else if (error instanceof Error) {
        throw new Error(`Error: ${error.message}`);
      } else {
        throw new Error('Unknown error occurred');
      }
    }
  }

  /**
   * Analyze markdown content and generate structured JSON
   * @returns Parsed JSON object from Gemini response
   */
  async analyzeContent(markdownContent: string): Promise<any> {
    if (!this.initialized) {
      throw new Error('Gemini service is not initialized');
    }

    try {
      // Use the specialized Gemini prompt builder
      const fullPrompt = buildGeminiAnalysisPrompt(markdownContent);
      
      const response = await this.processContent(fullPrompt);
      
      // Use the existing sanitizeAIResponse function to handle JSON parsing
      try {
        const parsedJson = sanitizeAIResponse(response);
        return parsedJson;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to parse Gemini response as JSON: ${errorMessage}`);
      }
    } catch (error) {
      throw error;
    }
  }


}

// Create a singleton instance
const geminiService = new GeminiService();
export default geminiService;
