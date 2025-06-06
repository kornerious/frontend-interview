import { AIAnalysisResult } from '../types';
import { sanitizeTheoryBlock } from './sanitizers/theorySanitizer';
import { sanitizeQuestion } from './sanitizers/questionSanitizer';
import { sanitizeTask } from './sanitizers/taskSanitizer';
import { TheoryBlock, Question, CodeTask } from '../../../types';

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
    const parsedJson = extractJsonFromResponse(response);
    if (!parsedJson) {
      console.error('Failed to extract JSON from Claude response');
      return {
        theory: [],
        questions: [],
        tasks: [],
        logicalBlockInfo: {
          suggestedEndLine: -1
        }
      };
    }
    
    // Process each section with proper typing
    const theory = Array.isArray(parsedJson.theory) 
      ? parsedJson.theory.map((item: Partial<TheoryBlock>) => sanitizeTheoryBlock(item))
      : [];
    
    const questions = Array.isArray(parsedJson.questions)
      ? parsedJson.questions.map((item: Partial<Question>) => sanitizeQuestion(item))
      : [];
    
    const tasks = Array.isArray(parsedJson.tasks)
      ? parsedJson.tasks.map((item: Partial<CodeTask>) => sanitizeTask(item))
      : [];
    
    // Extract logical block info if available
    const logicalBlockInfo = parsedJson.logicalBlockInfo || {
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
 * @returns Parsed JSON object or null if parsing fails
 */
export function extractJsonFromResponse(response: string): any {
  // Log the raw response for debugging
  console.log('CLAUDE RAW RESPONSE LENGTH:', response.length);
  console.log('CLAUDE RAW RESPONSE PREVIEW:', response.substring(0, 200) + '...');
  
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/); 
    if (!jsonMatch) {
      console.error('NO JSON FOUND IN CLAUDE RESPONSE');
      // Return a minimal valid JSON structure
      return {
        logicalBlockInfo: { suggestedEndLine: -1 },
        theory: [],
        questions: [],
        tasks: []
      };
    }
    
    // Get the JSON string and parse it
    const jsonString = jsonMatch[0];
    console.log('EXTRACTED JSON LENGTH:', jsonString.length);
    
    // Parse the JSON
    const parsedJson = JSON.parse(jsonString);
    
    // Log the structure to help with debugging
    console.log('PARSED JSON STRUCTURE:', {
      hasTheory: Array.isArray(parsedJson.theory) && parsedJson.theory.length > 0,
      theoryCount: Array.isArray(parsedJson.theory) ? parsedJson.theory.length : 0,
      hasQuestions: Array.isArray(parsedJson.questions) && parsedJson.questions.length > 0,
      questionCount: Array.isArray(parsedJson.questions) ? parsedJson.questions.length : 0,
      hasTasks: Array.isArray(parsedJson.tasks) && parsedJson.tasks.length > 0,
      taskCount: Array.isArray(parsedJson.tasks) ? parsedJson.tasks.length : 0,
      hasLogicalBlockInfo: !!parsedJson.logicalBlockInfo
    });
    
    return parsedJson;
  } catch (error) {
    console.error('ERROR PARSING JSON FROM CLAUDE RESPONSE:', error);
    return null;
  }
}
