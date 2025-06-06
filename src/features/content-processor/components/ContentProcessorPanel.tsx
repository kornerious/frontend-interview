import React, { useState, useEffect } from 'react';
import { Box, Button, CircularProgress, Typography, Alert, Paper, LinearProgress, Tabs, Tab } from '@mui/material';
import { useContentProcessorStore } from '../store/useContentProcessorStore';
import TheoryList from './TheoryList';
import QuestionList from './QuestionList';
import TaskList from './TaskList';

/**
 * Main content processor panel component
 * Connects to the content processor store for real functionality
 */
const ContentProcessorPanel: React.FC = () => {
  // Get state and actions from store
  const {
    processingState,
    currentChunk,
    isLoading,
    error,
    initialize,
    processNextChunk,
    markCurrentChunkCompleted,
    resetProcessing
  } = useContentProcessorStore();

  // Tab state
  const [tabValue, setTabValue] = useState(0);

  // Initialize on mount
  useEffect(() => {
    initialize().catch(err => {
      console.error('Failed to initialize content processor:', err);
    });
  }, [initialize]);

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle process next chunk
  const handleProcessNextChunk = async () => {
    try {
      await processNextChunk();
      // Reset to theory tab when new content is loaded
      setTabValue(0);
    } catch (err) {
      console.error('Error processing next chunk:', err);
    }
  };

  // Handle mark as completed
  const handleMarkCompleted = async () => {
    try {
      await markCurrentChunkCompleted();
      await processNextChunk();
      // Reset to theory tab when new content is loaded
      setTabValue(0);
    } catch (err) {
      console.error('Error marking chunk as completed:', err);
    }
  };

  // Handle reset
  const handleReset = async () => {
    try {
      await resetProcessing();
      // Reset to theory tab
      setTabValue(0);
    } catch (err) {
      console.error('Error resetting processor:', err);
    }
  };

  // Calculate progress percentage
  const progressPercentage = processingState
    ? Math.round((processingState.currentPosition / processingState.totalLines) * 100)
    : 0;

  return (
    <Paper elevation={3} sx={{ width: '100%', p: 3, mb: 3 }}>
      <Typography variant="h4" gutterBottom>
        Content Processor
      </Typography>
      
      <Typography variant="body1" paragraph>
        This panel processes your large markdown file in chunks, using AI to extract theory, questions, and tasks.
      </Typography>
      
      {/* Progress indicator */}
      <Box sx={{ width: '100%', mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Processing Progress
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {processingState ? `${processingState.currentPosition}/${processingState.totalLines} lines (${progressPercentage}%)` : '0%'}
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={progressPercentage} 
          sx={{ height: 10, borderRadius: 1 }}
        />
      </Box>
      
      {/* Error message */}
      {error && (
        <Alert severity="error" sx={{ my: 2 }}>
          {error}
        </Alert>
      )}
      
      {/* Content area */}
      {currentChunk ? (
        <>
          {/* Tabs for different content types */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 2 }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label={`Theory (${currentChunk.theory.length})`} />
              <Tab label={`Questions (${currentChunk.questions.length})`} />
              <Tab label={`Tasks (${currentChunk.tasks.length})`} />
            </Tabs>
          </Box>

          {/* Tab panels */}
          <Box sx={{ py: 2 }}>
            {tabValue === 0 && <TheoryList theory={currentChunk.theory} />}
            {tabValue === 1 && <QuestionList questions={currentChunk.questions} />}
            {tabValue === 2 && <TaskList tasks={currentChunk.tasks} />}
          </Box>

          {/* Action buttons */}
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleMarkCompleted}
              disabled={isLoading || currentChunk.completed}
            >
              {isLoading ? (
                <>
                  <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                  Processing...
                </>
              ) : (
                "I'm Done - Process Next Chunk"
              )}
            </Button>
            
            <Button
              variant="outlined"
              onClick={handleProcessNextChunk}
              disabled={isLoading || progressPercentage >= 100}
            >
              Skip & Process Next Chunk
            </Button>
          </Box>
        </>
      ) : (
        // No current chunk - show start button
        <Box sx={{ mt: 4, textAlign: 'center', p: 2, bgcolor: 'background.default', borderRadius: 1, minHeight: 200 }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography>Initializing content processor...</Typography>
            </Box>
          ) : (
            <>
              <Typography variant="body1" gutterBottom>
                No content has been processed yet. Click the button below to start processing.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={handleProcessNextChunk}
                disabled={isLoading || progressPercentage >= 100}
                sx={{ mt: 2 }}
              >
                Start Processing
              </Button>
            </>
          )}
        </Box>
      )}
      
      {/* Admin controls */}
      <Box sx={{ mt: 3, pt: 2, borderTop: '1px dashed #ccc' }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          Admin Controls
        </Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={handleReset}
          disabled={isLoading}
        >
          Reset Processor
        </Button>
      </Box>
    </Paper>
  );
};

export default ContentProcessorPanel;
