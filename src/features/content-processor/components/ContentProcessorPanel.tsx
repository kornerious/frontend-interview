import React, { useState, useEffect } from 'react';
import { 
  Box, Button, CircularProgress, Typography, Alert, Paper, 
  LinearProgress, Tabs, Tab, Select, MenuItem, FormControl, 
  InputLabel, SelectChangeEvent
} from '@mui/material';
import { useContentProcessorStore } from '../store/useContentProcessorStore';
import TheoryList from './TheoryList';
import QuestionList from './QuestionList';
import TaskList from './TaskList';
import { ContentProcessor } from '../utils/contentProcessor';
import { ExportUtils } from '../utils/exportUtils';
import localLlmService from '../api/localLlmService';
import ProcessingControls from './ProcessingControls';
import LineRangeProcessor from './LineRangeProcessor';
import LocalLlmSelector from './LocalLlmSelector';

/**
 * Main content processor panel component
 * Connects to the content processor store for real functionality
 */
const ContentProcessorPanel: React.FC = () => {
  // Get state and actions from store
  const {
    processingState,
    currentChunk,
    allChunks,
    isLoading,
    error,
    initialize,
    processNextChunk,
    markCurrentChunkCompleted,
    resetProcessing,
    setCurrentChunk,
    loadAllChunks
  } = useContentProcessorStore();

  // Tab state
  const [tabValue, setTabValue] = useState(0);
  
  // Local LLM state - default to using local LLM with DeepSeek Coder V2 Extended
  const [useLocalLlm, setUseLocalLlm] = useState(true);
  const [selectedModel, setSelectedModel] = useState('deepseek-coder-v2-extended:latest');
  const [localLlmInitialized, setLocalLlmInitialized] = useState(false);
  
  // Line range processing state removed - now in LineRangeProcessor component
  
  // Initialize on mount
  useEffect(() => {
    initialize()
      .then(() => loadAllChunks())
      .catch(err => {
        console.error('Failed to initialize content processor:', err);
      });
    
    // Initialize local LLM service
    if (useLocalLlm) {
      localLlmService.initialize({ apiKey: '' })
        .then(initialized => {
          setLocalLlmInitialized(initialized);
          if (initialized) {
            localLlmService.setDefaultModel(selectedModel);
            console.log('Local LLM service initialized with model:', selectedModel);
          }
        })
        .catch(err => {
          console.error('Failed to initialize local LLM service:', err);
        });
    }
  }, [initialize, loadAllChunks, useLocalLlm, selectedModel]);
  
  // useEffect for calculating total chunks removed

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle model change
  const handleModelChange = (event: SelectChangeEvent<string>) => {
    setSelectedModel(event.target.value);
  };

  // Handle chunk selection
  const handleChunkChange = (event: SelectChangeEvent<string>) => {
    const chunkId = event.target.value;
    setCurrentChunk(chunkId);
  };

  // Handle processing the next chunk
  const handleProcessNextChunk = async () => {
    try {
      // If using local LLM and it's initialized, process with local LLM
      if (useLocalLlm && localLlmInitialized) {
        console.log(`Processing next chunk with local LLM model: ${selectedModel}`);
        await processNextChunk({
          useLocalLlm: true,
          localLlmModel: selectedModel
        });
      } else {
        // Otherwise use Claude
        console.log('Processing next chunk with Claude API');
        await processNextChunk();
      }
      
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
      
      // If using local LLM and it's initialized, process with local LLM
      if (useLocalLlm && localLlmInitialized) {
        await processNextChunk({
          useLocalLlm: true,
          localLlmModel: selectedModel
        });
      } else {
        // Otherwise use Claude
        await processNextChunk();
      }
      
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
  
  
  // Handle export to JSON
  const handleExportToJson = async () => {
    try {
      // Get all chunks from store
      const chunks = allChunks;
      
      // Use ExportUtils to handle the export
      ExportUtils.exportAndDownload(chunks);
    } catch (error) {
      console.error('Error exporting to JSON:', error);
      alert(`Error exporting to JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Calculate progress percentage
  const progressPercentage = processingState
    ? Math.round((processingState.currentPosition / processingState.totalLines) * 100)
    : 0;

  return (
    <Paper elevation={3} sx={{ width: '100%', p: 3, mb: 3 }}>
      <details>
      <Typography variant="h4" gutterBottom>
        Content Processor
      </Typography>
      
        <summary style={{ cursor: 'pointer', color: '#666', marginBottom: '8px' }}>
        </summary>
        
        <Typography variant="body1" paragraph>
          This panel processes your MyNotes.md file in chunks, using AI to extract theory, questions, and tasks.
          You're currently using the <strong>{useLocalLlm ? `local LLM model (${selectedModel})` : 'Claude API'}</strong>.
        </Typography>
        
        <Typography variant="body1" paragraph sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          To process MyNotes.md, click the "Start Processing" button below. If no content appears, click "Reset Processor" and try again.
        </Typography>
        
        {/* LLM Selection */}
        <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {useLocalLlm && (
            <LocalLlmSelector 
              onModelSelect={(model: string) => {
                setSelectedModel(model);
                setLocalLlmInitialized(true);
              }}
              onProcessContent={async (content: string, model: string) => {
                console.log(`Processing test content with ${model}`);
                try {
                  const result = await localLlmService.processContent(content, { model });
                  console.log('Processing result:', result.substring(0, 100) + '...');
                  return;
                } catch (err) {
                  console.error('Error processing test content:', err);
                  throw err;
                }
              }}
            />
          )}
        </Box>
      </details>
      
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
      
      {/* Line range processing */}
      <LineRangeProcessor 
        useLocalLlm={useLocalLlm}
        localLlmInitialized={localLlmInitialized}
        selectedModel={selectedModel}
      />
      
      {/* Error message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Chunk navigation */}
      {allChunks.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="chunk-select-label">Select Chunk</InputLabel>
            <Select
              labelId="chunk-select-label"
              id="chunk-select"
              value={currentChunk?.id || ''}
              label="Select Chunk"
              onChange={handleChunkChange}
            >
              {allChunks.map(chunk => (
                <MenuItem key={chunk.id} value={chunk.id}>
                  Lines {chunk.startLine}-{chunk.endLine} {chunk.completed ? '(Completed)' : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}
      
      {/* Content area */}
      {currentChunk ? (
        <>
          {/* Chunk info */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Viewing chunk: Lines {currentChunk.startLine}-{currentChunk.endLine}
              {currentChunk.completed ? ' (Completed)' : ''}
            </Typography>
          </Box>
          
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

          {/* Processing controls */}
          <ProcessingControls 
            isLoading={isLoading}
            progressPercentage={progressPercentage}
            useLocalLlm={useLocalLlm}
            setUseLocalLlm={setUseLocalLlm}
            localLlmInitialized={localLlmInitialized}
            selectedModel={selectedModel}
            currentChunkCompleted={currentChunk.completed}
            handleProcessNextChunk={handleProcessNextChunk}
            handleMarkCompleted={handleMarkCompleted}
          />
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
                sx={{ mt: 2, fontSize: '1.1rem', py: 1, px: 3 }}
                size="large"
                startIcon={useLocalLlm && localLlmInitialized ? <span role="img" aria-label="local">🖥️</span> : <span role="img" aria-label="cloud">☁️</span>}
              >
                Start Processing MyNotes.md with {useLocalLlm && localLlmInitialized ? `Local LLM (${selectedModel})` : 'Claude AI'}
              </Button>
            </>
          )}
        </Box>
      )}
      
      {/* Additional processing options removed */}
      
      {/* Admin controls */}
      <Box sx={{ mt: 3, pt: 2, borderTop: '1px dashed #ccc' }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          Admin Controls
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={handleReset}
            disabled={isLoading}
          >
            Reset Processor
          </Button>
          <Button
            variant="outlined"
            size="small"
            color="success"
            onClick={handleExportToJson}
            disabled={isLoading || allChunks.length === 0}
            startIcon={<span role="img" aria-label="download">📥</span>}
          >
            Export to JSON
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default ContentProcessorPanel;
