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
      // Console log removed
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
    
    // Console log removed
    // Console log removed
    
    return {
      theory,
      questions,
      tasks,
      logicalBlockInfo
    };
  } catch (error) {
    // Console log removed
    // Console log removed
    
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
  // Console log removed
  // Console log removed
  
  // Log the full response for detailed debugging
  // Console log removed
  
  // Check for common JSON formatting issues
  if (response.includes('```json')) {
    // Console log removed
  }
  
  if (response.startsWith('```') || response.includes('```json')) {
    // Try to extract from code blocks
    const codeBlockMatch = response.match(/```(?:json)?\n([\s\S]*?)\n```/);
    if (codeBlockMatch && codeBlockMatch[1]) {
      // Console log removed
      response = codeBlockMatch[1];
    }
  }
  
  try {
    // Try multiple approaches to extract JSON from the response
    let jsonString = '';
    
    // First try: Look for the outermost complete JSON object
    const jsonMatch = response.match(/\{[\s\S]*\}/); 
    if (jsonMatch) {
      jsonString = jsonMatch[0];
      // Console log removed
    } else {
      // Second try: Look for any JSON-like structure with braces
      const braceMatch = response.match(/\{[^\{\}]*((\{[^\{\}]*\})|[^\{\}])*\}/);
      if (braceMatch) {
        jsonString = braceMatch[0];
        // Console log removed
      } else {
        // Console log removed
        // Return a minimal valid JSON structure
        return {
          logicalBlockInfo: { suggestedEndLine: -1 },
          theory: [],
          questions: [],
          tasks: []
        };
      }
    }
    
    // Clean up the JSON string - remove any non-JSON text before or after
    jsonString = jsonString.replace(/^[^\{]*/, '').replace(/[^\}]*$/, '');
    // Console log removed
    // Console log removed
    
    // Try to fix common JSON issues before parsing
    let fixedJsonString = jsonString;
    
    // Fix unescaped quotes in JSON strings
    fixedJsonString = fixedJsonString.replace(/"([^"]*)\n([^"]*)"(?=[,\}])/g, '"$1\\n$2"');
    
    // Fix trailing commas in arrays and objects
    fixedJsonString = fixedJsonString.replace(/,\s*([\}\]])/g, '$1');
    
    try {
      // Parse the JSON
      const parsedJson = JSON.parse(fixedJsonString);
      
      // JSON structure validation complete
      
      return parsedJson;
    } catch (parseError) {
      // Console log removed
      // Console log removed
      
      // If we have the JSON5 library, we could use it here
      // For now, let's try a more aggressive approach to fix the JSON
      try {
        // Try to manually construct a minimal valid JSON
        return {
          logicalBlockInfo: { 
            suggestedEndLine: 100 // Default to processing 100 lines (our chunk size)
          },
          theory: [],
          questions: [],
          tasks: []
        };
      } catch (e) {
        // Console log removed
        return null;
      }
    }
  } catch (error) {
    // Console log removed
    return null;
  }
}
