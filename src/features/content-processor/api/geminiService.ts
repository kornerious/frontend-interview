import axios from 'axios';
import { AIConfig } from '../../../utils/aiService';
import { buildGeminiAnalysisPrompt } from './geminiPromptBuilder';

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
   */
  async processContent(
    content: string,
    options: GeminiOptions = { 
      temperature: 1,
      maxOutputTokens: 65536
    }
  ): Promise<string> {
    if (!this.initialized || !this.apiKey) {
      throw new Error('Gemini service is not initialized or missing API key');
    }

    try {
      console.log(`Processing content with Gemini 2.5 Flash Preview...`);
      console.log(`Content length: ${content.length}`);
      
      const response = await axios.post(
        `${GEMINI_API_URL}?key=${this.apiKey}`,
        {
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
            temperature: options.temperature,
            maxOutputTokens: options.maxOutputTokens,
            topP: 0.95,
            topK: 40
          },
          tools: [
            {
              functionDeclarations: [
                {
                  name: "executeCode",
                  description: "Executes code to solve complex tasks",
                  parameters: {
                    type: "object",
                    properties: {
                      language: {
                        type: "string",
                        description: "The programming language of the code"
                      },
                      code: {
                        type: "string",
                        description: "The code to execute"
                      }
                    },
                    required: ["language", "code"]
                  }
                }
              ]
            }
          ],
          toolConfig: {
            toolChoice: options.enableCodeExecution ? "auto" : "none"
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 120000 // 2 minute timeout
        }
      );
      
      // Extract the text from the response
      const responseText = response.data.candidates[0].content.parts[0].text;
      console.log(`Response received. Length: ${responseText.length}`);
    
    // Response backup removed as requested
    
    return responseText;
    } catch (error) {
      console.error('Error processing content with Gemini:', error);
      throw error;
    }
  }

  /**
   * Analyze markdown content and generate structured JSON
   */
  async analyzeContent(markdownContent: string): Promise<string> {
    if (!this.initialized) {
      throw new Error('Gemini service is not initialized');
    }

    try {
      // Use the specialized Gemini prompt builder
      const fullPrompt = buildGeminiAnalysisPrompt(markdownContent);
      
      console.log('SENDING TO GEMINI:', fullPrompt.substring(0, 100) + '...');
      console.log('FULL PROMPT LENGTH:', fullPrompt.length);
      
      const response = await this.processContent(fullPrompt, {
        temperature: 1.0,
        maxOutputTokens: 65536,
        enableCodeExecution: true
      });
      
      console.log('RECEIVED FROM GEMINI:', response.substring(0, 100) + '...');
      console.log('FULL RESPONSE LENGTH:', response.length);
      
      return response;
    } catch (error) {
      console.error('Error analyzing content with Gemini:', error);
      throw error;
    }
  }


}

// Create a singleton instance
const geminiService = new GeminiService();
export default geminiService;
