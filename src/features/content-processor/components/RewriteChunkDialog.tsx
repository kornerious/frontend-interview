import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Box,
  Chip,
  Typography,
  SelectChangeEvent
} from '@mui/material';
import { useContentProcessorStore } from '../store/useContentProcessorStore';
import { MultiStageProcessingOptions } from '../api/multiStageProcessor';

type QuestionType = 'mcq' | 'code' | 'open' | 'flashcard';
type DifficultyLevel = 'easy' | 'medium' | 'hard';
type FocusArea = 'theory' | 'questions' | 'tasks';

interface RewriteChunkDialogProps {
  open: boolean;
  onClose: () => void;
  chunkId: string;
  useLocalLlm: boolean;
  localLlmModel: string;
}

/**
 * Dialog for configuring chunk rewrite options
 */
const RewriteChunkDialog: React.FC<RewriteChunkDialogProps> = ({
  open,
  onClose,
  chunkId,
  useLocalLlm,
  localLlmModel
}) => {
  // Get rewrite function from store
  const { rewriteChunk } = useContentProcessorStore();
  
  // Rewrite options state
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [focusArea, setFocusArea] = useState<FocusArea>('theory');
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>(['mcq', 'code', 'open', 'flashcard']);
  const [enhanceExamples, setEnhanceExamples] = useState<boolean>(true);
  const [simplifyContent, setSimplifyContent] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  
  // Handle difficulty change
  const handleDifficultyChange = (event: SelectChangeEvent<string>) => {
    setDifficulty(event.target.value as DifficultyLevel);
  };
  
  // Handle focus area change
  const handleFocusAreaChange = (event: SelectChangeEvent<string>) => {
    setFocusArea(event.target.value as FocusArea);
  };
  
  // Handle question type toggle
  const handleQuestionTypeToggle = (type: QuestionType) => {
    setQuestionTypes(prev => {
      if (prev.includes(type)) {
        return prev.filter(t => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };
  
  // Handle rewrite
  const handleRewrite = async () => {
    try {
      setIsProcessing(true);
      
      const options: MultiStageProcessingOptions = {
        useLocalLlm,
        localLlmModel,
        rewriteOptions: {
          difficulty,
          focus: focusArea,
          questionTypes,
          enhanceExamples,
          simplifyContent
        }
      };
      
      await rewriteChunk(chunkId, options);
      onClose();
    } catch (error) {
      console.error('Error rewriting chunk:', error);
      alert(`Error rewriting chunk: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Rewrite Chunk Options</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="focus-select-label">Focus Area</InputLabel>
            <Select
              labelId="focus-select-label"
              id="focus-select"
              value={focusArea}
              label="Focus Area"
              onChange={handleFocusAreaChange}
            >
              <MenuItem value="theory">Theory</MenuItem>
              <MenuItem value="questions">Questions</MenuItem>
              <MenuItem value="tasks">Tasks</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="difficulty-select-label">Difficulty</InputLabel>
            <Select
              labelId="difficulty-select-label"
              id="difficulty-select"
              value={difficulty}
              label="Difficulty"
              onChange={handleDifficultyChange}
            >
              <MenuItem value="easy">Easy</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="hard">Hard</MenuItem>
            </Select>
          </FormControl>
          
          <Typography variant="subtitle2" gutterBottom>
            Question Types
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {(['mcq', 'code', 'open', 'flashcard'] as QuestionType[]).map(type => (
              <Chip
                key={type}
                label={type}
                color={questionTypes.includes(type) ? 'primary' : 'default'}
                onClick={() => handleQuestionTypeToggle(type)}
                sx={{ textTransform: 'uppercase' }}
              />
            ))}
          </Box>
          
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  checked={enhanceExamples}
                  onChange={() => setEnhanceExamples(!enhanceExamples)}
                />
              }
              label="Enhance Examples"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={simplifyContent}
                  onChange={() => setSimplifyContent(!simplifyContent)}
                />
              }
              label="Simplify Content"
            />
          </FormGroup>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isProcessing}>
          Cancel
        </Button>
        <Button 
          onClick={handleRewrite} 
          variant="contained" 
          color="primary"
          disabled={isProcessing}
        >
          {isProcessing ? 'Processing...' : 'Rewrite Chunk'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RewriteChunkDialog;
