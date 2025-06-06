import { CodeTask, Difficulty } from '../../../../types';

/**
 * Sanitizes and validates a code task
 * @param task Partial CodeTask object that may be missing fields
 * @returns Complete CodeTask object with all required fields properly populated
 */
export function sanitizeTask(task: Partial<CodeTask>): CodeTask {
  // Validate difficulty
  const validDifficulties: Difficulty[] = ['easy', 'medium', 'hard'];
  const difficulty: Difficulty = validDifficulties.includes(task.difficulty as Difficulty) ? 
    task.difficulty as Difficulty : 'medium';

  // Validate learning path
  type LearningPath = 'beginner' | 'intermediate' | 'advanced' | 'expert';
  const validPaths: LearningPath[] = ['beginner', 'intermediate', 'advanced', 'expert'];
  const learningPath: LearningPath = validPaths.includes(task.learningPath as LearningPath) ? 
    task.learningPath as LearningPath : 'intermediate';

  // Ensure test cases array is properly initialized with at least 3 test cases
  const testCases: string[] = Array.isArray(task.testCases) && task.testCases.length > 0 ? 
    task.testCases : [
      'Test with basic input: expect function(input) to return expected output',
      'Test with edge case: expect function(edgeInput) to handle edge case correctly',
      'Test with invalid input: expect function(null) to throw appropriate error'
    ];

  // Ensure hints array is properly initialized with at least 2 hints
  const hints: string[] = Array.isArray(task.hints) && task.hints.length > 0 ? 
    task.hints : [
      'Consider edge cases like empty inputs or invalid data',
      'Think about performance optimization for large inputs'
    ];

  // Ensure tags array is properly initialized with at least 3 tags
  const tags: string[] = Array.isArray(task.tags) && task.tags.length > 0 ? 
    task.tags : [
      'algorithm',
      'implementation',
      'problem-solving'
    ];

  // Ensure prerequisites and related concepts arrays are properly initialized
  const prerequisites: string[] = Array.isArray(task.prerequisites) ? task.prerequisites : [];
  const relatedConcepts: string[] = Array.isArray(task.relatedConcepts) ? task.relatedConcepts : [];

  return {
    id: task.id || `task_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    title: task.title || 'Untitled Task',
    description: task.description || 'Implement a solution to the given problem following the requirements.',
    difficulty,
    startingCode: task.startingCode || '// Your code here\n\nfunction solution(input) {\n  // TODO: Implement your solution\n  return null;\n}',
    solutionCode: task.solutionCode || '// Solution code\n\nfunction solution(input) {\n  // Implementation\n  if (!input) {\n    throw new Error("Invalid input");\n  }\n  return processInput(input);\n}',
    testCases,
    hints,
    tags,
    timeEstimate: typeof task.timeEstimate === 'number' && task.timeEstimate > 0 ? 
      task.timeEstimate : 30,
    prerequisites,
    complexity: typeof task.complexity === 'number' ? 
      Math.min(Math.max(task.complexity, 1), 10) : 5,
    interviewRelevance: typeof task.interviewRelevance === 'number' ? 
      Math.min(Math.max(task.interviewRelevance, 1), 10) : 5,
    learningPath,
    relatedConcepts
  };
}
