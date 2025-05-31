import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  List, 
  ListItem, 
  ListItemText, 
  Typography, 
  Chip,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  Divider,
  useTheme
} from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DownloadIcon from '@mui/icons-material/Download';
import { useProgressStore } from '@/features/progress/useProgressStoreFirebase';
import { useSettingsStore } from '@/features/progress/useSettingsStoreFirebase';
import { LearningProgram } from '@/types';
import { useRouter } from 'next/router';

interface ProgramSwitcherProps {
  onNewProgramClick?: () => void;
}

/**
 * ProgramSwitcher component that allows users to switch between training programs
 * or start a new one without losing their current progress
 */
const ProgramSwitcher: React.FC<ProgramSwitcherProps> = ({ onNewProgramClick }) => {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const theme = useTheme();
  const { 
    currentProgram, 
    archivedPrograms, 
    switchProgram, 
    saveCurrentProgram
  } = useProgressStore();
  
  // Get settings store functions for export
  const { saveToFile } = useSettingsStore();
  
  const handleOpen = () => {
    // Save current program to make sure it's up-to-date in the archived list
    if (currentProgram) {
      saveCurrentProgram();
    }
    setOpen(true);
  };
  
  const handleClose = () => {
    setOpen(false);
  };
  
  const handleSwitchProgram = (programId: string) => {
    switchProgram(programId);
    setOpen(false);
    
    // Navigate to the daily page to show the switched program
    router.push('/daily');
  };
  
  const handleExportProgram = (e: React.MouseEvent, programId: string) => {
    e.stopPropagation(); // Prevent triggering the ListItem click
    
    // Export the program as a file using saveToFile
    const programToExport = archivedPrograms.find(p => p.id === programId);
    if (programToExport) {
      // Create a filename based on the program date
      const programDate = new Date(programToExport.dateStarted).toISOString().split('T')[0];
      const filename = `program_${programDate}_${programId}.json`;
      saveToFile(filename);
    }
  };
  
  const handleNewProgram = () => {
    if (onNewProgramClick) {
      onNewProgramClick();
    }
    handleClose();
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Calculate program completion percentage
  const getCompletionPercentage = (program: LearningProgram) => {
    const completedDays = program.dailyPlans.filter(plan => plan.completed).length;
    return Math.round((completedDays / program.durationDays) * 100);
  };
  
  return (
    <>
      <Button 
        startIcon={<SwapHorizIcon />} 
        onClick={handleOpen}
        color="primary"
        variant="outlined"
        size="small"
        sx={{ mr: 1 }}
      >
        Switch Program
      </Button>
      
      <Dialog 
        open={open} 
        onClose={handleClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6">
            Manage Training Programs
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Switch between your training programs or start a new one
          </Typography>
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Current Program
            </Typography>
            
            {currentProgram ? (
              <Box 
                sx={{ 
                  p: 2, 
                  border: '1px solid',
                  borderColor: 'primary.main',
                  borderRadius: 1,
                  bgcolor: 'background.paper',
                  mb: 2
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h6">
                      {formatDate(currentProgram.dateStarted)} Program
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                      {currentProgram.topics.map(tech => (
                        <Chip key={tech} label={tech} size="small" color="primary" variant="outlined" />
                      ))}
                    </Box>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" color="textSecondary">
                      Day {currentProgram.currentDay} of {currentProgram.durationDays}
                    </Typography>
                    <Chip 
                      label={`${getCompletionPercentage(currentProgram)}% complete`}
                      color="primary"
                      size="small"
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                </Box>
              </Box>
            ) : (
              <Typography variant="body2" color="textSecondary">
                No active program. Start a new one or select from your archived programs.
              </Typography>
            )}
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle1" gutterBottom>
            Your Programs
          </Typography>
          
          {archivedPrograms.length > 0 ? (
            <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
              {archivedPrograms.map(program => (
                <ListItem 
                  key={program.id} 
                  button
                  onClick={() => handleSwitchProgram(program.id)}
                  sx={{ 
                    borderRadius: 1,
                    mb: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.04)'
                    }
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body1">
                          {formatDate(program.dateStarted)} Program
                        </Typography>
                        <Chip 
                          label={`${getCompletionPercentage(program)}% complete`}
                          size="small"
                          color={getCompletionPercentage(program) >= 80 ? "success" : "primary"}
                          sx={{ ml: 1 }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                        {program.topics.map(tech => (
                          <Chip key={tech} label={tech} size="small" variant="outlined" />
                        ))}
                        <Typography variant="body2" color="textSecondary" sx={{ ml: 1 }}>
                          Day {program.currentDay} of {program.durationDays}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Tooltip title="Export as .ts file">
                      <IconButton 
                        edge="end" 
                        aria-label="export" 
                        onClick={(e) => handleExportProgram(e, program.id)}
                        size="small"
                      >
                        <DownloadIcon />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="textSecondary">
              No archived programs available.
            </Typography>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button 
            startIcon={<AddCircleOutlineIcon />}
            onClick={handleNewProgram}
            color="primary"
          >
            Start New Program
          </Button>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ProgramSwitcher;
