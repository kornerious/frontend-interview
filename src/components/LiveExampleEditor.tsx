import React, { useState } from 'react';
import { LiveProvider, LiveEditor, LiveError, LivePreview } from 'react-live';
import { Box, Paper, Typography, Button, Tooltip } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SaveIcon from '@mui/icons-material/Save';
import { useSettingsStore } from '@/features/progress/useSettingsStore';

interface LiveExampleEditorProps {
  initialCode: string;
  language: string;
  title: string;
  explanation?: string;
  exampleId?: string;
  onSave?: (code: string) => void;
}

const LiveExampleEditor: React.FC<LiveExampleEditorProps> = ({
  initialCode,
  language,
  title,
  exampleId,
  onSave
}) => {
  const [code, setCode] = useState(initialCode);
  const [copied, setCopied] = useState(false);
  const { settings } = useSettingsStore();
  
  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
  };
  
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleSave = () => {
    if (onSave) {
      onSave(code);
    }
  };
  
  return (
    <Paper 
      elevation={2} 
      sx={{ 
        mt: 2, 
        mb: 3, 
        overflow: 'hidden',
        bgcolor: settings.darkMode ? 'grey.900' : 'grey.100',
      }}
    >
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle1" fontWeight="medium">
          {title}
        </Typography>
        <Box>
          <Tooltip title={copied ? "Copied!" : "Copy code"}>
            <Button 
              size="small" 
              startIcon={<ContentCopyIcon />}
              onClick={handleCopy}
              sx={{ mr: 1 }}
            >
              Copy
            </Button>
          </Tooltip>
          {onSave && (
            <Button 
              size="small" 
              startIcon={<SaveIcon />}
              onClick={handleSave}
              variant="contained"
              color="primary"
            >
              Save Example
            </Button>
          )}
        </Box>
      </Box>
      
      <LiveProvider 
        code={code} 
        language={language} 
        noInline={language === 'jsx' || language === 'tsx'}
      >
        <Box sx={{ p: 0 }}>
          <Box 
            sx={{ 
              fontFamily: 'monospace', 
              fontSize: '0.9rem',
              '& pre': { 
                margin: 0, 
                padding: '16px', 
                backgroundColor: settings.darkMode ? '#1e1e1e' : '#f5f5f5',
                borderRadius: 0 
              }
            }}
          >
            <LiveEditor onChange={handleCodeChange} />
          </Box>
          
          <Box sx={{ 
            p: 2, 
            backgroundColor: settings.darkMode ? '#2d2d2d' : '#fff',
            borderTop: 1, 
            borderColor: 'divider' 
          }}>
            <Typography variant="subtitle2" gutterBottom>
              Result:
            </Typography>
            <Box 
              sx={{ 
                p: 2, 
                border: '1px dashed',
                borderColor: 'divider',
                minHeight: '60px',
                bgcolor: settings.darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'
              }}
            >
              <LivePreview />
            </Box>
            <Box 
              sx={{ 
                mt: 1, 
                color: 'error.main', 
                fontSize: '0.85rem',
                fontFamily: 'monospace'
              }}
            >
              <LiveError />
            </Box>
          </Box>
        </Box>
      </LiveProvider>
    </Paper>
  );
};

export default LiveExampleEditor;
