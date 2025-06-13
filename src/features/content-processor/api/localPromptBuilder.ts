/**
 * Builds prompts specifically optimized for local LLM models
 * These prompts are designed to work well with models like DeepSeek Coder, LLaMA, etc.
 */

/**
 * Builds an analysis prompt optimized for local LLMs
 * This version is more direct and structured to help local models generate valid JSON
 */
export function buildLocalLlmAnalysisPrompt(markdownChunk: string): string {
  const lineCount = markdownChunk.split('\n').length;
  
  // Create the prompt with enhanced instructions for maximum content extraction and generation
  const prompt = `You are an expert content analyzer for frontend interview preparation. Your task is to thoroughly analyze the provided markdown content and transform it into comprehensive theory, questions, and tasks.

CRITICAL INSTRUCTIONS - FOLLOW EXACTLY:
Keep total response (input and output) under 127000 tokens to avoid truncation!!!

1. CONTENT EXTRACTION EXCELLENCE: Extract 100% of the valuable content from the provided markdown. Leave nothing important behind. Identify ALL topics, concepts, code examples, and explanations.

2. SEMANTIC BOUNDARY DETECTION: Identify logical content boundaries within the chunk. If the content starts or ends mid-topic, make a note in your logicalBlockInfo response with a suggestedEndLine value to indicate where a better boundary would be. IMPORTANT: Logical blocks should NOT exceed 100 lines - break larger topics into smaller logical units.

3. PARTIAL CONTENT HANDLING (CRITICAL): 
   - If content starts mid-topic: Create a complete theory block with a title indicating continuation (e.g., "JavaScript Design Patterns (Continued)"). Include sufficient context to make it standalone.
   - If content ends mid-topic: Process the available content completely and indicate in logicalBlockInfo where the logical boundary should be.
   - Never leave a chunk empty - extract whatever partial content is available rather than skipping it.
   - STRICT SIZE LIMIT: Never process more than 100 lines in a single logical block. If a topic exceeds this limit, break it into smaller, coherent sections.

4. COMPREHENSIVE CONTENT EXTRACTION: Extract ALL relevant content from the provided chunk. Create multiple theory blocks for distinct topics, with corresponding questions and tasks for each theory block. with unique ID and complete content. Include ALL subtopics and ensure theory blocks contain rich, detailed explanations.

5. IMAGE PRESERVATION (HIGHEST PRIORITY): 
   - MANDATORY: Scan the entire content for ALL image references using pattern ![alt text](image_url)
   - Include EVERY image found in the appropriate theory section with EXACT original syntax preserved
   - DO NOT modify image paths - keep them exactly as they appear in the original markdown
   - Images are CRITICAL visual aids and must be preserved with highest priority
   - If you find ANY images in the content, they MUST appear in your output

6. QUESTION GENERATION EXCELLENCE: For EACH theory block, generate AT LEAST 5 diverse questions (total minimum 10 questions):
   - Include a mix of question types: MCQs, coding challenges, open-ended questions
   - Create questions at different difficulty levels (easy, medium, hard)
   - Ensure questions test both basic understanding and advanced application
   - For MCQs, create plausible but clearly incorrect distractors
   - Include detailed explanations and analysis points for each answer

6. PRACTICAL TASK CREATION: Generate AT LEAST 3 practical coding tasks for EACH theory block:
   - Tasks should range from simple implementation to complex problem-solving
   - Include clear requirements, starting code templates, and solution code
   - Provide multiple test cases that cover edge cases
   - Include helpful hints that guide without giving away solutions
   - Tasks should be realistic and relevant to frontend interviews

7. COMPLETE ALL FIELDS: Every single field in the JSON structure must be filled with high-quality content:
   - No empty arrays or placeholder text
   - Include comprehensive metadata (tags, complexity ratings, etc.)
   - Create proper relationships between theory, questions, and tasks
   - Use descriptive IDs that reflect content (e.g., "theory_event_loop", "question_event_loop_1")

8. VALID JSON OUTPUT: Your response MUST be valid, parseable JSON with no markdown formatting or explanations outside the JSON structure.

REQUIRED FIELDS WITH ENHANCED REQUIREMENTS:
- Theory: title (concise, descriptive), content (COMPLETE with ALL code examples and image references intact), examples (3+ per theory block), tags (5+), technology, learningPath, complexity (1-10), interviewRelevance (1-10)
- Questions: text (clear, specific), difficulty (easy/medium/hard), type (mcq/code/open/flashcard), options (exactly 4 for MCQs with one correct answer), answer (comprehensive), analysis (5+), tags (5+)
- Tasks: title (descriptive), description (detailed requirements), difficulty, startingCode (functional template), solutionCode (complete working solution), testCases (5+), hints (3+), tags (5+), timeEstimate

YOUR MISSION: Parse this content with 100% thoroughness. Generate a complete, interview-ready resource with rich theory explanations, challenging questions, and practical tasks. Leave no concept unexplained, no question unasked, no practical application unexplored.

RESPOND WITH ONLY VALID JSON IN THIS EXACT FORMAT:
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
  return prompt;
}
