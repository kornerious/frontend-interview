import firebaseService from './firebaseService';

export interface EvaluationResult {
  questionId: string;
  score: number;
  feedback: string;
  strengths: string[];
  improvementAreas: string[];
  timestamp: number;
  category: string;
  topic: string;
}

export interface UserProgress {
  weakTopics: {[key: string]: number}; // topic name: average score
  strongTopics: {[key: string]: number}; // topic name: average score
  overallScore: number;
  questionsTaken: number;
  lastActivityTimestamp: number;
}

class EvaluationStorageService {
  private storageKey = 'evaluation-results';
  private progressKey = 'user-progress';
  
  async storeEvaluation(result: EvaluationResult): Promise<void> {
    try {
      // Get existing evaluations
      const existingResults = await this.getEvaluations();
      
      // Add the new result
      existingResults.push(result);
      
      // Store updated array in settings customData
      const settings = await firebaseService.getSettings() || {};
      await firebaseService.saveSettings({
        ...settings,
        customData: {
          ...(settings as any).customData || {},
          [this.storageKey]: existingResults
        }
      } as any);
      
      // Update user progress
      await this.updateProgress(result);

    } catch (error) {
      console.error('Error storing evaluation in Firebase:', error);
      throw error;
    }
  }
  
  async getEvaluations(): Promise<EvaluationResult[]> {
    try {
      const settings = await firebaseService.getSettings() || {};
      const results = (settings as any).customData?.[this.storageKey];
      return results || [];
    } catch (error) {
      console.error('Error getting evaluations from Firebase:', error);
      return [];
    }
  }
  
  async getUserProgress(): Promise<UserProgress> {
    try {
      const settings = await firebaseService.getSettings() || {};
      const progress = (settings as any).customData?.[this.progressKey];
      return progress || {
        weakTopics: {},
        strongTopics: {},
        overallScore: 0,
        questionsTaken: 0,
        lastActivityTimestamp: Date.now()
      };
    } catch (error) {
      console.error('Error getting user progress from Firebase:', error);
      return {
        weakTopics: {},
        strongTopics: {},
        overallScore: 0,
        questionsTaken: 0,
        lastActivityTimestamp: Date.now()
      };
    }
  }
  
  private async updateProgress(result: EvaluationResult): Promise<void> {
    try {
      const progress = await this.getUserProgress();
      const { category, topic, score } = result;
      
      // Update question count
      progress.questionsTaken += 1;
      
      // Update overall score (weighted average)
      progress.overallScore = (progress.overallScore * (progress.questionsTaken - 1) + score) / progress.questionsTaken;
      
      // Update topic scores
      const topicKey = `${category}:${topic}`;
      
      // Get existing evaluations for this topic
      const evaluations = (await this.getEvaluations())
        .filter(e => e.category === category && e.topic === topic);
        
      const topicAverage = evaluations.reduce((sum, e) => sum + e.score, 0) / evaluations.length;
      
      // Classify as weak or strong topic (threshold: 70)
      if (topicAverage < 70) {
        progress.weakTopics[topicKey] = topicAverage;
        // Remove from strong topics if it was there before
        if (progress.strongTopics[topicKey]) {
          delete progress.strongTopics[topicKey];
        }
      } else {
        progress.strongTopics[topicKey] = topicAverage;
        // Remove from weak topics if it was there before
        if (progress.weakTopics[topicKey]) {
          delete progress.weakTopics[topicKey];
        }
      }
      
      progress.lastActivityTimestamp = Date.now();
      
      // Save updated progress to Firebase
      const settings = await firebaseService.getSettings() || {};
      await firebaseService.saveSettings({
        ...settings,
        customData: {
          ...(settings as any).customData || {},
          [this.progressKey]: progress
        }
      } as any);
      
    } catch (error) {
      console.error('Error updating user progress:', error);
    }
  }
  
  async getRecommendedTopics(): Promise<string[]> {
    try {
      const progress = await this.getUserProgress();
      
      // Return weak topics first (for focused improvement)
      return Object.keys(progress.weakTopics).sort((a, b) => 
        progress.weakTopics[a] - progress.weakTopics[b]
      );
      
    } catch (error) {
      console.error('Error getting recommended topics:', error);
      return [];
    }
  }
}

export const evaluationStorageService = new EvaluationStorageService();
