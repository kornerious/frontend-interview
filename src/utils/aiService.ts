import { AIProvider } from '@/types';
// Import service implementations directly to avoid circular dependency issues
import openaiService from './openaiService';
// We'll get claudeService differently to avoid circular dependencies

export interface AIConfig {
  apiKey: string;
  organization?: string;
}

export interface AnalysisResult {
  score: number;
  feedback: string;
  strengths: string[];
  improvementAreas: string[];
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIService {
  initialize(config: AIConfig): Promise<boolean>;
  isInitialized(): boolean;
  
  evaluateAnswer(
    question: string,
    userAnswer: string,
    modelAnswer: string
  ): Promise<AnalysisResult>;
  
  getImprovedAnswer(
    question: string,
    userAnswer: string
  ): Promise<string>;
  
  getConversationResponse(
    message: string
  ): Promise<string>;
  
  clearConversationHistory(): Promise<void>;
  
  startConversation(): Promise<void>;
  sendMessage(message: string): Promise<string>;
  getConversationHistory(): ConversationMessage[];
}

// Factory to get the correct AI service based on provider
export async function getAIService(provider: AIProvider): Promise<AIService> {
  switch (provider) {
    case 'claude':
      try {
        // Dynamic import to avoid circular dependency
        const claudeModule = await import('./claudeService');
        return claudeModule.default;
      } catch (error) {
        console.error('Failed to load Claude service:', error);
        return openaiService; // Fallback
      }
    case 'gemini':
      try {
        // Dynamic import to avoid circular dependency
        const geminiModule = await import('./geminiService');
        return geminiModule.default;
      } catch (error) {
        console.error('Failed to load Gemini service:', error);
        return openaiService; // Fallback
      }
    case 'openai':
    default:
      return openaiService;
  }
}
