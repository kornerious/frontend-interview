import { Question, Difficulty, QuestionType } from '../../../../types';

/**
 * Sanitizes and validates a question
 * @param question Partial Question object that may be missing fields
 * @returns Complete Question object with all required fields properly populated
 */
export function sanitizeQuestion(question: Partial<Question>): Question {
  // Validate question type
  const validTypes: QuestionType[] = ['mcq', 'code', 'open', 'flashcard'];
  const type: QuestionType = validTypes.includes(question.type as QuestionType) ? 
    question.type as QuestionType : 'open';

  // Ensure options array exists and has proper length for MCQs
  let options: string[] = [];
  if (type === 'mcq') {
    if (Array.isArray(question.options) && question.options.length > 0) {
      options = question.options;
      // Ensure we have exactly 4 options for MCQs
      while (options.length < 4) {
        options.push(`Option ${options.length + 1}`);
      }
      // Trim to 4 options if there are more
      if (options.length > 4) {
        options = options.slice(0, 4);
      }
    } else {
      // Create default options if none provided
      options = [
        question.answer || 'Correct answer',
        'Incorrect option 1',
        'Incorrect option 2',
        'Incorrect option 3'
      ];
    }
  }

  // Validate difficulty level
  const validLevels: Difficulty[] = ['easy', 'medium', 'hard'];
  const level: Difficulty = validLevels.includes(question.level as Difficulty) ? 
    question.level as Difficulty : 'medium';

  // Validate learning path
  type LearningPath = 'beginner' | 'intermediate' | 'advanced' | 'expert';
  const validPaths: LearningPath[] = ['beginner', 'intermediate', 'advanced', 'expert'];
  const learningPath: LearningPath = validPaths.includes(question.learningPath as LearningPath) ? 
    question.learningPath as LearningPath : 'intermediate';

  // Ensure arrays are properly initialized with meaningful values
  const analysisPoints: string[] = Array.isArray(question.analysisPoints) && question.analysisPoints.length > 0 ? 
    question.analysisPoints : ['Understanding of core concepts', 'Application of principles', 'Recognition of patterns'];
  
  const keyConcepts: string[] = Array.isArray(question.keyConcepts) && question.keyConcepts.length > 0 ? 
    question.keyConcepts : ['Core concept', 'Fundamental principle', 'Best practice'];
  
  const evaluationCriteria: string[] = Array.isArray(question.evaluationCriteria) && question.evaluationCriteria.length > 0 ? 
    question.evaluationCriteria : ['Accuracy of understanding', 'Completeness of answer', 'Application of knowledge'];
  
  const tags: string[] = Array.isArray(question.tags) && question.tags.length > 0 ? 
    question.tags : ['general', 'concept', 'fundamentals'];

  const prerequisites: string[] = Array.isArray(question.prerequisites) ? question.prerequisites : [];

  return {
    id: question.id || `question_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    topic: question.topic || 'General',
    level,
    type,
    question: question.question || 'Question text missing',
    answer: question.answer || 'Answer text missing',
    options,
    analysisPoints,
    keyConcepts,
    evaluationCriteria,
    example: question.example || '',
    tags,
    prerequisites,
    complexity: typeof question.complexity === 'number' ? 
      Math.min(Math.max(question.complexity, 1), 10) : 5,
    interviewFrequency: typeof question.interviewFrequency === 'number' ? 
      Math.min(Math.max(question.interviewFrequency, 1), 10) : 5,
    learningPath
  };
}
