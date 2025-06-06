/**
 * Builds prompts for content analysis
 */
export function buildAnalysisPrompt(markdownChunk: string): string {
  // Count the number of lines in the chunk
  const lineCount = markdownChunk.split('\n').length;
  
  // Create the prompt with concise but complete instructions
  const prompt = `Analyze this markdown content and categorize it into theory, questions, and tasks.

IMPORTANT INSTRUCTIONS:
1. Determine logical content boundaries - set "suggestedEndLine" to a value between 1-${lineCount} where this chunk should end
2. Create complete, high-quality content with ALL fields filled out - no empty fields or placeholders
3. Respond with ONLY a valid JSON object in the format shown below

REQUIRED FIELDS:
- Theory: title, content, examples (2+), tags (3-5), technology, learningPath, complexity (1-10), interviewRelevance (1-10)
- Questions: text, difficulty (easy/medium/hard), type (mcq/code/open/flashcard), options (exactly 4 for MCQs), answer, analysis (3-5), tags (3-5)
- Tasks: title, description, difficulty, startingCode, solutionCode, testCases (3-5), hints (2-3), tags (3-5), timeEstimate

If content is missing questions or tasks, generate 2-3 practice questions and 1-2 coding tasks based on the theory.

Respond with ONLY a JSON object in this format:
{
  "logicalBlockInfo": {
    "suggestedEndLine": -1
  },
  "theory": [
    {
      "id": "theory_[unique_id]",
      "title": "Section Title",
      "content": "# Detailed Markdown Content\\n\\nThis should be comprehensive content with proper markdown formatting, including:\\n\\n## Key Concepts\\n- Important point 1\\n- Important point 2\\n\\n## Implementation\\n\`\`\`typescript\\nfunction example() {\\n  // Implementation details\\n  return true;\\n}\\n\`\`\`",
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
    }
  ],
  "questions": [
    {
      "id": "question_[unique_id]_1",
      "topic": "Specific Topic Name",
      "level": "medium",
      "type": "mcq",
      "question": "Detailed, specific question text that tests understanding of the concept?",
      "answer": "The correct answer with complete explanation",
      "options": [
        "The correct answer with complete explanation", 
        "Incorrect option 1 that seems plausible", 
        "Incorrect option 2 with common misconception", 
        "Incorrect option 3 that tests edge case understanding"
      ],
      "analysisPoints": [
        "Key analysis point 1",
        "Key analysis point 2",
        "Key analysis point 3",
        "Key analysis point 4"
      ],
      "keyConcepts": [
        "Core concept 1",
        "Core concept 2",
        "Core concept 3",
        "Related concept 4"
      ],
      "evaluationCriteria": [
        "Understanding of fundamental principles",
        "Ability to distinguish between similar concepts",
        "Recognition of edge cases",
        "Application of best practices"
      ],
      "example": "\\n\`\`\`typescript\\n// Example code demonstrating the concept\\nfunction conceptExample() {\\n  // Implementation showing the concept in action\\n  return result;\\n}\\n\`\`\`",
      "tags": ["tag1", "tag2", "tag3", "tag4"],
      "prerequisites": ["prerequisite_1", "prerequisite_2"],
      "complexity": 7,
      "interviewFrequency": 8,
      "learningPath": "intermediate"
    },
    {
      "id": "question_[unique_id]_2",
      "topic": "Specific Topic Name",
      "level": "hard",
      "type": "open",
      "question": "Comprehensive open-ended question that requires detailed explanation?",
      "answer": "Detailed model answer that covers all key points, edge cases, and provides code examples where relevant. The answer should be thorough enough to serve as a reference implementation.",
      "options": [],
      "analysisPoints": [
        "Deep analysis point 1",
        "Deep analysis point 2",
        "Deep analysis point 3",
        "Deep analysis point 4"
      ],
      "keyConcepts": [
        "Advanced concept 1",
        "Advanced concept 2",
        "Advanced concept 3",
        "Advanced concept 4"
      ],
      "evaluationCriteria": [
        "Depth of understanding",
        "Completeness of explanation",
        "Consideration of edge cases",
        "Code quality and best practices"
      ],
      "example": "\\n\`\`\`typescript\\n// Complex example demonstrating the concept\\nfunction complexExample(input: any): any {\\n  // Detailed implementation\\n  return processedResult;\\n}\\n\`\`\`",
      "tags": ["advanced", "tag2", "tag3", "tag4"],
      "prerequisites": ["intermediate_concept_1", "intermediate_concept_2"],
      "complexity": 9,
      "interviewFrequency": 7,
      "learningPath": "advanced"
    }
  ],
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
      "learningPath": "intermediate",
      "relatedConcepts": ["related_concept_1", "related_concept_2", "related_concept_3"]
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
