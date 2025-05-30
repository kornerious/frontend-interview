import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Chip, CircularProgress, Alert } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { evaluationStorageService, UserProgress } from '../utils/evaluationStorageService';
import { useRouter } from 'next/router';

interface PersonalizedRecommendationsProps {
  onSelectTopic?: (topic: string, category: string) => void;
  displayAs?: 'full' | 'compact';
}

export default function PersonalizedRecommendations({
  onSelectTopic,
  displayAs = 'full'
}: PersonalizedRecommendationsProps) {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function loadUserProgress() {
      try {
        setLoading(true);
        const userProgress = await evaluationStorageService.getUserProgress();
        setProgress(userProgress);
      } catch (err) {
        console.error("Error loading user progress:", err);
        setError("Failed to load personalized recommendations");
      } finally {
        setLoading(false);
      }
    }
    
    loadUserProgress();
  }, []);

  const handleTopicSelect = (topicKey: string) => {
    const [category, topic] = topicKey.split(':');
    
    if (onSelectTopic) {
      onSelectTopic(topic, category);
    } else {
      // If no handler is provided, navigate to the topic
      router.push(`/practice/${category.toLowerCase()}/${topic.toLowerCase()}`);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!progress || progress.questionsTaken === 0) {
    return (
      <Box sx={{ p: 2, border: '1px dashed', borderColor: 'divider', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Complete some practice questions to receive personalized recommendations.
        </Typography>
      </Box>
    );
  }

  // Display weak topics as recommendations for focused improvement
  const weakTopics = Object.keys(progress.weakTopics);
  
  if (displayAs === 'compact') {
    return (
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
          <TrendingUpIcon fontSize="small" sx={{ mr: 0.5 }} />
          Recommended Focus Areas
        </Typography>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {weakTopics.length > 0 ? (
            weakTopics.slice(0, 3).map((topicKey) => {
              const [, topic] = topicKey.split(':');
              const score = Math.round(progress.weakTopics[topicKey]);
              
              return (
                <Chip 
                  key={topicKey}
                  label={`${topic} (${score}%)`}
                  onClick={() => handleTopicSelect(topicKey)}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              );
            })
          ) : (
            <Typography variant="body2" color="text.secondary">
              Great job! No specific areas need improvement.
            </Typography>
          )}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, border: '1px solid', borderColor: 'primary.light', borderRadius: 1, mb: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <TrendingUpIcon sx={{ mr: 1 }} />
        Your Personalized Learning Path
      </Typography>
      
      <Typography variant="body2" gutterBottom>
        Based on your previous {progress.questionsTaken} question{progress.questionsTaken !== 1 ? 's' : ''}, 
        here are the areas we recommend focusing on to improve your skills:
      </Typography>
      
      {weakTopics.length > 0 ? (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" color="warning.main" gutterBottom>
            Focus Areas:
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {weakTopics.map((topicKey) => {
              const [category, topic] = topicKey.split(':');
              const score = Math.round(progress.weakTopics[topicKey]);
              
              return (
                <Button 
                  key={topicKey}
                  variant="outlined"
                  color="warning"
                  size="small"
                  onClick={() => handleTopicSelect(topicKey)}
                  sx={{ mb: 1 }}
                >
                  {topic} ({score}%)
                </Button>
              );
            })}
          </Box>
        </Box>
      ) : (
        <Alert severity="success" sx={{ mt: 2 }}>
          Great job! Your evaluations show solid understanding across all topics.
        </Alert>
      )}
      
      <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Typography variant="body2" color="text.secondary">
          Overall progress: {Math.round(progress.overallScore)}% mastery
        </Typography>
      </Box>
    </Box>
  );
}
