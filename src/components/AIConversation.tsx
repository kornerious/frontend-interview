import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  Typography,
  Paper,
  Avatar,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import { getAIService } from '@/utils/aiService';
import { AIProvider } from '@/types';
import { useSettingsStore } from '@/features/progress/useSettingsStoreFirebase';
import { useProgressStore } from '@/features/progress/useProgressStoreFirebase';
import ReactMarkdown from 'react-markdown';

interface AIConversationProps {
  questionId?: string;
  initialContext?: string;
  questionContent?: string;
  userAnswer?: string;
  modelAnswer?: string;
}

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export default function AIConversation({
  questionId,
  initialContext,
  questionContent,
  userAnswer,
  modelAnswer
}: AIConversationProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const { settings } = useSettingsStore();
  const { saveUserAnswer } = useProgressStore();
  const aiProvider: AIProvider = settings.aiProvider;
  const [providerName, setProviderName] = useState<string>('AI');
  
  // Get the API key for the selected provider
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
  
  // Initialize the conversation with a welcome message
  useEffect(() => {
    // Initial message from AI
    const initialMessages: Message[] = [];
    
    if (!apiKeyAvailable) {
      initialMessages.push({
        id: 'welcome',
        content: `To start the conversation with the interview coach, please add your ${providerName} API key in the settings.`,
        sender: 'ai',
        timestamp: new Date()
      });
    } else {
      if (initialContext && questionContent) {
        initialMessages.push({
          id: 'context',
          content: `I'm your interview coach, and I'll help you with this question:
          
**Question:** ${questionContent}

${userAnswer ? `**Your answer:** ${userAnswer}` : 'Provide your answer, and I can give you feedback on it.'}

${modelAnswer ? `For reference, an expected answer would include concepts like: ${modelAnswer.substring(0, 150)}...` : ''}

How would you like me to help you?`,
          sender: 'ai',
          timestamp: new Date()
        });
      } else {
        initialMessages.push({
          id: 'welcome',
          content: "I'm your interview coach! Ask me anything about frontend development, interview questions, or get feedback on your solutions.",
          sender: 'ai',
          timestamp: new Date()
        });
      }
    }
    
    setMessages(initialMessages);
  }, [apiKeyAvailable, initialContext, questionContent, userAnswer, modelAnswer]);
  
  // Auto-scroll to bottom of messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleSendMessage = async () => {
    if (!input.trim() || !apiKeyAvailable) return;
    
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: input,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);
    
    try {
      // Get the appropriate AI service based on the selected provider
      const aiService = await getAIService(aiProvider);
      
      // Initialize AI service if needed
      if (!aiService.isInitialized()) {
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
      }
      
      // Create conversation context
      const conversationContext = [
        ...(initialContext ? [`Context: ${initialContext}`] : []),
        ...(questionContent ? [`Question: ${questionContent}`] : []),
        ...(userAnswer ? [`Student answer: ${userAnswer}`] : []),
        ...(modelAnswer ? [`Model answer: ${modelAnswer}`] : []),
      ].join('\n\n') || 'No specific context available.';
      
      // Get previous messages to build conversation history
      const conversationHistory = messages
        .map(msg => `${msg.sender === 'user' ? 'Student' : 'Coach'}: ${msg.content}`)
        .join('\n\n') || '';
      
      // Start a conversation with the AI service or continue existing
      if (!aiService.getConversationHistory().length) {
        await aiService.startConversation();
        
        // If we have context, send it first
        if (conversationContext) {
          await aiService.sendMessage(`[System Context, not visible to user]\n${conversationContext}`);
        }
      }
      
      const aiResponse = await aiService.sendMessage(input);
      
      // Add AI response
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        content: aiResponse,
        sender: 'ai',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Save updated answer if the question was about improving a solution and we have a questionId
      if (questionId && (
          input.toLowerCase().includes('improve') || 
          input.toLowerCase().includes('help with answer') ||
          input.toLowerCase().includes('better answer')
        )) {
        // Save latest answer or solution if the user asks for an improved version
        if (aiMessage.content.includes('improved answer') || 
            aiMessage.content.includes('better solution')) {
          saveUserAnswer(questionId, aiMessage.content);
        }
      }
      
    } catch (err) {
      console.error('Error getting AI response:', err);
      setError(err instanceof Error ? err.message : 'Failed to get response from OpenAI');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const clearConversation = () => {
    // Keep just the initial welcome message
    const initialWelcome = messages.length > 0 ? [messages[0]] : [];
    setMessages(initialWelcome);
  };
  
  return (
    <Paper
      elevation={0}
      variant="outlined"
      sx={{
        display: 'flex', 
        flexDirection: 'column',
        height: '500px', 
        maxHeight: '500px',
        bgcolor: 'background.paper',
        borderRadius: 2
      }}
    >
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: 1,
        borderColor: 'divider'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SmartToyIcon color="primary" />
          <Typography variant="h6">
            Interview Coach
          </Typography>
        </Box>
        
        <IconButton 
          size="small" 
          color="primary"
          onClick={clearConversation}
          title="Clear conversation"
        >
          <DeleteSweepIcon />
        </IconButton>
      </Box>
      
      {/* Messages container */}
      <Box sx={{ 
        flex: 1, 
        overflowY: 'auto',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 2
      }}>
        {messages.map((message) => (
          <Box
            key={message.id}
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              alignSelf: message.sender === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '80%'
            }}
          >
            {message.sender === 'ai' && (
              <Avatar sx={{ mr: 1, bgcolor: 'primary.main' }}>
                <SmartToyIcon fontSize="small" />
              </Avatar>
            )}
            
            <Paper
              elevation={1}
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: message.sender === 'user' ? 'primary.main' : 'background.default',
                color: message.sender === 'user' ? 'primary.contrastText' : 'text.primary'
              }}
            >
              {message.sender === 'ai' ? (
                <ReactMarkdown>{message.content}</ReactMarkdown>
              ) : (
                <Typography variant="body1">{message.content}</Typography>
              )}
              
              <Typography variant="caption" color={message.sender === 'user' ? 'primary.contrastText' : 'text.secondary'} sx={{ display: 'block', mt: 1, textAlign: 'right', opacity: 0.7 }}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Typography>
            </Paper>
            
            {message.sender === 'user' && (
              <Avatar sx={{ ml: 1, bgcolor: 'secondary.main' }}>
                <PersonIcon fontSize="small" />
              </Avatar>
            )}
          </Box>
        ))}
        
        {isLoading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <SmartToyIcon fontSize="small" />
            </Avatar>
            <CircularProgress size={24} />
          </Box>
        )}
        
        {error && (
          <Box sx={{ p: 2, bgcolor: 'error.main', color: 'error.contrastText', borderRadius: 1, mt: 2 }}>
            <Typography variant="body2">{error}</Typography>
          </Box>
        )}
        
        <div ref={messagesEndRef} />
      </Box>
      
      <Divider />
      
      {/* Message input */}
      <Box sx={{ p: 2 }}>
        <TextField
          fullWidth
          placeholder={apiKeyAvailable ? "Ask the interview coach..." : `Add your ${providerName} API key in settings to enable chat`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={!apiKeyAvailable || isLoading}
          multiline
          maxRows={3}
          variant="outlined"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  color="primary"
                  onClick={handleSendMessage}
                  disabled={!input.trim() || !apiKeyAvailable || isLoading}
                >
                  <SendIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Box>
    </Paper>
  );
}
