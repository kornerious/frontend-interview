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
        console.log('Gemini service initialized with environment variable');
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
      console.log(`Processing content with Gemini 2.5 Flash Preview...`);
      console.log(`Content length: ${content.length}`);
      
      // Prepare request payload according to Gemini 2.5 Flash API documentation
      const requestPayload = {
        contents: [
          {
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
      
      console.log('GEMINI REQUEST PAYLOAD:');
      console.log(JSON.stringify(requestPayload, null, 2));
      
      // Make the API request with better error handling
      console.log(`Sending request to Gemini API: ${GEMINI_API_URL}?key=*****`);
      
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
      
      // Log the full response structure
      console.log('FULL RESPONSE STRUCTURE FROM GEMINI API:');
      console.log(JSON.stringify(response.data, null, 2));
      
      // Validate response structure
      if (!response.data || !response.data.candidates || !response.data.candidates[0] ||
          !response.data.candidates[0].content || !response.data.candidates[0].content.parts ||
          !response.data.candidates[0].content.parts[0] || !response.data.candidates[0].content.parts[0].text) {
        console.error('Invalid response structure from Gemini API');
        console.error('Response data:', response.data);
        throw new Error('Invalid response structure from Gemini API');
      }
      
      // Extract the text from the response
      const responseText = response.data.candidates[0].content.parts[0].text;
      console.log(`Response received. Length: ${responseText.length}`);
      console.log('RESPONSE TEXT FROM GEMINI:');
      console.log(responseText);
      
      return responseText;
    } catch (error) {
      console.error('Error processing content with Gemini:');
      
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:');
        console.error('Status:', error.response?.status);
        console.error('Status text:', error.response?.statusText);
        console.error('Response data:', error.response?.data);
        console.error('Request config:', error.config);
        
        const status = error.response?.status;
        if (status === 400) {
          console.error('Bad request - check API key and request format');
        } else if (status === 401 || status === 403) {
          console.error('Authentication error - check your API key');
        } else if (status === 429) {
          console.error('Rate limit exceeded - slow down requests');
        } else if (status && status >= 500) {
          console.error('Server error - Gemini API might be experiencing issues');
        }
      } else {
        console.error('Non-Axios error:', error);
      }
      
      throw error;
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
      
      console.log('SENDING TO GEMINI (FULL PROMPT):');
      console.log(fullPrompt);
      console.log('FULL PROMPT LENGTH:', fullPrompt.length);
      
      const response = await this.processContent(fullPrompt);
      
      console.log('RECEIVED FROM GEMINI (FULL RESPONSE):');
      console.log(response);
      console.log('FULL RESPONSE LENGTH:', response.length);
      
      // Use the existing sanitizeAIResponse function to handle JSON parsing
      try {
        const parsedJson = sanitizeAIResponse(response);
        console.log('Successfully parsed response as JSON using sanitizeAIResponse');
        return parsedJson;
      } catch (error) {
        console.error('Failed to parse Gemini response as JSON:', error);
        throw new Error('Failed to parse Gemini response as JSON. Please check the prompt and response format.');
      }
    } catch (error) {
      console.error('Error analyzing content with Gemini:', error);
      throw error;
    }
  }


}

// Create a singleton instance
const geminiService = new GeminiService();
export default geminiService;
