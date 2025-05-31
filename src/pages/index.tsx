import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Card, 
  CardContent, 
  CardActions,
  Stepper,
  Step,
  StepLabel,
  TextField,
  Chip,
  Slider,
  Stack,
  Alert,
  Grid,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useRouter } from 'next/router';
import AppLayout from '@/components/AppLayout';
import ProgramSwitcher from '@/components/ProgramSwitcher';
import { Technology } from '@/types';
import { useProgressStore } from '@/features/progress/useProgressStoreFirebase';
import { useSettingsStore } from '@/features/progress/useSettingsStoreFirebase';
import { generateLearningProgram } from '@/features/learning/planner';
import { sampleTheoryBlocks } from '@/data/sampleTheory';
import { sampleQuestions } from '@/data/sampleQuestions';
import { codeTasks } from '@/data/sampleTasks';
import PersonalizedRecommendations from '@/components/PersonalizedRecommendations';

export default function Dashboard() {
  const { currentProgram, setCurrentProgram, archivedPrograms, loadProgram, saveCurrentProgram, createProgram } = useProgressStore();
  const { settings, setName, setTechnologies, setLearningDuration } = useSettingsStore();
  const router = useRouter();
  
  // Setup wizard state
  const [activeStep, setActiveStep] = useState(0);
  const [selectedTechnologies, setSelectedTechnologies] = useState<Technology[]>(settings.selectedTechnologies);
  const [learningDuration, setLocalDuration] = useState(settings.learningDuration);
  const [userName, setUserName] = useState(settings.name);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Handle technology selection
  const handleTechnologyToggle = (tech: Technology) => {
    setSelectedTechnologies(prev => 
      prev.includes(tech) 
        ? prev.filter(t => t !== tech) 
        : [...prev, tech]
    );
  };
  
  // Handle duration change
  const handleDurationChange = (event: Event, newValue: number | number[]) => {
    setLocalDuration(newValue as number);
  };
  
  // Handle next step
  const handleNext = async () => {
    if (activeStep === steps.length - 1) {
      // Final step - create program
      // Set loading state
      setLoading(true);
      
      try {
        // Create program and wait for it to be saved
        await createProgramAndSave();

        // Navigate to daily plan
        router.push('/daily');
      } catch (error) {
        setError('Failed to create program. Please try again.');
      } finally {
        setLoading(false);
      }
    } else {
      setActiveStep(prevStep => prevStep + 1);
    }
  };
  
  // Handle back
  const handleBack = () => {
    setActiveStep(prevStep => prevStep - 1);
  };
  
  // Create learning program
  const createProgramAndSave = async () => {
    // First update settings individually
    setName(userName);
    setTechnologies(selectedTechnologies);
    setLearningDuration(learningDuration); // Call the store's setter function with our local state
    
    // Generate the learning program with proper content - this ensures tasks and questions are included
    const newProgram = generateLearningProgram(
      selectedTechnologies,
      learningDuration,
      sampleTheoryBlocks,
      sampleQuestions,
      codeTasks
    );

    // Set as current program and save it
    setCurrentProgram(newProgram);
    saveCurrentProgram(); // Ensure it's saved using the normal mechanism too

    return newProgram;
  };
  
  // Handle loading an archived program
  const handleLoadProgram = (programId: string) => {
    loadProgram(programId);
    router.push('/daily');
  };
  
  // Setup wizard steps
  const steps = [
    'Select Technologies',
    'Set Duration',
    'Personal Info',
    'Create Plan'
  ];
  
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
  
  return (
    <AppLayout>
      {!currentProgram ? (
        <Box>
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Create Your Interview Prep Plan
            </Typography>
            
            <Stepper activeStep={activeStep} sx={{ my: 4 }} alternativeLabel>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
            
            {/* Step content */}
            <Box sx={{ mt: 4, minHeight: '300px' }}>
              {activeStep === 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Choose Technologies for Your Preparation
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Select the technologies you want to focus on during your interview preparation.
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                    {technologies.map((tech) => (
                      <Chip
                        key={tech}
                        label={tech}
                        color={selectedTechnologies?.includes?.(tech) ? 'primary' : 'default'}
                        onClick={() => handleTechnologyToggle(tech)}
                        sx={{ fontSize: '1rem', py: 2.5 }}
                      />
                    ))}
                  </Box>
                  
                  {selectedTechnologies?.length === 0 && (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                      Please select at least one technology
                    </Alert>
                  )}
                </Box>
              )}
              
              {activeStep === 1 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Choose Your Preparation Duration
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                    How many days do you want to spend preparing for your interview?
                  </Typography>
                  
                  <Box sx={{ px: 5, py: 3 }}>
                    <Slider
                      value={learningDuration}
                      min={7}
                      max={30}
                      step={1}
                      onChange={handleDurationChange}
                      marks={[
                        { value: 7, label: '7 days' },
                        { value: 14, label: '14 days' },
                        { value: 21, label: '21 days' },
                        { value: 30, label: '30 days' }
                      ]}
                      valueLabelDisplay="on"
                    />
                  </Box>
                  
                  <Typography variant="body1" align="center" sx={{ mt: 2 }}>
                    You selected <strong>{learningDuration} days</strong> of preparation
                  </Typography>
                </Box>
              )}
              
              {activeStep === 2 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Personal Information
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Let us know your name so we can personalize your experience.
                  </Typography>
                  
                  <TextField
                    fullWidth
                    label="Your Name"
                    variant="outlined"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    sx={{ mb: 3 }}
                  />
                </Box>
              )}
              
              {activeStep === 3 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Review Your Plan
                  </Typography>
                  
                  <Grid container spacing={2} sx={{ mt: 2 }}>
                    <Grid item xs={12} md={6} component="div">
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          Selected Technologies:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {selectedTechnologies.map((tech) => (
                            <Chip key={tech} label={tech} size="small" />
                          ))}
                        </Box>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={6} component="div">
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          Duration: {learningDuration} days
                        </Typography>
                        <Typography variant="body2">
                          You'll have a daily plan with theory, practice questions, and coding tasks.
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                  
                  <Alert severity="info" sx={{ mt: 3 }}>
                    Your plan will be tailored to your selections and will adapt based on your performance.
                  </Alert>
                </Box>
              )}
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button 
                onClick={handleBack}
                disabled={activeStep === 0}
              >
                Back
              </Button>
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={activeStep === 0 && selectedTechnologies.length === 0}
              >
                {activeStep === steps.length - 1 ? 'Create Plan' : 'Next'}
              </Button>
            </Box>
          </Paper>
          
          {archivedPrograms.length > 0 && (
            <Box>
              <Typography variant="h5" gutterBottom>
                Archived Programs
              </Typography>
              
              <Grid container spacing={3}>
                {archivedPrograms.map((program) => (
                  <Grid item xs={12} sm={6} md={4} key={program.id}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" component="div">
                          Program {program.dateStarted}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {program.durationDays} days plan
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                          {program.topics.map((tech) => (
                            <Chip key={tech} label={tech} size="small" variant="outlined" />
                          ))}
                        </Box>
                        <Typography variant="body2" sx={{ mt: 2 }}>
                          Progress: Day {program.currentDay} of {program.durationDays}
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <Button 
                          size="small" 
                          onClick={() => handleLoadProgram(program.id)}
                          variant="contained"
                        >
                          Resume
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Box>
      ) : (
        <Box>
          <Paper sx={{ p: 3, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>              
              <Box>
                <Typography variant="h4" component="h1" gutterBottom>
                  Welcome{settings.name ? `, ${settings.name}` : ''}!
                </Typography>
                
                <Typography variant="body1" paragraph>
                  Your interview preparation plan is ready. You're on day {currentProgram.currentDay} of {currentProgram.durationDays}.
                </Typography>
              </Box>
              
              <Box>
                <ProgramSwitcher onNewProgramClick={() => {
                  // Save current program before resetting
                  saveCurrentProgram();
                  // Reset the wizard
                  setActiveStep(0);
                  setSelectedTechnologies(settings.selectedTechnologies);
                  setLearningDuration(settings.learningDuration);
                  setUserName(settings.name);
                }} />
              </Box>
            </Box>
            
            <Box sx={{ mt: 3, display: 'flex', alignItems: 'center' }}>
              <Button 
                variant="contained" 
                size="large"
                onClick={() => router.push('/daily')}
              >
                Continue Your Daily Plan
              </Button>
              
              <Button 
                variant="outlined" 
                size="large"
                onClick={() => {
                  // Save current program
                  saveCurrentProgram();
                  // Reset current program to start a new one
                  setCurrentProgram(null);
                }}
                sx={{ ml: 2 }}
              >
                Start New Program
              </Button>
            </Box>
          </Paper>
          
          {/* Adaptive Learning Recommendations */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AutoAwesomeIcon sx={{ mr: 1 }} />
              Personalized Learning Path
            </Typography>
            <PersonalizedRecommendations 
              onSelectTopic={(topic, category) => {
                router.push(`/questions?topic=${topic}&category=${category}`);
              }}
            />
          </Box>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Progress
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {Math.round((currentProgram.currentDay / currentProgram.durationDays) * 100)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Day {currentProgram.currentDay} of {currentProgram.durationDays}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Technologies
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {currentProgram.topics.map((tech) => (
                      <Chip key={tech} label={tech} size="small" />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Quick Actions
                  </Typography>
                  <Stack spacing={1}>
                    <Button variant="outlined" onClick={() => router.push('/theory')}>
                      Browse Theory
                    </Button>
                    <Button variant="outlined" onClick={() => router.push('/questions')}>
                      Practice Questions
                    </Button>
                    <Button variant="outlined" onClick={() => router.push('/tasks')}>
                      Coding Tasks
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}
    </AppLayout>
  );
}
