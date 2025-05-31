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
} from '@mui/material';
import Editor from '@monaco-editor/react';
import { CodeTask } from '@/types';
import { useSettingsStore } from '@/features/progress/useSettingsStoreFirebase';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import ChatIcon from '@mui/icons-material/Chat';
import ReactMarkdown from 'react-markdown';
import AIEvaluator from './AIEvaluator';
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
  const [tabValue, setTabValue] = useState(0);
  const [showAIFeedback, setShowAIFeedback] = useState(false);
  const [allTestsPassed, setAllTestsPassed] = useState(false);

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
  
  // Handle running tests against user's code
  const handleRunCode = () => {
    try {
      // Reset results
      setTestResults([]);
      
      // Parse test cases and evaluate the code
      const results = task.testCases.map(testCase => {
        try {
          // This is a simplified approach - in a real app, you'd use a sandbox
          // to safely evaluate the code against test cases
          const testFunction = new Function('code', `
            try {
              ${code}
              return { passed: ${testCase}, message: 'Test passed: ${testCase}' };
            } catch (error) {
              return { passed: false, message: 'Error: ' + error.message };
            }
          `);
          
          return testFunction();
        } catch (error) {
          return { 
            passed: false, 
            message: `Error in test case ${testCase}: ${error instanceof Error ? error.message : String(error)}` 
          };
        }
      });
      
      setTestResults(results);
      
      // Check if all tests passed
      const allPassed = results.every(result => result.passed);
      setAllTestsPassed(allPassed);
      
      // If all passed, mark as complete
      if (allPassed) {
        onComplete(task.id, code, true, timeSpent);
      }
    } catch (error) {
      setTestResults([{
        passed: false,
        message: `Failed to run tests: ${error instanceof Error ? error.message : String(error)}`
      }]);
    }
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
          <Editor
            height="100%"
            language={getLanguage()}
            value={code}
            onChange={handleCodeChange}
            theme={settings.codeEditorTheme}
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
              formatOnType: true,
              suggestOnTriggerCharacters: true,
              snippetSuggestions: 'on'
            }}
          />
      </Box>
      
      <Divider />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Button 
            variant="outlined" 
            color="warning"
            startIcon={<LightbulbIcon />}
            onClick={handleShowSolution}
            sx={{ mr: 1 }}
          >
            Show Solution
          </Button>
          
          <Button 
            variant="outlined" 
            color="info"
            startIcon={<ChatIcon />}
            onClick={() => {
              setShowAIFeedback(true);
              setTabValue(2); // Set to AI Chat tab
            }}
          >
            AI Assistant
          </Button>
        </Box>
        
        <Button 
          variant="contained" 
          onClick={handleRunCode}
        >
          Run Tests
        </Button>
      </Box>
      
      {(testResults.length > 0 || showAIFeedback) && (
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
                disabled={false} 
              />
              <Tab 
                label="Chat with Coach" 
                icon={<ChatIcon />} 
                iconPosition="start"
                disabled={false} 
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
              <AIEvaluator
                question={`${task.title}\n${task.description}`}
                userAnswer={code}
                modelAnswer={task.solutionCode}
                onEvaluationComplete={(evaluation) => {
                  // Save evaluation to database and mark task as complete if score is high enough
                  if (evaluation && evaluation.score >= 70) {
                    console.log('AI evaluation passed with score:', evaluation.score);
                    // Mark task as complete with success=true
                    onComplete(task.id, code, true, timeSpent);
                  } else if (evaluation) {
                    console.log('AI evaluation score not sufficient:', evaluation.score);
                  }
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
