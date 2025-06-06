/**
 * Builds prompts for content analysis
 */
export function buildAnalysisPrompt(markdownChunk: string): string {
  // Count the number of lines in the chunk
  const lineCount = markdownChunk.split('\n').length;
  
  const prompt = `Analyze this markdown content and categorize it into theory, questions, and tasks.

IMPORTANT INSTRUCTIONS ABOUT LOGICAL BLOCKS:
Your job is to determine where the content should be divided into logical chunks for processing.

1. Analyze the content to find where natural topic boundaries occur
2. Set "suggestedEndLine" to the line number where the current chunk should end

Guidelines for setting these values:

For suggestedEndLine:
- The value should be between 1 and ${lineCount}
- Aim to end chunks at natural topic boundaries (end of a section, concept, etc.)
- If the entire content forms a complete topic, set suggestedEndLine to ${lineCount}
- If you can identify a clear topic boundary before line ${lineCount}, use that line number instead

These values help determine how content is processed and displayed.

Theory sections should be well-structured with clear headings, examples, and explanations. Questions should have clear instructions and expected answers. Tasks should have clear requirements and acceptance criteria.

If the content is missing questions or tasks, generate 2-3 practice questions and 1-2 coding tasks based on the theory content.

Respond with ONLY a JSON object in this format:
{
  "logicalBlockInfo": {
    "suggestedEndLine": -1
  },
  "theory": [
    {
      "title": "Section Title",
      "content": "Markdown content with examples and explanations"
    }
  ],
  "questions": [
    {
      "question": "Question text",
      "answer": "Model answer",
      "explanation": "Explanation of the answer"
    }
  ],
  "tasks": [
    {
      "title": "Task Title",
      "description": "Task description",
      "requirements": ["Requirement 1", "Requirement 2"],
      "starterCode": "function example() {\\n  // Your code here\\n}",
      "solutionCode": "function example() {\\n  return 'solution';\\n}",
      "testCases": ["Test case 1", "Test case 2"]
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
