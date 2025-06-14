import React from 'react';
import { 
  Box,
  Paper, 
  Button,
  Alert,
  AlertTitle
} from '@mui/material';
import { useRouter } from 'next/router';
import AppLayout from '@/components/AppLayout';
import DailyPlanComponent from '@/components/DailyPlan';
import { useProgressStore } from '@/features/progress/useProgressStoreFirebase';
import { adaptLearningProgram } from '@/features/learning/planner';
import { sampleTheoryBlocks } from '@/data/sampleTheory';
import { sampleQuestions } from '@/data/sampleQuestions';
import { codeTasks } from '@/data/sampleTasks';
import { ArchiveManager } from '@/editor/ArchiveManager';

export default function DailyPage() {
  // Get all required states and actions from progress store
  const { 
    currentProgram, 
    setCurrentProgram, 
    updateDayCompletion, 
    addProgress, 
    // Important: use the state directly to ensure we always have the latest values
    completedQuestionIds, 
    completedTaskIds 
  } = useProgressStore();
  const router = useRouter();
  
  // If no current program, redirect to home
  if (!currentProgram) {
    if (typeof window !== 'undefined') {
      router.push('/');
    }
    return null;
  }
  
  // Get the current day's plan
  const currentDayPlan = currentProgram.dailyPlans.find(
    plan => plan.day === currentProgram.currentDay
  );
  
  // If no plan for current day (shouldn't happen), show error
  if (!currentDayPlan) {
    return (
      <AppLayout>
        <Paper sx={{ p: 3 }}>
          <Alert severity="error">
            <AlertTitle>Error</AlertTitle>
            No plan found for day {currentProgram.currentDay}. Please return to the dashboard and reset your program.
          </Alert>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => router.push('/')}
            sx={{ mt: 2 }}
          >
            Return to Dashboard
          </Button>
        </Paper>
      </AppLayout>
    );
  }
  
  // Get theory blocks for current day
  const dayTheoryBlocks = sampleTheoryBlocks.filter(
    theory => currentDayPlan.theoryBlockIds.includes(theory.id)
  );
  
  // Get questions for current day, excluding already completed questions
  const dayQuestions = sampleQuestions.filter(question => 
    // Include the question if it's in the day plan AND hasn't been completed yet
    currentDayPlan.questionIds.includes(question.id) && 
    !completedQuestionIds.includes(question.id)
  );
  
  // Get code task for current day if it hasn't been completed yet
  const dayCodeTask = (currentDayPlan.codeTaskId && !completedTaskIds.includes(currentDayPlan.codeTaskId)) ?
    (codeTasks.find(task => task.id === currentDayPlan.codeTaskId) || null) : null;
    
  console.log('Completed task IDs:', completedTaskIds);
  console.log('Current day code task:', currentDayPlan.codeTaskId, 'is completed:', completedTaskIds.includes(currentDayPlan.codeTaskId));
  
  // Handle day completion
  const handleDayComplete = (day: number) => {
    // Mark day as completed
    updateDayCompletion(day, true);
    
    // Adapt the program based on progress
    const adaptedProgram = adaptLearningProgram(
      currentProgram,
      sampleTheoryBlocks,
      sampleQuestions,
      codeTasks
    );
    
    // Update the program
    setCurrentProgram(adaptedProgram);
    
    // Archive the program
    const archiveManager = ArchiveManager.getInstance();
    archiveManager.saveProgram(adaptedProgram);
    
    // Navigate to the next day if available, or show completion
    if (adaptedProgram.currentDay < adaptedProgram.durationDays) {
      router.reload();
    } else {
      router.push('/progress');
    }
  };
  
  // Handle example save
  const handleSaveExample = (exampleId: string, code: string) => {
    console.log(`Example ${exampleId} saved with code:`, code);
    // In a real app, this would save the code to the user's progress
  };
  
  // Handle question answer
  const handleQuestionAnswer = (questionId: string, answer: string, isCorrect: boolean) => {
    // Add to progress
    addProgress({
      date: new Date().toISOString(),
      questionId,
      isCorrect,
      attempts: 1, // For now, just one attempt
      timeTaken: 0, // We're not tracking time for questions yet
      notes: '' // No notes for now
    });
  };
  
  // Handle task completion
  const handleTaskComplete = (taskId: string, code: string, success: boolean, timeSpent: number) => {
    // Add to progress
    addProgress({
      date: new Date().toISOString(),
      questionId: taskId, // Reusing the questionId field for task id
      isCorrect: success,
      attempts: 1,
      timeTaken: timeSpent,
      notes: success ? 'Completed successfully' : 'Incomplete'
    });
  };
  
  return (
    <AppLayout>
      <Box>
        <DailyPlanComponent
          day={currentProgram.currentDay}
          plan={currentDayPlan}
          theoryBlocks={dayTheoryBlocks}
          questions={dayQuestions}
          codeTask={dayCodeTask}
          onComplete={handleDayComplete}
          onSaveExample={handleSaveExample}
          onAnswerQuestion={handleQuestionAnswer}
          onCompleteTask={handleTaskComplete}
        />
      </Box>
    </AppLayout>
  );
}
