import { Question, Difficulty, QuestionType } from '@/types';

/**
 * Parses React Q&A content from markdown files into structured data for the application
 */
export class MarkdownParser {
  /**
   * Parses a React Q&A markdown file into structured Question objects
   * @param content The markdown content to parse
   * @returns Array of parsed Question objects
   */
  static parseReactQA(content: string): Question[] {
    const questions: Question[] = [];
    
    // Split content by question sections (usually starts with "## Q:")
    const sections = content.split(/\n##\s*(?=Q:)/g);
    
    for (const section of sections) {
      if (!section.trim()) continue;
      
      try {
        const question = this.parseQuestionSection(section);
        if (question) {
          questions.push(question);
        }
      } catch (error) {
        console.error('Error parsing question section:', error);
      }
    }
    
    return questions;
  }
  
  /**
   * Parse a single question section into a Question object
   * @param section The markdown section containing a single question
   * @returns Parsed Question object or null if parsing fails
   */
  private static parseQuestionSection(section: string): Question | null {
    // Extract question text
    const questionMatch = section.match(/Q:\s*(.*?)(?=\n[A|E]:|\n##|$)/);
    if (!questionMatch) return null;
    
    // Extract answer
    const answerMatch = section.match(/A:\s*(.*?)(?=\n[Q|E]:|\n##|$)/);
    if (!answerMatch) return null;
    
    // Extract example (optional)
    const exampleMatch = section.match(/E:\s*(.*?)(?=\n[Q|A]:|\n##|$)/);
    
    // Extract category/topic from context or header
    const topicMatch = section.match(/Category:\s*(.*?)(?=\n|$)/i) || 
                      section.match(/Topic:\s*(.*?)(?=\n|$)/i);
    
    // Generate a unique ID based on the question content
    const id = 'q_' + this.generateQuestionId(questionMatch[1]);
    
    // Determine difficulty based on content length and complexity
    const difficulty = this.estimateDifficulty(answerMatch[1]);
    
    // Determine question type based on content
    const type = this.determineQuestionType(section);
    
    // Extract tags from the content
    const tags = this.extractTags(section);
    
    return {
      id,
      topic: topicMatch ? topicMatch[1].trim() : 'React',
      level: difficulty,
      type,
      question: questionMatch[1].trim(),
      answer: answerMatch[1].trim(),
      example: exampleMatch ? exampleMatch[1].trim() : '',
      tags,
      options: [],
      analysisPoints: [],
      keyConcepts: [],
      evaluationCriteria: [],
      prerequisites: [],
      complexity: 5,
      interviewFrequency: 5,
      learningPath: 'intermediate'
    };
  }
  
  /**
   * Generate a unique ID for a question based on its content
   * @param questionText The question text
   * @returns A unique string ID
   */
  private static generateQuestionId(questionText: string): string {
    // Create a simplified slug from the first few words of the question
    const slug = questionText.trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(' ')
      .slice(0, 5)
      .join('_');
    
    // Add a hash to ensure uniqueness
    const hash = Math.abs(this.simpleHash(questionText)).toString(16).substring(0, 6);
    
    return `${slug}_${hash}`;
  }
  
  /**
   * Generate a simple numeric hash of a string
   * @param str Input string
   * @returns Numeric hash value
   */
  private static simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  }
  
  /**
   * Estimate the difficulty of a question based on its answer
   * @param answerText The answer text
   * @returns Estimated difficulty level
   */
  private static estimateDifficulty(answerText: string): Difficulty {
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
  
  /**
   * Determine the type of question based on content
   * @param section The complete question section
   * @returns Question type
   */
  private static determineQuestionType(section: string): QuestionType {
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
  
  /**
   * Extract tags from the question content
   * @param section The complete question section
   * @returns Array of extracted tags
   */
  private static extractTags(section: string): string[] {
    const tags: string[] = [];
    
    // Look for explicit tags
    const tagMatch = section.match(/Tags:\s*(.*?)(?=\n|$)/i);
    if (tagMatch) {
      const tagText = tagMatch[1];
      tags.push(...tagText.split(',').map(tag => tag.trim()));
      return tags;
    }
    
    // Extract implicit tags based on keywords in the content
    const keywordMap: Record<string, string[]> = {
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
}
