import { Question } from '@/types';

interface AnalysisResult {
  isCorrect: boolean;
  score: number; // 0-100
  missingConcepts: string[];
  feedback: string;
  strengths: string[];
  weaknesses: string[];
}

/**
 * Analyzes a user's answer to an open-ended question
 * Uses key concept matching to determine correctness and provide detailed feedback
 */
export function analyzeOpenAnswer(
  question: Question,
  userAnswer: string
): AnalysisResult {
  // Default return structure
  const result: AnalysisResult = {
    isCorrect: false,
    score: 0,
    missingConcepts: [],
    feedback: '',
    strengths: [],
    weaknesses: []
  };

  // If the question has explicit key concepts to check for
  const keyConcepts = question.keyConcepts || extractKeyConcepts(question.answer);
  const keyConceptsFound: string[] = [];
  const keyConceptsMissing: string[] = [];

  // Check for each key concept in the user's answer
  keyConcepts.forEach((concept: string) => {
    const conceptLower = concept.toLowerCase();
    const answerLower = userAnswer.toLowerCase();
    
    if (answerLower.includes(conceptLower)) {
      keyConceptsFound.push(concept);
    } else {
      keyConceptsMissing.push(concept);
    }
  });

  // Calculate score based on percentage of key concepts found
  result.score = Math.round((keyConceptsFound.length / keyConcepts.length) * 100);
  result.isCorrect = result.score >= 70; // Consider 70% or better as correct
  result.missingConcepts = keyConceptsMissing;

  // Generate feedback
  if (result.isCorrect) {
    if (result.score === 100) {
      result.feedback = "Excellent answer! You covered all the key concepts perfectly.";
    } else {
      result.feedback = "Good answer! You covered most key concepts, but could add more detail on: " + 
        keyConceptsMissing.join(', ');
    }
    result.strengths = keyConceptsFound;
    result.weaknesses = keyConceptsMissing;
  } else {
    result.feedback = "Your answer needs improvement. Key concepts to include: " + 
      keyConceptsMissing.join(', ');
    result.strengths = keyConceptsFound;
    result.weaknesses = keyConceptsMissing;
  }

  return result;
}

/**
 * Special analyzer for React hooks questions
 */
export function analyzeHooksAnswer(
  question: Question,
  userAnswer: string
): AnalysisResult {
  // Handle specific types of hook questions differently
  if (question.question.includes('useMemo') && question.question.includes('useCallback')) {
    return analyzeUseMemoVsUseCallbackAnswer(question, userAnswer);
  }
  
  // Default to standard open answer analysis
  return analyzeOpenAnswer(question, userAnswer);
}

/**
 * Specialized analyzer for useMemo vs useCallback questions
 */
function analyzeUseMemoVsUseCallbackAnswer(
  question: Question,
  userAnswer: string
): AnalysisResult {
  const result: AnalysisResult = {
    isCorrect: false,
    score: 0,
    missingConcepts: [],
    feedback: '',
    strengths: [],
    weaknesses: []
  };

  // Key concepts that should be mentioned for this specific question
  const useMemoKeyConcepts = [
    'memoize values',
    'cache expensive calculations',
    'computed values',
    'prevent recalculation',
    'performance optimization'
  ];

  const useCallbackKeyConcepts = [
    'memoize functions',
    'function references',
    'prevent recreation',
    'referential equality',
    'child component optimization',
    'prevent rerenders'
  ];

  // Count how many key concepts were mentioned for each hook
  let useMemoScore = 0;
  let useCallbackScore = 0;
  const answerLower = userAnswer.toLowerCase();

  const useMemoFound = useMemoKeyConcepts.filter(concept => answerLower.includes(concept.toLowerCase()));
  const useCallbackFound = useCallbackKeyConcepts.filter(concept => answerLower.includes(concept.toLowerCase()));

  useMemoScore = Math.round((useMemoFound.length / useMemoKeyConcepts.length) * 100);
  useCallbackScore = Math.round((useCallbackFound.length / useCallbackKeyConcepts.length) * 100);

  // Check for correct example usage
  const hasUseMemoExample = answerLower.includes('usememo(') && answerLower.includes('=>') && answerLower.includes('[');
  const hasUseCallbackExample = answerLower.includes('usecallback(') && answerLower.includes('=>') && answerLower.includes('[');

  if (hasUseMemoExample) useMemoScore = Math.min(100, useMemoScore + 20);
  if (hasUseCallbackExample) useCallbackScore = Math.min(100, useCallbackScore + 20);

  // Calculate overall score
  result.score = Math.round((useMemoScore + useCallbackScore) / 2);
  result.isCorrect = result.score >= 70;

  // Track missing concepts
  const useMemoMissing = useMemoKeyConcepts.filter(concept => !useMemoFound.includes(concept));
  const useCallbackMissing = useCallbackKeyConcepts.filter(concept => !useCallbackFound.includes(concept));

  // Build feedback
  if (result.score >= 90) {
    result.feedback = "Excellent answer! You have a strong understanding of both useMemo and useCallback.";
  } else if (result.score >= 70) {
    result.feedback = "Good answer! You understand the basics of both hooks, but could be more specific about their differences.";
  } else if (result.score >= 50) {
    result.feedback = "Your answer needs improvement. Try to be more specific about the purpose of each hook.";
  } else {
    result.feedback = "Your answer needs significant improvement. Review the React hooks documentation for more details.";
  }

  // Add specific feedback for each hook
  if (useMemoScore < 70) {
    result.feedback += "\n\nFor useMemo, focus on: " + useMemoMissing.join(', ');
    result.missingConcepts.push(...useMemoMissing);
    result.weaknesses.push('useMemo understanding');
  } else {
    result.strengths.push('useMemo understanding');
  }

  if (useCallbackScore < 70) {
    result.feedback += "\n\nFor useCallback, focus on: " + useCallbackMissing.join(', ');
    result.missingConcepts.push(...useCallbackMissing);
    result.weaknesses.push('useCallback understanding');
  } else {
    result.strengths.push('useCallback understanding');
  }

  return result;
}

/**
 * Extract key concepts from a model answer
 */
function extractKeyConcepts(modelAnswer: string): string[] {
  // Basic implementation - split by periods and semicolons
  const sentences = modelAnswer.split(/[.;]/).filter(s => s.trim().length > 0);
  
  // Extract noun phrases and important terms
  return sentences.map(sentence => sentence.trim());
}

/**
 * Generate personalized learning recommendations based on answer analysis
 */
export function generateLearningRecommendations(
  analysisResults: AnalysisResult[], 
  topic: string
): string[] {
  const recommendations: string[] = [];
  
  // Count frequent weaknesses
  const weaknessCount = new Map<string, number>();
  analysisResults.forEach(result => {
    result.weaknesses.forEach(weakness => {
      weaknessCount.set(weakness, (weaknessCount.get(weakness) || 0) + 1);
    });
  });
  
  // Sort weaknesses by frequency
  const sortedWeaknesses = Array.from(weaknessCount.entries())
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0]);
  
  // Generate recommendations for top weaknesses
  sortedWeaknesses.slice(0, 3).forEach(weakness => {
    if (weakness.includes('useMemo')) {
      recommendations.push('Review useMemo documentation and practice with performance optimization examples');
    } else if (weakness.includes('useCallback')) {
      recommendations.push('Practice using useCallback with dependency arrays and component optimization');
    } else {
      recommendations.push(`Study more about ${weakness} in the context of ${topic}`);
    }
  });
  
  return recommendations;
}
