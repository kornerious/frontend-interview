import React, { useState, useEffect } from 'react';
import { Paper, Typography, Box, Chip, Divider, Button, CircularProgress } from '@mui/material';
import { TheoryBlock as TheoryBlockType, CodeExample } from '@/types';
import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import gistStorageService from '../utils/gistStorageService';

interface TheoryBlockProps {
  theory: TheoryBlockType;
  onSaveExample?: (exampleId: string, code: string) => void;
}

/**
 * TheoryBlock component for displaying theory content with editable examples
 */
export default function TheoryBlock({ theory, onSaveExample }: TheoryBlockProps) {
  // State for saving status and database operations
  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({});
  const [savedCodes, setSavedCodes] = useState<Record<string, string>>({});
  
  // Load any previously saved code from the database
  useEffect(() => {
    const loadSavedExamples = async () => {
      try {
        // Use gistStorageService for Gist storage instead of localStorage
        const savedExamples = await gistStorageService.getCodeExamples(theory.id);
        if (savedExamples) {
          setSavedCodes(savedExamples);
        }
      } catch (error) {
        console.error('Failed to load saved examples:', error);
      }
    };
    
    loadSavedExamples();
  }, [theory.id]);
  
  // Enhanced save handler with database persistence
  const handleSaveExample = (example: CodeExample, newCode: string) => {
    // Set saving state to show loading indicator
    setSavingStates(prev => ({ ...prev, [example.id]: true }));
    
    // Use async/await with gistStorageService
    (async () => {
      try {
        // Update local state first for immediate feedback
        setSavedCodes(prev => ({ ...prev, [example.id]: newCode }));
        
        // Save to Gist using gistStorageService
        await gistStorageService.saveCodeExample(example.id, newCode, theory.id);
      } catch (error) {
        console.error('Failed to save example:', error);
      } finally {
        // Clear saving state regardless of success/failure
        setSavingStates(prev => ({ ...prev, [example.id]: false }));
      }
    })();
    
      // Call parent handler if provided
      if (onSaveExample) {
        onSaveExample(example.id, newCode);
      }
      
      // Note: Saving state is now cleared in the finally block of the async IIFE
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
      <Typography variant="h4" component="h2" gutterBottom>
        {theory.title}
      </Typography>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
        {theory.tags.map(tag => (
          <Chip 
            key={tag} 
            label={tag} 
            size="small" 
            color="primary" 
            variant="outlined"
          />
        ))}
      </Box>
      
      <Box sx={{ mb: 3 }}>
        <ReactMarkdown>{theory.content}</ReactMarkdown>
      </Box>
      
      {theory.examples.length > 0 && (
        <>
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="h5" gutterBottom>
            Examples
          </Typography>
          
          {theory.examples.map(example => (
            <Box key={example.id} sx={{ mb: 4, position: 'relative' }}>
              <Typography variant="h6" gutterBottom>
                {example.title}
              </Typography>
              
              {example.explanation && (
                <Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic' }}>
                  {example.explanation}
                </Typography>
              )}
              
              <Box sx={{ height: 500, mb: 2 }}>
                <Editor
                  height="100%"
                  language={example.language}
                  value={savedCodes[example.id] || example.code}
                  onChange={(value) => setSavedCodes(prev => ({ ...prev, [example.id]: value || '' }))}
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
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={() => handleSaveExample(example, savedCodes[example.id] || example.code)}
                  disabled={savingStates[example.id]}
                  startIcon={savingStates[example.id] ? <CircularProgress size={20} color="inherit" /> : null}
                >
                  {savingStates[example.id] ? 'Saving...' : 'Save to Database'}
                </Button>
              </Box>
            </Box>
          ))}
        </>
      )}
    </Paper>
  );
}
