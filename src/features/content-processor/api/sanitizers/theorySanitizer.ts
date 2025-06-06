import { TheoryBlock, CodeExample, Technology } from '../../../../types';

/**
 * Sanitizes and validates a theory block
 */
export function sanitizeTheoryBlock(theory: Partial<TheoryBlock>): TheoryBlock {
  // Ensure we have examples array with proper structure
  const examples: CodeExample[] = Array.isArray(theory.examples) ? theory.examples.map((example: Partial<CodeExample>) => ({
    id: example.id || `example_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    title: example.title || 'Code Example',
    code: example.code || '// Example code with proper implementation',
    explanation: example.explanation || 'This example demonstrates a key concept from the theory block.',
    language: (example.language as 'typescript' | 'javascript' | 'jsx' | 'tsx' | 'html' | 'css') || 'typescript'
  })) : [
    // Add a default example if none provided
    {
      id: `example_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      title: 'Default Example',
      code: '// Default example code\nfunction example() {\n  // Implementation\n  return true;\n}',
      explanation: 'This is a default example for the theory block that demonstrates the concept.',
      language: 'typescript'
    },
    {
      id: `example_${Date.now()}_${Math.floor(Math.random() * 1000) + 1}`,
      title: 'Advanced Example',
      code: '// Advanced example code\nfunction advancedExample(input: any) {\n  // Advanced implementation\n  return processInput(input);\n}',
      explanation: 'This is a more advanced example that shows practical application of the concept.',
      language: 'typescript'
    }
  ];
  
  // Default tags if none provided or empty
  const tags: string[] = Array.isArray(theory.tags) && theory.tags.length > 0 
    ? theory.tags 
    : ['concept', 'fundamentals', 'important'];
  
  // Default prerequisites if none provided
  const prerequisites: string[] = Array.isArray(theory.prerequisites) && theory.prerequisites.length > 0
    ? theory.prerequisites
    : ['basic-programming'];
  
  // Default required for if none provided
  const requiredFor: string[] = Array.isArray(theory.requiredFor) && theory.requiredFor.length > 0
    ? theory.requiredFor
    : ['advanced-concepts'];
  
  // Default related items if none provided
  const relatedQuestions: string[] = Array.isArray(theory.relatedQuestions) ? theory.relatedQuestions : [];
  const relatedTasks: string[] = Array.isArray(theory.relatedTasks) ? theory.relatedTasks : [];
  
  // Create a properly formatted theory block
  return {
    id: theory.id || `theory_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    title: theory.title || 'Untitled Theory',
    content: theory.content || '# Default Theory Content\n\nThis is placeholder content for a theory block.',
    prerequisites,
    complexity: typeof theory.complexity === 'number' ? Math.min(Math.max(theory.complexity, 1), 10) : 5,
    interviewRelevance: typeof theory.interviewRelevance === 'number' ? Math.min(Math.max(theory.interviewRelevance, 1), 10) : 5,
    learningPath: ['beginner', 'intermediate', 'advanced', 'expert'].includes(theory.learningPath as string) 
      ? theory.learningPath as 'beginner' | 'intermediate' | 'advanced' | 'expert'
      : 'intermediate',
    requiredFor,
    relatedQuestions,
    relatedTasks,
    tags,
    technology: (theory.technology as Technology) || 'JavaScript',
    examples
  };
}
