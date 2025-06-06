import { Question } from '@/types';

/**
 * Sanitizes and validates a question
 */
export function sanitizeQuestion(question: any): Question {
  return {
    id: question.id || `question_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    topic: question.topic || 'General',
    level: question.level || 'medium',
    type: question.type || 'open',
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
