/**
 * Sanitizes AI responses to ensure they are valid JSON
 */
export function sanitizeAIResponse(response: string): any {
  console.log('[DEBUG] sanitizeAIResponse received response type:', typeof response);
  console.log('[DEBUG] sanitizeAIResponse response length:', response?.length || 0);
  console.log('[This is esponse:', response);
  try {
    // First, try to parse the response directly
    console.log('[DEBUG] Attempting direct JSON parse');
    const parsed = JSON.parse(response);
    console.log('[DEBUG] Direct JSON parse successful, result:', parsed);
    return parsed;
  } catch (error) {
    console.log('[DEBUG] Direct JSON parse failed:', error instanceof Error ? error.message : String(error));
    console.log("response for questions:" + response);
    // If direct parsing fails, try to extract JSON from the response
    try {
      // Look for JSON object pattern
      console.log('[DEBUG] Attempting to extract JSON using regex');
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        console.log('[DEBUG] JSON pattern found, attempting to parse extracted content');
        const extracted = JSON.parse(jsonMatch[0]);
        console.log('[DEBUG] Extracted JSON parse successful, result:', extracted);
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
