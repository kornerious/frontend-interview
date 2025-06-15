/**
 * Sanitizes AI responses to ensure they are valid JSON
 */
export function sanitizeAIResponse(response: string): any {
  console.log('[DEBUG] sanitizeAIResponse received response type:', typeof response);
  console.log('[DEBUG] sanitizeAIResponse response length:', response?.length || 0);
  console.log('[This is response:', response);
  
  // Simple check for markdown code blocks and remove them if present
  let cleanedResponse = response;
  if (response.startsWith('```json') || response.startsWith('```')) {
    console.log('[DEBUG] Found markdown code block, removing it');
    // Remove opening ```json or ``` and closing ```
    cleanedResponse = response
      .replace(/^```(?:json)?\s*/, '') // Remove opening ```json or ```
      .replace(/\s*```$/, '');        // Remove closing ```
    console.log('[DEBUG] Cleaned response:', cleanedResponse);
  }
  
  try {
    // Try to parse the cleaned response
    console.log('[DEBUG] Attempting JSON parse');
    const parsed = JSON.parse(cleanedResponse);
    console.log('[DEBUG] JSON parse successful');
    return parsed;
  } catch (error) {
    console.log('[DEBUG] JSON parse failed:', error instanceof Error ? error.message : String(error));
    
    // If parsing fails, try to extract JSON from the response
    try {
      // Look for JSON object pattern
      console.log('[DEBUG] Attempting to extract JSON using regex');
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        console.log('[DEBUG] JSON pattern found, attempting to parse extracted content');
        const extracted = JSON.parse(jsonMatch[0]);
        console.log('[DEBUG] Extracted JSON parse successful');
        return extracted;
      }
      
      // If no JSON object found, throw error
      console.error('[DEBUG] No JSON pattern found in response');
      throw new Error('No valid JSON found in response');
    } catch (extractError) {
      console.error('[DEBUG] Error extracting JSON from response:', extractError);
      console.error('[DEBUG] Original response (first 500 chars):', response?.substring(0, 500));
      throw new Error('Failed to parse AI response as JSON');
    }
  }
}
