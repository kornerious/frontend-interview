import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Button, 
  TextField, 
  Chip,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Collapse,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Alert,
  Divider,
  Tabs,
  Tab
} from '@mui/material';
import { Question, Difficulty } from '@/types';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import DoneIcon from '@mui/icons-material/Done';
import CloseIcon from '@mui/icons-material/Close';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import ChatIcon from '@mui/icons-material/Chat';
import ReactMarkdown from 'react-markdown';
import AIEvaluator from './AIEvaluator';
import AIConversation from './AIConversation';
import { useProgressStore } from '@/features/progress/useProgressStoreFirebase';
import { useSettingsStore } from '@/features/progress/useSettingsStore';
import Editor from '@monaco-editor/react';

interface QuestionCardProps {
  question: Question;
  onAnswer: (questionId: string, answer: string, isCorrect: boolean, analytics?: {
    timeTaken: number;
    topic?: string;
    difficulty?: Difficulty;
    problemAreas?: string[];
  }) => void;
  getNextQuestion?: () => Question | null;
  navigateToTask?: () => void;
}

export default function QuestionCard({ 
  question, 
  onAnswer,
  getNextQuestion,
  navigateToTask
}: QuestionCardProps) {
  // Get settings and progress stores
  const settings = useSettingsStore(state => state.settings);
  const { saveUserAnswer, getUserAnswer, saveAnalysis, addProgress } = useProgressStore();
  
  // Initialize user answer from saved answers if available and enabled in settings
  const initialAnswer = settings.saveAnswers ? getUserAnswer(question.id) : '';
  
  const [userAnswer, setUserAnswer] = useState(initialAnswer);
  const [answered, setAnswered] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [answerAnalysis, setAnswerAnalysis] = useState<any>(null);
  const [showAIEvaluation, setShowAIEvaluation] = useState(false);
  const [tabValue, setTabValue] = useState(0); // For switching between AI evaluation and chat
  
  // Options for MCQ questions
  const [options, setOptions] = useState<string[]>(() => {
    if (question.type === 'mcq') {
      // Check if the answer contains JSON-formatted options
      try {
        const parsedOptions = JSON.parse(question.answer);
        if (Array.isArray(parsedOptions) && parsedOptions.every(o => o && typeof o === 'object' && 'text' in o && 'correct' in o)) {
          // Return formatted options directly from the answer
          return parsedOptions.map(o => o.text);
        }
      } catch (e) {
        // Not JSON, continue with normal processing
      }
      
      // If we have specific options in the question object, use them
      if (question.options && Array.isArray(question.options) && question.options.length > 0) {
        // Return a shuffled copy of the options
        return [...question.options].sort(() => Math.random() - 0.5);
      }
    }
    return [];
  });
  
  // Timer state
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [timeSpent, setTimeSpent] = useState<number>(0);
  
  // Handle moving to the next question after a correct answer
  const moveToNextQuestion = () => {
    if (getNextQuestion) {
      const nextQuestion = getNextQuestion();
      if (nextQuestion) {
        // We have another question, save progress first to prevent losing it on navigation
        if (settings.saveAnswers) {
          // Save the user answer
          saveUserAnswer(question.id, userAnswer);
          
          // Also update the progress to mark it as completed
          addProgress({
            questionId: question.id,
            date: new Date().toISOString(),
            isCorrect: true,
            attempts: 1,
            timeTaken: timeSpent || 0,
            topic: question.topic,
            difficulty: question.level
          });
        }
        // Use a more direct/forceful navigation approach
        window.location.href = `/questions?id=${nextQuestion.id}`;
        return true;
      }
    }
    
    // If we get here, there's no next question, so try to navigate to a task
    if (navigateToTask) {
      // Save progress first
      if (settings.saveAnswers) {
        // Save the user answer
        saveUserAnswer(question.id, userAnswer);
        
        // Add to progress with completion status
        addProgress({
          questionId: question.id,
          date: new Date().toISOString(),
          isCorrect: true,
          attempts: 1,
          timeTaken: timeSpent || 0,
          topic: question.topic,
          difficulty: question.level
        });
      }
      // Use the navigation function
      navigateToTask();
      return true;
    }
    
    return false;
  };
  
  const handleSubmit = () => {
    // Calculate time spent on the question
    const endTime = Date.now();
    const timeSpentMs = endTime - startTime;
    setTimeSpent(timeSpentMs);
    
    // Save user answer if enabled in settings
    if (settings.saveAnswers) {
      saveUserAnswer(question.id, userAnswer);
    }
    
    // Check if the answer is correct
    let correct = false;
    let problemAreas: string[] = [];

    if (question.type === 'mcq') {
      try {
        // Try to parse answer as JSON for MCQ with detailed options
        const parsedOptions = JSON.parse(question.answer);
        if (Array.isArray(parsedOptions) && parsedOptions.every(o => o && typeof o === 'object' && 'text' in o && 'correct' in o)) {
          // Find the selected option in the parsed options
          const selectedOption = parsedOptions.find(o => o.text === userAnswer);
          correct = selectedOption ? selectedOption.correct : false;
          
          // If incorrect, identify problem areas
          if (!correct && selectedOption && selectedOption.problemArea) {
            problemAreas.push(selectedOption.problemArea);
          }
        } else {
          correct = userAnswer === question.answer;
        }
      } catch (e) {
        // Not JSON, do direct comparison
        correct = userAnswer === question.answer;
      }
    }

    setIsCorrect(correct);
    setAnswered(true);
    
    // Automatically show answer if incorrect
    if (!correct) {
      setShowAnswer(true);
    }
    
    // Call the onAnswer callback with analytics
    onAnswer(question.id, userAnswer, correct, {
      timeTaken: timeSpentMs,
      topic: question.topic,
      difficulty: question.level,
      problemAreas
    });
    
    // If answer is correct, wait a moment and then move to next question or coding task
    if (correct) {
      moveToNextQuestion();
    }
  };
  
  const handleReset = () => {
    // This is now only used for the "Try Another Question" button
    moveToNextQuestion();
  };
  
  // Handle submitting for AI evaluation only
  const handleAIEvaluationSubmit = () => {
    // Calculate time spent on the question
    const endTime = Date.now();
    const timeSpentMs = endTime - startTime;
    setTimeSpent(timeSpentMs);
    
    // Save user answer if enabled in settings
    if (settings.saveAnswers) {
      saveUserAnswer(question.id, userAnswer);
    }
    
    // Call the onAnswer callback with analytics
    onAnswer(question.id, userAnswer, false, {
      timeTaken: timeSpentMs,
      topic: question.topic,
      difficulty: question.level,
      problemAreas: []
    });
    
    // Set as answered to trigger UI updates
    setAnswered(true);
    
    // No need to set showAIEvaluation since we now display it automatically
  };
  
  // Handle the question change with preservation of previous answers
  useEffect(() => {
    // Check if we have a saved answer for this question
    const savedAnswer = settings.saveAnswers ? getUserAnswer(question.id) : '';
    
    if (savedAnswer) {
      // Restore the saved answer
      setUserAnswer(savedAnswer);
      // Mark as answered if we have a saved answer - this preserves state on page reload
      setAnswered(true);
      // Also try to check if it was correct by comparing with the answer
      try {
        // Simple string comparison for basic answers
        const wasCorrect = savedAnswer === question.answer;
        setIsCorrect(wasCorrect);
        // If it was correct, automatically show the next question option
        setShowAnswer(!wasCorrect);
      } catch (e) {
        // In case of error in comparison, default to showing the answer
        setShowAnswer(true);
      }
    } else {
      // Reset form state for new questions
      setUserAnswer('');
      setAnswered(false);
      setShowAnswer(false);
      setIsCorrect(false);
    }
    
    // Always reset timer and evaluation state
    setStartTime(Date.now());
    setTimeSpent(0);
    setShowAIEvaluation(false);
    
    // For MCQ questions, check if options need to be refreshed
    // (Only refresh if empty or question changed)  
    if (question.type === 'mcq' && options.length === 0) {
      // Generate default options for common React questions
      const defaultOptions = [
        'const [state, setState] = useState(initialValue);',
        'const state = useState(initialValue); setState(newValue);',
        'this.state = { value: initialValue }; this.setState({ value: newValue });',
        'let [state, setState] = this.useState(initialValue);'
      ];
      
      // Always make sure the correct answer is included in the options
      if (!defaultOptions.includes(question.answer)) {
        defaultOptions.push(question.answer);
      }
      
      // Shuffle options
      setOptions(defaultOptions.sort(() => Math.random() - 0.5));
    }
  }, [question.id, question.type, question.answer, question.options]);
  
  return (
    <Card variant="outlined" sx={{ mb: 4, position: 'relative' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Chip 
            label={question.topic} 
            color="primary" 
            size="small"
            sx={{ mr: 1 }}
          />
          <Chip 
            label={question.level} 
            color={
              question.level === 'easy' ? 'success' : 
              question.level === 'medium' ? 'warning' : 'error'
            }
            size="small"
          />
        </Box>
        
        <Typography variant="h6" component="h3" gutterBottom>
          {question.question}
        </Typography>
        
        {!answered ? (
          <>
            {question.type === 'mcq' ? (
              <Box>
                <FormControl component="fieldset" sx={{ width: '100%', mt: 2 }}>
                  <RadioGroup value={userAnswer} onChange={(e) => setUserAnswer(e.target.value)}>
                    {options.map((option, index) => (
                      <FormControlLabel 
                        key={index} 
                        value={option} 
                        control={<Radio />} 
                        label={option}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>
                
                <Button 
                  variant="contained" 
                  color="primary"
                  fullWidth
                  sx={{ mt: 2 }}
                  onClick={handleSubmit}
                  disabled={!userAnswer}
                >
                  Submit Answer
                </Button>
              </Box>
            ) : (
              <Box>
                <Box sx={{ height: 200, mt: 2 }}>
                  <Editor
                    height="100%"
                    language="javascript"
                    value={userAnswer}
                    onChange={(value) => setUserAnswer(value || '')}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: true },
                      scrollBeyondLastLine: false,
                      fontSize: 14,
                      wordWrap: 'on',
                      lineNumbers: 'on',
                      automaticLayout: true,
                      rulers: [80],
                      bracketPairColorization: { enabled: true },
                      formatOnPaste: true,
                      formatOnType: true
                    }}
                  />
                </Box>
                
                {userAnswer.length > 0 && (
                  <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    {question.type === 'open' ? (
                      /* Only show AI evaluation button for open-ended questions */
                      <Button
                        variant="contained"
                        color="secondary"
                        startIcon={<TipsAndUpdatesIcon />}
                        onClick={handleAIEvaluationSubmit}
                        fullWidth
                      >
                        Submit with AI Evaluation
                      </Button>
                    ) : (
                      /* Regular submit button for non-open questions */
                      <Button 
                        variant="contained" 
                        color="primary"
                        fullWidth
                        onClick={handleSubmit}
                      >
                        Submit Answer
                      </Button>
                    )}
                  </Box>
                )}
              </Box>
            )}
          </>
        ) : (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              {isCorrect ? (
                <>
                  <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                  <Typography color="success.main" fontWeight="bold">
                    Correct! Well done.
                  </Typography>
                </>
              ) : answerAnalysis && answerAnalysis.score >= 60 ? (
                // Show partially correct message if AI evaluation score is above 60%
                <>
                  <CheckCircleIcon color="warning" sx={{ mr: 1 }} />
                  <Typography color="warning.main" fontWeight="bold">
                    Partially correct ({answerAnalysis.score}%). You can improve your answer.
                  </Typography>
                </>
              ) : (
                <>
                  <ErrorIcon color="error" sx={{ mr: 1 }} />
                  <Typography color="error.main" fontWeight="bold">
                    {question.type === 'open' ? 'Your answer needs improvement.' : 'Incorrect. Try again.'}
                  </Typography>
                  
                  {/* No longer need a separate button for AI evaluation */}
                </>
              )}
            </Box>
            
            {/* Allow editing even after submission if answer was incorrect */}
            {!isCorrect && (
              <Box sx={{ mt: 3, mb: 3 }}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  {answerAnalysis && answerAnalysis.score >= 60 ? 
                    "Improve your answer:" : 
                    "Try again with a different answer:"}
                </Typography>
                <Box sx={{ height: 200, mb: 2 }}>
                  <Editor
                    height="100%"
                    language="javascript"
                    value={userAnswer}
                    onChange={(value) => setUserAnswer(value || '')}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: true },
                      scrollBeyondLastLine: false,
                      fontSize: 14,
                      wordWrap: 'on',
                      lineNumbers: 'on',
                      automaticLayout: true,
                      rulers: [80],
                      bracketPairColorization: { enabled: true },
                      formatOnPaste: true,
                      formatOnType: true
                    }}
                  />
                </Box>
                
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <Button 
                  variant="contained" 
                  color="primary"
                  fullWidth
                  onClick={question.type === 'open' ? handleAIEvaluationSubmit : handleSubmit}
                >
                  Submit Answer
                </Button>
                </Box>
              </Box>
            )}
            
            {/* Analysis Feedback for open-ended questions */}
            {answerAnalysis && (
              <Paper elevation={0} variant="outlined" sx={{ p: 2, my: 2, bgcolor: 'background.paper' }}>
                <Typography variant="h6" gutterBottom>
                  Answer Analysis
                </Typography>
                
                <Alert severity={isCorrect ? "success" : "warning"} sx={{ mb: 2 }}>
                  {answerAnalysis.feedback}
                </Alert>
                
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Score: {answerAnalysis.score}/100
                  </Typography>
                  
                  <LinearProgress 
                    variant="determinate" 
                    value={answerAnalysis.score} 
                    color={answerAnalysis.score >= 70 ? "success" : answerAnalysis.score >= 50 ? "warning" : "error"}
                    sx={{ mb: 2 }}
                  />
                  
                  {answerAnalysis.strengths && answerAnalysis.strengths.length > 0 && (
                    <>
                      <Typography variant="subtitle2" color="success.main" sx={{ mt: 1 }}>
                        Strengths:
                      </Typography>
                      <List dense>
                        {answerAnalysis.strengths.map((strength: string, index: number) => (
                          <ListItem key={index}>
                            <ListItemIcon sx={{ minWidth: 30 }}>
                              <DoneIcon color="success" fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary={strength} />
                          </ListItem>
                        ))}
                      </List>
                    </>
                  )}
                  
                  {answerAnalysis.weaknesses && answerAnalysis.weaknesses.length > 0 && (
                    <>
                      <Typography variant="subtitle2" color="error.main" sx={{ mt: 1 }}>
                        Areas to Improve:
                      </Typography>
                      <List dense>
                        {answerAnalysis.weaknesses.map((weakness: string, index: number) => (
                          <ListItem key={index}>
                            <ListItemIcon sx={{ minWidth: 30 }}>
                              <CloseIcon color="error" fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary={weakness} />
                          </ListItem>
                        ))}
                      </List>
                    </>
                  )}
                </Box>
              </Paper>
            )}
            
            {/* Only show answer related buttons for non-editing type questions or when answer is correct */}
            {(isCorrect || (question.type !== 'open' && question.type !== 'code')) && (
              <>
                <Button 
                  variant="outlined"
                  onClick={() => setShowAnswer(!showAnswer)}
                  endIcon={<ExpandMoreIcon />}
                  fullWidth
                  sx={{ mb: 1 }}
                >
                  {showAnswer ? 'Hide Answer' : 'Show Answer'}
                </Button>
                
                <Collapse in={showAnswer}>
                  <Box sx={{ 
                    p: 2, 
                    mt: 1, 
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1
                  }}>
                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                      Correct Answer:
                    </Typography>
                    <ReactMarkdown>{question.answer}</ReactMarkdown>
                    
                    {question.example && (
                      <>
                        <Typography variant="subtitle1" gutterBottom fontWeight="bold" sx={{ mt: 2 }}>
                          Example:
                        </Typography>
                        <ReactMarkdown>{question.example}</ReactMarkdown>
                      </>
                    )}
                  </Box>
                </Collapse>
                
                <Button 
                  variant="contained" 
                  color="secondary"
                  fullWidth
                  sx={{ mt: 2 }}
                  onClick={handleReset}
                >
                  Try Another Question
                </Button>
              </>
            )}
            
            {/* For editing type questions that are incorrect, just show a Skip button */}
            {!isCorrect && (question.type === 'open' || question.type === 'code') && (
              <Button 
                variant="outlined" 
                color="secondary"
                fullWidth
                sx={{ mt: 4 }}
                onClick={handleReset}
              >
                Skip This Question
              </Button>
            )}
            
            {/* AI Analysis Component - automatically show for open-ended questions */}
            {(answered && question.type === 'open') && (
              <>
                <Divider sx={{ my: 3 }} />
                <Box sx={{ mb: 3 }}>
                  <Tabs
                    value={tabValue}
                    onChange={(e: React.SyntheticEvent, newValue: number) => setTabValue(newValue)}
                    aria-label="ai feedback tabs"
                  >
                    <Tab label="AI Evaluation" icon={<TipsAndUpdatesIcon />} iconPosition="start" />
                    <Tab label="Chat with Interview Coach" icon={<ChatIcon />} iconPosition="start" />
                  </Tabs>
                </Box>
                
                {tabValue === 0 ? (
                  <AIEvaluator
                    question={question.question}
                    userAnswer={userAnswer}
                    modelAnswer={question.answer}
                    questionId={question.id}
                    questionTopic={question.topic}
                    questionCategory={question.level}
                    onEvaluationComplete={(evaluation) => {
                      // Save the analysis if settings allow
                      if (settings.saveAnswers) {
                        saveAnalysis(question.id, evaluation);
                        
                        // Update the answer analysis state to show feedback
                        setAnswerAnalysis(evaluation);
                      }
                    }}
                  />
                ) : (
                  <AIConversation
                    questionId={question.id}
                    questionContent={question.question}
                    userAnswer={userAnswer}
                    modelAnswer={question.answer}
                    initialContext={`This is a ${question.level} level question about ${question.topic}.`}
                  />
                )}
              </>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
