/**
 * Builds an analysis prompt optimized for Google Gemini 2.5 Flash Preview API
 * This prompt is structured to leverage Gemini's strengths in one-shot processing
 */

export function buildGeminiAnalysisPrompt(markdownChunk: string): string {
  // Create the prompt with enhanced instructions for maximum content extraction and generation
  const prompt = `You are an expert content analyzer for frontend interview preparation. Your task is to thoroughly analyze the provided markdown content and transforming it into a comprehensive theory, questions, and tasks.
! CRITICAL: YOUR RESPONSE MUST BE RAW JSON ONLY. Return your response as plain JSON without wrapping it in markdown code blocks (do NOT use \`\`\`json ... \`\`\`). 
! Make sure that your response should not be more than 60000 tokens.

! Stage 1: Extract theory blocks from provided markdown content. 
- Important! Translate non-English content to English and normalize code style.
- Create multiple theory blocks for distinct topics or concepts Include ALL subtopics and ensure theory blocks contain proper explanations.
- Add few practical code examples that demonstrate the concepts in the theory block, they should be short.
- When a concept is under-explained or ambiguous or missing, you may use your expertise to fill in missing details or clarify — just keep it concise, stay faithful to the original intent.
- Text, code blocks, examples should be a related content.
- Preserve all image references from the markdown. DO NOT modify image paths - keep them exactly as they appear in the original markdown.
- If there is generally the same information in markdown content, it should be in one theory block, and you should make it compact.

! Stage 2: EXTRACT QUESTIONS from provided markdown content (MAXIMUM QUANTITY and COMPLEXITY).
- Generate as many questions, coding tasks, theory blocks, flashcards as possible. 
- Each question should be directly related to concepts in the provided markdown content.
- If you see existing questions in the content (like "?"), extract them AND create variations.
- Break down some complex concepts into simple questions.
- Include a mix of different types - mcq, code, open, flashcard.
- For MCQs: create plausible but clearly incorrect distractors, focus on conceptual and practical scenarios.
- For Coding Challenges: can include edge cases and performance optimizations etc...
- For Open-Ended Questions: can encourage critical thinking and detailed explanations etc...
- Create questions at different difficulty levels (easy, medium, hard).
- Ensure questions test both basic understanding and advanced application.
- Include explanations and analysis points for each answer.
- Can be a question: Features mentioned briefly without examples, Content phrased as questions with answers, Small code snippets demonstrating a feature.

! Stage 3: Generate practical coding tasks for EACH theory block.
- Tasks should be realistic and relevant to frontend interviews.
- Include clear requirements, starting code templates, and solution code.
- Provide multiple test cases that cover edge cases.
- Include helpful hints that guide without giving away solutions.
- Tasks should range from simple implementation to complex problem-solving - Comprehensive implementation scenarios, Content asking to implement or create something, Practical coding exercises, implementation challenges, Multi-feature integration exercises, Best practice demonstrations etc... 

! RESPOND WITH ONLY VALID JSON IN THIS EXACT FORMAT !!! :
{
  "logicalBlockInfo": {
    "suggestedEndLine": -1
  },
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
      "learningPath": "advanced",
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
      "learningPath": "intermediate",
    },
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
      "learningPath": "beginner",
      "relatedConcepts": ["related_concept_1", "related_concept_2", "related_concept_3"]
    }
  ]
}

! GUIDELINES:
- learningPath can be: "beginner" | "intermediate" | "advanced" | "expert".
- COMPLETE ALL FIELDS: Every single field in the JSON structure must be filled with high-quality content:
- No empty arrays or placeholder text.
- Include metadata (tags, complexity ratings, etc.).
- Create proper relationships between theory, questions, and tasks.
- Use descriptive IDs that reflect content (e.g., "theory_event_loop", "question_event_loop_1").

! Here's the markdown content to analyze:

${markdownChunk}

! FINAL REMINDER: RETURN ONLY THE RAW JSON OBJECT, NO MARKDOWN FORMATTING.`;

  return prompt;
}
