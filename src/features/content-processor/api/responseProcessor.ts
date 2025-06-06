import { AIAnalysisResult } from '../types';
import { TheoryBlock, Question, CodeTask } from '../../../types';
import { sanitizeTheoryBlock, sanitizeQuestion, sanitizeTask } from './sanitizers';

/**
 * Processes the raw response from Claude
 * @param response Raw response string
 * @returns Processed content with theory, questions, tasks, and logical block info
 */
export function processResponse(response: string): AIAnalysisResult & {
  logicalBlockInfo: {
    suggestedEndLine: number;
  };
} {
  try {
    // Extract JSON content from the response
    const jsonContent = extractJsonFromResponse(response);
    
    // Parse the JSON
    const parsedContent = JSON.parse(jsonContent);
    console.log('PARSED CONTENT:', JSON.stringify(parsedContent).substring(0, 200) + '...');
    
    // Process each section with proper typing
    const theory = Array.isArray(parsedContent.theory) 
      ? parsedContent.theory.map((item: Partial<TheoryBlock>) => sanitizeTheoryBlock(item))
      : [];
    
    const questions = Array.isArray(parsedContent.questions)
      ? parsedContent.questions.map((item: Partial<Question>) => sanitizeQuestion(item))
      : [];
    
    const tasks = Array.isArray(parsedContent.tasks)
      ? parsedContent.tasks.map((item: Partial<CodeTask>) => sanitizeTask(item))
      : [];
    
    // Extract logical block info if available
    const logicalBlockInfo = parsedContent.logicalBlockInfo || {
      suggestedEndLine: -1 // -1 indicates no suggestion
    };
    
    console.log(`PROCESSED: ${theory.length} theory blocks, ${questions.length} questions, and ${tasks.length} tasks`);
    console.log('LOGICAL BLOCK INFO:', JSON.stringify(logicalBlockInfo));
    
    return {
      theory,
      questions,
      tasks,
      logicalBlockInfo
    };
  } catch (error) {
    console.error('ERROR PROCESSING AI RESPONSE:', error);
    console.error('RAW RESPONSE SAMPLE:', response.substring(0, 500) + '...');
    
    return {
      theory: [],
      questions: [],
      tasks: [],
      logicalBlockInfo: {
        suggestedEndLine: -1
      }
    };
  }
}

/**
 * Extracts JSON content from the AI response
 * @param response Raw response string from the AI
 * @returns JSON string extracted from the response
 */
export function extractJsonFromResponse(response: string): string {
  // Log the raw response for debugging
  console.log('CLAUDE RAW RESPONSE: ', response);
  console.log('CLAUDE RESPONSE LENGTH:', response.length);
  
  // Try to extract JSON from the response
  const jsonMatch = response.match(/\{[\s\S]*\}/); 
  if (!jsonMatch) {
    console.error('NO JSON FOUND IN CLAUDE RESPONSE');
    // Return a minimal valid JSON structure
    return JSON.stringify({
      logicalBlockInfo: { isComplete: false, suggestedEndLine: -1 },
      theory: [],
      questions: [],
      tasks: []
    });
  }
  
  // Get the JSON string
  const jsonString = jsonMatch[0];
  console.log('EXTRACTED JSON (first 500 chars):', jsonString.substring(0, 500) + (jsonString.length > 500 ? '...' : ''));
  console.log('EXTRACTED JSON LENGTH:', jsonString.length);
  
  return jsonString;
}
