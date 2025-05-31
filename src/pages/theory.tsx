import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  CardActions,
  Button,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Chip,
  IconButton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import CodeIcon from '@mui/icons-material/Code';
import AppLayout from '@/components/AppLayout';
import TheoryBlockComponent from '@/components/TheoryBlock';
import { sampleTheoryBlocks } from '@/data/sampleTheory';
import { Technology } from '@/types';
import { useProgressStore } from '@/features/progress/useProgressStore';
import { ArchiveManager } from '@/utils/archiveManager';

export default function TheoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTech, setSelectedTech] = useState<Technology | 'all'>('all');
  const [favoriteBlocks, setFavoriteBlocks] = useState<string[]>([]);
  const [activeTheoryId, setActiveTheoryId] = useState<string | null>(null);
  const { currentProgram } = useProgressStore();
  
  // Get all unique technologies
  const technologies = Array.from(new Set(sampleTheoryBlocks.map(block => block.technology)));
  
  // Filter theory blocks based on search and tech filter
  const filteredTheory = sampleTheoryBlocks.filter(theory => {
    const matchesSearch = 
      searchTerm.trim() === '' || 
      theory.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      theory.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      theory.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesTech = 
      selectedTech === 'all' || 
      theory.technology === selectedTech;
    
    return matchesSearch && matchesTech;
  });
  
  // Get the active theory block
  const activeTheory = activeTheoryId 
    ? sampleTheoryBlocks.find(theory => theory.id === activeTheoryId) 
    : null;
  
  // Handle favorite toggle
  const handleFavoriteToggle = (id: string) => {
    setFavoriteBlocks(prev => 
      prev.includes(id) 
        ? prev.filter(blockId => blockId !== id) 
        : [...prev, id]
    );
  };
  
  // Handle saving example code
  const handleSaveExample = (exampleId: string, code: string) => {
    // In a real app, we would save this to the user's progress
    // For demo purposes, we'll just create a backup file
    if (currentProgram) {
      // Add the code to the current program (this is just for demonstration)
      const updatedProgram = {
        ...currentProgram,
        savedExamples: {
          ...(currentProgram.savedExamples || {}),
          [exampleId]: code
        }
      };
      
      // Save the updated program to a TypeScript file
      ArchiveManager.saveAsTypeScriptFile(updatedProgram)
        .then(() => {
          alert('Example saved successfully as a TypeScript file!');
        })
        .catch(error => {
          console.error('Error saving example:', error);
          alert('Failed to save example. See console for details.');
        });
    }
  };
  
  return (
    <AppLayout>
      <Box>
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Theory Library
          </Typography>
          
          <TextField
            fullWidth
            placeholder="Search theory content..."
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mb: 3 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          
          <Tabs
            value={selectedTech}
            onChange={(e, newValue) => setSelectedTech(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ mb: 3 }}
          >
            <Tab label="All" value="all" />
            {technologies.map((tech) => (
              <Tab key={tech} label={tech} value={tech} />
            ))}
          </Tabs>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="subtitle1">
              {filteredTheory.length} {filteredTheory.length === 1 ? 'topic' : 'topics'} found
            </Typography>
            
            {favoriteBlocks.length > 0 && (
              <Button 
                variant="outlined"
                startIcon={<FavoriteIcon />}
                onClick={() => setSelectedTech('all')}
                size="small"
              >
                Show Favorites ({favoriteBlocks.length})
              </Button>
            )}
          </Box>
        </Paper>
        
        {activeTheory ? (
          <Box>
            <Button 
              variant="outlined" 
              sx={{ mb: 2 }}
              onClick={() => setActiveTheoryId(null)}
            >
              Back to All Topics
            </Button>
            
            <TheoryBlockComponent
              theory={activeTheory}
              onSaveExample={handleSaveExample}
            />
          </Box>
        ) : (
          <Grid container spacing={3}>
            {filteredTheory.map((theory) => (
              <Grid item xs={12} sm={6} md={4} key={theory.id}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    backgroundColor: favoriteBlocks.includes(theory.id) ? 'rgba(255, 0, 0, 0.05)' : 'inherit'
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="h6" component="h3" sx={{ flexGrow: 1 }}>
                        {theory.title}
                      </Typography>
                      
                      <IconButton 
                        size="small" 
                        onClick={() => handleFavoriteToggle(theory.id)}
                      >
                        {favoriteBlocks.includes(theory.id) ? (
                          <FavoriteIcon color="error" />
                        ) : (
                          <FavoriteBorderIcon />
                        )}
                      </IconButton>
                    </Box>
                    
                    <Chip 
                      label={theory.technology} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                      sx={{ mb: 2 }}
                    />
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {theory.content.substring(0, 100)}...
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {theory.tags.map((tag) => (
                        <Chip 
                          key={tag} 
                          label={tag} 
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                      <CodeIcon fontSize="small" sx={{ mr: 0.5 }} />
                      <Typography variant="body2" color="text.secondary">
                        {theory.examples.length} {theory.examples.length === 1 ? 'example' : 'examples'}
                      </Typography>
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      onClick={() => setActiveTheoryId(theory.id)}
                      variant="contained"
                    >
                      View Content
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
            
            {filteredTheory.length === 0 && (
              <Grid item xs={12}>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body1" color="text.secondary">
                    No theory content found matching your filters.
                  </Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        )}
      </Box>
    </AppLayout>
  );
}
