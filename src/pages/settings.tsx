import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  FormControl,
  FormControlLabel,
  Switch,
  TextField,
  Button,
  Select,
  MenuItem,
  InputLabel,
  Divider,
  Alert,
  Grid,
  Card,
  CardContent,
  CardActions
} from '@mui/material';
import { Technology } from '@/types';
import AppLayout from '@/components/AppLayout';
import { useSettingsStore } from '@/features/progress/useSettingsStoreFirebase';
import { useProgressStore } from '@/features/progress/useProgressStoreFirebase';
import { ArchiveManager } from '@/utils/archiveManager';
import firebaseService from '@/utils/firebaseService';

export default function SettingsPage() {
  const {
    settings, 
    toggleDarkMode, 
    setName: updateName, 
    setTechnologies, 
    setLearningDuration: updateDuration, 
    setCodeEditorTheme,
    setAIProvider,
    setOpenAIApiKey,
    setClaudeApiKey,
    setGeminiApiKey,
    setGithubGistToken: updateGistToken,
    toggleUseGistStorage,
    saveToFile, 
    loadFromFile 
  } = useSettingsStore();
  const { currentProgram, archiveCurrentProgram } = useProgressStore();
  const [name, setName] = useState(settings.name);
  const [selectedTechnologies, setSelectedTechnologies] = useState<Technology[]>(settings.selectedTechnologies);
  const [learningDuration, setLearningDuration] = useState(settings.learningDuration);
  const [editorTheme, setEditorTheme] = useState(settings.codeEditorTheme);
  const [selectedAIProvider, setSelectedAIProvider] = useState(settings.aiProvider);
  const [openAIKey, setOpenAIKey] = useState(settings.openAIApiKey || '');
  const [claudeKey, setClaudeKey] = useState(settings.claudeApiKey || '');
  const [geminiKey, setGeminiKey] = useState(settings.geminiApiKey || '');
  const [githubGistToken, setGithubGistToken] = useState(settings.githubGistToken || '');
  const [useGistStorage, setUseGistStorage] = useState(settings.useGistStorage);
  const [gistUrl, setGistUrl] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [saveAnswers, setSaveAnswers] = useState(settings.saveAnswers);
  const [importingGist, setImportingGist] = useState(false);

  // Handle technology selection
  const handleTechnologyToggle = (tech: Technology) => {
    setSelectedTechnologies(prev =>
      prev.includes(tech)
        ? prev.filter(t => t !== tech)
        : [...prev, tech]
    );
  };

  // Available technologies
  const technologies: Technology[] = [
    'React',
    'Next.js',
    'TypeScript',
    'JavaScript',
    'MUI',
    'Testing',
    'Performance',
    'CSS',
    'HTML'
  ];

  // Handle settings save with direct database and Gist saving
  const handleSaveSettings = async () => {
    // Create a complete settings object with all the current values
    const newSettings = {
      ...settings,
      name,
      selectedTechnologies,
      learningDuration,
      codeEditorTheme: editorTheme,
      aiProvider: selectedAIProvider,
      openAIApiKey: openAIKey,
      claudeApiKey: claudeKey,
      geminiApiKey: geminiKey,
      githubGistToken,
      useGistStorage,
      // Make sure darkMode is preserved
      darkMode: settings.darkMode,
    };

    try {
      // Initialize the gist service if token is provided
      if (newSettings.githubGistToken) {
        await firebaseService.initialize(newSettings.githubGistToken);
      }
      // Save the complete settings object to Firebase
      await firebaseService.saveSettings(newSettings);


    } catch (error) {
      console.error("❌ Error saving settings to GitHub Gist:", error);
    }
    
    // Update the UI store state (this will trigger component updates)
    updateName(name);
    setTechnologies(selectedTechnologies);
    updateDuration(learningDuration);
    setCodeEditorTheme(editorTheme);
    setAIProvider(selectedAIProvider);
    setOpenAIApiKey(openAIKey);
    setClaudeApiKey(claudeKey);
    setGeminiApiKey(geminiKey);
    updateGistToken(githubGistToken);
    if (useGistStorage !== settings.useGistStorage) {
      toggleUseGistStorage();
    }
    
    // Show success message
    setSaveSuccess(true);
    
    // Hide success message after 3 seconds
    setTimeout(() => {
      setSaveSuccess(false);
    }, 3000);
  };
  
  // Handle export all data to file
  const handleExportData = async () => {
    try {
      const filename = await saveToFile();
      alert(`Data exported successfully to ${filename}`);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data');
    }
  };
  
  // Handle import data from file
  const handleImportData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      try {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = async (event) => {
          try {
            const content = event.target?.result as string;
            const success = await loadFromFile(content);
            
            if (success) {
              setImportSuccess(true);
              // Refresh the page to show updated data
              setTimeout(() => {
                window.location.reload();
              }, 1500);
            } else {
              setImportError('Failed to import data. Invalid format.');
            }
          } catch (error) {
            setImportError(`Error processing file: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        };
        
        reader.onerror = () => {
          setImportError('Failed to read file');
        };
        
        reader.readAsText(file);
      } catch (error) {
        setImportError(`Error importing data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImportFile(e.target.files[0]);
      setImportError(null);
    }
  };

  // Handle program import
  const handleImportProgram = async () => {
    if (!importFile) {
      setImportError('No file selected');
      return;
    }

    try {
      // Read the file content
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          // Try to parse the file content as a TypeScript/JavaScript module
          // This is a simplified version - in a real app, we would need proper TS/JS parsing
          const programMatch = content.match(/export const program = (\{[\s\S]*?\});/);
          
          if (programMatch && programMatch[1]) {
            try {
              // Parse the JSON part
              const programData = JSON.parse(programMatch[1].replace(/'/g, '"'));

              setImportSuccess(true);
              setImportError(null);
      
              // Hide success message after 3 seconds
              setTimeout(() => {
                setImportSuccess(false);
              }, 3000);
            } catch (parseError) {
              setImportError('Failed to parse program data. Invalid format.');
            }
          } else {
            setImportError('Invalid file format. Could not find program data.');
          }
        } catch (error) {
          setImportError(`Error processing file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      };
      
      reader.onerror = () => {
        setImportError('Failed to read file');
      };
      
      reader.readAsText(importFile);
    } catch (error) {
      setImportError(`Import error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <AppLayout>
      <Box>
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Settings
          </Typography>

          {saveSuccess && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Settings saved successfully!
            </Alert>
          )}

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Personal Settings
                  </Typography>
                  <TextField
                    label="Your Name"
                    fullWidth
                    margin="normal"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.darkMode}
                        onChange={toggleDarkMode}
                      />
                    }
                    label="Dark Mode"
                  />
                </CardContent>
                <CardActions>
                  <Button variant="contained" onClick={handleSaveSettings}>
                    Save Settings
                  </Button>
                </CardActions>
              </Card>
            </Grid>


          </Grid>
        </Paper>

      </Box>
    </AppLayout>
  );
}
