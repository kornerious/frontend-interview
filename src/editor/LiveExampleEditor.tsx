import React, { useState, useEffect } from 'react';
import { LiveProvider, LiveError, LivePreview } from 'react-live';
import { Box, Paper, Typography, Button, Tabs, Tab, useTheme } from '@mui/material';
import Editor from '@monaco-editor/react';
import { useSettingsStore } from '@/features/progress/useSettingsStore';

interface LiveExampleEditorProps {
  initialCode: string;
  title: string;
  explanation?: string;
  language: 'typescript' | 'javascript' | 'jsx' | 'tsx' | 'html' | 'css';
  onSave?: (code: string) => void;
}

/**
 * LiveExampleEditor component allows users to edit and see the live preview of code examples
 */
export default function LiveExampleEditor({
  initialCode,
  title,
  explanation,
  language = 'jsx',
  onSave
}: LiveExampleEditorProps) {
  const [code, setCode] = useState(initialCode);
  const [activeTab, setActiveTab] = useState(0);
  const { settings } = useSettingsStore();
  const theme = useTheme();
  
  // Map language to proper Monaco language
  const getMonacoLanguage = () => {
    switch (language) {
      case 'tsx':
      case 'typescript':
        return 'typescript';
      case 'jsx':
      case 'javascript':
        return 'javascript';
      default:
        return language;
    }
  };
  
  // Determine if the code can be executed in the live preview
  const canExecute = language === 'jsx' || language === 'tsx';
  
  // Reset code if initialCode changes
  useEffect(() => {
    setCode(initialCode);
  }, [initialCode]);
  
  // Handle code change
  const handleCodeChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCode(value);
    }
  };
  
  // Handle save
  const handleSave = () => {
    if (onSave) {
      onSave(code);
    }
  };
  
  return (
    <Paper 
      elevation={3} 
      sx={{ 
        marginY: 3, 
        overflow: 'hidden',
        border: `1px solid ${theme.palette.divider}`
      }}
    >
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="subtitle1" sx={{ padding: 2, fontWeight: 'bold' }}>
          {title}
        </Typography>
        <Tabs 
          value={activeTab} 
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
        >
          <Tab label="Code" />
          {canExecute && <Tab label="Result" />}
          {explanation && <Tab label="Explanation" />}
        </Tabs>
      </Box>
      
      <Box sx={{ display: activeTab === 0 ? 'block' : 'none', height: 300 }}>
        <Editor
          height="300px"
          language={getMonacoLanguage()}
          value={code}
          onChange={handleCodeChange}
          theme={settings.codeEditorTheme}
          options={{
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 14,
            wordWrap: 'on',
            automaticLayout: true
          }}
        />
      </Box>
      
      {canExecute && (
        <Box 
          sx={{ 
            display: activeTab === 1 ? 'block' : 'none', 
            height: 300, 
            overflow: 'auto',
            padding: 2,
            backgroundColor: theme.palette.background.default
          }}
        >
          <LiveProvider code={code} noInline={code.includes('render(')}>
            <Box sx={{ marginBottom: 2 }}>
              <LivePreview />
            </Box>
            <Box 
              sx={{ 
                color: 'error.main', 
                fontSize: '0.875rem',
                fontFamily: 'monospace' 
              }}
            >
              <LiveError />
            </Box>
          </LiveProvider>
        </Box>
      )}
      
      {explanation && (
        <Box 
          sx={{ 
            display: activeTab === (canExecute ? 2 : 1) ? 'block' : 'none',
            height: 300,
            overflow: 'auto',
            padding: 2,
            backgroundColor: theme.palette.background.paper
          }}
        >
          <Typography variant="body2">
            {explanation}
          </Typography>
        </Box>
      )}
      
      <Box sx={{ 
        padding: 1, 
        display: 'flex', 
        justifyContent: 'flex-end',
        borderTop: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper
      }}>
        <Button 
          variant="outlined" 
          size="small" 
          onClick={() => setCode(initialCode)}
          sx={{ marginRight: 1 }}
        >
          Reset
        </Button>
        <Button 
          variant="contained" 
          size="small"
          onClick={handleSave}
          disabled={!onSave}
        >
          Save Example
        </Button>
      </Box>
    </Paper>
  );
}
