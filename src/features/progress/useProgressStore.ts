import { create } from 'zustand';
import { UserProgress, LearningProgram, Technology } from '@/types';
import gistStorageService from '@/utils/gistStorageService';
import { useSettingsStore } from './useSettingsStore';

interface ProgressState {
  currentProgram: LearningProgram | null;
  archivedPrograms: LearningProgram[];
  progress: UserProgress[];
  completedQuestionIds: string[];
  completedTaskIds: string[];
  userAnswers: Record<string, string>; // Store user answers by question ID
  lastAnalysis: Record<string, any>; // Store OpenAI analysis by question ID
  bookmarked: {
    questions: string[];
    tasks: string[];
    theory: string[];
  };

  // Actions
  setCurrentProgram: (program: LearningProgram | null) => void;
  addProgress: (progress: UserProgress) => void;
  getProgressForQuestion: (questionId: string) => UserProgress | undefined;
  saveUserAnswer: (questionId: string, answer: string) => void;
  getUserAnswer: (questionId: string) => string;
  saveAnalysis: (questionId: string, analysis: any) => void;
  getAnalysis: (questionId: string) => any;
  toggleBookmark: (type: 'questions' | 'tasks' | 'theory', id: string) => void;
  isBookmarked: (type: 'questions' | 'tasks' | 'theory', id: string) => boolean;
  updateDayCompletion: (day: number, completed: boolean) => void;
  archiveCurrentProgram: () => void;
  loadProgram: (programId: string) => void;
  createProgram: (topics: Technology[], duration: number) => Promise<LearningProgram>;
  deleteArchivedProgram: (programId: string) => void;
  saveCurrentProgram: () => void;
  switchProgram: (programId: string) => void;
  getActivePrograms: () => LearningProgram[];
  _initializeFromDatabase: () => Promise<void>;
}

export const useProgressStore = create<ProgressState>()((set, get) => ({
  currentProgram: null,
  archivedPrograms: [],
  progress: [],
  completedQuestionIds: [],
  completedTaskIds: [],
  userAnswers: {},
  lastAnalysis: {},
  bookmarked: {
    questions: [],
    tasks: [],
    theory: []
  },

  setCurrentProgram: (program) => {
    set({ currentProgram: program });
    if (program) {
      gistStorageService.saveProgram(program).catch(err => {
        console.error('Failed to save program to Gist storage:', err);
      });
    }
  },

  addProgress: (progress) => {
    const isComplete = progress.isCorrect;
    const questionId = progress.questionId;
    
    set(state => {
      // Add the new progress item to the array
      const newProgress = [...state.progress, progress];
      
      // Create a new set of completed question IDs to avoid duplications
      let newCompletedQuestionIds = [...state.completedQuestionIds];
      
      // Only add to completed if it's correct and not already in the array
      if (isComplete && !newCompletedQuestionIds.includes(questionId)) {
        newCompletedQuestionIds.push(questionId);
      }

      // Attempt to save progress to Gist with retry mechanism
      const saveOperation = async () => {
        try {
          await gistStorageService.saveProgress(progress);
          // After saving, also update the userAnswers if this is a correct answer
          if (isComplete && progress.questionId) {
            // We need to also get the answer text from elsewhere
            const answers = state.userAnswers || {};
            if (answers[questionId]) {
              // Make sure this gets saved to Gist too
              gistStorageService.saveUserAnswers({...answers});
            }
          }
        } catch (err) {
          console.error('Failed to save progress to Gist storage:', err);
        }
      };
      
      // Initiate save operation
      saveOperation();
      
      // Return updated state
      return { 
        progress: newProgress, 
        completedQuestionIds: newCompletedQuestionIds
      };
    });
  },

  getProgressForQuestion: (questionId) => {
    const state = get();
    // Find the most recent progress entry for this question
    const questionProgress = state.progress
      .filter(p => p.questionId === questionId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      
    return questionProgress;
  },
  
  saveUserAnswer: (questionId, answer) => {
    set(state => {
      // Only save if saveAnswers setting is enabled
      const settings = useSettingsStore.getState().settings;
      if (settings.saveAnswers) {
        const newUserAnswers = { 
          ...state.userAnswers, 
          [questionId]: answer 
        };
        
        // Save to Gist storage
        gistStorageService.saveUserAnswers(newUserAnswers).catch(err => {
          console.error('Failed to save user answers to Gist storage:', err);
        });
        
        return { userAnswers: newUserAnswers };
      }
      return state;
    });
  },
  
  getUserAnswer: (questionId) => {
    return get().userAnswers[questionId] || '';
  },
  
  saveAnalysis: (questionId, analysis) => {
    set(state => {
      const newAnalysis = {
        ...state.lastAnalysis,
        [questionId]: analysis
      };
      
      // Save to Gist storage
      gistStorageService.saveAnalysis(newAnalysis).catch(err => {
        console.error('Failed to save analysis to Gist storage:', err);
      });
      
      return { lastAnalysis: newAnalysis };
    });
  },
  
  getAnalysis: (questionId) => {
    return get().lastAnalysis[questionId] || null;
  },
  
  toggleBookmark: (type, id) => {
    set(state => {
      const currentBookmarks = state.bookmarked[type];
      const isCurrentlyBookmarked = currentBookmarks.includes(id);
      
      let updatedBookmarks;
      if (isCurrentlyBookmarked) {
        updatedBookmarks = currentBookmarks.filter(bookmark => bookmark !== id);
      } else {
        updatedBookmarks = [...currentBookmarks, id];
      }
      
      const newBookmarked = {
        ...state.bookmarked,
        [type]: updatedBookmarks
      };
      
      // Save to Gist storage
      gistStorageService.saveBookmarks(newBookmarked).catch(err => {
        console.error('Failed to save bookmarks to Gist storage:', err);
      });
      
      return { bookmarked: newBookmarked };
    });
  },
  
  isBookmarked: (type, id) => {
    return get().bookmarked[type].includes(id);
  },

  updateDayCompletion: (day, completed) => {
    set(state => {
      if (!state.currentProgram) return state;
      
      const currentProgram = { ...state.currentProgram };
      const dayPlan = currentProgram.dailyPlans.find(plan => plan.day === day);
      
      if (dayPlan) {
        dayPlan.completed = completed;
        
        // Save updated program to database
        gistStorageService.saveProgram(currentProgram).catch(err => {
          console.error('Failed to save program to database:', err);
        });
        
        return { currentProgram };
      }
      
      return state;
    });
  },

  archiveCurrentProgram: () => {
    set(state => {
      if (!state.currentProgram) return state;
      
      const programToArchive = { ...state.currentProgram, archived: true };
      const newArchivedPrograms = [...state.archivedPrograms, programToArchive];
      
      // Archive in Gist storage by saving with archived flag
      gistStorageService.saveProgram(programToArchive).catch(err => {
        console.error('Failed to archive program in Gist storage:', err);
      });
      
      return { 
        currentProgram: null, 
        archivedPrograms: newArchivedPrograms 
      };
    });
  },
  
  loadProgram: async (programId) => {
    try {
      const program = await gistStorageService.getProgram(programId);
      if (program) {
        set({ currentProgram: program });
      }
    } catch (err) {
      console.error('Failed to load program from Gist storage:', err);
    }
  },

  createProgram: async (topics, duration) => {

    try {
      // Use the emergency save function to create and save the program
      // This ensures the program is saved directly to GitHub Gist with retries
      const { createAndSaveProgram } = await import('@/utils/emergencySave');
      const newProgram = await createAndSaveProgram(topics, duration);
      
      if (newProgram) {
        set({ currentProgram: newProgram });
        return newProgram;
      } else {
        console.error('❌ Failed to create and save program');
        // Create a local program as fallback
        const localProgram: LearningProgram = {
          id: `program_${Date.now()}`,
          dateStarted: new Date().toISOString(),
          topics,
          durationDays: duration,
          currentDay: 1,
          dailyPlans: Array.from({ length: duration }, (_, i) => ({
            day: i + 1,
            theoryBlockIds: [],
            questionIds: [],
            codeTaskId: '',
            completed: false
          })),
          progress: [],
          savedExamples: {}
        };
        
        set({ currentProgram: localProgram });
        return localProgram;
      }
    } catch (error) {
      console.error('❌ Critical error in createProgram:', error);
      // Fallback to local program creation
      const fallbackProgram: LearningProgram = {
        id: `program_${Date.now()}`,
        dateStarted: new Date().toISOString(),
        topics,
        durationDays: duration,
        currentDay: 1,
        dailyPlans: Array.from({ length: duration }, (_, i) => ({
          day: i + 1,
          theoryBlockIds: [],
          questionIds: [],
          codeTaskId: '',
          completed: false
        })),
        progress: [],
        savedExamples: {}
      };
      
      set({ currentProgram: fallbackProgram });
      return fallbackProgram;
    }
  },

  deleteArchivedProgram: (programId) => {
    set(state => {
      const updatedArchived = state.archivedPrograms.filter(prog => prog.id !== programId);
      
      // Find the program and mark it as deleted in Gist storage
      const programToDelete = state.archivedPrograms.find(prog => prog.id === programId);
      if (programToDelete) {
        const markedAsDeleted = { ...programToDelete, deleted: true };
        // Save the program with the deleted flag
        gistStorageService.saveProgram(markedAsDeleted).catch(err => {
          console.error('Failed to mark program as deleted in Gist storage:', err);
        });
      }
      
      return { archivedPrograms: updatedArchived };
    });
  },
  
  saveCurrentProgram: () => {
    const { currentProgram } = get();
    if (currentProgram) {
      gistStorageService.saveProgram(currentProgram).catch(err => {
        console.error('Failed to save program to Gist storage:', err);
      });
    }
  },
  
  switchProgram: async (programId) => {
    try {
      const program = await gistStorageService.getProgram(programId);
      if (program) {
        set({ currentProgram: program });
      }
    } catch (err) {
      console.error('Failed to switch program:', err);
    }
  },
  
  getActivePrograms: () => {
    return [get().currentProgram, ...get().archivedPrograms].filter(Boolean) as LearningProgram[];
  },
  
  _initializeFromDatabase: async () => {
    try {
      // Initialize gistStorageService if needed
      const settings = useSettingsStore.getState().settings;
      if (settings.githubGistToken) {
        await gistStorageService.initialize(settings.githubGistToken);
      }
      
      // Load all programs from Gist storage with improved logging
      const programs = await gistStorageService.getAllPrograms();
      
      if (programs && programs.length > 0) {
        // Log the IDs of available programs
        // Find current (non-archived) program
        const current = programs.find(p => !p.archived);
        const archived = programs.filter(p => p.archived);

        // Set the programs in the store
        set({ 
          currentProgram: current || null, 
          archivedPrograms: archived || [] 
        });

      } else {
        console.warn('⚠️ No programs found in Gist storage');
      }
      
      // Load all progress records with improved handling
      const progressRecords = await gistStorageService.getAllProgress();
      
      if (progressRecords && progressRecords.length > 0) {
        console.log(`Loading ${progressRecords.length} progress records to analyze...`);
        
        // Create a special Set of completed question IDs
        const completedQuestionIdsSet = new Set<string>();
        
        // Process all progress records to find which questions have been correctly answered
        progressRecords.forEach(record => {
          // Check if this record indicates a correct answer
          if (record.isCorrect && record.questionId) {
            completedQuestionIdsSet.add(record.questionId);
            console.log(`Added ${record.questionId} to completed questions`);
          }
        });
        
        // Load user answers as a secondary source of truth
        const userAnswers = await gistStorageService.getUserAnswers() || {};
        
        // If a question has an answer stored, consider it completed as well
        Object.keys(userAnswers).forEach(questionId => {
          if (questionId && !completedQuestionIdsSet.has(questionId)) {
            completedQuestionIdsSet.add(questionId);
            console.log(`Added ${questionId} to completed questions from user answers`);
          }
        });
        
        // Create array of completed question IDs
        const completedQuestionIds = Array.from(completedQuestionIdsSet);
        
        console.log(`FINAL: ${completedQuestionIds.length} completed questions:`, completedQuestionIds);
        
        // Store in state
        set({ 
          progress: progressRecords,
          completedQuestionIds: completedQuestionIds
        });
      } else {
        // Reset completed questions if no progress records
        set({
          progress: [],
          completedQuestionIds: []
        });
      }
      
      // Load user answers
      const userAnswers = await gistStorageService.getUserAnswers();
      if (userAnswers) {
        set({ userAnswers });
      }
      
      // Load analysis data
      const analysis = await gistStorageService.getAnalysis();
      if (analysis) {
        set({ lastAnalysis: analysis });
      }
      
      // Load bookmarks
      const bookmarks = await gistStorageService.getBookmarks();
      if (bookmarks) {
        set({ bookmarked: bookmarks });
      }
    } catch (error) {
      console.error('Error loading data from Gist storage:', error);
    }
  }
}));
