import claudeService from '@/utils/claudeService';
import { TheoryBlock, Question, CodeTask } from '@/types';
import { AIAnalysisResult } from '../types';

/**
 * Content Analyzer that uses Claude to analyze markdown content
 */
export class ContentAnalyzer {
  /**
   * Analyzes a chunk of markdown content using Claude
   * @param markdownChunk The chunk of markdown content to analyze
   * @returns Structured content categorized as theory, questions, and tasks
   */
  static async analyzeContent(markdownChunk: string): Promise<AIAnalysisResult> {
    // Ensure Claude service is initialized
    if (!claudeService.isInitialized()) {
      throw new Error('Claude service is not initialized. Please add your API key in settings.');
    }

    try {
      // Format the prompt for Claude
      const prompt = this.buildAnalysisPrompt(markdownChunk);
      
      // Send the prompt to Claude
      const response = await claudeService.sendMessage(prompt);
      
      // Process the response
      return this.processResponse(response);
    } catch (error) {
      console.error('Error analyzing content with Claude:', error);
      return {
        theory: [],
        questions: [],
        tasks: []
      };
    }
  }

  /**
   * Builds the prompt for content analysis
   */
  private static buildAnalysisPrompt(markdownChunk: string): string {
    // Count the number of lines in the chunk
    const lineCount = markdownChunk.split('\n').length;
    
    const prompt = `Analyze this markdown content and categorize it into theory, questions, and tasks.

IMPORTANT INSTRUCTIONS ABOUT LOGICAL BLOCKS:
Your job is to determine where the content should be divided into logical chunks for processing.

1. Analyze the content to find where natural topic boundaries occur
2. Set "suggestedEndLine" to the line number where the current chunk should end

Guidelines for setting these values:

For suggestedEndLine:
- The value should be between 1 and ${lineCount}
- Aim to end chunks at natural topic boundaries (end of a section, concept, etc.)
- If the entire content forms a complete topic, set suggestedEndLine to ${lineCount}
- If you can identify a clear topic boundary before line ${lineCount}, use that line number instead

These values help determine how content is processed and displayed.

Theory sections should be well-structured with clear headings, examples, and explanations. Questions should have clear instructions and expected answers. Tasks should have clear requirements and acceptance criteria.

If the content is missing questions or tasks, generate 2-3 practice questions and 1-2 coding tasks based on the theory content.

Respond with ONLY a JSON object in this format:
{
  "logicalBlockInfo": {
    "suggestedEndLine": -1
  },
  "theory": [
    {
      "title": "Section Title",
      "content": "Markdown content with examples and explanations"
    }
  ],
  "questions": [
    {
      "question": "Question text",
      "answer": "Model answer",
      "explanation": "Explanation of the answer"
    }
  ],
  "tasks": [
    {
      "title": "Task Title",
      "description": "Task description",
      "requirements": ["Requirement 1", "Requirement 2"],
      "starterCode": "function example() {\n  // Your code here\n}",
      "solutionCode": "function example() {\n  return 'solution';\n}",
      "testCases": ["Test case 1", "Test case 2"]
    }
  ]
}

Here's the content to analyze:

${markdownChunk}`;
    
    // Log the prompt (excluding the full markdown content)
    console.log('PROMPT TO CLAUDE (template part):', prompt.substring(0, prompt.indexOf("Here's the content to analyze:") + 30) + '...');
    console.log('MARKDOWN CHUNK LENGTH:', markdownChunk.length);
    console.log('MARKDOWN CHUNK PREVIEW (first 200 chars):', markdownChunk.substring(0, 200) + (markdownChunk.length > 200 ? '...' : ''));
    
    return prompt;
  }

  /**
   * Processes the raw response from Claude
   * @param response Raw response string
   * @returns Processed content with theory, questions, tasks, and logical block info
   */
  private static processResponse(response: string): AIAnalysisResult & {
    logicalBlockInfo: {
      suggestedEndLine: number;
    };
  } {
    try {
      // Extract JSON content from the response
      const jsonContent = this.extractJsonFromResponse(response);
      
      // Parse the JSON
      const parsedContent = JSON.parse(jsonContent);
      console.log('PARSED CONTENT:', JSON.stringify(parsedContent).substring(0, 200) + '...');
      
      // Process each section
      const theory = (parsedContent.theory || []).map(this.sanitizeTheoryBlock);
      const questions = (parsedContent.questions || []).map(this.sanitizeQuestion);
      const tasks = (parsedContent.tasks || []).map(this.sanitizeTask);
      
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
   */
  private static extractJsonFromResponse(response: string): string {
    // Log the raw response for debugging
    console.log('CLAUDE RAW RESPONSE (first 500 chars):', response.substring(0, 500) + (response.length > 500 ? '...' : ''));
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

  /**
   * Sanitizes and validates a theory block
   */
  private static sanitizeTheoryBlock(theory: any): TheoryBlock {
    return {
      id: theory.id || `theory_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      title: theory.title || 'Untitled Theory',
      content: theory.content || '',
      prerequisites: theory.prerequisites || [],
      complexity: theory.complexity || 5,
      interviewRelevance: theory.interviewRelevance || 5,
      learningPath: theory.learningPath || 'intermediate',
      requiredFor: theory.requiredFor || [],
      relatedQuestions: theory.relatedQuestions || [],
      relatedTasks: theory.relatedTasks || [],
      tags: theory.tags || [],
      technology: theory.technology || 'JavaScript',
      examples: Array.isArray(theory.examples) ? theory.examples.map((example: any) => ({
        id: example.id || `example_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        title: example.title || 'Code Example',
        code: example.code || '// Example code',
        explanation: example.explanation || '',
        language: example.language || 'typescript'
      })) : []
    };
  }

  /**
   * Sanitizes and validates a question
   */
  private static sanitizeQuestion(question: any): Question {
    return {
      id: question.id || `question_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      topic: question.topic || 'General',
      level: question.level || 'medium',
      type: question.type || 'theory',
      question: question.question || 'No question provided',
      answer: question.answer || 'No answer provided',
      options: Array.isArray(question.options) ? question.options : [],
      analysisPoints: Array.isArray(question.analysisPoints) ? question.analysisPoints : [],
      keyConcepts: Array.isArray(question.keyConcepts) ? question.keyConcepts : [],
      evaluationCriteria: Array.isArray(question.evaluationCriteria) ? question.evaluationCriteria : [],
      example: question.example || '',
      tags: Array.isArray(question.tags) ? question.tags : [],
      prerequisites: Array.isArray(question.prerequisites) ? question.prerequisites : [],
      complexity: typeof question.complexity === 'number' ? question.complexity : 5,
      interviewFrequency: typeof question.interviewFrequency === 'number' ? question.interviewFrequency : 5,
      learningPath: ['beginner', 'intermediate', 'advanced', 'expert'].includes(question.learningPath) 
        ? question.learningPath as 'beginner' | 'intermediate' | 'advanced' | 'expert'
        : 'intermediate'
    };
  }

  /**
   * Sanitizes and validates a task
   */
  private static sanitizeTask(task: any): CodeTask {
    return {
      id: task.id || `task_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      title: task.title || 'Untitled Task',
      description: task.description || 'No description provided',
      difficulty: task.difficulty || 'medium',
      startingCode: task.startingCode || '// Your code here',
      solutionCode: task.solutionCode || '// Solution not provided',
      testCases: Array.isArray(task.testCases) ? task.testCases : [],
      hints: Array.isArray(task.hints) ? task.hints : [],
      tags: Array.isArray(task.tags) ? task.tags : [],
      timeEstimate: typeof task.timeEstimate === 'number' ? task.timeEstimate : 30,
      prerequisites: Array.isArray(task.prerequisites) ? task.prerequisites : [],
      complexity: typeof task.complexity === 'number' ? task.complexity : 5,
      interviewRelevance: typeof task.interviewRelevance === 'number' ? task.interviewRelevance : 5,
      learningPath: ['beginner', 'intermediate', 'advanced', 'expert'].includes(task.learningPath) 
        ? task.learningPath as 'beginner' | 'intermediate' | 'advanced' | 'expert'
        : 'intermediate',
      relatedConcepts: Array.isArray(task.relatedConcepts) ? task.relatedConcepts : []
    };
  }
}
