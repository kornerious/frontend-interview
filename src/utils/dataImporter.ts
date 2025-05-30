import fs from 'fs';
import path from 'path';
import { Question, CodeTask, TheoryBlock } from '@/types';
import { MarkdownParser } from './markdownParser';

/**
 * Utility for importing external data into the application
 */
export class DataImporter {
  /**
   * Import questions from a markdown file
   * @param filePath Path to the markdown file containing Q&A content
   * @returns Array of parsed Question objects
   */
  static importQuestionsFromFile(filePath: string): Question[] {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return MarkdownParser.parseReactQA(content);
    } catch (error) {
      console.error(`Error importing questions from ${filePath}:`, error);
      return [];
    }
  }
  
  /**
   * Convert imported questions to JSON format for storage or use in the application
   * @param questions Array of Question objects
   * @param outputPath Path to save the JSON output (optional)
   * @returns JSON string of the questions
   */
  static convertQuestionsToJson(questions: Question[], outputPath?: string): string {
    const json = JSON.stringify(questions, null, 2);
    
    if (outputPath) {
      try {
        fs.writeFileSync(outputPath, json, 'utf8');
        console.log(`Questions saved to ${outputPath}`);
      } catch (error) {
        console.error(`Error saving questions to ${outputPath}:`, error);
      }
    }
    
    return json;
  }
  
  /**
   * Import questions from a directory of markdown files
   * @param directoryPath Path to the directory containing markdown files
   * @param pattern File pattern to match (default: *.md)
   * @returns Array of parsed Question objects from all files
   */
  static importQuestionsFromDirectory(directoryPath: string, pattern = '*.md'): Question[] {
    try {
      const files = fs.readdirSync(directoryPath)
        .filter(file => file.endsWith('.md'));
      
      let allQuestions: Question[] = [];
      
      for (const file of files) {
        const filePath = path.join(directoryPath, file);
        const questions = this.importQuestionsFromFile(filePath);
        allQuestions = [...allQuestions, ...questions];
      }
      
      return allQuestions;
    } catch (error) {
      console.error(`Error importing questions from directory ${directoryPath}:`, error);
      return [];
    }
  }
  
  /**
   * Helper method to generate theory blocks from imported questions
   * @param questions Array of Question objects
   * @returns Array of TheoryBlock objects generated from the questions
   */
  static generateTheoryBlocksFromQuestions(questions: Question[]): TheoryBlock[] {
    // Group questions by topic
    const questionsByTopic: Record<string, Question[]> = {};
    
    for (const question of questions) {
      if (!questionsByTopic[question.topic]) {
        questionsByTopic[question.topic] = [];
      }
      questionsByTopic[question.topic].push(question);
    }
    
    // Create theory blocks for each topic
    const theoryBlocks: TheoryBlock[] = [];
    
    for (const [topic, topicQuestions] of Object.entries(questionsByTopic)) {
      // Skip if there are too few questions for a meaningful theory block
      if (topicQuestions.length < 3) continue;
      
      // Create a theory block ID
      const blockId = topic.toLowerCase().replace(/[^a-z0-9]/g, '_');
      
      // Determine the technology
      const technology = this.determineTechnology(topic);
      
      // Generate content based on most comprehensive answers
      const content = this.generateTheoryContent(topic, topicQuestions);
      
      // Extract code examples from questions
      const examples = this.extractCodeExamples(topicQuestions);
      
      // Generate theory block
      const theoryBlock: TheoryBlock = {
        id: blockId,
        title: topic,
        content,
        examples,
        relatedQuestions: topicQuestions.slice(0, 5).map(q => q.id),
        relatedTasks: [],
        tags: this.extractTopicTags(topicQuestions),
        technology
      };
      
      theoryBlocks.push(theoryBlock);
    }
    
    return theoryBlocks;
  }
  
  /**
   * Determine the most appropriate technology for a topic
   * @param topic The topic name
   * @returns The most appropriate Technology
   */
  private static determineTechnology(topic: string): any {
    const lowerTopic = topic.toLowerCase();
    
    if (lowerTopic.includes('react')) return 'React';
    if (lowerTopic.includes('next')) return 'Next.js';
    if (lowerTopic.includes('typescript')) return 'TypeScript';
    if (lowerTopic.includes('javascript')) return 'JavaScript';
    if (lowerTopic.includes('css')) return 'CSS';
    if (lowerTopic.includes('html')) return 'HTML';
    if (lowerTopic.includes('test')) return 'Testing';
    if (lowerTopic.includes('performance')) return 'Performance';
    
    // Default to React if we can't determine
    return 'React';
  }
  
  /**
   * Generate theory content from a set of questions
   * @param topic The topic name
   * @param questions Array of questions on the topic
   * @returns Markdown content for the theory block
   */
  private static generateTheoryContent(topic: string, questions: Question[]): string {
    // Find the most comprehensive answers (usually the longest)
    const sortedByAnswerLength = [...questions].sort((a, b) => b.answer.length - a.answer.length);
    const topQuestions = sortedByAnswerLength.slice(0, 3);
    
    // Generate a comprehensive theory section from the best answers
    let content = `# ${topic}\n\n`;
    
    // Add an introduction if possible
    const introQuestion = topQuestions.find(q => 
      q.question.toLowerCase().includes('what is') || 
      q.question.toLowerCase().includes('explain') ||
      q.question.toLowerCase().includes('define')
    );
    
    if (introQuestion) {
      content += `${introQuestion.answer}\n\n`;
    }
    
    // Add key concepts from other top questions
    for (const question of topQuestions) {
      if (question !== introQuestion) {
        content += `## ${question.question}\n\n${question.answer}\n\n`;
      }
    }
    
    return content;
  }
  
  /**
   * Extract code examples from questions
   * @param questions Array of questions
   * @returns Array of code examples
   */
  private static extractCodeExamples(questions: Question[]): any[] {
    const examples: any[] = [];
    let exampleId = 1;
    
    // Find questions with code examples
    const questionsWithCode = questions.filter(q => 
      q.type === 'code' || 
      (q.example && (
        q.example.includes('```') || 
        q.example.includes('`') || 
        q.example.includes('<code>')
      ))
    );
    
    for (const question of questionsWithCode) {
      if (!question.example) continue;
      
      // Extract code blocks
      const codeMatches = question.example.match(/```(?:jsx?|tsx?|javascript|typescript)?\s*([^`]+)```/g);
      if (!codeMatches) continue;
      
      for (const codeMatch of codeMatches) {
        // Clean up the code
        let code = codeMatch.replace(/```(?:jsx?|tsx?|javascript|typescript)?\s*/g, '')
          .replace(/```$/g, '')
          .trim();
        
        // Determine language
        let language: any = 'javascript';
        if (code.includes('import React') || code.includes('<')) {
          language = code.includes(':') ? 'tsx' : 'jsx';
        }
        
        // Create an example
        examples.push({
          id: `example_${exampleId++}`,
          title: question.question,
          code,
          explanation: question.answer,
          language
        });
        
        // Limit to 3 examples per topic
        if (examples.length >= 3) break;
      }
    }
    
    return examples;
  }
  
  /**
   * Extract tags from a set of questions
   * @param questions Array of questions
   * @returns Array of unique tags
   */
  private static extractTopicTags(questions: Question[]): string[] {
    const tagSet = new Set<string>();
    
    for (const question of questions) {
      if (question.tags) {
        for (const tag of question.tags) {
          tagSet.add(tag);
        }
      }
    }
    
    return Array.from(tagSet);
  }
}
