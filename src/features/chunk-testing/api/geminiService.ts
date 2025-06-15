import axios from 'axios';
import { AIConfig } from '../../../utils/aiService';
import { buildGeminiAnalysisPrompt } from '../utils/geminiPromptBuilder';
import { sanitizeAIResponse } from './sanitizers/aiResponseSanitizer';
import { useSettingsStore } from '../../progress/useSettingsStoreFirebase';

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
   * Initialize with settings store
   */
  private initializeWithEnvVar(): void {
    try {
      // First try environment variable
      const envApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      
      // Then try settings store
      const settingsApiKey = useSettingsStore.getState().settings.geminiApiKey;
      
      // Use either source, prioritizing env var
      const apiKey = envApiKey || settingsApiKey;
      
      if (apiKey) {
        this.apiKey = apiKey;
        this.initialized = true;
        console.log('Initialized Gemini service with API key');
      } else {
        console.warn('No Gemini API key found in environment or settings store');
      }
    } catch (error) {
      console.error('Error initializing Gemini service:', error);
    }
  }

  /**
   * Initialize the service with API key
   * @param config Configuration object with API key
   * @returns Promise resolving to boolean indicating success
   */
  async initialize(config: AIConfig): Promise<boolean> {
    try {
      if (config.apiKey) {
        // Use provided API key
        this.apiKey = config.apiKey;
        this.initialized = true;
        console.log('Initialized Gemini service with provided API key');
        return true;
      } else {
        // Try to get API key from settings store or environment variable
        const settingsApiKey = useSettingsStore.getState().settings.geminiApiKey;
        const envApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        
        // Use either source, prioritizing settings store
        const apiKey = settingsApiKey || envApiKey;
        
        if (apiKey) {
          this.apiKey = apiKey;
          this.initialized = true;
          console.log('Initialized Gemini service with API key from settings store or environment');
          return true;
        } else {
          console.warn('No Gemini API key available');
          return false;
        }
      }
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
   * @param chunkRange Optional chunk range for logging (e.g., "100-199")
   * @param config Optional configuration to override default settings
   */
  public async processContent(
    content: string,
    chunkRange?: string,
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
        
        // Extract the text from the response - the sanitizer will handle any issues with the structure
        const responseText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        // Format the chunk range for logging
        const formattedChunkRange = chunkRange ? `chunk ${chunkRange}` : 'current chunk';
      
      // Simple log with chunk info
      console.log(`Received Gemini response for ${formattedChunkRange}`);
      
      // Return early if we got an empty response
      if (!responseText) {
        console.error('Empty response from Gemini API');
        return '';  // Return empty string, sanitizer will handle it
      }
      

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
   * @returns Parsed JSON object from Gemini response or null if parsing fails
   */
  async analyzeContent(markdownContent: string, chunkRange?: string): Promise<any | null> {
    if (!this.initialized) {
      throw new Error('Gemini service is not initialized');
    }

    try {
      // Use the specialized Gemini prompt builder
      const fullPrompt = buildGeminiAnalysisPrompt(markdownContent);
      console.log(`Analyzing ${chunkRange ? `chunk ${chunkRange}` : 'content'} with Gemini...`);
      
      // Pass the chunk range to processContent for logging
      const response = await this.processContent(fullPrompt, chunkRange);
      
      // Use the updated sanitizeAIResponse function to handle JSON parsing
      // It now returns null for invalid JSON instead of throwing an error
      const parsedJson = sanitizeAIResponse(response);
      
      if (parsedJson === null) {
        // Log skipped chunks with range information
        const skippedChunkInfo = chunkRange ? `chunk ${chunkRange}` : 'current chunk';
        console.error(`${skippedChunkInfo} rejected, JSON incorrect format`);
        return null;
      }
      
      console.log(`Successfully analyzed ${chunkRange ? `chunk ${chunkRange}` : 'content'}`);
      return parsedJson;
    } catch (error) {
      // Log the error with chunk information
      const errorInfo = chunkRange ? `chunk ${chunkRange}` : 'content';
      console.error(`Error analyzing ${errorInfo}:`, error);
      
      // Return null for any errors to allow skipping this chunk
      return null;
    }
  }
}

// Create a singleton instance
const geminiService = new GeminiService();
export default geminiService;
