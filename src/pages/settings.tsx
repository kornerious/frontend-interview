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
import gistStorageService from '@/utils/gistStorageService';

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
    importFromGistUrl, 
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
        await gistStorageService.initialize(newSettings.githubGistToken);
      }
      

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
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle1">Integration</Typography>
                    <Grid container spacing={2}>
                      {/* GitHub Gist Integration */}
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" gutterBottom>GitHub Gist Storage</Typography>
                        <Typography variant="body2" paragraph>
                          Use GitHub Gist to store your settings, progress, and user data. 
                          This allows you to sync across devices.
                        </Typography>
                        
                        <FormControlLabel
                          control={
                            <Switch
                              checked={useGistStorage}
                              onChange={(e) => setUseGistStorage(e.target.checked)}
                              color="primary"
                            />
                          }
                          label="Use GitHub Gist for storage"
                        />
                        
                        <TextField
                          label="GitHub Personal Access Token"
                          type="password"
                          fullWidth
                          value={githubGistToken}
                          onChange={(e) => setGithubGistToken(e.target.value)}
                          margin="normal"
                          helperText="Create a token with gist scope at github.com/settings/tokens"
                        />
                        
                        <Box mt={2}>
                          <Grid container spacing={2}>
                            <Grid item xs={12}>
                              <Typography variant="subtitle2">Import from Existing Gist URL</Typography>
                              <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                                <TextField
                                  label="Gist URL"
                                  fullWidth
                                  value={gistUrl}
                                  onChange={(e) => setGistUrl(e.target.value)}
                                  size="small"
                                  placeholder="https://gist.githubusercontent.com/..."
                                />
                                <Button
                                  variant="contained"
                                  color="primary"
                                  onClick={async () => {
                                    if (!githubGistToken) {
                                      setImportError("GitHub token is required");
                                      return;
                                    }
                                    
                                    try {
                                      setImportingGist(true);
                                      setImportError(null);
                                      const success = await importFromGistUrl(gistUrl);
                                      if (success) {
                                        setImportSuccess(true);
                                        // Refresh the page to show updated data
                                        setTimeout(() => {
                                          window.location.reload();
                                        }, 1500);
                                      } else {
                                        setImportError("Failed to import data from Gist URL. Invalid format or URL.");
                                      }
                                    } catch (error) {
                                      console.error("Error importing from Gist URL:", error);
                                      setImportError("Failed to import data from Gist URL.");
                                    } finally {
                                      setImportingGist(false);
                                    }
                                  }}
                                  disabled={!gistUrl || !githubGistToken || importingGist}
                                  sx={{ ml: 1, height: "40px" }}
                                >
                                  Import
                                </Button>
                              </Box>
                            </Grid>
                          </Grid>
                        </Box>
                      </Grid>
                    </Grid>
                    <Typography variant="subtitle1" gutterBottom>
                      AI Provider Settings
                    </Typography>
                    
                    <FormControl fullWidth margin="normal">
                      <InputLabel id="ai-provider-label">AI Provider</InputLabel>
                      <Select
                        labelId="ai-provider-label"
                        value={selectedAIProvider}
                        label="AI Provider"
                        onChange={(e) => setSelectedAIProvider(e.target.value as 'openai' | 'claude' | 'gemini')}
                      >
                        <MenuItem value="openai">OpenAI (GPT-4)</MenuItem>
                        <MenuItem value="claude">Anthropic (Claude)</MenuItem>
                        <MenuItem value="gemini">Google (Gemini)</MenuItem>
                      </Select>
                    </FormControl>
                    
                    {selectedAIProvider === 'openai' && (
                      <TextField
                        fullWidth
                        type="password"
                        label="OpenAI API Key"
                        variant="outlined"
                        value={openAIKey}
                        onChange={(e) => setOpenAIKey(e.target.value)}
                        placeholder="sk-..."
                        helperText="Required for OpenAI-powered features"
                        margin="normal"
                      />
                    )}
                    
                    {selectedAIProvider === 'claude' && (
                      <TextField
                        fullWidth
                        type="password"
                        label="Claude API Key"
                        variant="outlined"
                        value={claudeKey}
                        onChange={(e) => setClaudeKey(e.target.value)}
                        placeholder="sk-ant-..."
                        helperText="Required for Anthropic Claude features"
                        margin="normal"
                      />
                    )}
                    
                    {selectedAIProvider === 'gemini' && (
                      <TextField
                        fullWidth
                        type="password"
                        label="Gemini API Key"
                        variant="outlined"
                        value={geminiKey}
                        onChange={(e) => setGeminiKey(e.target.value)}
                        placeholder="..."
                        helperText="Required for Google Gemini features"
                        margin="normal"
                      />
                    )}
                    
                    <FormControlLabel
                      control={
                        <Switch
                          checked={saveAnswers}
                          onChange={(e) => setSaveAnswers(e.target.checked)}
                          color="primary"
                        />
                      }
                      label="Save my answers between sessions"
                    />
                  </Box>
                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel id="editor-theme-label">Code Editor Theme</InputLabel>
                    <Select
                      labelId="editor-theme-label"
                      value={editorTheme}
                      label="Code Editor Theme"
                      onChange={(e) => setEditorTheme(e.target.value)}
                    >
                      <MenuItem value="vs-dark">Dark (VS Code)</MenuItem>
                      <MenuItem value="vs-light">Light (VS Code)</MenuItem>
                    </Select>
                  </FormControl>

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

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Learning Preferences
                  </Typography>

                  <Typography variant="subtitle2" gutterBottom>
                    Selected Technologies
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                    {technologies.map((tech) => (
                      <Button
                        key={tech}
                        variant={selectedTechnologies.includes(tech) ? 'contained' : 'outlined'}
                        color="primary"
                        size="small"
                        onClick={() => handleTechnologyToggle(tech)}
                        sx={{ mb: 1 }}
                      >
                        {tech}
                      </Button>
                    ))}
                  </Box>

                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel id="duration-label">Learning Duration (Days)</InputLabel>
                    <Select
                      labelId="duration-label"
                      value={learningDuration}
                      label="Learning Duration (Days)"
                      onChange={(e) => setLearningDuration(Number(e.target.value))}
                    >
                      <MenuItem value={7}>7 days</MenuItem>
                      <MenuItem value={14}>14 days</MenuItem>
                      <MenuItem value={21}>21 days</MenuItem>
                      <MenuItem value={30}>30 days</MenuItem>
                    </Select>
                  </FormControl>
                </CardContent>
                <CardActions>
                  <Button variant="contained" onClick={handleSaveSettings}>
                    Save Preferences
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          </Grid>
        </Paper>

        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Backup & Restore
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Full Data Backup and Restore
                  </Typography>

                  <Typography variant="body2" paragraph>
                    Export all your data (including progress, settings, and answers) as a JSON file for backup or transfer between devices.
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Button
                      variant="contained"
                      onClick={handleExportData}
                      sx={{ mt: 2, mr: 1 }}
                      startIcon={<>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                          <polyline points="17 21 17 13 7 13 7 21" />
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                      </>}
                    >
                      Export All Data as JSON
                    </Button>
                    
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Restore from Backup
                      </Typography>
                      <input
                        accept=".json"
                        style={{ display: 'none' }}
                        id="data-file-upload"
                        type="file"
                        onChange={handleImportData}
                      />
                      <label htmlFor="data-file-upload">
                        <Button variant="outlined" component="span" startIcon={<>
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                          </svg>
                        </>}>
                          Import Data from JSON
                        </Button>
                      </label>
                      
                      {importError && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                          {importError}
                        </Alert>
                      )}

                      {importSuccess && (
                        <Alert severity="success" sx={{ mt: 2 }}>
                          Data imported successfully! Reloading...
                        </Alert>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Program Backup Options
                  </Typography>

                  <Typography variant="body2" paragraph>
                    Archive your current program for later access, or export it as a TypeScript file for
                    a permanent backup you can store anywhere.
                  </Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Archive Current Program
                      </Typography>
                      <Typography variant="body2" paragraph>
                        This will archive your current program within the app and allow you to start a new one.
                      </Typography>
                      <Button
                        variant="contained"
                        color="warning"
                        onClick={archiveCurrentProgram}
                        disabled={!currentProgram}
                        size="small"
                      >
                        Archive Program
                      </Button>
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Export as TypeScript File
                      </Typography>
                      <Typography variant="body2" paragraph>
                        Save your current program as a .ts file for external backup or sharing.
                      </Typography>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => {
                          if (currentProgram) {
                            ArchiveManager.saveAsTypeScriptFile(currentProgram)
                              .then(() => {
                                alert('Program exported successfully as a TypeScript file!');
                              })
                              .catch(error => {
                                console.error('Error exporting program:', error);
                                alert('Failed to export program. See console for details.');
                              });
                          }
                        }}
                        disabled={!currentProgram}
                        size="small"
                      >
                        Export as .ts File
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </AppLayout>
  );
}
