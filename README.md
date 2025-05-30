# Frontend Interview Preparation App

An interactive app for preparing for frontend developer interviews with comprehensive theory, quizzes, and coding challenges.

## Features

- **Theory Learning**: Browse and study comprehensive frontend development concepts with editable examples
- **Interactive Quizzes**: Test your knowledge with multiple-choice and open-ended questions
- **Coding Challenges**: Solve real-world coding tasks with an integrated editor
- **Personalized Learning Path**: Create a custom learning plan based on your selected technologies and timeline
- **Progress Tracking**: Monitor your performance with detailed statistics
- **Local Archiving**: Save your progress and examples as TypeScript files for backup
- **Dark/Light Mode**: Choose your preferred theme for comfortable studying

## Technologies Used

- **React 18+** - UI library
- **Next.js** - React framework
- **TypeScript** - Type-safe JavaScript
- **Material UI (MUI)** - Component library
- **Monaco Editor** - Code editor component (same as VS Code)
- **React Live** - For editable code examples
- **Zustand** - State management
- **LocalForage** - Enhanced local storage

## App Structure

```
/src
  /components
    - AppLayout.tsx       # Main layout with navigation
    - DailyPlan.tsx       # Daily learning view
    - LeetEditor.tsx      # Coding challenge editor
    - QuestionCard.tsx    # Interactive question component
    - TheoryBlock.tsx     # Theory content with examples
  /data
    - sampleQuestions.ts  # Sample question data
    - sampleTasks.ts      # Sample coding tasks
    - sampleTheory.ts     # Sample theory content
  /editor
    - ArchiveManager.ts   # Program archive/backup functionality
    - LiveExampleEditor.tsx # Editable code example component
  /features
    /learning
      - planner.ts        # Learning plan generator
    /progress
      - useProgressStore.ts # Progress tracking state
      - useSettingsStore.ts # User settings state
  /pages
    - _app.tsx            # Main Next.js app
    - index.tsx           # Dashboard
    - daily.tsx           # Daily plan page
    - theory.tsx          # Browse theory content
    - questions.tsx       # Practice questions
    - tasks.tsx           # Coding tasks
    - progress.tsx        # Progress tracking
    - settings.tsx        # App settings
  /types
    - index.ts            # TypeScript type definitions
```

## Getting Started

1. Clone the repository:
   ```
   git clone <repository-url>
   cd frontend-interview-app
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Run the development server:
   ```
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Starting a New Program**:
   - On first launch, you'll be guided through setting up your learning plan
   - Select technologies and duration for your personalized program

2. **Daily Learning**:
   - Follow your daily plan with theory, quizzes, and coding tasks
   - Track your progress and mark days as complete

3. **Self-Study**:
   - Browse all theory content in the Theory section
   - Practice questions and coding tasks independently

4. **Progress Tracking**:
   - Monitor your performance in the Progress section
   - Export your progress as a TypeScript file for backup

5. **Customization**:
   - Adjust settings according to your preferences
   - Toggle dark/light mode for comfortable studying

## Features for Developers

- **Editable Examples**: All code examples can be edited and run directly in the app
- **Code Backup**: Your modified examples are automatically saved in the program backup file
- **Import/Export**: Programs can be exported as TypeScript files and reimported later

## Content Sources

The app comes pre-loaded with selected content from [kornerious/fronted-dev-interview](https://github.com/kornerious/fronted-dev-interview) GitHub repository, adapted into a structured learning format.

## Future Enhancements

- User authentication for cloud sync
- Additional coding task templates
- AI-powered code review feedback
- Mock interview simulations
- Community features for sharing notes

## License

MIT
