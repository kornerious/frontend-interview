import React, { useState, useEffect } from 'react';
import { 
  Paper, 
  Typography, 
  Box, 
  Button, 
  Chip, 
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  IconButton,
  Collapse,
  Tab,
  Tabs,
  Switch,
  FormControlLabel
} from '@mui/material';
import Editor from '@monaco-editor/react';
import CodesandboxEditor from './CodesandboxEditor';
import { CodeTask } from '@/types';
import { useSettingsStore } from '@/features/progress/useSettingsStore';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import ChatIcon from '@mui/icons-material/Chat';
import ReactMarkdown from 'react-markdown';
import OpenAIEvaluator from './OpenAIEvaluator';
import AIConversation from './AIConversation';

interface LeetEditorProps {
  task: CodeTask;
  onComplete: (taskId: string, code: string, success: boolean, timeSpent: number) => void;
}

export default function LeetEditor({ task, onComplete }: LeetEditorProps) {
  const { settings } = useSettingsStore();
  const [code, setCode] = useState(task.startingCode);
  const [showHints, setShowHints] = useState(false);
  const [testResults, setTestResults] = useState<Array<{ passed: boolean; message: string }>>([]);
  const [showSolution, setShowSolution] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [showAIFeedback, setShowAIFeedback] = useState(false);
  const [allTestsPassed, setAllTestsPassed] = useState(false);
  const [useCodesandbox, setUseCodesandbox] = useState(true);
  
  // Start timer when component mounts
  useEffect(() => {
    setStartTime(Date.now());
    
    // Setup interval to update time spent
    const interval = setInterval(() => {
      if (startTime) {
        setTimeSpent(Math.floor((Date.now() - startTime) / 1000));
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [startTime]);
  
  // Format time spent as mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Function to evaluate code against test cases
  const runTests = () => {
    setIsRunning(true);
    
    // In a real implementation, this would execute the code against test cases
    // For now, we'll simulate test results with a timeout
    setTimeout(() => {
      try {
        // Mock test evaluation
        // In a real app, we would run the user's code against test cases
        const results = task.testCases.map((testCase, index) => {
          // Random success/failure for demo purposes
          // In a real app, this would be based on actual code execution
          const passed = Math.random() > 0.3;
          return {
            passed,
            message: passed 
              ? `Test ${index + 1} passed: ${testCase}`
              : `Test ${index + 1} failed: ${testCase}`
          };
        });
        
        setTestResults(results);
        
        // Check if all tests passed
        const allPassed = results.every(r => r.passed);
        setAllTestsPassed(allPassed);
        
        if (allPassed) {
          // If all tests passed, update progress
          onComplete(task.id, code, true, timeSpent);
          // Show the AI feedback tab when tests pass
          setShowAIFeedback(true);
          // Switch to the feedback tab
          setTabValue(1);
        }
        
        setIsRunning(false);
      } catch (error) {
        setTestResults([{ 
          passed: false, 
          message: `Error: ${(error as Error).message}` 
        }]);
        setIsRunning(false);
      }
    }, 1500);
  };
  
  // Handle code changes
  const handleCodeChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCode(value);
    }
  };
  
  // Get Monaco language from task
  const getLanguage = () => {
    // Check if code includes JSX
    if (task.startingCode.includes('jsx') || task.startingCode.includes('React')) {
      return 'typescript';
    }
    return 'typescript';
  };
  
  // Handle giving up and showing solution
  const handleShowSolution = () => {
    setShowSolution(true);
    // Mark as incomplete
    onComplete(task.id, code, false, timeSpent);
  };
  
  return (
    <Paper elevation={3} sx={{ mb: 4, overflow: 'hidden' }}>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" component="h2">
            {task.title}
          </Typography>
          
          <Box>
            <Chip 
              label={task.difficulty} 
              color={
                task.difficulty === 'easy' ? 'success' : 
                task.difficulty === 'medium' ? 'warning' : 'error'
              }
              size="small"
              sx={{ mr: 1 }}
            />
            <Chip 
              label={`${task.timeEstimate} min`}
              variant="outlined"
              size="small"
            />
          </Box>
        </Box>
        
        <Box sx={{ mb: 3 }}>
          <ReactMarkdown>{task.description}</ReactMarkdown>
        </Box>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
          {task.tags.map(tag => (
            <Chip 
              key={tag} 
              label={tag} 
              size="small" 
              color="primary" 
              variant="outlined"
            />
          ))}
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Button
            startIcon={<LightbulbIcon />}
            onClick={() => setShowHints(!showHints)}
            size="small"
          >
            {showHints ? 'Hide Hints' : 'Show Hints'}
          </Button>
          
          <Typography variant="body2" color="text.secondary">
            Time spent: {formatTime(timeSpent)}
          </Typography>
        </Box>
        
        <Collapse in={showHints}>
          <Box sx={{ 
            p: 2, 
            mb: 3, 
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1
          }}>
            <Typography variant="subtitle1" gutterBottom>
              Hints:
            </Typography>
            <List dense>
              {task.hints.map((hint, index) => (
                <ListItem key={index}>
                  <ListItemIcon sx={{ minWidth: 30 }}>
                    <LightbulbIcon color="warning" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={hint} />
                </ListItem>
              ))}
            </List>
          </Box>
        </Collapse>
      </Box>
      
      <Divider />
      
      <Box sx={{ height: 500 }}>
        {useCodesandbox ? (
          // Codesandbox Editor (new)
          <CodesandboxEditor
            code={code}
            language={getLanguage()}
            onChange={handleCodeChange}
            theme={settings.codeEditorTheme === 'dark' ? 'dark' : 'light'}
          />
        ) : (
          // Monaco Editor (original)
          <Editor
            height="100%"
            language={getLanguage()}
            value={code}
            onChange={handleCodeChange}
            theme={settings.codeEditorTheme}
            options={{
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              fontSize: 14,
              wordWrap: 'on',
              lineNumbers: 'on',
              automaticLayout: true
            }}
          />
        )}
      </Box>
      
      <Divider />
      
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<PlayArrowIcon />}
            onClick={runTests}
            disabled={isRunning}
            sx={{ mr: 2 }}
          >
            {isRunning ? 'Running Tests...' : 'Run Tests'}
          </Button>
          
          <FormControlLabel
            control={
              <Switch
                checked={useCodesandbox}
                onChange={(e) => setUseCodesandbox(e.target.checked)}
                color="primary"
              />
            }
            label="Use Codesandbox Editor"
          />
        </Box>
        
        <Box>
          <Button
            variant="outlined"
            startIcon={<LightbulbIcon />}
            onClick={() => setShowHints(!showHints)}
            sx={{ mr: 2 }}
          >
            {showHints ? 'Hide Hints' : 'Show Hints'}
          </Button>
          
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleShowSolution}
          >
            Show Solution
          </Button>
        </Box>
      </Box>
      
      {testResults.length > 0 && (
        <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs 
              value={tabValue} 
              onChange={(e, newValue) => setTabValue(newValue)}
              aria-label="feedback tabs"
            >
              <Tab label="Test Results" />
              <Tab 
                label="AI Evaluation" 
                icon={<TipsAndUpdatesIcon />} 
                iconPosition="start"
                disabled={!allTestsPassed && !showAIFeedback} 
              />
              <Tab 
                label="Chat with Coach" 
                icon={<ChatIcon />} 
                iconPosition="start"
                disabled={!allTestsPassed && !showAIFeedback} 
              />
            </Tabs>
          </Box>
          
          {/* Test Results Tab */}
          {tabValue === 0 && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Test Results:
              </Typography>
              
              <List dense>
                {testResults.map((result, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      {result.passed ? (
                        <CheckCircleOutlineIcon color="success" />
                      ) : (
                        <ErrorOutlineIcon color="error" />
                      )}
                    </ListItemIcon>
                    <ListItemText 
                      primary={result.message}
                      primaryTypographyProps={{
                        color: result.passed ? 'success.main' : 'error.main'
                      }}
                    />
                  </ListItem>
                ))}
              </List>
              
              {allTestsPassed && (
                <>
                  <Alert severity="success" sx={{ mt: 2 }}>
                    All tests passed! Great job!
                  </Alert>
                  {!showAIFeedback && (
                    <Button
                      variant="outlined"
                      startIcon={<TipsAndUpdatesIcon />}
                      sx={{ mt: 2 }}
                      onClick={() => {
                        setShowAIFeedback(true);
                        setTabValue(1);
                      }}
                    >
                      Get AI Feedback on Your Code
                    </Button>
                  )}
                </>
              )}
            </Box>
          )}
          
          {/* AI Evaluation Tab */}
          {tabValue === 1 && (
            <Box>
              <OpenAIEvaluator
                question={`${task.title}\n${task.description}`}
                userAnswer={code}
                modelAnswer={task.solutionCode}
                onEvaluationComplete={(evaluation) => {
                  // Save evaluation to database if needed
                }}
              />
            </Box>
          )}
          
          {/* AI Chat Tab */}
          {tabValue === 2 && (
            <Box>
              <AIConversation
                questionId={task.id}
                questionContent={`${task.title}\n${task.description}`}
                userAnswer={code}
                modelAnswer={task.solutionCode}
                initialContext={`This is a ${task.difficulty} level coding task. The test cases are: ${task.testCases.join(', ')}.`}
              />
            </Box>
          )}
        </Box>
      )}
      
      {showSolution && (
        <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle1">
              Solution:
            </Typography>
            <IconButton 
              size="small" 
              onClick={() => setShowSolution(!showSolution)}
            >
              {showSolution ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
          
          <Box sx={{ 
            p: 2, 
            mt: 1, 
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            maxHeight: 300,
            overflow: 'auto'
          }}>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
              <code>{task.solutionCode}</code>
            </pre>
          </Box>
        </Box>
      )}
    </Paper>
  );
}
