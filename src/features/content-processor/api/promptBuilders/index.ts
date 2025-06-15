/**
 * Specialized prompt builders for multi-stage content processing
 */

/**
 * Stage 1: Parse theory blocks from markdown content
 * This prompt focuses only on extracting theory blocks with logical boundaries
 */
export function buildTheoryExtractionPrompt(markdownChunk: string): string {
  return `Extract theory blocks from this markdown content.

Highest priority: translate all non-english to English, all data should be in English!!!

IMPORTANT INSTRUCTIONS:
1. INTELLIGENT CONTENT BOUNDARIES: Analyze the semantic structure of the content to identify where one complete topic or concept ends and another begins. Set "suggestedEndLine" to the exact line number where a logical content unit concludes. Look for these signals:
   - Topic transitions (new subject matter being introduced)
   - Conceptual completeness (a topic has been fully explained)
   - Visual separators (horizontal rules, multiple blank lines)
   - Format changes (switching from theory to examples)
   NEVER set boundaries that would split related content, code blocks, or examples.

2. MULTIPLE THEORY BLOCKS: Create MULTIPLE theory blocks when the content covers distinct topics or concepts. Identify separate topics based on subject matter, not just formatting. Each conceptually distinct topic should be its own theory block with a unique ID and complete content.

3. IMAGE HANDLING: Preserve all image references from the markdown. Include them in the content field using proper markdown image syntax: ![alt text](image_url).

4. FOCUS ONLY ON THEORY: In this stage, we're only extracting theory blocks. Do not generate questions or tasks.

5. RESPOND WITH VALID JSON: Return ONLY a valid JSON object in the format shown below.

Respond with ONLY a JSON object in this format:
{
  "logicalBlockInfo": {
    "suggestedEndLine": -1
  },
  "theory": [
    {
      "id": "theory_[unique_id]",
      "title": "Section Title",
      "content": "This should be comprehensive content with proper markdown formatting.",
      "tags": ["tag1", "tag2", "tag3"],
      "technology": Technology = "React" | "Next.js" | "TypeScript" | "JavaScript" | "MUI" | "Testing" | "Performance" | "CSS" | "HTML" | "Other",
      "prerequisites": [],
      "complexity": 6,
      "interviewRelevance": 8,
      "learningPath": "intermediate",
      "requiredFor": []
    }
  ],
  "questions": [],
  "tasks": []
}

Here's the content to analyze:

${markdownChunk}`;
}

/**
 * Stage 2: Enhance theory blocks with more examples and explanations
 * This prompt takes an existing theory block and enhances it
 */
export function buildTheoryEnhancementPrompt(theoryBlock: any): string {
  return `Enhance this theory block with more examples and detailed explanations.

IMPORTANT INSTRUCTIONS:
1. ADD CODE EXAMPLES: Add 2-3 practical code examples that demonstrate the concepts in the theory block.
2. EXPAND EXPLANATIONS: Provide more detailed explanations of complex concepts.
3. MAINTAIN ORIGINAL CONTENT: Keep all the original content intact, only add to it.
4. KEEP EXAMPLES CONCISE: Code examples should be 10-15 lines maximum.
5. RESPOND WITH VALID JSON: Return ONLY a valid JSON object with the enhanced theory block.

Original theory block:
${JSON.stringify(theoryBlock, null, 2)}

Respond with ONLY a JSON object containing the enhanced theory block with the same structure but improved content and examples:
{
  "id": "theory_[same_id]",
  "title": "Same Title",
  "content": "Enhanced content with more detailed explanations",
  "examples": [
    {
      "id": "example_[unique_id]_1",
      "title": "Basic Example",
      "code": "// Code example\\nfunction example() {\\n  const result = true;\\n  return result;\\n}",
      "explanation": "This example demonstrates the basic implementation with detailed explanation of how it works and why it's important.",
      "language": "typescript"
    },
    {
      "id": "example_[unique_id]_2",
      "title": "Advanced Example",
      "code": "// Advanced implementation\\nfunction advancedExample(input: string): boolean {\\n  // Complex logic here\\n  return input.length > 0;\\n}",
      "explanation": "This more complex example shows how to handle edge cases and provides additional implementation details.",
      "language": "typescript"
    }
  ],
  "relatedQuestions": [],
  "relatedTasks": [],
  "tags": ["tag1", "tag2", "tag3", "tag4"],
  "technology": "TypeScript",
  "prerequisites": ["prerequisite_concept_1", "prerequisite_concept_2"],
  "complexity": 6,
  "interviewRelevance": 8,
  "learningPath": "intermediate",
  "requiredFor": ["advanced_concept_1", "advanced_concept_2"]
}`;
}

/**
 * Stage 3: Generate questions based on theory blocks
 * This prompt takes theory blocks and generates questions of different types
 */
export function buildQuestionGenerationPrompt(theoryBlocks: any[]): string {
  return `EXTRACT QUESTIONS - MAXIMUM QUANTITY and COMPLEXITY. If there are a lot of ? - you should create at list 20 questions!!!

RULES:
If you see existing questions in the content (like "?"), extract them AND create variations
Break down some complex concepts into many simple questions
Create questions about reasonable term, definition, example, or code snippet
DO NOT SKIP ANYTHING - every piece of information needs can need question
QUESTION GENERATION EXCELLENCE:
Include a mix of question types: MCQs, coding challenges, open-ended questions
Create questions at different difficulty levels (easy, medium, hard)
Ensure questions test both basic understanding and advanced application
For MCQs, create plausible but clearly incorrect distractors
Include detailed explanations and analysis points for each answer

IMPORTANT INSTRUCTIONS:
1. CREATE DIVERSE QUESTIONS: Generate up to 20 questions of different types (mcq, code, open, flashcard).
2. ENSURE VARIETY: Include a mix of difficulty levels (easy, medium, hard).
3. LINK TO THEORY: Each question should be directly related to concepts in the provided theory blocks.
4. COMPLETE FIELDS: Fill out all required fields for each question type.
5. RESPOND WITH VALID JSON: Return ONLY a valid JSON object with the generated questions.

IMPORTANT: Each question MUST include ALL these fields exactly as specified:
- id: string (format: "question_[unique_id]")
- topic: string (the specific topic the question covers)
- level: 'easy' | 'medium' | 'hard'
- type: 'mcq' | 'code' | 'open' | 'flashcard'
- question: string (the actual question text)
- answer: string (the correct answer or solution)
- example: string (code example if applicable, otherwise empty string)
- tags: string[] (relevant tags for categorization)
- options: string[] (array of options for MCQ questions, empty array for other types)
- analysisPoints: string[] (key points for analyzing the answer)
- keyConcepts: string[] (core concepts tested by this question)
- evaluationCriteria: string[] (criteria for evaluating answers)
- prerequisites: string[] (concepts needed to understand this question)
- complexity: number (1-10 scale of conceptual difficulty)
- interviewFrequency: number (1-10 scale of how often asked in interviews)
- learningPath: 'beginner' | 'intermediate' | 'advanced' | 'expert'

Respond with ONLY a valid JSON object containing an array of questions:
{
  "theory": [
    {
      "id": "theory_[unique_id]",
      "title": "Section Title",
      "content": "This should be comprehensive content with proper markdown formatting, including:\\n\\n## Key Concepts\\n- Important point 1\\n- Important point 2\\n\\n## Implementation\\n\`\`\`typescript\\nfunction example() {\\n  // Implementation details\\n  return true;\\n}\\n\`\`\`",
      "examples": [
        {
          "id": "example_[unique_id]_1",
          "title": "Basic Example",
          "code": "// Code example\\nfunction example() {\\n  const result = true;\\n  return result;\\n}",
          "explanation": "This example demonstrates the basic implementation with detailed explanation of how it works and why it's important.",
          "language": "typescript"
        },
        {
          "id": "example_[unique_id]_2",
          "title": "Advanced Example",
          "code": "// Advanced implementation\\nfunction advancedExample(input: string): boolean {\\n  // Complex logic here\\n  return input.length > 0;\\n}",
          "explanation": "This more complex example shows how to handle edge cases and provides additional implementation details.",
          "language": "typescript"
        }
      ],
      "relatedQuestions": [],
      "relatedTasks": [],
      "tags": ["tag1", "tag2", "tag3", "tag4"],
      "technology": "TypeScript",
      "prerequisites": ["prerequisite_concept_1", "prerequisite_concept_2"],
      "complexity": 6,
      "interviewRelevance": 8,
      "learningPath": "beginner" | "intermediate" | "advanced" | "expert",
      "requiredFor": ["advanced_concept_1", "advanced_concept_2"]
    }
  ]
}

Theory blocks to analyze:
${JSON.stringify(theoryBlocks, null, 2)}

`;
}

/**
 * Stage 4: Generate coding tasks based on theory blocks
 * This prompt takes theory blocks and generates practical coding tasks
 */
export function buildTaskGenerationPrompt(theoryBlocks: any[]): string {
  return `Generate coding tasks based on these theory blocks.

IMPORTANT INSTRUCTIONS:
1. CREATE PRACTICAL TASKS: Generate coding tasks that apply concepts from the theory blocks.
2. INCLUDE STARTING CODE: Provide starter code templates for each task.
3. PROVIDE SOLUTION CODE: Include complete solution code (keep under 50 lines).
4. ADD TEST CASES: Include 3-5 test cases to validate the solution.
5. RESPOND WITH VALID JSON: Return ONLY a valid JSON object with the generated tasks.

Theory blocks:
${JSON.stringify(theoryBlocks, null, 2)}

Respond with ONLY a JSON object containing an array of tasks:
{
  "tasks": [
    {
      "id": "task_[unique_id]",
      "title": "Implement a Specific Feature or Algorithm",
      "description": "\\nDetailed task description with clear requirements:\\n\\n1. Implement X functionality with these specific requirements\\n2. Handle these edge cases properly\\n3. Ensure performance meets these criteria\\n4. Write tests to verify your implementation\\n\\nYour solution should demonstrate understanding of key concepts and follow best practices.\\n",
      "difficulty": "medium",
      "startingCode": "// Starting template with structure\\nfunction implementation(input: any): any {\\n  // TODO: Implement the required functionality\\n  // Consider edge cases:\\n  // 1. What if input is empty?\\n  // 2. What if input contains invalid data?\\n  \\n  return null; // Replace with your implementation\\n}\\n\\n// Example usage:\\n// const result = implementation(sampleInput);\\n",
      "solutionCode": "// Complete working solution\\nfunction implementation(input: any): any {\\n  // Input validation\\n  if (!input || typeof input !== 'object') {\\n    throw new Error('Invalid input');\\n  }\\n  \\n  // Core implementation logic\\n  const result = processInput(input);\\n  \\n  // Handle edge cases\\n  if (specialCase(result)) {\\n    return handleSpecialCase(result);\\n  }\\n  \\n  return result;\\n}\\n\\n// Helper functions\\nfunction processInput(input) {\\n  // Processing logic\\n  return transformedInput;\\n}\\n\\nfunction specialCase(data) {\\n  return data.hasOwnProperty('special');\\n}\\n\\nfunction handleSpecialCase(data) {\\n  // Special case handling\\n  return modifiedData;\\n}\\n",
      "testCases": [
        "Test with valid input: implementation({data: 'valid'}) should return expected output",
        "Test with empty input: implementation({}) should handle gracefully",
        "Test with invalid input: implementation(null) should throw appropriate error",
        "Test with special case: implementation({special: true}) should handle special case correctly",
        "Test performance: implementation should complete within acceptable time limits for large inputs"
      ],
      "hints": [
        "Consider using technique X to optimize the solution",
        "Don't forget to validate all inputs before processing",
        "The edge case with empty arrays requires special handling"
      ],
      "tags": ["algorithm", "optimization", "data-structure", "best-practices"],
      "timeEstimate": 45,
      "prerequisites": ["concept_1", "concept_2"],
      "complexity": 6,
      "interviewRelevance": 8,
      "learningPath": "beginner" | "intermediate" | "advanced" | "expert",
      "relatedConcepts": ["related_concept_1", "related_concept_2", "related_concept_3"]
    }
  ]
}`;
}

/**
 * Stage 5: Rewrite specific chunk with selected option
 * This prompt takes an existing chunk and rewrites it based on specified options
 */
export function buildChunkRewritePrompt(chunk: any, options: {
  focus?: 'theory' | 'questions' | 'tasks';
  difficulty?: 'easy' | 'medium' | 'hard';
  questionTypes?: Array<'mcq' | 'code' | 'open' | 'flashcard'>;
  enhanceExamples?: boolean;
  simplifyContent?: boolean;
}): string {
  // Build options string based on provided options
  const optionsDescription = [
    options.focus ? `Focus on ${options.focus}` : '',
    options.difficulty ? `Set difficulty to ${options.difficulty}` : '',
    options.questionTypes ? `Include question types: ${options.questionTypes.join(', ')}` : '',
    options.enhanceExamples ? 'Enhance code examples' : '',
    options.simplifyContent ? 'Simplify content for beginners' : '',
  ].filter(Boolean).join('. ');

  return `Rewrite this content chunk with the following options: ${optionsDescription}.

IMPORTANT INSTRUCTIONS:
1. MAINTAIN STRUCTURE: Keep the same overall structure and IDs.
2. APPLY SPECIFIED OPTIONS: Modify the content according to the specified options.
3. PRESERVE METADATA: Keep metadata like IDs and relationships intact.
4. RESPOND WITH VALID JSON: Return ONLY a valid JSON object with the rewritten chunk.

Original chunk:
${JSON.stringify(chunk, null, 2)}

Respond with ONLY a JSON object containing the rewritten chunk with the same structure but modified according to the specified options.`;
}
