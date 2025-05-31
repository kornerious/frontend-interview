// This script will import your structured React Q&A content and convert it to JSON for the application
const fs = require('fs');
const path = require('path');

// Paths to the structured Q&A content files
const structuredDir = path.resolve('/Users/alex/Downloads/Interview/CheatSheet/merge/Structured');
const outputDir = path.resolve(__dirname, '../data');

// Function to parse Q&A content from markdown
function parseReactQA(content) {
  const questions = [];
  
  // Split content by question sections (usually starts with "## Q:")
  const sections = content.split(/\n##\s*(?=Q:)/g);
  
  for (const section of sections) {
    if (!section.trim()) continue;
    
    try {
      const question = parseQuestionSection(section);
      if (question) {
        questions.push(question);
      }
    } catch (error) {
      console.error('Error parsing question section:', error);
    }
  }
  
  return questions;
}

// Parse a single question section
function parseQuestionSection(section) {
  // Extract question text
  const questionMatch = section.match(/Q:\s*(.*?)(?=\n[A|E]:|\n##|$)/s);
  if (!questionMatch) return null;
  
  // Extract answer
  const answerMatch = section.match(/A:\s*(.*?)(?=\n[Q|E]:|\n##|$)/s);
  if (!answerMatch) return null;
  
  // Extract example (optional)
  const exampleMatch = section.match(/E:\s*(.*?)(?=\n[Q|A]:|\n##|$)/s);
  
  // Extract category/topic from context or header
  const topicMatch = section.match(/Category:\s*(.*?)(?=\n|$)/i) || 
                    section.match(/Topic:\s*(.*?)(?=\n|$)/i);
  
  // Generate a unique ID based on the question content
  const id = 'q_' + generateQuestionId(questionMatch[1]);
  
  // Determine difficulty based on content length and complexity
  const difficulty = estimateDifficulty(answerMatch[1]);
  
  // Determine question type based on content
  const type = determineQuestionType(section);
  
  // Extract tags from the content
  const tags = extractTags(section);
  
  return {
    id,
    topic: topicMatch ? topicMatch[1].trim() : 'React',
    level: difficulty,
    type,
    question: questionMatch[1].trim(),
    answer: answerMatch[1].trim(),
    example: exampleMatch ? exampleMatch[1].trim() : undefined,
    tags
  };
}

// Generate a unique ID for a question
function generateQuestionId(questionText) {
  // Create a simplified slug from the first few words of the question
  const slug = questionText.trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(' ')
    .slice(0, 5)
    .join('_');
  
  // Add a hash to ensure uniqueness
  const hash = Math.abs(simpleHash(questionText)).toString(16).substring(0, 6);
  
  return `${slug}_${hash}`;
}

// Simple hash function
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

// Estimate question difficulty
function estimateDifficulty(answerText) {
  const length = answerText.length;
  const complexityMarkers = [
    'advanced', 'complex', 'difficult', 'optimization',
    'performance', 'security', 'architecture', 'design pattern'
  ];
  
  // Check for complexity markers
  const hasComplexityMarkers = complexityMarkers.some(marker => 
    answerText.toLowerCase().includes(marker)
  );
  
  // Determine difficulty
  if (length > 1000 || hasComplexityMarkers) {
    return 'hard';
  } else if (length > 500) {
    return 'medium';
  } else {
    return 'easy';
  }
}

// Determine question type
function determineQuestionType(section) {
  const lowerSection = section.toLowerCase();
  
  // Check for code snippets or examples
  if (lowerSection.includes('```') || lowerSection.includes('`') || lowerSection.includes('<code>')) {
    return 'code';
  }
  
  // Check for multiple choice indicators
  if (lowerSection.includes('a)') && lowerSection.includes('b)') || 
      lowerSection.includes('option a') && lowerSection.includes('option b')) {
    return 'mcq';
  }
  
  // Check if it's a short definition/concept (flashcard)
  if (section.length < 500 && !lowerSection.includes('example') && !lowerSection.includes('code')) {
    return 'flashcard';
  }
  
  // Default to open-ended question
  return 'open';
}

// Extract tags from the question content
function extractTags(section) {
  const tags = [];
  
  // Look for explicit tags
  const tagMatch = section.match(/Tags:\s*(.*?)(?=\n|$)/i);
  if (tagMatch) {
    const tagText = tagMatch[1];
    tags.push(...tagText.split(',').map(tag => tag.trim()));
    return tags;
  }
  
  // Extract implicit tags based on keywords in the content
  const keywordMap = {
    'hooks': ['useState', 'useEffect', 'useContext', 'useReducer', 'useCallback', 'useMemo', 'useRef'],
    'performance': ['optimization', 'memoization', 'memo', 'shouldComponentUpdate', 'pure component'],
    'lifecycle': ['componentDidMount', 'componentDidUpdate', 'componentWillUnmount', 'useEffect'],
    'state management': ['redux', 'context', 'state', 'reducer', 'store', 'recoil', 'zustand'],
    'styling': ['css', 'style', 'styled-components', 'css-in-js', 'tailwind', 'sass'],
    'routing': ['router', 'navigation', 'link', 'route', 'url', 'history', 'location'],
    'typescript': ['typescript', 'interface', 'type', 'generic', 'typing', 'typed']
  };
  
  // Check for keywords and add corresponding tags
  const lowerSection = section.toLowerCase();
  for (const [tag, keywords] of Object.entries(keywordMap)) {
    if (keywords.some(keyword => lowerSection.includes(keyword.toLowerCase()))) {
      tags.push(tag);
    }
  }
  
  return tags;
}

// Main execution
async function main() {
  try {

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Import from each file
    const targetFiles = [
      'React_QA.md',
      'Complete_React_QA_Final.md',
      'React_QA_Final.md'
    ];
    
    let allQuestions = [];
    
    for (const file of targetFiles) {
      const filePath = path.join(structuredDir, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const questions = parseReactQA(content);
        allQuestions = [...allQuestions, ...questions];
      } else {
        console.warn(`File not found: ${filePath}`);
      }
    }
    
    // Remove duplicates based on similar questions
    const uniqueQuestions = removeDuplicates(allQuestions);

    // Save to JSON file
    const outputPath = path.join(outputDir, 'reactQuestions.json');
    fs.writeFileSync(outputPath, JSON.stringify(uniqueQuestions, null, 2), 'utf8');

    // Create a TypeScript module to access the data
    const tsModulePath = path.join(outputDir, 'reactQuestionsData.ts');
    const tsContent = `
// Auto-generated from React Q&A markdown files
import { Question } from '@/types';

export const reactQuestions: Question[] = ${JSON.stringify(uniqueQuestions, null, 2)};
`;
    fs.writeFileSync(tsModulePath, tsContent, 'utf8');

  } catch (error) {
    console.error('Error during import:', error);
  }
}

// Remove duplicate questions based on similarity
function removeDuplicates(questions) {
  const uniqueQuestions = [];
  const questionMap = new Map(); // Maps question texts to their indices
  
  for (const question of questions) {
    // Normalize the question text for comparison
    const normalizedQuestion = question.question.toLowerCase().trim();
    
    // Check if we already have a similar question
    let isDuplicate = false;
    for (const [existingQ, index] of questionMap.entries()) {
      if (areSimilar(normalizedQuestion, existingQ)) {
        // Keep the longer/more detailed answer
        if (question.answer.length > uniqueQuestions[index].answer.length) {
          uniqueQuestions[index] = question;
        }
        isDuplicate = true;
        break;
      }
    }
    
    if (!isDuplicate) {
      questionMap.set(normalizedQuestion, uniqueQuestions.length);
      uniqueQuestions.push(question);
    }
  }
  
  return uniqueQuestions;
}

// Check if two question texts are similar
function areSimilar(q1, q2) {
  // If they're very short, require high similarity
  if (q1.length < 20 || q2.length < 20) {
    return q1 === q2;
  }
  
  // For longer questions, check if one contains the other's key words
  const words1 = new Set(q1.split(/\W+/).filter(w => w.length > 3));
  const words2 = new Set(q2.split(/\W+/).filter(w => w.length > 3));
  
  let commonWords = 0;
  for (const word of words1) {
    if (words2.has(word)) {
      commonWords++;
    }
  }
  
  const similarity = commonWords / Math.min(words1.size, words2.size);
  return similarity > 0.7; // 70% similar words
}

// Run the script
main().catch(console.error);
