export type Difficulty = 'easy' | 'medium' | 'hard';
export type QuestionType = 'mcq' | 'code' | 'open' | 'flashcard';
export type Technology = 'React' | 'Next.js' | 'TypeScript' | 'JavaScript' | 'MUI' | 'Testing' | 'Performance' | 'CSS' | 'HTML' | 'Other' ;

export type Question = {
  id: string;
  topic: string;
  level: Difficulty;
  type: QuestionType;
  question: string;
  answer: string;
  example: string;
  tags: string[];
  options: string[];
  analysisPoints: string[];
  keyConcepts: string[];
  evaluationCriteria: string[];
  
  // Fields for learning plan optimization
  prerequisites: string[]; // Essential for sequencing
  complexity: number; // 1-10 scale of conceptual difficulty
  interviewFrequency: number; // 1-10 scale of how often asked in interviews
  learningPath: 'beginner' | 'intermediate' | 'advanced' | 'expert';
};

export type CodeTask = {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  startingCode: string;
  solutionCode: string;
  testCases: string[];
  hints: string[];
  tags: string[];
  timeEstimate: number; // in minutes
  
  // Fields for learning plan optimization
  prerequisites: string[]; // Essential for sequencing
  complexity: number; // 1-10 scale of implementation difficulty
  interviewRelevance: number; // 1-10 scale of relevance to interviews
  learningPath: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  relatedConcepts: string[]; // Links to theory concepts
};

export type TheoryBlock = {
  id: string;
  title: string;
  content: string;
  examples: CodeExample[];
  relatedQuestions: string[]; // Question IDs
  relatedTasks: string[]; // CodeTask IDs
  tags: string[];
  technology: Technology;
  
  // Fields for learning plan optimization
  prerequisites: string[]; // Essential for sequencing
  complexity: number; // 1-10 scale of conceptual difficulty
  interviewRelevance: number; // 1-10 scale of relevance to interviews
  learningPath: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  requiredFor: string[]; // Content that depends on this theory
};

export type CodeExample = {
  id: string;
  title: string;
  code: string;
  explanation: string;
  language: 'typescript' | 'javascript' | 'jsx' | 'tsx' | 'html' | 'css';
};

export type UserProgress = {
  date: string;
  questionId: string;
  isCorrect: boolean;
  attempts: number;
  timeTaken: number;
  notes?: string;
  topic?: string;
  difficulty?: Difficulty;
  problemAreas?: string[];
};

export type LearningProgram = {
  id: string;
  dateStarted: string;
  topics: Technology[];
  durationDays: number;
  currentDay: number;
  dailyPlans: DailyPlan[];
  progress: UserProgress[];
  savedExamples?: Record<string, string>;
  archived?: boolean; // Whether this program is archived
};

export type DailyPlan = {
  day: number;
  theoryBlockIds: string[];
  questionIds: string[];
  codeTaskId: string;
  completed: boolean;
};

export type AIProvider = 'openai' | 'claude' | 'gemini';

export type TimeEntry = {
  id: string;
  activity: 'theory' | 'question' | 'coding' | 'review';
  itemId: string;
  startTime: string;
  endTime: string | null;
  duration: number; // in seconds
  completed: boolean;
  tags: string[];
};

export type UserSettings = {
  id?: string; // Added for database storage
  name: string;
  selectedTechnologies: Technology[];
  learningDuration: number;
  darkMode: boolean;
  codeEditorTheme: string;
  aiProvider: AIProvider; // The selected AI provider
  openAIApiKey: string; // OpenAI API key
  claudeApiKey: string; // Claude/Anthropic API key
  geminiApiKey: string; // Google Gemini API key
  githubGistToken: string; // GitHub Personal Access Token for Gist storage
  useGistStorage: boolean; // Whether to use GitHub Gist for cloud storage
  saveAnswers: boolean; // Whether to save answers between sessions
};

// Index structure for fast content lookup
export type ContentIndex = {
  byTopic: Record<string, {
    theory: string[],
    questions: string[],
    tasks: string[]
  }>;
  byDifficulty: Record<Difficulty, string[]>;
  byLearningPath: Record<string, string[]>;
  byPrerequisites: Record<string, string[]>;
};

// Learning path template for generating interview plans
export type LearningPathTemplate = {
  id: string;
  name: string;
  description: string;
  targetLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  estimatedHours: number;
  topics: {
    topicId: string;
    requiredContentIds: string[];
    optionalContentIds?: string[];
  }[];
  prerequisites?: Technology[];
};
