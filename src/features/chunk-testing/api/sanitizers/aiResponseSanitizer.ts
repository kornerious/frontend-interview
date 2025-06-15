/**
 * Sanitizes AI responses to ensure they are valid JSON
 * Returns null if the response cannot be parsed as valid JSON
 */
export function sanitizeAIResponse(response: string): any | null {
  if (!response) {
    return null;
  }
  
  // Remove any text prefix before the first { character
  let cleanedResponse = response;
  const firstBraceIndex = cleanedResponse.indexOf('{');
  
  if (firstBraceIndex > 0) {
    // There's text before the first opening brace
    cleanedResponse = cleanedResponse.substring(firstBraceIndex);
  }
  
  // Handle case where text appears between { and [
  // Example: {This is Response: [ ... ] becomes { [ ... ]
  cleanedResponse = cleanedResponse.replace(/\{([^\[\{]*?)\[/g, '{[');
  
  // Simple check for markdown code blocks and remove them if present
  if (cleanedResponse.startsWith('```json') || cleanedResponse.startsWith('```')) {
    // Remove opening ```json or ``` and closing ```
    cleanedResponse = cleanedResponse
      .replace(/^```(?:json)?\s*/, '') // Remove opening ```json or ```
      .replace(/\s*```$/, '');        // Remove closing ```
  }
  
  try {
    // Try to parse the cleaned response
    const parsed = JSON.parse(cleanedResponse);
    return parsed;
  } catch (error) {
    // If parsing fails, try to extract JSON from the response
    try {
      // Look for JSON object pattern
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const extracted = JSON.parse(jsonMatch[0]);
        return extracted;
      } else {
        // No valid JSON object found
        return null;
      }
    } catch (extractError) {
      // Failed to parse extracted JSON
      return null;
    }
  }
}
