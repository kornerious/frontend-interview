import axios from 'axios';
import { AIConfig, AnalysisResult } from '../../../utils/aiService';
import { buildLocalLlmAnalysisPrompt } from './localPromptBuilder';

// Available local LLM models
export const LOCAL_LLM_MODELS = {
  LLAMA3: "llama3:latest",
  LLAMA3_EXTENDED: "llama3-extended:latest",
  DEEPSEEK_CODER: "deepseek-coder:6.7b",
  DEEPSEEK_CODER_EXTENDED: "deepseek-coder-extended:latest",
  DEEPSEEK_CODER_V2: "deepseek-coder-v2:16b",
  DEEPSEEK_CODER_V2_EXTENDED: "deepseek-coder-v2-extended:latest",
  DEEPSEEK_R1_14B: "deepseek-r1:14b",
  DEEPSEEK_R1_14B_EXTENDED: "deepseek-r1-14b-extended:latest",
  QWEN3: "qwen3:8b",
  QWEN3_EXTENDED: "qwen3-extended:latest"
};

export interface LlmOptions {
  model: string;
  temperature?: number;
  maxTokens?: number;
}

class LocalLlmService {
  private baseUrl: string = 'http://192.168.0.225:11434';
  private config: AIConfig | null = null;
  private initialized: boolean = false;
  private defaultModel: string = LOCAL_LLM_MODELS.DEEPSEEK_CODER_V2_EXTENDED;

  /**
   * Initialize the Local LLM service
   */
  async initialize(config: AIConfig): Promise<boolean> {
    try {
      // For local LLM, we don't need an API key, but we'll keep the interface consistent
      // We'll use the config to store custom settings if needed
      this.config = config;
      
      // Check if Ollama is running
      try {
        await axios.get(`${this.baseUrl}/api/version`);
      } catch (error) {
        console.error('Ollama service is not running. Please start Ollama with: ollama serve');
        return false;
      }
      
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Error initializing Local LLM service:', error);
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
   * Set the custom Ollama server URL
   */
  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  /**
   * Set the default model to use
   */
  setDefaultModel(model: string): void {
    this.defaultModel = model;
  }

  /**
   * List available models from Ollama
   */
  async listModels(): Promise<string[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/tags`);
      return response.data.models.map((model: any) => model.name);
    } catch (error) {
      console.error('Error listing models:', error);
      return [];
    }
  }

  /**
   * Process content with local LLM
   */
  async processContent(
    content: string,
    options: LlmOptions = { 
      model: LOCAL_LLM_MODELS.DEEPSEEK_CODER_EXTENDED,
      temperature: 0.9, // Maximum temperature for creative question/task generation
      maxTokens: 127000 // Increased to 150K tokens to handle larger chunks
    }
  ): Promise<string> {
    if (!this.initialized) {
      throw new Error('Local LLM service is not initialized');
    }

    try {
      console.log(`Processing content with ${options.model || this.defaultModel}...`);
      console.log(`Content length: ${content.length}`);
      
      const response = await axios.post(`${this.baseUrl}/api/generate`, {
        model: options.model || this.defaultModel,
        prompt: content,
        stream: false,
        options: {
          temperature: 0.9, // Maximum temperature for creative question/task generation
          num_predict: 127000 // Increased to 150K tokens to match our maxTokens setting
        }
      }, {
        timeout: 600000 // 10 minute timeout for large content processing
      });
      
      console.log(`Response received. Length: ${response.data.response.length}`);
      return response.data.response;
    } catch (error) {
      console.error('Error processing content with local LLM:', error);
      throw error;
    }
  }

  /**
   * Analyze markdown content and generate structured JSON
   * This is the main method for content processing
   */
  async analyzeContent(markdownContent: string, _promptTemplate: string): Promise<string> {
    if (!this.initialized) {
      throw new Error('Local LLM service is not initialized');
    }

    try {
      // Use the specialized local LLM prompt builder instead of the general prompt template
      const fullPrompt = buildLocalLlmAnalysisPrompt(markdownContent);
      
      console.log('SENDING TO LOCAL LLM:', fullPrompt.substring(0, 100) + '...');
      console.log('FULL PROMPT LENGTH:', fullPrompt.length);
      
      // Use maximum available tokens for DeepSeek Coder 2 Extended
      const response = await this.processContent(fullPrompt, {
        model: this.defaultModel,
        temperature: 0.9, // Maximum temperature for creative question/task generation
        maxTokens: 127000 // Increased to 150K tokens to handle larger chunks
      });
      
      console.log('RECEIVED FROM LOCAL LLM:', response.substring(0, 100) + '...');
      console.log('FULL RESPONSE LENGTH:', response.length);
      
      return response;
    } catch (error) {
      console.error('Error analyzing content with local LLM:', error);
      throw error;
    }
  }

  /**
   * Compare different models on the same content
   */
  async compareModels(content: string, models: string[] = Object.values(LOCAL_LLM_MODELS)): Promise<Record<string, any>> {
    const results: Record<string, any> = {};
    
    for (const model of models) {
      console.log(`Testing model: ${model}`);
      try {
        const startTime = Date.now();
        const response = await this.processContent(content, { model });
        const endTime = Date.now();
        
        results[model] = {
          success: true,
          processingTime: endTime - startTime,
          responseLength: response.length,
          response: response.substring(0, 100) + '...' // Preview
        };
      } catch (error) {
        results[model] = {
          success: false,
          error: error instanceof Error ? error.message : String(error)
        };
      }
    }
    
    return results;
  }
}

// Create a singleton instance
const localLlmService = new LocalLlmService();
export default localLlmService;
