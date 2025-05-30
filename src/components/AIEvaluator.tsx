import React, { useState, useEffect } from 'react';
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
import { getAIService } from '@/utils/aiService';
import { useSettingsStore } from '@/features/progress/useSettingsStore';
import { AIProvider } from '@/types';
import { evaluationStorageService } from '../utils/evaluationStorageService';

interface AnalysisResult {
  score: number;
  feedback: string;
  strengths: string[];
  improvementAreas: string[];
}

interface AIEvaluatorProps {
  question: string;
  userAnswer: string;
  modelAnswer: string;
  onEvaluationComplete?: (result: AnalysisResult) => void;
  onImproveComplete?: (improvedAnswer: string) => void;
  questionCategory?: string;
  questionTopic?: string;
  questionId?: string;
}

/**
 * Component to evaluate answers using the selected AI provider
 */
export default function AIEvaluator({
  question,
  userAnswer,
  modelAnswer,
  onEvaluationComplete,
  onImproveComplete,
  questionCategory,
  questionTopic,
  questionId
}: AIEvaluatorProps) {
  const [loading, setLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [improvedAnswer, setImprovedAnswer] = useState<string | null>(null);
  const [loadingImprovement, setLoadingImprovement] = useState(false);
  
  // Get settings to check if API key is available
  const settings = useSettingsStore(state => state.settings);
  const aiProvider: AIProvider = settings.aiProvider;
  const [providerName, setProviderName] = useState<string>('AI');
  
  // Determine if an API key is available for the selected provider
  const getApiKeyAvailable = () => {
    switch (aiProvider) {
      case 'openai':
        return !!settings.openAIApiKey;
      case 'claude':
        return !!settings.claudeApiKey;
      case 'gemini':
        return !!settings.geminiApiKey;
      default:
        return false;
    }
  };

  const apiKeyAvailable = getApiKeyAvailable();
  
  // Update the provider name display when the AI provider changes
  useEffect(() => {
    switch (aiProvider) {
      case 'openai':
        setProviderName('OpenAI');
        break;
      case 'claude':
        setProviderName('Claude');
        break;
      case 'gemini':
        setProviderName('Gemini');
        break;
      default:
        setProviderName('AI');
    }
  }, [aiProvider]);

  const handleEvaluate = async () => {
    if (!apiKeyAvailable) {
      setError(`${providerName} API key not found. Please add your API key in the settings.`);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Get the appropriate AI service based on the selected provider
      const aiService = await getAIService(aiProvider);
      
      // Always reinitialize the AI service to ensure we're using the current API key
      // This helps fix issues where settings were changed but service wasn't updated
      let apiKey = '';
      switch (aiProvider) {
        case 'openai':
          apiKey = settings.openAIApiKey;
          break;
        case 'claude':
          apiKey = settings.claudeApiKey;
          break;
        case 'gemini':
          apiKey = settings.geminiApiKey;
          break;
      }
      
      await aiService.initialize({ apiKey });
      
      const result = await aiService.evaluateAnswer(question, userAnswer, modelAnswer);
      
      setEvaluation(result);
      if (onEvaluationComplete) {
        onEvaluationComplete(result);
      }
      
      // Store the evaluation result in the database
      if (result && questionId) {
        try {
          await evaluationStorageService.storeEvaluation({
            questionId,
            score: result.score,
            feedback: result.feedback,
            strengths: result.strengths || [],
            improvementAreas: result.improvementAreas || [],
            timestamp: Date.now(),
            category: questionCategory || 'unknown',
            topic: questionTopic || 'unknown'
          });
          console.log('Evaluation stored successfully for adaptive learning');
        } catch (storageError) {
          console.error('Error storing evaluation result:', storageError);
          // Non-critical error, don't show to user
        }
      }
    } catch (error) {
      console.error('Error evaluating answer:', error);
      setError(error instanceof Error ? error.message : `An error occurred evaluating your answer with ${providerName}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleImprove = async () => {
    if (!apiKeyAvailable) {
      setError(`${providerName} API key not found. Please add your API key in the settings.`);
      return;
    }
    
    setLoadingImprovement(true);
    setError(null);
    
    try {
      // Get the appropriate AI service based on the selected provider
      const aiService = await getAIService(aiProvider);
      
      // Always reinitialize the AI service to ensure we're using the current API key
      // This helps fix issues where settings were changed but service wasn't updated
      let apiKey = '';
      switch (aiProvider) {
        case 'openai':
          apiKey = settings.openAIApiKey;
          break;
        case 'claude':
          apiKey = settings.claudeApiKey;
          break;
        case 'gemini':
          apiKey = settings.geminiApiKey;
          break;
      }
      
      await aiService.initialize({ apiKey });
      
      const improvement = await aiService.getImprovedAnswer(question, userAnswer);
      setImprovedAnswer(improvement);
    } catch (error) {
      console.error('Error improving answer:', error);
      setError(error instanceof Error ? error.message : `An error occurred improving your answer with ${providerName}`);
    } finally {
      setLoadingImprovement(false);
    }
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        {providerName}-Powered Answer Analysis
      </Typography>
      
      {!apiKeyAvailable ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          Add your {providerName} API key in the settings to enable AI analysis of your answers.
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
              Evaluate My Answer with {providerName}
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
                {providerName} Evaluation Results
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
