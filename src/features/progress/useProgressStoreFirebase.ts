import { create } from 'zustand';
import { UserProgress, LearningProgram, Technology } from '@/types';
import firebaseService from '@/utils/firebaseService';
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
      firebaseService.saveProgram(program).catch(err => {
        console.error('Failed to save program to Firebase:', err);
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

      // Attempt to save progress to Firebase with built-in retry mechanism
      const saveOperation = async () => {
        try {
          await firebaseService.saveProgress(progress);
          
          // After saving, also update the userAnswers if this is a correct answer
          if (isComplete && progress.questionId) {
            // We need to also get the answer text from elsewhere
            const answers = state.userAnswers || {};
            if (answers[questionId]) {
              // Save user answers to Firebase
              firebaseService.saveUserAnswers({...answers});
            }
          }
        } catch (err) {
          console.error('Failed to save progress to Firebase:', err);
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
      .sort((a, b) => {
        const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return bTime - aTime; // Most recent first
      })[0];
    
    return questionProgress;
  },

  saveUserAnswer: (questionId, answer) => {
    set(state => {
      const newAnswers = { ...state.userAnswers, [questionId]: answer };
      
      // Save answers to Firebase
      firebaseService.saveUserAnswers({ [questionId]: answer }).catch(err => {
        console.error('Failed to save user answer to Firebase:', err);
      });
      
      return { userAnswers: newAnswers };
    });
  },

  getUserAnswer: (questionId) => {
    return get().userAnswers[questionId] || '';
  },

  saveAnalysis: (questionId, analysis) => {
    set(state => {
      const newAnalysis = { ...state.lastAnalysis, [questionId]: analysis };
      
      // Save analysis to Firebase
      firebaseService.saveAnalysis(newAnalysis).catch(err => {
        console.error('Failed to save analysis to Firebase:', err);
      });
      
      return { lastAnalysis: newAnalysis };
    });
  },

  getAnalysis: (questionId) => {
    return get().lastAnalysis[questionId];
  },

  toggleBookmark: (type, id) => {
    set(state => {
      // Create a copy of the bookmark arrays
      const bookmarked = {
        questions: [...state.bookmarked.questions],
        tasks: [...state.bookmarked.tasks],
        theory: [...state.bookmarked.theory]
      };
      
      // Check if this item is already bookmarked
      const index = bookmarked[type].indexOf(id);
      
      if (index > -1) {
        // Remove from bookmarks
        bookmarked[type].splice(index, 1);
      } else {
        // Add to bookmarks
        bookmarked[type].push(id);
      }
      
      // Save updated bookmarks to Firebase
      firebaseService.saveBookmarks(bookmarked).catch(err => {
        console.error('Failed to save bookmarks to Firebase:', err);
      });
      
      return { bookmarked };
    });
  },

  isBookmarked: (type, id) => {
    return get().bookmarked[type].includes(id);
  },

  updateDayCompletion: (day, completed) => {
    const currentProgram = get().currentProgram;
    if (!currentProgram) return;

    set(state => {
      const updatedProgram = { ...currentProgram };
      
      // Ensure days array exists
      if (!updatedProgram.days) {
        updatedProgram.days = [];
      }
      
      // Update the specified day
      if (updatedProgram.days[day]) {
        updatedProgram.days[day].completed = completed;
      } else {
        // Initialize day if it doesn't exist
        updatedProgram.days[day] = { completed, tasks: [] };
      }
      
      // Save to Firebase
      firebaseService.saveProgram(updatedProgram).catch(err => {
        console.error('Failed to update day completion in Firebase:', err);
      });
      
      return { currentProgram: updatedProgram };
    });
  },

  archiveCurrentProgram: () => {
    const currentProgram = get().currentProgram;
    if (!currentProgram) return;
    
    set(state => {
      // Mark program as archived
      const archivedProgram = { ...currentProgram, archived: true };
      
      // Add to archived programs list
      const newArchivedPrograms = [...state.archivedPrograms, archivedProgram];
      
      // Save archived program to Firebase
      firebaseService.saveProgram(archivedProgram).catch(err => {
        console.error('Failed to save archived program to Firebase:', err);
      });
      
      return { 
        currentProgram: null, 
        archivedPrograms: newArchivedPrograms 
      };
    });
  },

  loadProgram: async (programId) => {
    try {
      const program = await firebaseService.getProgram(programId);
      if (program) {
        set({ currentProgram: program });
      }
    } catch (err) {
      console.error('Failed to load program:', err);
    }
  },

  createProgram: async (topics, duration) => {
    try {
      // Generate unique program ID
      const programId = `program_${Date.now()}`;
      
      // Create new program structure
      const newProgram: LearningProgram = {
        id: programId,
        topics,
        duration,
        days: Array(duration).fill(null).map(() => ({ 
          completed: false,
          tasks: []
        })),
        created: new Date().toISOString(),
        archived: false
      };
      
      // Save to Firebase
      await firebaseService.saveProgram(newProgram);
      
      // Update store
      set({ currentProgram: newProgram });
      
      return newProgram;
    } catch (error) {
      console.error('Error creating program:', error);
      throw error;
    }
  },

  deleteArchivedProgram: (programId) => {
    set(state => {
      // Filter out the program to delete
      const newArchivedPrograms = state.archivedPrograms.filter(
        program => program.id !== programId
      );
      
      return { archivedPrograms: newArchivedPrograms };
    });
  },

  saveCurrentProgram: () => {
    const currentProgram = get().currentProgram;
    if (currentProgram) {
      firebaseService.saveProgram(currentProgram).catch(err => {
        console.error('Failed to save program to Firebase:', err);
      });
    }
  },
  
  switchProgram: async (programId) => {
    try {
      const program = await firebaseService.getProgram(programId);
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
      // Initialize firebaseService
      await firebaseService.initialize();
      
      // Load all programs from Firebase
      const programs = await firebaseService.getAllPrograms();
      
      if (programs && programs.length > 0) {
        // Find current (non-archived) program
        const current = programs.find(p => !p.archived);
        const archived = programs.filter(p => p.archived);

        // Set the programs in the store
        set({ 
          currentProgram: current || null, 
          archivedPrograms: archived || [] 
        });
      } else {
        console.warn('⚠️ No programs found in Firebase storage');
      }
      
      // Load all progress records
      const progressRecords = await firebaseService.getAllProgress();
      
      if (progressRecords && progressRecords.length > 0) {
        console.log(`Loading ${progressRecords.length} progress records to analyze...`);
        
        // Create a Set of completed question IDs to avoid duplicates
        const completedQuestionIdsSet = new Set<string>();
        
        // Process all progress records to find which questions have been correctly answered
        progressRecords.forEach(record => {
          // Check if this record indicates a correct answer
          if (record.isCorrect && record.questionId) {
            completedQuestionIdsSet.add(record.questionId);
          }
        });
        
        // Load user answers as a secondary source of truth
        const userAnswers = await firebaseService.getUserAnswers() || {};
        
        // If a question has an answer stored, consider it completed as well
        Object.keys(userAnswers).forEach(questionId => {
          if (questionId && !completedQuestionIdsSet.has(questionId)) {
            completedQuestionIdsSet.add(questionId);
          }
        });
        
        // Create array of completed question IDs
        const completedQuestionIds = Array.from(completedQuestionIdsSet);
        
        console.log(`FINAL: ${completedQuestionIds.length} completed questions`);
        
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
      const userAnswers = await firebaseService.getUserAnswers();
      if (userAnswers) {
        set({ userAnswers });
      }
      
      // Load analysis data
      const analysis = await firebaseService.getAnalysis();
      if (analysis) {
        set({ lastAnalysis: analysis });
      }
      
      // Load bookmarks
      const bookmarks = await firebaseService.getBookmarks();
      if (bookmarks) {
        set({ bookmarked: bookmarks });
      }
    } catch (error) {
      console.error('Error loading data from Firebase storage:', error);
    }
  }
}));
