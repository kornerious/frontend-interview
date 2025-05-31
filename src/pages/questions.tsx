import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  Box, 
  Typography, 
  Paper, 
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Pagination,
  TextField,
  InputAdornment,
  Chip,
  Stack,
  Grid,
  Card,
  CardContent,
  CardActions,
  Divider
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LabelIcon from '@mui/icons-material/Label';
import QuizIcon from '@mui/icons-material/Quiz';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import AppLayout from '@/components/AppLayout';
import QuestionCard from '@/components/QuestionCard';
import { sampleQuestions } from '@/data/sampleQuestions';
import { useProgressStore } from '@/features/progress/useProgressStore';
import { Question, Difficulty, QuestionType } from '@/types';
import PersonalizedRecommendations from '@/components/PersonalizedRecommendations';

export default function QuestionsPage() {
  const router = useRouter();
  
  // Get completed question IDs and progress functions from the store
  const { addProgress, completedQuestionIds, _initializeFromDatabase } = useProgressStore();
  
  // Initialize data from Gist database on mount
  useEffect(() => {
    const loadData = async () => {
      await _initializeFromDatabase();
    };
    loadData();
  }, [_initializeFromDatabase]);
  
  // Filter out all completed questions from the initial state
  const filteredInitialQuestions = useMemo(() => {
    return sampleQuestions.filter(q => !completedQuestionIds.includes(q.id));
  }, [completedQuestionIds]);
  
  // We'll add an effect to update filtered questions after filterQuestions is defined
  
  const [questions, setQuestions] = useState(filteredInitialQuestions);
  const [filteredQuestions, setFilteredQuestions] = useState(filteredInitialQuestions);
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<QuestionType | 'all'>('all');
  const [topicFilter, setTopicFilter] = useState('all');
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  const questionsPerPage = 10;
  
  // Get all unique topics
  const topics = Array.from(new Set(questions.map(q => q.topic)));
  
  // Create a memoized function to filter questions
  const filterQuestions = () => {
    // Start with all questions
    let filtered = [...questions];
    const initialCount = filtered.length;
    
    // CRITICAL: Filter out completed questions first
    if (completedQuestionIds && completedQuestionIds.length > 0) {
      filtered = filtered.filter(question => {
        const isCompleted = completedQuestionIds.includes(question.id);
        return !isCompleted;
      });

      // Extra check for react_hooks_1
      if (completedQuestionIds.includes('react_hooks_1')) {
        const stillIncluded = filtered.some(q => q.id === 'react_hooks_1');
      }
    }
    
    // Apply search
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(q => 
        q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (q.tags && q.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
      );
    }
    
    // Apply difficulty filter
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(q => q.level === difficultyFilter);
    }
    
    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(q => q.type === typeFilter);
    }
    
    // Apply topic filter
    if (topicFilter !== 'all') {
      filtered = filtered.filter(q => q.topic === topicFilter);
    }
    
    return filtered;
  };
  
  // Apply filters whenever any filter criteria changes
  useEffect(() => {
    const newFilteredQuestions = filterQuestions();
    setFilteredQuestions(newFilteredQuestions);
    setPage(1); // Reset to first page when filters change
  }, [searchTerm, difficultyFilter, typeFilter, topicFilter, questions, completedQuestionIds]);
  
  // Force refresh whenever completedQuestionIds changes
  useEffect(() => {
    // When completed questions change, update both questions and filtered questions
    // First, update the base questions to exclude completed ones
    setQuestions(sampleQuestions.filter(q => !completedQuestionIds.includes(q.id)));
    
    // Then refresh the filtered questions with all current filters
    const refreshed = filterQuestions();
    setFilteredQuestions(refreshed);
    
    // If the active question has been completed, clear it
    if (activeQuestion && completedQuestionIds.includes(activeQuestion.id)) {
      setActiveQuestion(null);
    }
    
    // Reset to first page if the current page would be empty
    const currentPageStart = (page - 1) * questionsPerPage;
    if (currentPageStart >= refreshed.length && page > 1) {
      setPage(1);
    }
  }, [completedQuestionIds]);
  
  // Get current page questions
  const currentQuestions = filteredQuestions.slice(
    (page - 1) * questionsPerPage,
    page * questionsPerPage
  );
  
  // Find the next question after the active one
  const getNextQuestion = () => {
    if (!activeQuestion) return null;
    
    // Get currently completed questions
    const completed = [...completedQuestionIds];
    
    // Find all questions that haven't been completed yet
    const remainingQuestions = filteredQuestions.filter(q => 
      !completed.includes(q.id) && q.id !== activeQuestion.id
    );
    
    if (remainingQuestions.length === 0) {
      return null; // No unanswered questions left
    }
    
    const currentIndex = currentQuestions.findIndex(q => q.id === activeQuestion.id);
    
    // First check if there's a next question on the current page
    if (currentIndex !== -1 && currentIndex < currentQuestions.length - 1) {
      // Find the next uncompleted question on this page
      const remainingOnPage = currentQuestions
        .slice(currentIndex + 1)
        .filter(q => !completed.includes(q.id));
      
      if (remainingOnPage.length > 0) {
        return remainingOnPage[0];
      }
    }
    
    // If no next question on this page, check next pages
    if (page < Math.ceil(filteredQuestions.length / questionsPerPage)) {
      const nextPageIndex = page * questionsPerPage;
      if (nextPageIndex < filteredQuestions.length) {
        // Find the first uncompleted question on the next page
        const nextPageQuestions = filteredQuestions
          .slice(nextPageIndex)
          .filter(q => !completed.includes(q.id));
        
        if (nextPageQuestions.length > 0) {
          setPage(page + 1);
          return nextPageQuestions[0];
        }
      }
    }
    
    // If we've checked all pages in order but found nothing,
    // just return the first uncompleted question from anywhere
    return remainingQuestions[0];
  };
  
  // Handle filter changes
  const handleDifficultyChange = (event: SelectChangeEvent) => {
    setDifficultyFilter(event.target.value as Difficulty | 'all');
  };
  
  const handleTypeChange = (event: SelectChangeEvent) => {
    setTypeFilter(event.target.value as QuestionType | 'all');
  };
  
  const handleTopicChange = (event: SelectChangeEvent) => {
    setTopicFilter(event.target.value);
  };
  
  // Handle pagination
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    window.scrollTo(0, 0);
  };
  
  // Handle bookmark toggle
  const handleBookmarkToggle = (id: string) => {
    setBookmarkedQuestions(prev => 
      prev.includes(id) 
        ? prev.filter(qId => qId !== id) 
        : [...prev, id]
    );
  };
  
  // Handle question selection
  const handleQuestionSelect = (question: Question) => {
    setActiveQuestion(question);
  };
  
  // Handle question answer
  const handleQuestionAnswer = async (
    questionId: string, 
    answer: string, 
    isCorrect: boolean, 
    analytics?: {
      timeTaken: number;
      topic?: string;
      difficulty?: Difficulty;
      problemAreas?: string[];
    }
  ) => {
    // Find the question for additional metadata
    const question = questions.find(q => q.id === questionId);
    
    // Create progress data object
    const progressData = {
      date: new Date().toISOString(),
      questionId,
      isCorrect,
      attempts: 1,
      timeTaken: analytics?.timeTaken || 0,
      topic: analytics?.topic || question?.topic,
      difficulty: analytics?.difficulty || question?.level,
      problemAreas: analytics?.problemAreas || [],
    };
    
    // Add to progress - this will save to store and attempt gist save
    addProgress(progressData);
    
    // Auto-navigation based on correctness
    if (isCorrect) {
      // Make sure the completed state is updated in our local state
      const updatedCompletedIds = [...completedQuestionIds];
      if (!updatedCompletedIds.includes(questionId)) {
        updatedCompletedIds.push(questionId);
      }
      
      // Short delay to show the correct answer feedback
      setTimeout(() => {
        // Get next question, excluding the one we just completed
        const nextQuestions = filteredQuestions.filter(q => 
          !updatedCompletedIds.includes(q.id) && q.id !== questionId
        );
        
        if (nextQuestions.length > 0) {
          // Navigate to the next available question
          setActiveQuestion(nextQuestions[0]);
        } else {
          // If there are no more questions in the current filter view
          setActiveQuestion(null);
          
          // Check if all questions have been completed
          const remainingCount = questions.filter(q => 
            !updatedCompletedIds.includes(q.id)
          ).length;
          
          if (remainingCount === 0) {
            // All questions completed, redirect to tasks page
            router.push('/tasks');
          }
        }
      }, 500);
    }
    // If incorrect, the QuestionCard will automatically show the answer section
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
  
  // Get question type icon
  const getQuestionTypeLabel = (type: QuestionType) => {
    switch (type) {
      case 'mcq':
        return 'Multiple Choice';
      case 'code':
        return 'Coding Question';
      case 'open':
        return 'Open Question';
      case 'flashcard':
        return 'Flashcard';
      default:
        return type;
    }
  };
  
  return (
    <AppLayout>
      <Box>
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Practice Questions
          </Typography>
          
          <TextField
            fullWidth
            placeholder="Search questions..."
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
            <Grid item xs={12} sm={4}>
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
            
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Question Type</InputLabel>
                <Select
                  value={typeFilter}
                  label="Question Type"
                  onChange={handleTypeChange}
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="mcq">Multiple Choice</MenuItem>
                  <MenuItem value="code">Coding</MenuItem>
                  <MenuItem value="open">Open-ended</MenuItem>
                  <MenuItem value="flashcard">Flashcard</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Topic</InputLabel>
                <Select
                  value={topicFilter}
                  label="Topic"
                  onChange={handleTopicChange}
                >
                  <MenuItem value="all">All Topics</MenuItem>
                  {topics.map(topic => (
                    <MenuItem key={topic} value={topic}>
                      {topic}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle1">
              {filteredQuestions.length} {filteredQuestions.length === 1 ? 'question' : 'questions'} found
            </Typography>
            
            {bookmarkedQuestions.length > 0 && (
              <Button
                variant="outlined"
                startIcon={<BookmarkIcon />}
                onClick={() => setFilteredQuestions(questions.filter(q => bookmarkedQuestions.includes(q.id)))}
                size="small"
              >
                Bookmarks ({bookmarkedQuestions.length})
              </Button>
            )}
          </Box>
        </Paper>
        
        {/* Personalized Recommendations */}
        <Box sx={{ mb: 3 }}>
          <PersonalizedRecommendations 
            onSelectTopic={(topic, category) => {
              setTopicFilter(topic);
              setDifficultyFilter(category as Difficulty || 'all');
            }}
          />
        </Box>
        
        {activeQuestion ? (
          <Box>
            <Button 
              variant="outlined" 
              sx={{ mb: 2 }}
              onClick={() => setActiveQuestion(null)}
            >
              Back to Question List
            </Button>
            
            <QuestionCard
              question={activeQuestion}
              onAnswer={handleQuestionAnswer}
            />
          </Box>
        ) : (
          <>
            <Grid container spacing={3}>
              {currentQuestions.map(question => (
                <Grid item xs={12} sm={6} key={question.id}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Chip 
                          label={question.topic} 
                          color="primary" 
                          size="small"
                        />
                        <Box>
                          <Chip 
                            label={question.level} 
                            color={getDifficultyColor(question.level)}
                            size="small"
                            sx={{ mr: 1 }}
                          />
                          <Chip 
                            label={getQuestionTypeLabel(question.type)} 
                            variant="outlined"
                            size="small"
                          />
                        </Box>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="h6" component="h3" sx={{ flexGrow: 1 }}>
                          {question.question.length > 100 
                            ? `${question.question.substring(0, 100)}...` 
                            : question.question}
                        </Typography>
                        
                        <Button
                          size="small"
                          onClick={() => handleBookmarkToggle(question.id)}
                          sx={{ minWidth: 'auto', p: 0.5 }}
                        >
                          {bookmarkedQuestions.includes(question.id) ? (
                            <BookmarkIcon color="primary" />
                          ) : (
                            <BookmarkBorderIcon />
                          )}
                        </Button>
                      </Box>
                      
                      {question.tags && question.tags.length > 0 && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 2 }}>
                          {question.tags.slice(0, 3).map(tag => (
                            <Chip 
                              key={tag} 
                              label={tag} 
                              size="small" 
                              variant="outlined"
                              icon={<LabelIcon fontSize="small" />}
                            />
                          ))}
                          {question.tags.length > 3 && (
                            <Chip 
                              label={`+${question.tags.length - 3} more`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      )}
                    </CardContent>
                    <CardActions>
                      <Button 
                        size="small" 
                        variant="contained" 
                        startIcon={<QuizIcon />}
                        onClick={() => handleQuestionSelect(question)}
                        fullWidth
                      >
                        Practice Question
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
              
              {currentQuestions.length === 0 && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body1" color="text.secondary">
                      No questions found matching your filters.
                    </Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>
            
            {filteredQuestions.length > questionsPerPage && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination
                  count={Math.ceil(filteredQuestions.length / questionsPerPage)}
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
