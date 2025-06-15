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
  private baseUrl: string = 'http://localhost:11434';
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
        // Console log removed
        return false;
      }
      
      this.initialized = true;
      return true;
    } catch (error) {
      // Console log removed
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
      // Console log removed
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
      // Console log removed
      // Console log removed
      
      const response = await axios.post(`${this.baseUrl}/api/generate`, {
        model: this.defaultModel,
        prompt: content,
        stream: false,
        system: "You are a JSON generator. Output ONLY valid JSON with no explanations or thinking process.",
        format: 'json',
        options: {
          temperature: 1, // Zero temperature for deterministic output
          num_predict: 65536, // Token limit
        }
      }, {
        timeout: 200000 // 10 minute timeout for large content processing
      });
      
      // Console log removed
      return response.data.response;
    } catch (error) {
      // Console log removed
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
      
      // Console log removed
      // Console log removed
      
      // Use maximum available tokens for DeepSeek Coder 2 Extended
      const response = await this.processContent(fullPrompt, {
        model: this.defaultModel,
        temperature: 1, // Maximum temperature for creative question/task generation
        maxTokens: 65536 // Increased to 150K tokens to handle larger chunks
      });
      
      // Console log removed
      // Console log removed
      
      return response;
    } catch (error) {
      // Console log removed
      throw error;
    }
  }

  /**
   * Compare different models on the same content
   */
  async compareModels(content: string, models: string[] = Object.values(LOCAL_LLM_MODELS)): Promise<Record<string, any>> {
    const results: Record<string, any> = {};
    
    for (const model of models) {
      // Console log removed
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
