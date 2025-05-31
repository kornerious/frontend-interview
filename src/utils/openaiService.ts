import { OpenAI } from 'openai';
import { AIService, ConversationMessage } from './aiService';

export interface OpenAIConfig {
  apiKey: string;
  organization?: string;
}

class OpenAIService implements AIService {
  private client: OpenAI | null = null;
  private config: OpenAIConfig | null = null;
  private conversationHistory: Array<{role: 'user' | 'assistant' | 'system', content: string}> = [];
  private isInitializingClient = false;
  private sessionId: string = `session_${Date.now()}`; // Create a unique session ID
  private initialized = false;

  async initialize(config: OpenAIConfig) {
    // Prevent multiple parallel initialization attempts
    if (this.isInitializingClient) {
      // Wait for current initialization to complete
      while (this.isInitializingClient) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this.client !== null;
    }

    this.isInitializingClient = true;

    try {
      // Validate API key format - basic validation only
      if (!config.apiKey || typeof config.apiKey !== 'string' || config.apiKey.trim().length < 30) {
        console.error('Invalid OpenAI API key format');
        this.isInitializingClient = false;
        return false;
      }

      // Exit early if we already have a client with the same API key
      if (
        this.client !== null &&
        this.config?.apiKey === config.apiKey
      ) {
        this.isInitializingClient = false;
        return true;
      }

      // Clean the API key by trimming whitespace
      const sanitizedApiKey = config.apiKey.trim();

      // Set the config with sanitized API key
      this.config = {
        ...config,
        apiKey: sanitizedApiKey
      };

      // Create the client
      this.client = new OpenAI({
        apiKey: sanitizedApiKey,
        organization: config.organization,
        dangerouslyAllowBrowser: true
      });

      // Test the API key with a minimal request
      try {
        // Small request to verify API key works - just get the models list without params
        await this.client.models.list();
      } catch (apiError) {
        console.error('API key validation failed:', apiError);
        this.client = null;
        this.config = null;
        this.isInitializingClient = false;
        return false;
      }

      // Load conversation history from Firebase
      await this.loadConversationHistory();

      this.isInitializingClient = false;
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Error initializing OpenAI client:', error);
      this.client = null;
      this.config = null;
      this.isInitializingClient = false;
      return false;
    }
  }

  isInitialized(): boolean {
    return !!this.client;
  }

  async evaluateAnswer(
    question: string, 
    userAnswer: string, 
    modelAnswer: string
  ): Promise<{
    score: number;
    feedback: string;
    strengths: string[];
    improvementAreas: string[];
  }> {
    if (!this.client) {
      throw new Error('OpenAI service is not initialized. Please add your API key in settings.');
    }

    try {
      const response = await this.client.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert frontend interview evaluator. Your task is to evaluate the candidate's answer to a question and provide constructive feedback.
            
Your evaluation must include:
1. A score from 0-100
2. Brief feedback explaining the score
3. A list of strengths (maximum 3 points)
4. A list of improvement areas (maximum 3 points)

Respond in the following JSON format only:
{
  "score": <number between 0 and 100>,
  "feedback": "<brief feedback>",
  "strengths": ["<strength1>", "<strength2>", "<strength3>"],
  "improvementAreas": ["<area1>", "<area2>", "<area3>"]
}

Do not include any other text in your response.`
          },
          {
            role: "user",
            content: `Question: ${question}\n\nCandidate's Answer: ${userAnswer}\n\nModel Answer: ${modelAnswer}`
          }
        ],
        temperature: 0.5,
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return {
        score: result.score || 0,
        feedback: result.feedback || 'No feedback available',
        strengths: result.strengths || [],
        improvementAreas: result.improvementAreas || []
      };
    } catch (error) {
      console.error('Error evaluating answer with OpenAI:', error);
      return {
        score: 0,
        feedback: 'Error evaluating answer. Please check your API key or try again later.',
        strengths: [],
        improvementAreas: ['Could not evaluate due to an error']
      };
    }
  }

  async getImprovedAnswer(question: string, userAnswer: string): Promise<string> {
    if (!this.client) {
      throw new Error('OpenAI service is not initialized. Please add your API key in settings.');
    }

    try {
      const response = await this.client.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert frontend developer. Your task is to improve the candidate's answer to a interview question while maintaining their original approach and thinking.
            
Provide an improved version of their answer that is well-structured, technically accurate, and demonstrates strong understanding of frontend concepts.`
          },
          {
            role: "user",
            content: `Question: ${question}\n\nOriginal Answer: ${userAnswer}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      return response.choices[0].message.content || 
        'Could not generate improved answer. Please try again later.';
    } catch (error) {
      console.error('Error generating improved answer with OpenAI:', error);
      return 'Error generating improved answer. Please check your API key or try again later.';
    }
  }

  async getConversationResponse(input: string): Promise<string> {
    if (!this.initialized) {
      throw new Error('OpenAI service not initialized');
    }
    if (!this.client) {
      throw new Error('OpenAI client not initialized');
    }

    // Create system message
    const systemMessage = {
      role: 'system' as const,
      content: `You are an expert coding instructor helping users practice for frontend interviews.
      Your goal is to provide helpful, accurate information in a supportive manner.
      If you're unable to answer a question, acknowledge that and suggest resources for further learning.
      Keep responses focused on the topic at hand and prioritize examples and clarity.`
    };

    // Add user message to history
    this.conversationHistory.push({
      role: 'user' as const,
      content: input
    });

    // Prepare messages for the completion
    const messages = [
      systemMessage,
      ...this.conversationHistory.slice(-10) // Keep conversation history limited to last 10 messages
    ];

    try {
      // Call the OpenAI API
      const response = await this.client.chat.completions.create({
        model: "gpt-4o",
        messages,
        temperature: 0.7,
        max_tokens: 2000
      });

      // Get the response content
      const content = response.choices[0]?.message?.content || 'No response generated.';

      // Add assistant response to history
      this.conversationHistory.push({
        role: 'assistant' as const,
        content
      });

      // Save conversation history to database
      await this.saveConversationHistory();

      return content;
    } catch (error) {
      console.error('Error getting conversation response:', error);
      throw error;
    }
  }

  /**
   * Save conversation history to database
   */
  private async saveConversationHistory(): Promise<void> {
    try {
      // Import Firebase service instead of GitHub Gist storage
      const { default: firebaseService } = await import('./firebaseService');
      await firebaseService.saveConversationHistory(this.conversationHistory, this.sessionId);
    } catch (error) {
      console.error('Error saving conversation history to Firebase:', error);
    }
  }
  
  /**
   * Load conversation history from database
   */
  private async loadConversationHistory(): Promise<void> {
    try {
      // Import Firebase service instead of GitHub Gist storage
      const { default: firebaseService } = await import('./firebaseService');
      const history = await firebaseService.getConversationHistory(this.sessionId);
      if (history && history.length > 0) {
        this.conversationHistory = history;
      }
    } catch (error) {
      console.error('Error loading conversation history from Firebase:', error);
    }
  }
  
  /**
   * Clear conversation history
   */
  async clearConversationHistory(): Promise<void> {
    this.conversationHistory = [];
    try {
      const { default: firebaseService } = await import('./firebaseService');
      // Save an empty array to Firebase
      await firebaseService.saveConversationHistory([], this.sessionId);
    } catch (error) {
      console.error('Error clearing conversation history from Firebase:', error);
    }
  }

  /**
   * Start a new conversation
   */
  async startConversation(): Promise<void> {
    // Clear existing conversation history
    await this.clearConversationHistory();
  }

  /**
   * Send a message and get a response
   */
  async sendMessage(message: string): Promise<string> {
    // This is just a wrapper around getConversationResponse
    return this.getConversationResponse(message);
  }

  /**
   * Get the current conversation history
   */
  getConversationHistory(): ConversationMessage[] {
    // Convert our internal format to the interface format
    return this.conversationHistory
      .filter(msg => msg.role !== 'system') // Filter out system messages
      .map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));
  }
}

// Create a singleton instance
const openAIService = new OpenAIService();
export default openAIService;
