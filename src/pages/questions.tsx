import React, { useState, useEffect } from 'react';
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
  const [questions, setQuestions] = useState(sampleQuestions);
  const [filteredQuestions, setFilteredQuestions] = useState(sampleQuestions);
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<QuestionType | 'all'>('all');
  const [topicFilter, setTopicFilter] = useState('all');
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const { addProgress } = useProgressStore();
  
  const questionsPerPage = 10;
  
  // Get all unique topics
  const topics = Array.from(new Set(questions.map(q => q.topic)));
  
  // Filter questions when any filter changes
  useEffect(() => {
    let filtered = [...questions];
    
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
    
    setFilteredQuestions(filtered);
    setPage(1); // Reset to first page when filters change
  }, [searchTerm, difficultyFilter, typeFilter, topicFilter, questions]);
  
  // Get current page questions
  const currentQuestions = filteredQuestions.slice(
    (page - 1) * questionsPerPage,
    page * questionsPerPage
  );
  
  // Find the next question after the active one
  const getNextQuestion = () => {
    if (!activeQuestion) return null;
    
    const currentIndex = currentQuestions.findIndex(q => q.id === activeQuestion.id);
    if (currentIndex === -1 || currentIndex >= currentQuestions.length - 1) {
      // If we're on the last question of the page, go to next page if available
      if (page < Math.ceil(filteredQuestions.length / questionsPerPage)) {
        setPage(page + 1);
        return filteredQuestions[(page * questionsPerPage)];
      }
      return null; // No next question available
    }
    
    // Return the next question in the current page
    return currentQuestions[currentIndex + 1];
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
  const handleQuestionAnswer = (
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
    
    // Add to progress with analytics data
    addProgress({
      date: new Date().toISOString(),
      questionId,
      isCorrect,
      attempts: 1,
      timeTaken: analytics?.timeTaken || 0,
      topic: analytics?.topic || question?.topic,
      difficulty: analytics?.difficulty || question?.level,
      problemAreas: analytics?.problemAreas || [],
    });
    
    console.log('Performance data saved:', {
      questionId,
      isCorrect,
      timeTaken: analytics?.timeTaken || 0,
      problemAreas: analytics?.problemAreas || []
    });
    
    // Auto-navigation based on correctness
    if (isCorrect) {
      // If answer is correct, navigate to the next question after a brief delay
      setTimeout(() => {
        const nextQuestion = getNextQuestion();
        if (nextQuestion) {
          setActiveQuestion(nextQuestion);
        } else {
          // If there's no next question, close the active question to show the list
          setActiveQuestion(null);
        }
      }, 1500); // Short delay to show the correct answer feedback
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
