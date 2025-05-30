import React, { useState } from 'react';
import { 
  Paper, 
  Typography, 
  Box, 
  Stepper, 
  Step, 
  StepLabel, 
  Button,
  LinearProgress,
  Chip
} from '@mui/material';
import { 
  DailyPlan as DailyPlanType, 
  TheoryBlock, 
  Question, 
  CodeTask 
} from '@/types';
import TheoryBlockComponent from './TheoryBlock';
import QuestionCard from './QuestionCard';
import LeetEditor from './LeetEditor';

interface DailyPlanProps {
  day: number;
  plan: DailyPlanType;
  theoryBlocks: TheoryBlock[];
  questions: Question[];
  codeTask: CodeTask | null;
  onComplete: (day: number) => void;
  onSaveExample: (exampleId: string, code: string) => void;
  onAnswerQuestion: (questionId: string, answer: string, isCorrect: boolean) => void;
  onCompleteTask: (taskId: string, code: string, success: boolean, timeSpent: number) => void;
}

export default function DailyPlan({
  day,
  plan,
  theoryBlocks,
  questions,
  codeTask,
  onComplete,
  onSaveExample,
  onAnswerQuestion,
  onCompleteTask
}: DailyPlanProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<Record<string, boolean>>({});
  const [taskCompleted, setTaskCompleted] = useState(false);
  
  // Calculate steps based on content
  const steps = [
    { label: 'Theory', completed: false },
    { label: 'Questions', completed: false },
    { label: 'Coding Task', completed: taskCompleted }
  ];
  
  // Handle question answer
  const handleQuestionAnswer = (questionId: string, answer: string, isCorrect: boolean) => {
    setAnsweredQuestions(prev => ({
      ...prev,
      [questionId]: isCorrect
    }));
    
    onAnswerQuestion(questionId, answer, isCorrect);
  };
  
  // Handle task completion
  const handleTaskComplete = (taskId: string, code: string, success: boolean, timeSpent: number) => {
    setTaskCompleted(success);
    onCompleteTask(taskId, code, success, timeSpent);
  };
  
  // Get current question
  const currentQuestion = questions[questionIndex];
  
  // Calculate progress
  const theoryProgress = 100; // Theory is always considered "viewed"
  const questionProgress = questions.length > 0
    ? (Object.keys(answeredQuestions).length / questions.length) * 100
    : 100;
  const taskProgress = taskCompleted ? 100 : 0;
  
  // Calculate overall progress
  const overallProgress = (theoryProgress + questionProgress + taskProgress) / 3;
  
  // Check if day can be completed
  const canComplete = overallProgress >= 70; // 70% completion required
  
  // Handle step navigation
  const handleNext = () => {
    setActiveStep(prevStep => Math.min(prevStep + 1, steps.length - 1));
  };
  
  const handleBack = () => {
    setActiveStep(prevStep => Math.max(prevStep - 1, 0));
  };
  
  // Handle day completion
  const handleDayComplete = () => {
    onComplete(day);
  };
  
  return (
    <Box sx={{ mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Day {day}
          </Typography>
          
          <Chip 
            label={plan.completed ? 'Completed' : 'In Progress'} 
            color={plan.completed ? 'success' : 'primary'} 
          />
        </Box>
        
        <LinearProgress 
          variant="determinate" 
          value={overallProgress} 
          sx={{ height: 8, borderRadius: 4, mb: 2 }}
        />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Overall Progress: {Math.round(overallProgress)}%
          </Typography>
          
          {canComplete && !plan.completed && (
            <Button 
              variant="contained" 
              color="success"
              onClick={handleDayComplete}
            >
              Complete Day
            </Button>
          )}
        </Box>
        
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((step, index) => (
            <Step key={step.label} completed={index === 0 ? true : step.completed}>
              <StepLabel>{step.label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
          >
            Back
          </Button>
          
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={activeStep === steps.length - 1}
          >
            Next
          </Button>
        </Box>
      </Paper>
      
      {activeStep === 0 && (
        <Box>
          <Typography variant="h5" sx={{ mb: 3 }}>
            Theory
          </Typography>
          
          {theoryBlocks.length > 0 ? (
            theoryBlocks.map(theory => (
              <TheoryBlockComponent
                key={theory.id}
                theory={theory}
                onSaveExample={onSaveExample}
              />
            ))
          ) : (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No theory content for today.
              </Typography>
            </Paper>
          )}
        </Box>
      )}
      
      {activeStep === 1 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5">
              Questions
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Button
                disabled={questionIndex === 0}
                onClick={() => setQuestionIndex(prev => Math.max(prev - 1, 0))}
                sx={{ mr: 1 }}
              >
                Previous
              </Button>
              
              <Typography variant="body2" sx={{ mx: 2 }}>
                {questionIndex + 1} / {questions.length}
              </Typography>
              
              <Button
                disabled={questionIndex === questions.length - 1}
                onClick={() => setQuestionIndex(prev => Math.min(prev + 1, questions.length - 1))}
                variant="contained"
              >
                Next
              </Button>
            </Box>
          </Box>
          
          {questions.length > 0 ? (
            <QuestionCard
              question={currentQuestion}
              onAnswer={handleQuestionAnswer}
            />
          ) : (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No questions for today.
              </Typography>
            </Paper>
          )}
        </Box>
      )}
      
      {activeStep === 2 && (
        <Box>
          <Typography variant="h5" sx={{ mb: 3 }}>
            Coding Task
          </Typography>
          
          {codeTask ? (
            <LeetEditor
              task={codeTask}
              onComplete={handleTaskComplete}
            />
          ) : (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No coding task for today.
              </Typography>
            </Paper>
          )}
        </Box>
      )}
    </Box>
  );
}
