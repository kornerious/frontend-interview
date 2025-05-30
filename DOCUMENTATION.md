# Frontend Interview Preparation App Documentation

## Overview
This documentation provides a comprehensive guide to the Frontend Interview Preparation App, a Next.js application designed to help users prepare for frontend developer interviews through theory content, quizzes, and coding challenges.

## Core Features

### 1. Learning Path System
- Users can create personalized learning plans based on selected technologies and durations
- The app generates a daily plan with theory, questions, and coding tasks
- Progress is tracked and saved

### 2. Theory Content with Editable Examples
- Interactive theory modules with React, Next.js, TypeScript, and other frontend topics
- **Editable code examples** with live preview using **Codesandbox Editor**
- GitHub Gist persistence for saved code examples
- Multi-file editing and preview functionality
- File explorer for managing complex examples

### 3. Questions and Quizzes
- Multiple choice, open-ended, code, and flashcard type questions
- Integration with structured React Q&A content from external markdown files
- Difficulty levels (easy, medium, hard) with appropriate tagging

### 4. Coding Challenges
- LeetCode-style coding tasks with embedded Codesandbox editor (default) and Monaco editor option
- Test cases with automated evaluation and AI-powered code review
- Support for multiple approaches and solutions
- File explorer for multi-file projects
- Console output and debugging tools

### 5. Progress Tracking and GitHub Gist Integration
- User progress and settings stored in GitHub Gists for cloud persistence
- Cross-device synchronization using GitHub Gist API
- Daily plans with completion status and automatic progression
- Comprehensive performance analytics on strengths and weaknesses
- Time tracking for all user activities with detailed reports

### 6. Backup and Export
- Archive and export programs as TypeScript files
- Import functionality to restore from backups
- Local file system saving for program snapshots

### 7. Dark/Light Mode
- Default dark mode with ability to toggle
- Consistent theming across components including code blocks

## Technical Architecture

### Tech Stack
- **Frontend**: Next.js, React, TypeScript
- **UI Components**: Material UI (MUI) v5
- **State Management**: Zustand
- **Code Editors**: Codesandbox Editor (primary), Monaco Editor (alternative)
- **Storage**: GitHub Gists for cloud persistence and synchronization
- **Live Code Examples**: Codesandbox Editor with file explorer and preview

### Directory Structure
```
/src
  /components
    - AppLayout.tsx              # Main application layout
    - CodesandboxEditor.tsx      # Codesandbox editor with file explorer
    - LeetEditor.tsx             # Coding task editor with Codesandbox integration
    - QuestionCard.tsx           # Card component for questions
    - TheoryBlock.tsx            # Theory content display
    - ImportDataButton.tsx       # Import React Q&A content
    - AIConversation.tsx         # AI conversation interface
    - AIEvaluator.tsx            # AI answer evaluation component
    - DailyPlan.tsx              # Daily learning plan display
    - DatabaseInitializer.tsx    # GitHub Gist initialization component
    - LiveExampleEditor.tsx      # Live code example editor
    - PersonalizedRecommendations.tsx # Personalized learning recommendations
    - ProgramSwitcher.tsx        # Learning program switcher component
  /data
    - sampleQuestions.ts         # Sample questions data
    - sampleTasks.ts             # Sample coding tasks
    - sampleTheory.ts            # Sample theory content
  /editor
    - ArchiveManager.ts          # Manages program archives with GitHub Gist
  /features
    /learning
      - planner.ts               # Generates learning plans
    /progress
      - useProgressStore.ts      # Store for user progress with GitHub Gist sync
      - useSettingsStore.ts      # Store for user settings with GitHub Gist sync
      - useDatabaseSync.ts       # GitHub Gist synchronization hooks
      - useTimeTracking.ts       # Time tracking functionality
  /pages
    - _app.tsx                   # Next.js app entry
    - index.tsx                  # Dashboard/home page
    - daily.tsx                  # Daily learning plan
    - theory.tsx                 # Browse theory content
    - questions.tsx              # Practice questions
    - tasks.tsx                  # Coding tasks
    - settings.tsx               # User settings
    - progress.tsx               # Progress overview
  /scripts
    - importQAContent.js         # Script to import React Q&A
  /types
    - index.ts                   # TypeScript type definitions
  /utils
    - aiService.ts               # AI service abstraction layer
    - answerAnalyzer.ts          # Analyzes user answers
    - archiveManager.ts          # Secondary archive manager
    - claudeService.ts           # Claude AI integration
    - dataImporter.ts            # Imports external data
    - evaluationStorageService.ts # Stores evaluation results in GitHub Gist
    - geminiService.ts           # Gemini AI integration
    - gistStorageService.ts      # Core GitHub Gist storage service
    - markdownParser.ts          # Parses markdown content
    - openaiService.ts           # OpenAI integration
```

### Key Components

#### GistStorageService
The `GistStorageService` is the core storage utility that provides GitHub Gist-based persistence for all application data:

```typescript
// Initialize GitHub Gist storage
await gistStorageService.initialize(token);

// Save settings to GitHub Gist
await gistStorageService.saveSettings(updatedSettings);

// Save code examples to GitHub Gist
await gistStorageService.saveCodeExample(exampleId, code, contextId);

// Save user progress to GitHub Gist
await gistStorageService.saveProgram(program);
```

#### CodesandboxEditor
The `CodesandboxEditor` component provides a powerful interactive code environment with these features:
- Multi-file editing with file explorer
- Live preview with real-time updates
- Console output for debugging
- File upload functionality
- Support for multiple languages and frameworks
- Persistent storage of code in GitHub Gists

```tsx
// Usage example
<CodesandboxEditor
  code="const greeting = 'Hello, World!';"
  language="javascript"
  onChange={(code) => handleCodeChange(code)}
  theme="dark"
/>
```

#### ArchiveManager
The `ArchiveManager` utility handles saving and loading programs using GitHub Gists and can export as TypeScript files:

```typescript
// Save a program to GitHub Gist
await ArchiveManager.getInstance().saveProgram(currentProgram);

// Get all programs from GitHub Gist
const programs = await ArchiveManager.getInstance().getAllPrograms();
```

#### AI Services
The application supports multiple AI providers (Claude, OpenAI, Gemini) for answer evaluation and assistance:

```typescript
// Get the configured AI service based on user settings
const aiService = await getAIService(settings.aiProvider);

// Evaluate a user answer
const evaluation = await aiService.evaluateAnswer(question, userAnswer, modelAnswer);
```

#### Markdown Parser
The `MarkdownParser` utility converts structured markdown content into app-compatible data structures:

```typescript
// Parse React Q&A content
const questions = MarkdownParser.parseReactQA(markdownContent);
```

### State Management

The app uses Zustand for state management with the following main stores, all synchronized with GitHub Gists:

#### Settings Store
Manages user preferences including:
- Dark/light mode
- Selected technologies
- Learning duration
- Code editor theme
- GitHub Gist token for storage

#### Progress Store
Tracks the user's learning progress:
- Current program status
- Completed questions and tasks
- Performance metrics
- Archived programs

### Data Models

#### User Settings
```typescript
interface UserSettings {
  name: string;
  selectedTechnologies: Technology[];
  learningDuration: number;
  darkMode: boolean;
  codeEditorTheme: string;
  aiProvider: AIProvider; // 'openai' | 'claude' | 'gemini'
  openAIApiKey: string;
  claudeApiKey: string;
  geminiApiKey: string;
  githubGistToken: string;
  useGistStorage: boolean;
  saveAnswers: boolean;
  lastExportDate?: string;
}
```

#### Theory Block
```typescript
type TheoryBlock = {
  id: string;
  title: string;
  content: string;
  examples: CodeExample[];
  relatedQuestions: string[];
  relatedTasks: string[];
  tags: string[];
  technology: Technology;
};
```

#### Question
```typescript
type Question = {
  id: string;
  topic: string;
  level: Difficulty;
  type: QuestionType;
  question: string;
  answer: string;
  example?: string;
  tags?: string[];
};
```

#### Learning Program
```typescript
type LearningProgram = {
  id: string;
  dateStarted: string;
  topics: Technology[];
  durationDays: number;
  currentDay: number;
  dailyPlans: DailyPlan[];
  progress: UserProgress[];
  savedExamples?: Record<string, string>;
};
```

## Advanced Features

### Learning Curve Engine
The Learning Curve Engine adapts content based on user performance and identified weak areas:

```typescript
// src/features/learning/learningCurveEngine.ts
interface WeakAreaDetection {
  tag: string;
  accuracy: number;
  timeSpent: number;
  occurrences: number;
  lastAttemptDate: string;
}

interface LearningRecommendation {
  type: 'theory' | 'question' | 'task' | 'revision';
  topics: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  reason: string;
}

function generateDailyPlan(progress: UserProgress, weakAreas: WeakAreaDetection[]): DailyPlan {
  // Intelligently combines regular progression with targeted practice for weak areas
  // Returns a personalized daily plan with theory, questions and coding tasks
}
```

### Time Tracking System
The app includes comprehensive time tracking for all user activities:

```typescript
// src/features/progress/useTimeTracking.ts
interface TimeEntry {
  activity: 'theory' | 'question' | 'coding' | 'review';
  itemId: string;
  startTime: string;
  endTime: string;
  duration: number; // in seconds
  completed: boolean;
}

function startTimer(activity: string, itemId: string): void;
function stopTimer(): TimeEntry;
function getTotalTimeByActivity(): Record<string, number>;
function getAverageTimeForQuestionType(type: QuestionType): number;
```

### Gamification System
The app includes engagement features to maintain user motivation:

```typescript
// src/features/progress/useGameElements.ts
interface GameStats {
  level: number;
  xp: number;
  xpToNextLevel: number;
  streak: number;
  longestStreak: number;
  badges: Badge[];
  achievements: Achievement[];
}

function awardXP(activity: string, performance: number): number;
function updateStreak(isActive: boolean): number;
function checkForLevelUp(): boolean;
function unlockBadge(badgeId: string): Badge;
```

## Feature Implementation Details

### Dark Mode Implementation
The app uses Material UI's theme provider with the default mode set to dark:

```typescript
// src/features/progress/useSettingsStore.ts
const DEFAULT_SETTINGS: UserSettings = {
  // ...other settings
  darkMode: true,
  codeEditorTheme: 'vs-dark',
};
```

```typescript
// src/pages/_app.tsx
const theme = createTheme({
  palette: {
    mode: settings.darkMode ? 'dark' : 'light',
    // ...other theme settings
  },
});
```

### Program Export/Import
Programs are exported as TypeScript files with the following structure:

```typescript
// frontend-prep_2025-05-29.ts
export const program = {
  id: "prep_2025_05_29",
  dateStarted: "2025-05-29",
  topics: ["React", "Next.js", "TypeScript"],
  durationDays: 14,
  currentDay: 3,
  // ...other program data
};
```

The export function uses the File System Access API when available, with a fallback to the traditional download method:

```typescript
if ('showSaveFilePicker' in window) {
  // Use modern File System Access API
} else {
  // Fallback to traditional download
  const blob = new Blob([fileContent], { type: 'text/typescript' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
}
```

### React Q&A Content Integration
The app includes utilities to import Q&A content from structured markdown files:

1. **Parsing**: Using regex patterns to extract questions, answers, and examples
2. **Categorization**: Auto-categorizing by topic and tagging based on content
3. **Deduplication**: Removing similar questions to avoid redundancy
4. **Integration**: Converting to the app's internal data structure

## Environment Variables

The application requires the following environment variables for proper functionality:

```
# GitHub Gist Storage
NEXT_PUBLIC_GITHUB_GIST_TOKEN=your_github_personal_access_token
NEXT_PUBLIC_GIST_ID=your_gist_id_for_data_storage
NEXT_PUBLIC_GIST_FILENAME=FrontendDevInterview.json

# AI Providers (Optional)
NEXT_PUBLIC_CLAUDE_API_KEY=your_anthropic_api_key
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_GEMINI_API_KEY=your_google_gemini_api_key
```

## Future Development

### Planned Features
1. **Enhanced GitHub Integration**: Further integration with GitHub features and version control
2. **Mock Interview Mode**: Timed interview simulations with AI feedback
3. **Multi-user Mode**: Support for multiple users with different Gist IDs
4. **AI Code Review**: Integration with AI to review user solutions
5. **Expanded Content**: More technologies and question types

### Extension Points
1. **New Question Types**: The `QuestionType` enum can be extended
2. **Additional Technologies**: Add more tech options to the `Technology` type
3. **Enhanced Analytics**: Add more detailed progress tracking
4. **Mobile Optimization**: Improve mobile responsiveness

## Troubleshooting

### Common Issues
1. **Import Errors**: Make sure markdown files follow the expected format with Q:, A:, and E: sections
2. **GitHub Gist Token**: Ensure your GitHub Gist token has correct permissions and is properly set in the environment variables
3. **TypeScript Errors**: Use `Array.from()` instead of spread operators with Sets for compatibility
4. **Material UI Version**: Ensure compatibility between MUI components and icons package versions

### Development Tips
1. **Adding New Components**: Follow the existing pattern of separating UI and logic
2. **State Management**: Use the existing Zustand stores or create new ones as needed
3. **Page Structure**: Follow the Next.js conventions for adding new pages
4. **TypeScript**: Make sure to update the type definitions when adding new features

## Conclusion
This Frontend Interview Preparation App provides a comprehensive tool for frontend developers to prepare for interviews. With interactive theory content, practice questions, and coding challenges, users can build a structured learning path tailored to their needs.

The app's architecture allows for easy extension and customization, making it a solid foundation for future development and enhancement.
