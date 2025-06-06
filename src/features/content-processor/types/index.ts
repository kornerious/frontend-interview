import { TheoryBlock, Question, CodeTask, CodeExample } from '@/types';

/**
 * Processing state for the content processor
 */
export interface ProcessingState {
  currentPosition: number;
  totalLines: number;
  isProcessing: boolean;
  lastProcessedDate?: string;
  error: string | null;
}

/**
 * Logical block information from AI analysis
 */
export interface LogicalBlockInfo {
  suggestedEndLine: number;
}

/**
 * AI analysis result from processing a chunk
 */
export interface AIAnalysisResult {
  theory: TheoryBlock[];
  questions: Question[];
  tasks: CodeTask[];
  logicalBlockInfo?: LogicalBlockInfo;
}

/**
 * Processed chunk of content
 */
export interface ProcessedChunk extends AIAnalysisResult {
  id: string;
  startLine: number;
  endLine: number;
  processedDate: string;
  completed: boolean;
}

/**
 * AI service configuration
 */
export interface AIServiceConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  prompt: string;
}
