import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Paper,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import claudeService from '@/utils/claudeService';
import { useSettingsStore } from '@/features/progress/useSettingsStoreFirebase';

interface AIEvaluatorProps {
  question: string;
  userAnswer: string;
  modelAnswer: string;
  onEvaluationComplete?: (evaluation: any) => void;
}

/**
 * Component to evaluate answers using Claude
 */
export default function AIEvaluator({
  question,
  userAnswer,
  modelAnswer,
  onEvaluationComplete
}: AIEvaluatorProps) {
  const [loading, setLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [improvedAnswer, setImprovedAnswer] = useState<string | null>(null);
  const [loadingImprovement, setLoadingImprovement] = useState(false);
  
  // Get settings to check if API key is available
  const settings = useSettingsStore(state => state.settings);
  const apiKeyAvailable = !!settings.claudeApiKey;

  const handleEvaluate = async () => {
    // Validate API key
    if (!apiKeyAvailable) {
      setError('Claude API key not found. Please add your API key in the settings page.');
      return;
    }

    if (settings.claudeApiKey && settings.claudeApiKey.trim().length < 30) {
      setError('The Claude API key appears to be invalid. Please check your settings.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Wait for initialization to complete with improved error handling
      const initSuccess = await claudeService.initialize({ apiKey: settings.claudeApiKey });
      
      if (!initSuccess) {
        throw new Error('Failed to initialize Claude service. Please check your API key.');
      }
      
      // Add a timeout to prevent hanging requests
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out. Please try again later.')), 20000);
      });
      
      // Race the evaluation request against the timeout
      const result = await Promise.race([
        claudeService.evaluateAnswer(question, userAnswer, modelAnswer),
        timeoutPromise
      ]) as any;
      
      // Validate the returned result has the expected format
      if (!result || typeof result.score !== 'number') {
        throw new Error('Invalid response format from Claude. Please try again.');
      }
      
      setEvaluation(result);
      if (onEvaluationComplete) {
        onEvaluationComplete(result);
      }
    } catch (error) {
      console.error('Error evaluating answer:', error);
      
      // Provide more specific error messages based on error type
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          setError('Invalid API key. Please check your Claude API key in settings.');
        } else if (error.message.includes('timeout')) {
          setError('Request timed out. The Claude service might be experiencing high load.');
        } else if (error.message.includes('rate limit')) {
          setError('Claude rate limit exceeded. Please try again in a few minutes.');
        } else {
          setError(`Error: ${error.message}`);
        }
      } else {
        setError('An unexpected error occurred. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleImprove = async () => {
    if (!apiKeyAvailable) {
      setError('Claude API key not found. Please add your API key in the settings.');
      return;
    }
    
    setLoadingImprovement(true);
    setError(null);
    
    try {
      // Initialize Claude service with the API key if not already initialized
      if (!claudeService.isInitialized()) {
        claudeService.initialize({ apiKey: settings.claudeApiKey });
      }
      
      const improvement = await claudeService.getImprovedAnswer(question, userAnswer);
      setImprovedAnswer(improvement);
    } catch (error) {
      console.error('Error improving answer:', error);
      setError(error instanceof Error ? error.message : 'An error occurred improving your answer');
    } finally {
      setLoadingImprovement(false);
    }
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        AI-Powered Answer Analysis
      </Typography>
      
      {!apiKeyAvailable ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          Add your OpenAI API key in the settings to enable AI analysis of your answers.
        </Alert>
      ) : (
        <>
          {!evaluation && !loading && (
            <Button 
              variant="outlined" 
              onClick={handleEvaluate}
              startIcon={<TipsAndUpdatesIcon />}
              fullWidth
            >
              Evaluate My Answer with AI
            </Button>
          )}
          
          {loading && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
              <CircularProgress size={24} sx={{ mr: 1 }} />
              <Typography>Analyzing your answer...</Typography>
            </Box>
          )}
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {evaluation && (
            <Paper variant="outlined" sx={{ p: 2, my: 2 }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                AI Evaluation Results
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mr: 1 }}>Score:</Typography>
                <Typography 
                  variant="subtitle1"
                  fontWeight="bold"
                  color={evaluation.score >= 70 ? 'success.main' : evaluation.score >= 50 ? 'warning.main' : 'error.main'}
                >
                  {evaluation.score}/100
                </Typography>
              </Box>
              
              <Alert 
                severity={evaluation.score >= 70 ? "success" : evaluation.score >= 50 ? "warning" : "error"}
                sx={{ mb: 2 }}
              >
                {evaluation.feedback}
              </Alert>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" color="success.main" sx={{ mb: 1 }}>
                Strengths:
              </Typography>
              
              <List dense>
                {evaluation.strengths.map((strength: string, index: number) => (
                  <ListItem key={`strength-${index}`}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <CheckCircleIcon color="success" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={strength} />
                  </ListItem>
                ))}
              </List>
              
              <Typography variant="subtitle2" color="error.main" sx={{ mt: 2, mb: 1 }}>
                Areas to Improve:
              </Typography>
              
              <List dense>
                {evaluation.improvementAreas.map((area: string, index: number) => (
                  <ListItem key={`improvement-${index}`}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <ErrorIcon color="error" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={area} />
                  </ListItem>
                ))}
              </List>
              
              {!improvedAnswer && !loadingImprovement && (
                <Button
                  variant="text"
                  color="primary"
                  onClick={handleImprove}
                  sx={{ mt: 2 }}
                  startIcon={<TipsAndUpdatesIcon />}
                >
                  Get an Improved Answer
                </Button>
              )}
              
              {loadingImprovement && (
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  <Typography variant="body2">Generating improved answer...</Typography>
                </Box>
              )}
              
              {improvedAnswer && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Improved Answer:
                  </Typography>
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      p: 2, 
                      bgcolor: 'background.default',
                      borderColor: 'primary.light',
                      borderWidth: 1,
                      borderStyle: 'solid'
                    }}
                  >
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {improvedAnswer}
                    </Typography>
                  </Paper>
                </Box>
              )}
            </Paper>
          )}
        </>
      )}
    </Box>
  );
}
