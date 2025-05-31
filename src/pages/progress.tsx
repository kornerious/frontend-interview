import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  Tabs,
  Tab,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Alert
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import AppLayout from '@/components/AppLayout';
import { useProgressStore } from '@/features/progress/useProgressStoreFirebase';
import { useSettingsStore } from '@/features/progress/useSettingsStore';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ProgressPage() {
  const [tabValue, setTabValue] = useState(0);
  const { currentProgram } = useProgressStore();
  const { saveToFile } = useSettingsStore();
  const [exportSuccess, setExportSuccess] = useState(false);
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Handle program export
  const handleExport = () => {
    if (currentProgram) {
      // Export the program using the settings store
      const programDate = new Date(currentProgram.dateStarted).toISOString().split('T')[0];
      const filename = `program_${programDate}_${currentProgram.id}.json`;
      saveToFile(filename)
        .then(() => {
          // Show success message
          setExportSuccess(true);
          
          // Hide success message after 3 seconds
          setTimeout(() => {
            setExportSuccess(false);
          }, 3000);
        });
    }
  };
  
  // Calculate progress statistics
  const calculateStats = () => {
    if (!currentProgram) return {
      totalQuestions: 0,
      answeredQuestions: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      completedDays: 0,
      correctRate: 0
    };
    
    const progress = currentProgram.progress;
    const totalQuestions = progress.length;
    const answeredQuestions = progress.length;
    const correctAnswers = progress.filter(p => p.isCorrect).length;
    const incorrectAnswers = progress.filter(p => !p.isCorrect).length;
    const completedDays = currentProgram.dailyPlans.filter(p => p.completed).length;
    const correctRate = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    
    return {
      totalQuestions,
      answeredQuestions,
      correctAnswers,
      incorrectAnswers,
      completedDays,
      correctRate
    };
  };
  
  const stats = calculateStats();
  
  // Group progress by date
  const progressByDate = currentProgram ? 
    currentProgram.progress.reduce<Record<string, typeof currentProgram.progress>>((acc, item) => {
      const date = new Date(item.date).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(item);
      return acc;
    }, {}) : {};
  
  // Get progress dates sorted by most recent
  const progressDates = Object.keys(progressByDate).sort((a, b) => {
    return new Date(b).getTime() - new Date(a).getTime();
  });
  
  if (!currentProgram) {
    return (
      <AppLayout>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Progress Tracking
          </Typography>
          <Alert severity="info">
            No active program found. Start a new program from the dashboard to track your progress.
          </Alert>
        </Paper>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout>
      <Box>
        <Paper sx={{ p: 3, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1">
              Progress Tracking
            </Typography>
            
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
            >
              Export Progress
            </Button>
          </Box>
          
          {exportSuccess && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Program exported successfully!
            </Alert>
          )}
          
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Complete Days
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {stats.completedDays} / {currentProgram.durationDays}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={(stats.completedDays / currentProgram.durationDays) * 100} 
                    sx={{ mt: 1 }} 
                  />
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Questions Answered
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {stats.answeredQuestions}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                      <CheckCircleIcon color="success" fontSize="small" sx={{ mr: 0.5 }} />
                      <Typography variant="body2">{stats.correctAnswers} Correct</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <ErrorIcon color="error" fontSize="small" sx={{ mr: 0.5 }} />
                      <Typography variant="body2">{stats.incorrectAnswers} Incorrect</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Success Rate
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {stats.correctRate.toFixed(1)}%
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={stats.correctRate} 
                    color={stats.correctRate > 70 ? "success" : "warning"} 
                    sx={{ mt: 1 }} 
                  />
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Technologies
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {currentProgram.topics.map(tech => (
                      <Chip key={tech} label={tech} size="small" />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="progress tabs">
              <Tab label="Daily Activity" />
              <Tab label="All Questions" />
            </Tabs>
          </Box>
          
          <TabPanel value={tabValue} index={0}>
            {progressDates.length > 0 ? (
              progressDates.map(date => (
                <Box key={date} sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    {date}
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Question/Task</TableCell>
                          <TableCell align="center">Result</TableCell>
                          <TableCell align="right">Time Spent</TableCell>
                          <TableCell align="right">Attempts</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {progressByDate[date].map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.questionId}</TableCell>
                            <TableCell align="center">
                              {item.isCorrect ? (
                                <Chip label="Correct" size="small" color="success" />
                              ) : (
                                <Chip label="Incorrect" size="small" color="error" />
                              )}
                            </TableCell>
                            <TableCell align="right">
                              {item.timeTaken > 0 
                                ? `${Math.floor(item.timeTaken / 60)}:${(item.timeTaken % 60).toString().padStart(2, '0')}` 
                                : 'N/A'}
                            </TableCell>
                            <TableCell align="right">{item.attempts}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              ))
            ) : (
              <Typography variant="body1" color="text.secondary" sx={{ my: 3, textAlign: 'center' }}>
                No activity recorded yet. Complete some questions or tasks to see your progress.
              </Typography>
            )}
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Question/Task</TableCell>
                    <TableCell align="center">Result</TableCell>
                    <TableCell align="right">Time Spent</TableCell>
                    <TableCell align="right">Attempts</TableCell>
                    <TableCell>Notes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {currentProgram.progress.length > 0 ? (
                    currentProgram.progress
                      .slice()
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                          <TableCell>{item.questionId}</TableCell>
                          <TableCell align="center">
                            {item.isCorrect ? (
                              <Chip label="Correct" size="small" color="success" />
                            ) : (
                              <Chip label="Incorrect" size="small" color="error" />
                            )}
                          </TableCell>
                          <TableCell align="right">
                            {item.timeTaken > 0 
                              ? `${Math.floor(item.timeTaken / 60)}:${(item.timeTaken % 60).toString().padStart(2, '0')}` 
                              : 'N/A'}
                          </TableCell>
                          <TableCell align="right">{item.attempts}</TableCell>
                          <TableCell>{item.notes || 'N/A'}</TableCell>
                        </TableRow>
                      ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No progress data available yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>
        </Paper>
      </Box>
    </AppLayout>
  );
}
