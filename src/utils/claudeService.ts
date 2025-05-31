import { Anthropic } from '@anthropic-ai/sdk';
import { AIConfig, AnalysisResult } from './aiService';

// According to Anthropic's documentation, these are the available Claude models
const CLAUDE_MODELS = {
  SONNET: "claude-3-sonnet-20240229", // Original Claude 3 Sonnet
  SONNET_V2: "claude-3-5-sonnet-20240620", // Claude 3.5 Sonnet
  SONNET_4: "claude-sonnet-4-20250514", // Claude 4 Sonnet (newest model)
  OPUS: "claude-3-opus-20240229",
  HAIKU: "claude-3-haiku-20240307"
};

class ClaudeService {
  private client: Anthropic | null = null;
  private config: AIConfig | null = null;
  private conversationHistory: Array<{role: 'user' | 'assistant' | 'system', content: string}> = [];
  private model = CLAUDE_MODELS.SONNET_4; // Use Claude 4 Sonnet - the most advanced model
  private sessionId: string = 'default-session';
  private initialized: boolean = false;

  /**
   * Initialize the Claude client with the provided configuration
   */
  async initialize(config: AIConfig): Promise<boolean> {
    try {
      if (!config.apiKey) {
        console.error('Claude API key is required');
        return false;
      }
      
      // Basic validation for API key format
      if (typeof config.apiKey !== 'string' || config.apiKey.trim().length < 30) {
        console.error('Invalid Claude API key format');
        return false;
      }

      // Use a cleaned version of the API key
      const sanitizedApiKey = config.apiKey.trim();
      
      // Create Anthropic client with the dangerouslyAllowBrowser option
      this.client = new Anthropic({
        apiKey: sanitizedApiKey,
        dangerouslyAllowBrowser: true // Required for browser environments
      });
      
      this.config = {
        ...config,
        apiKey: sanitizedApiKey
      };

      // Load conversation history from Firebase
      await this.loadConversationHistory();
      
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Error initializing Claude client:', error);
      this.client = null;
      this.config = null;
      return false;
    }
  }

  isInitialized(): boolean {
    return this.initialized && !!this.client;
  }

  /**
   * Evaluate a user's answer against a model answer
   */
  async evaluateAnswer(
    question: string, 
    userAnswer: string, 
    modelAnswer: string
  ): Promise<AnalysisResult> {
    if (!this.client) {
      throw new Error('Claude service is not initialized. Please add your API key in settings.');
    }

    try {

      // Break down API call into steps with separate try/catch for better error detection
      let response;
      try {
        // Create a timeout promise to handle potential silent failures
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('Claude API call timed out after 15 seconds'));
          }, 15000); // 15 second timeout
        });
        
        // Race the API call against the timeout
        response = await Promise.race<any>([
          this.client.messages.create({
            model: this.model,
            max_tokens: 1000,
            temperature: 0.5,
            system: "You are an expert frontend developer evaluating interview answers. Always respond with valid JSON.",
            messages: [
              {
                role: "user",
                content: `Evaluate this interview answer.

Question: ${question}

User Answer: ${userAnswer}

Model Answer: ${modelAnswer}

Respond with ONLY a JSON object in this format:
{
  "score": 75,
  "feedback": "Brief feedback here",
  "strengths": ["Strength 1", "Strength 2"],
  "improvementAreas": ["Area 1", "Area 2"]
}`
              }
            ],
          }),
          timeoutPromise
        ]);

      } catch (apiError) {
        console.error('Error during Claude API call:', apiError);
        throw apiError;
      }

      // Parse JSON from the response content
      const contentBlock = response.content[0];
      if (!('text' in contentBlock)) {
        console.error('Unexpected response format:', contentBlock);
        throw new Error('Unexpected response format from Claude');
      }

      // Extract the text content
      const responseText = contentBlock.text;

      // Attempt to find JSON in the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        try {
          // Try to parse the JSON
          const jsonText = jsonMatch[0];
          const result = JSON.parse(jsonText) as AnalysisResult;
          
          // Validate result has required fields
          if (typeof result.score !== 'number') {
            result.score = 0;
          }
          
          if (!result.feedback) {
            result.feedback = 'No feedback provided';
          }
          
          if (!Array.isArray(result.strengths) || result.strengths.length === 0) {
            result.strengths = ['Could not identify strengths'];
          }
          
          if (!Array.isArray(result.improvementAreas) || result.improvementAreas.length === 0) {
            result.improvementAreas = ['Could not identify improvement areas'];
          }
          
          return result;
        } catch (parseError) {
          console.error('Failed to parse JSON from Claude response:', parseError);
          throw new Error('Invalid JSON in Claude response');
        }
      } else {
        console.error('No JSON found in response:', responseText);
        throw new Error('No JSON found in Claude response');
      }
    } catch (error) {
      console.error('Error evaluating answer with Claude:', error);
      return {
        score: 0,
        feedback: 'Error evaluating answer. Please check your API key or try again later.',
        strengths: [],
        improvementAreas: ['Could not evaluate due to an error']
      };
    }
  }

  /**
   * Get an improved version of a user's answer
   */
  async getImprovedAnswer(question: string, userAnswer: string): Promise<string> {
    if (!this.client) {
      throw new Error('Claude service is not initialized. Please add your API key in settings.');
    }

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 2000,
        temperature: 0.7,
        system: "You are an expert frontend developer helping improve interview answers.",
        messages: [
          {
            role: "user",
            content: `Improve the candidate's answer to this frontend interview question while maintaining their original approach.

Question: ${question}

Original Answer: ${userAnswer}

Provide an improved version that is well-structured, technically accurate, and demonstrates strong understanding of frontend concepts.`
          }
        ],
      });

      // Extract the text content
      const contentBlock = response.content[0];
      if (!('text' in contentBlock)) {
        throw new Error('Unexpected response format from Claude');
      }
      return contentBlock.text;
    } catch (error) {
      console.error('Error generating improved answer with Claude:', error);
      return 'Error generating improved answer. Please check your API key or try again later.';
    }
  }

  /**
   * Get a response for an interactive conversation
   */
  async getConversationResponse(input: string): Promise<string> {
    if (!this.client) {
      throw new Error('Claude client not initialized');
    }

    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      content: input
    });

    try {
      // Format messages for Claude's API
      const messages = this.conversationHistory
        .filter(msg => msg.role !== 'system')
        .map(msg => ({
          role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
          content: msg.content
        }));

      // Call the Claude API
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 2000,
        temperature: 0.7,
        system: "You are an expert coding instructor helping users practice for frontend interviews. Your goal is to provide helpful, accurate information in a supportive manner. If you're unable to answer a question, acknowledge that and suggest resources for further learning. Keep responses focused on the topic at hand and prioritize examples and clarity.",
        messages,
      });

      // Get the response content
      const contentBlock = response.content[0];
      if (!('text' in contentBlock)) {
        throw new Error('Unexpected response format from Claude');
      }
      const content = contentBlock.text;

      // Add assistant response to history
      this.conversationHistory.push({
        role: 'assistant',
        content
      });

      // Save the updated conversation history to Firebase
      await this.saveConversationHistory();

      return content;
    } catch (error) {
      console.error('Error getting conversation response from Claude:', error);
      throw error;
    }
  }

  /**
   * Clear conversation history
   */
  async clearConversationHistory(): Promise<void> {
    this.conversationHistory = [];
    try {
      // Import Firebase service to avoid circular dependencies
      const { default: firebaseService } = await import('./firebaseService');
      // Save an empty array to Firebase
      await firebaseService.saveConversationHistory([], this.sessionId);
    } catch (error) {
      console.error('Error clearing conversation history from Firebase:', error);
    }
  }

  /**
   * Save conversation history to Firebase
   */
  private async saveConversationHistory(): Promise<void> {
    try {
      // Import Firebase service to avoid circular dependencies
      const { default: firebaseService } = await import('./firebaseService');
      await firebaseService.saveConversationHistory(this.conversationHistory, this.sessionId);
    } catch (error) {
      console.error('Error saving conversation history to Firebase:', error);
    }
  }

  /**
   * Load conversation history from Firebase
   */
  private async loadConversationHistory(): Promise<void> {
    try {
      // Import Firebase service to avoid circular dependencies
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
   * Get conversation history
   */
  getConversationHistory(): { role: 'user' | 'assistant', content: string }[] {
    // Filter out system messages and convert to the format expected by AIService interface
    return this.conversationHistory
      .filter(msg => msg.role !== 'system')
      .map(msg => ({
        role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      }));
  }

  /**
   * Start a new conversation
   */
  async startConversation(): Promise<void> {
    this.clearConversationHistory();
  }

  /**
   * Send a message and get a response
   */
  async sendMessage(message: string): Promise<string> {
    return this.getConversationResponse(message);
  }
}

// Create a singleton instance
const claudeService = new ClaudeService();
export default claudeService;