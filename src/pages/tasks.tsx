import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  CardActions,
  Button,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  TextField,
  InputAdornment,
  Pagination
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CodeIcon from '@mui/icons-material/Code';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import AppLayout from '@/components/AppLayout';
import LeetEditor from '@/components/LeetEditor';
import { codeTasks } from '@/data/sampleTasks';
import { useProgressStore } from '@/features/progress/useProgressStore';
import { CodeTask, Difficulty } from '@/types';

export default function TasksPage() {
  const [tasks, setTasks] = useState(codeTasks);
  const [filteredTasks, setFilteredTasks] = useState(codeTasks);
  const [activeTask, setActiveTask] = useState<CodeTask | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | 'all'>('all');
  const [tagFilter, setTagFilter] = useState('all');
  const [bookmarkedTasks, setBookmarkedTasks] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const { addProgress } = useProgressStore();
  
  const tasksPerPage = 6;
  
  // Get all unique tags
  const tags = Array.from(new Set(tasks.flatMap(task => task.tags)));
  
  // Filter tasks when any filter changes
  useEffect(() => {
    let filtered = [...tasks];
    
    // Apply search
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Apply difficulty filter
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(task => task.difficulty === difficultyFilter);
    }
    
    // Apply tag filter
    if (tagFilter !== 'all') {
      filtered = filtered.filter(task => task.tags.includes(tagFilter));
    }
    
    setFilteredTasks(filtered);
    setPage(1); // Reset to first page when filters change
  }, [searchTerm, difficultyFilter, tagFilter, tasks]);
  
  // Get current page tasks
  const currentTasks = filteredTasks.slice(
    (page - 1) * tasksPerPage,
    page * tasksPerPage
  );
  
  // Handle filter changes
  const handleDifficultyChange = (event: SelectChangeEvent) => {
    setDifficultyFilter(event.target.value as Difficulty | 'all');
  };
  
  const handleTagChange = (event: SelectChangeEvent) => {
    setTagFilter(event.target.value);
  };
  
  // Handle pagination
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    window.scrollTo(0, 0);
  };
  
  // Handle bookmark toggle
  const handleBookmarkToggle = (id: string) => {
    setBookmarkedTasks(prev => 
      prev.includes(id) 
        ? prev.filter(taskId => taskId !== id) 
        : [...prev, id]
    );
  };
  
  // Handle task selection
  const handleTaskSelect = (task: CodeTask) => {
    setActiveTask(task);
  };
  
  // Handle task completion
  const handleTaskComplete = (taskId: string, code: string, success: boolean, timeSpent: number) => {
    // Add to progress
    addProgress({
      date: new Date().toISOString(),
      questionId: taskId, // Reusing questionId field for task ID
      isCorrect: success,
      attempts: 1,
      timeTaken: timeSpent,
      notes: success ? 'Task completed successfully' : 'Task attempted but not completed'
    });
  };
  
  // Get difficulty color
  const getDifficultyColor = (difficulty: Difficulty) => {
    switch (difficulty) {
      case 'easy':
        return 'success';
      case 'medium':
        return 'warning';
      case 'hard':
        return 'error';
      default:
        return 'primary';
    }
  };
  
  return (
    <AppLayout>
      <Box>
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Coding Tasks
          </Typography>
          
          <TextField
            fullWidth
            placeholder="Search tasks..."
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
          
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Difficulty</InputLabel>
                <Select
                  value={difficultyFilter}
                  label="Difficulty"
                  onChange={handleDifficultyChange}
                >
                  <MenuItem value="all">All Difficulties</MenuItem>
                  <MenuItem value="easy">Easy</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="hard">Hard</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Tag</InputLabel>
                <Select
                  value={tagFilter}
                  label="Tag"
                  onChange={handleTagChange}
                >
                  <MenuItem value="all">All Tags</MenuItem>
                  {tags.map(tag => (
                    <MenuItem key={tag} value={tag}>
                      {tag}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle1">
              {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'} found
            </Typography>
            
            {bookmarkedTasks.length > 0 && (
              <Button
                variant="outlined"
                startIcon={<BookmarkIcon />}
                onClick={() => setFilteredTasks(tasks.filter(t => bookmarkedTasks.includes(t.id)))}
                size="small"
              >
                Bookmarks ({bookmarkedTasks.length})
              </Button>
            )}
          </Box>
        </Paper>
        
        {activeTask ? (
          <Box>
            <Button 
              variant="outlined" 
              sx={{ mb: 2 }}
              onClick={() => setActiveTask(null)}
            >
              Back to Task List
            </Button>
            
            <LeetEditor
              task={activeTask}
              onComplete={handleTaskComplete}
            />
          </Box>
        ) : (
          <>
            <Grid container spacing={3}>
              {currentTasks.map(task => (
                <Grid item xs={12} md={6} key={task.id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="h6" component="h3" sx={{ flexGrow: 1 }}>
                          {task.title}
                        </Typography>
                        
                        <Button
                          size="small"
                          onClick={() => handleBookmarkToggle(task.id)}
                          sx={{ minWidth: 'auto', p: 0.5 }}
                        >
                          {bookmarkedTasks.includes(task.id) ? (
                            <BookmarkIcon color="primary" />
                          ) : (
                            <BookmarkBorderIcon />
                          )}
                        </Button>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', my: 2 }}>
                        <Chip 
                          label={task.difficulty} 
                          color={getDifficultyColor(task.difficulty)}
                          size="small"
                          sx={{ mr: 1 }}
                        />
                        <Chip 
                          icon={<AccessTimeIcon fontSize="small" />}
                          label={`${task.timeEstimate} min`}
                          variant="outlined"
                          size="small"
                        />
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {task.description.substring(0, 100)}...
                      </Typography>
                      
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {task.tags.slice(0, 3).map(tag => (
                          <Chip 
                            key={tag} 
                            label={tag} 
                            size="small" 
                            variant="outlined"
                          />
                        ))}
                        {task.tags.length > 3 && (
                          <Chip 
                            label={`+${task.tags.length - 3} more`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </CardContent>
                    <CardActions>
                      <Button 
                        size="small" 
                        variant="contained" 
                        startIcon={<CodeIcon />}
                        onClick={() => handleTaskSelect(task)}
                        fullWidth
                      >
                        Start Coding
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
              
              {currentTasks.length === 0 && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body1" color="text.secondary">
                      No tasks found matching your filters.
                    </Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>
            
            {filteredTasks.length > tasksPerPage && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination
                  count={Math.ceil(filteredTasks.length / tasksPerPage)}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                  size="large"
                />
              </Box>
            )}
          </>
        )}
      </Box>
    </AppLayout>
  );
}
