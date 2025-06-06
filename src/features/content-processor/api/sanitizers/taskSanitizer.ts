import { CodeTask } from '@/types';

/**
 * Sanitizes and validates a task
 */
export function sanitizeTask(task: any): CodeTask {
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
