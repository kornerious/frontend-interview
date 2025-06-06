import { TheoryBlock } from '@/types';

/**
 * Sanitizes and validates a theory block
 */
export function sanitizeTheoryBlock(theory: any): TheoryBlock {
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
