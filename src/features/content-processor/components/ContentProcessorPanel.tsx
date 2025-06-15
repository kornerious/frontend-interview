import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Button,
  SelectChangeEvent,
  CircularProgress
} from '@mui/material';
import { useContentProcessorStore } from '../store/useContentProcessorStore';
import { ProcessingStage } from '../api/multiStageProcessor';
import { ExportUtils } from '../utils/exportUtils';
import localLlmService from '../api/localLlmService';
import ProcessingControls from './ProcessingControls';
import LineRangeProcessor from './LineRangeProcessor';
import MultiStageControls from './MultiStageControls';
import ContentTabsPanel from './ContentTabsPanel';
import ProgressBar from './ProgressBar';
import ChunkSelector from './ChunkSelector';
import AdminControls from './AdminControls';
import ErrorAlert from './ErrorAlert';
import ModelSelector from './ModelSelector';
import DialogManager from './DialogManager';

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
    currentStage,
    initialize,
    processNextChunk,
    markCurrentChunkCompleted,
    resetProcessing,
    setCurrentChunk,
    loadAllChunks,
    setProcessingStage,
    enhanceTheory,
    generateQuestions,
    generateTasks,
    rewriteChunk
  } = useContentProcessorStore();

  // Tab state
  const [tabValue, setTabValue] = useState(0);
  
  // Local LLM state - default to using local LLM with DeepSeek Coder V2 16B
  const [useLocalLlm, setUseLocalLlm] = useState(true);
  const [selectedModel, setSelectedModel] = useState('deepseek-coder-v2:16b');
  const [localLlmInitialized, setLocalLlmInitialized] = useState(false);
  
  // Rewrite dialog state
  const [rewriteDialogOpen, setRewriteDialogOpen] = useState(false);
  
  // Calculate progress percentage
  const progressPercentage = allChunks.length > 0
    ? (allChunks.filter(chunk => chunk.completed).length / allChunks.length) * 100
    : 0;
  
  // Initialize on mount
  useEffect(() => {
    initialize()
      .then(() => loadAllChunks())
      .catch(err => {
        // Console log removed
      });
    
    // Initialize local LLM service
    if (useLocalLlm) {
      localLlmService.initialize({ apiKey: '' })
        .then(initialized => {
          setLocalLlmInitialized(initialized);
          if (initialized) {
            localLlmService.setDefaultModel(selectedModel);
            // Console log removed
          }
        })
        .catch(err => {
          // Console log removed
        });
    }
  }, [initialize, loadAllChunks, useLocalLlm, selectedModel]);

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
        // Console log removed
        await processNextChunk({
          useLocalLlm: true,
          localLlmModel: selectedModel
        });
      } else {
        // Otherwise use Claude
        // Console log removed
        await processNextChunk();
      }
      
      // Reset to theory tab when new content is loaded
      setTabValue(0);
    } catch (err) {
      // Console log removed
    }
  };

  // Handle mark as completed
  const handleMarkCompleted = async () => {
    try {
      await markCurrentChunkCompleted();
      
      // If there are more chunks to process, automatically process the next one
      const completedChunks = allChunks.filter(chunk => chunk.completed).length;
      if (completedChunks < allChunks.length) {
        // Console log removed
      } else {
        // Console log removed
      }
    } catch (err) {
      // Console log removed
    }
  };

  // Handle reset
  const handleReset = async () => {
    try {
      await resetProcessing();
      setTabValue(0);
      // Console log removed
    } catch (err) {
      // Console log removed
    }
  };

  // Handle export to JSON
  const handleExportToJson = () => {
    try {
      ExportUtils.exportAndDownload(allChunks);
    } catch (err) {
      // Console log removed
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>Content Processor</Typography>
        
        {/* Error message */}
        <ErrorAlert error={error} />
        
        {/* Progress bar */}
        <ProgressBar
          progressPercentage={progressPercentage}
          completedChunks={allChunks.filter(chunk => chunk.completed).length}
          totalChunks={allChunks.length}
        />
        
        {/* Model selector */}
        <ModelSelector
          useLocalLlm={useLocalLlm}
          localLlmInitialized={localLlmInitialized}
          selectedModel={selectedModel}
          handleToggleLocalLlm={() => setUseLocalLlm(!useLocalLlm)}
          handleModelChange={handleModelChange}
          isLoading={isLoading}
        />
        
        {/* Line range processor */}
        <LineRangeProcessor
          useLocalLlm={useLocalLlm}
          localLlmInitialized={localLlmInitialized}
          selectedModel={selectedModel}
        />
        
        {/* Chunk selector */}
        <ChunkSelector
          allChunks={allChunks}
          currentChunkId={currentChunk?.id}
          handleChunkChange={handleChunkChange}
        />
        
        {/* Content area */}
        {currentChunk ? (
          <>
            {/* Chunk info and multi-stage processing controls */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Viewing chunk: Lines {currentChunk.startLine}-{currentChunk.displayEndLine !== undefined ? currentChunk.displayEndLine : currentChunk.endLine - 1}
                {currentChunk.completed ? ' (Completed)' : ''}
              </Typography>
              
              {/* Multi-stage processing controls */}
              <MultiStageControls
                currentStage={currentStage}
                isLoading={isLoading}
                enhanceTheory={enhanceTheory}
                generateQuestions={generateQuestions}
                generateTasks={generateTasks}
                setProcessingStage={setProcessingStage}
                setRewriteDialogOpen={setRewriteDialogOpen}
                currentChunkId={currentChunk.id}
                useLocalLlm={useLocalLlm}
                selectedModel={selectedModel}
              />
            </Box>
            
            {/* Content tabs panel */}
            <ContentTabsPanel 
              tabValue={tabValue}
              handleTabChange={handleTabChange}
              currentChunk={currentChunk}
            />

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
        
        {/* Admin controls */}
        <AdminControls
          isLoading={isLoading}
          hasChunks={allChunks.length > 0}
          handleReset={handleReset}
          handleExportToJson={handleExportToJson}
        />
      </Paper>
      
      {/* Dialog manager */}
      <DialogManager
        isRewriteDialogOpen={rewriteDialogOpen}
        handleCloseRewriteDialog={() => setRewriteDialogOpen(false)}
        currentChunkId={currentChunk?.id || null}
        useLocalLlm={useLocalLlm}
        selectedModel={selectedModel}
      />
    </Box>
  );
};

export default ContentProcessorPanel;
