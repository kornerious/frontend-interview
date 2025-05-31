import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  arrayUnion, 
  runTransaction,
  Timestamp,
  serverTimestamp,
  DocumentReference,
  Firestore
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, User, Auth } from 'firebase/auth';
import { firebaseConfig } from './firebaseConfig';
import { LearningProgram, UserProgress } from '@/types';

// Debug Firebase config
console.log('Firebase Config:', {
  apiKey: firebaseConfig.apiKey ? '✓ Present' : '✗ Missing',
  authDomain: firebaseConfig.authDomain ? '✓ Present' : '✗ Missing',
  projectId: firebaseConfig.projectId ? '✓ Present' : '✗ Missing',
  storageBucket: firebaseConfig.storageBucket ? '✓ Present' : '✗ Missing',
  messagingSenderId: firebaseConfig.messagingSenderId ? '✓ Present' : '✗ Missing',
  appId: firebaseConfig.appId ? '✓ Present' : '✗ Missing',
});

// Initialize Firebase - safely handling both client and server environments
let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

// Check if Firebase is already initialized to avoid duplicate app initialization
if (typeof window !== 'undefined') { // Only in browser environment
  try {
    // Check if Firebase app is already initialized
    if (getApps().length === 0) {
      // No Firebase app initialized yet
      console.log('Initializing new Firebase app...');
      app = initializeApp(firebaseConfig);
    } else {
      // Firebase app already initialized
      console.log('Using existing Firebase app...');
      app = getApp();
    }
    
    // Initialize Firestore and Auth
    db = getFirestore(app);
    auth = getAuth(app);
    
    console.log('Firebase services initialized successfully');
  } catch (error) {
    console.error('Error during Firebase initialization:', error);
    // Don't throw error, continue with null instances
    // This prevents the app from crashing if Firebase fails to initialize
  }
} else {
  // Server-side rendering
  console.log('Server environment detected - Firebase will initialize on client only');
}

// User auth state
let currentUser: User | null = null;

/**
 * Firebase Storage Service
 * Replaces the GitHub Gist storage mechanism with Firebase Firestore
 * Implements solutions for previous race conditions by using transactions and atomic operations
 */
class FirebaseStorageService {
  private isInitialized: boolean = false;
  private userId: string | null = null;
  private readonly MAX_RETRIES = 3; // Maximum number of retries for operations
  private readonly RETRY_DELAY_MS = 1000; // Base delay between retries in ms

  /**
   * Initialize Firebase service with user authentication
   * This method needs to be called before any other methods
   */
  async initialize(userIdentifier?: string): Promise<boolean> {
    console.log('Starting Firebase service initialization...');
    
    // Check if Firebase services are available (they should be initialized in browser environment)
    if (typeof window === 'undefined' || !app || !db || !auth) {
      console.warn('Firebase is not available or not initialized yet');
      // In server-side rendering, we'll consider this "initialized" but operations will be no-ops
      // This prevents errors during SSR
      if (typeof window === 'undefined') {
        console.log('Server environment: marking Firebase as virtually initialized');
        this.isInitialized = true; // Mark as initialized to prevent further init attempts on server
        return true;
      }
      return false;
    }
    
    try {
      // Return early if already initialized
      if (this.isInitialized) {
        console.log('Firebase service already initialized');
        return true;
      }

      // Set up auth state listener with timeout to prevent hanging
      return new Promise<boolean>((resolve) => {
        // Add timeout to prevent hanging if auth state doesn't change
        const timeoutId = setTimeout(() => {
          console.warn('Auth state listener timed out');
          resolve(false);
        }, 10000); // 10 second timeout
        
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          // Clear the timeout since we got a response
          clearTimeout(timeoutId);
          // Unsubscribe immediately to prevent memory leaks
          unsubscribe();
          
          if (user) {
            // User is already signed in
            console.log('User already signed in:', user.uid);
            currentUser = user;
            this.userId = user.uid;
            this.isInitialized = true;
            resolve(true);
          } else {
            // No user signed in, create anonymous account
            try {
              console.log('Creating anonymous user...');
              const userCredential = await signInAnonymously(auth);
              currentUser = userCredential.user;
              this.userId = userCredential.user.uid;
              this.isInitialized = true;
              
              // If a userIdentifier is provided (like a previous Gist ID), link it to the user
              if (userIdentifier) {
                await this.setUserIdentifier(userIdentifier);
              }
              
              console.log('Anonymous user created successfully:', this.userId);
              resolve(true);
            } catch (error) {
              console.error('Failed to sign in anonymously:', error);
              resolve(false);
            }
          }
        });
      });
    } catch (error) {
      console.error('Firebase initialization error:', error);
      return false;
    }
  }

  /**
   * Link a custom identifier to the current user
   * This helps in migrating from GitHub Gists
   */
  private async setUserIdentifier(identifier: string): Promise<void> {
    if (!this.userId) throw new Error('Not initialized');
    
    await setDoc(doc(db, 'userMappings', identifier), {
      userId: this.userId,
      createdAt: serverTimestamp()
    }, { merge: true });
  }

  /**
   * Generic method to perform an operation with retry logic
   * @param operation Function that performs the database operation
   * @param retries Number of retries left
   */
  private async withRetry<T>(operation: () => Promise<T>, retries = this.MAX_RETRIES): Promise<T> {
    try {
      return await operation();
    } catch (error: any) {
      if (retries > 0) {
        // Calculate exponential backoff delay
        const delay = this.RETRY_DELAY_MS * Math.pow(2, this.MAX_RETRIES - retries);
        console.warn(`Operation failed, retrying in ${delay}ms. Retries left: ${retries}`, error);
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Retry with one fewer retry remaining
        return this.withRetry(operation, retries - 1);
      } else {
        console.error('Operation failed after multiple retries:', error);
        throw error;
      }
    }
  }

  /**
   * Get the user document reference
   */
  private getUserDocRef() {
    if (!this.userId) throw new Error('Not initialized');
    return doc(db, 'users', this.userId);
  }

  /**
   * Ensure the user is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  /**
   * Get all learning programs for the user
   */
  async getAllPrograms(): Promise<LearningProgram[]> {
    await this.ensureInitialized();
    
    return this.withRetry(async () => {
      const programsCollection = collection(db, 'users', this.userId!, 'programs');
      const programsSnapshot = await getDocs(programsCollection);
      
      const programs: LearningProgram[] = [];
      programsSnapshot.forEach(doc => {
        programs.push({ id: doc.id, ...doc.data() } as LearningProgram);
      });
      
      return programs;
    });
  }

  /**
   * Get a specific program by ID
   */
  async getProgram(programId: string): Promise<LearningProgram | undefined> {
    await this.ensureInitialized();
    
    return this.withRetry(async () => {
      const programDoc = await getDoc(doc(db, 'users', this.userId!, 'programs', programId));
      if (programDoc.exists()) {
        return { id: programDoc.id, ...programDoc.data() } as LearningProgram;
      }
      return undefined;
    });
  }

  /**
   * Save a learning program
   * Uses transactions to prevent race conditions
   */
  async saveProgram(program: LearningProgram): Promise<boolean> {
    await this.ensureInitialized();
    
    return this.withRetry(async () => {
      const programRef = doc(db, 'users', this.userId!, 'programs', program.id);
      
      // Use transaction to ensure atomic update
      await runTransaction(db, async (transaction) => {
        const programDoc = await transaction.get(programRef);
        
        // Prepare data for saving (remove undefined values)
        const programData = { ...program };
        Object.keys(programData).forEach(key => {
          if (programData[key as keyof LearningProgram] === undefined) {
            delete programData[key as keyof LearningProgram];
          }
        });
        
        if (!programDoc.exists()) {
          // New program
          transaction.set(programRef, {
            ...programData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        } else {
          // Update existing program
          transaction.update(programRef, {
            ...programData,
            updatedAt: serverTimestamp()
          });
        }
      });
      
      return true;
    });
  }

  /**
   * Save a progress record
   */
  async saveProgress(progressItem: UserProgress): Promise<boolean> {
    await this.ensureInitialized();
    
    return this.withRetry(async () => {
      // Generate a unique ID for the progress item if one doesn't exist
      const progressId = progressItem.id || `progress_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const progressWithId = { ...progressItem, id: progressId };
      
      // Add timestamp
      const progressData = {
        ...progressWithId,
        timestamp: Timestamp.now()
      };
      
      // Save to Firestore
      await setDoc(
        doc(db, 'users', this.userId!, 'progress', progressId), 
        progressData
      );
      
      return true;
    });
  }

  /**
   * Get all progress records for the user
   */
  async getAllProgress(): Promise<UserProgress[]> {
    await this.ensureInitialized();
    
    return this.withRetry(async () => {
      const progressCollection = collection(db, 'users', this.userId!, 'progress');
      const progressSnapshot = await getDocs(progressCollection);
      
      const progressItems: UserProgress[] = [];
      progressSnapshot.forEach(doc => {
        progressItems.push({ id: doc.id, ...doc.data() } as UserProgress);
      });
      
      return progressItems;
    });
  }

  /**
   * Save user answers (with special handling to prevent data loss)
   */
  async saveUserAnswers(answers: Record<string, string>): Promise<boolean> {
    await this.ensureInitialized();
    
    return this.withRetry(async () => {
      const userDocRef = this.getUserDocRef();
      
      // Use transaction to safely update user answers
      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userDocRef);
        
        if (!userDoc.exists()) {
          // New user document
          transaction.set(userDocRef, { 
            userAnswers: answers,
            updatedAt: serverTimestamp()
          });
        } else {
          // Get existing answers
          const existingData = userDoc.data();
          const existingAnswers = existingData?.userAnswers || {};
          
          // Merge answers (preserve existing answers if they're not being updated)
          const mergedAnswers = { ...existingAnswers, ...answers };
          
          transaction.update(userDocRef, { 
            userAnswers: mergedAnswers,
            updatedAt: serverTimestamp()
          });
        }
      });
      
      return true;
    });
  }

  /**
   * Get user answers
   */
  async getUserAnswers(): Promise<Record<string, string>> {
    await this.ensureInitialized();
    
    return this.withRetry(async () => {
      const userDoc = await getDoc(this.getUserDocRef());
      if (userDoc.exists()) {
        return userDoc.data()?.userAnswers || {};
      }
      return {};
    });
  }

  /**
   * Save analysis data
   */
  async saveAnalysis(analysis: Record<string, any>): Promise<boolean> {
    await this.ensureInitialized();
    
    return this.withRetry(async () => {
      await updateDoc(this.getUserDocRef(), { 
        lastAnalysis: analysis,
        updatedAt: serverTimestamp()
      });
      return true;
    });
  }

  /**
   * Get analysis data
   */
  async getAnalysis(): Promise<Record<string, any>> {
    await this.ensureInitialized();
    
    return this.withRetry(async () => {
      const userDoc = await getDoc(this.getUserDocRef());
      if (userDoc.exists()) {
        return userDoc.data()?.lastAnalysis || {};
      }
      return {};
    });
  }

  /**
   * Save bookmarks
   */
  async saveBookmarks(bookmarks: { questions: string[], tasks: string[], theory: string[] }): Promise<boolean> {
    await this.ensureInitialized();
    
    return this.withRetry(async () => {
      await updateDoc(this.getUserDocRef(), { 
        bookmarked: bookmarks,
        updatedAt: serverTimestamp()
      });
      return true;
    });
  }

  /**
   * Get bookmarks
   */
  async getBookmarks(): Promise<{ questions: string[], tasks: string[], theory: string[] }> {
    await this.ensureInitialized();
    
    return this.withRetry(async () => {
      const userDoc = await getDoc(this.getUserDocRef());
      if (userDoc.exists()) {
        return userDoc.data()?.bookmarked || { questions: [], tasks: [], theory: [] };
      }
      return { questions: [], tasks: [], theory: [] };
    });
  }

  /**
   * Save conversation history
   */
  async saveConversationHistory(history: any[], sessionId = 'default-session'): Promise<boolean> {
    await this.ensureInitialized();
    
    return this.withRetry(async () => {
      const conversationRef = doc(db, 'users', this.userId!, 'conversations', sessionId);
      
      await setDoc(conversationRef, { 
        history,
        updatedAt: serverTimestamp()
      });
      
      return true;
    });
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(sessionId = 'default-session'): Promise<any[]> {
    await this.ensureInitialized();
    
    return this.withRetry(async () => {
      const conversationRef = doc(db, 'users', this.userId!, 'conversations', sessionId);
      const conversationDoc = await getDoc(conversationRef);
      
      if (conversationDoc.exists()) {
        return conversationDoc.data()?.history || [];
      }
      
      return [];
    });
  }

  /**
   * Save code examples
   */
  async saveCodeExamples(examples: Record<string, string>, contextId = 'global'): Promise<boolean> {
    return this.withRetry(async () => {
      await this.ensureInitialized();
      
      const codeExamplesRef = doc(db, 'users', this.userId!, 'codeExamples', contextId);
      
      await setDoc(codeExamplesRef, {
        examples,
        updatedAt: serverTimestamp()
      });
      
      return true;
    });
  }

  /**
   * Get code examples
   */
  async getCodeExamples(contextId = 'global'): Promise<Record<string, string>> {
    return this.withRetry(async () => {
      await this.ensureInitialized();
      
      const codeExamplesRef = doc(db, 'users', this.userId!, 'codeExamples', contextId);
      const codeExamplesDoc = await getDoc(codeExamplesRef);
      
      if (codeExamplesDoc.exists()) {
        return codeExamplesDoc.data()?.examples || {};
      }
      
      return {};
    });
  }
  
  /**
   * Save user settings
   */
  async saveSettings(settings: any): Promise<boolean> {
    return this.withRetry(async () => {
      await this.ensureInitialized();
      
      console.log('Saving settings to Firebase:', settings);
      
      // Store settings in the user document
      const userDocRef = this.getUserDocRef();
      
      // Make a deep copy of the settings to avoid reference issues
      const sanitizedSettings = JSON.parse(JSON.stringify(settings));
      
      // Don't store API keys in raw form - consider implementing encryption
      // For now, we'll preserve them if they exist but not overwrite with empty strings
      const sensitiveFields = ['openAIApiKey', 'claudeApiKey', 'geminiApiKey', 'githubGistToken'];
      
      // First get existing settings
      const existingDoc = await getDoc(userDocRef);
      const existingSettings = existingDoc.exists() ? existingDoc.data()?.settings : {};
      
      // Merge settings carefully to preserve existing values
      for (const field of sensitiveFields) {
        // If the field is empty, but exists in existing settings, use the existing value
        if (!sanitizedSettings[field] && existingSettings && existingSettings[field]) {
          sanitizedSettings[field] = existingSettings[field];
        }
      }
      
      // Ensure all custom data is preserved
      if (settings.customData) {
        sanitizedSettings.customData = settings.customData;
      }
      
      if (settings.testData) {
        sanitizedSettings.testData = settings.testData;
      }
      
      // Update the document with the settings
      await setDoc(userDocRef, {
        settings: sanitizedSettings,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      console.log('Settings successfully saved to Firebase');
      return true;
    });
  }
  
  /**
   * Get user settings
   */
  async getSettings(): Promise<any> {
    return this.withRetry(async () => {
      await this.ensureInitialized();
      
      const userDocRef = this.getUserDocRef();
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists() && userDoc.data()?.settings) {
        return userDoc.data().settings;
      }
      
      return null;
    });
  }

  /**
   * Migration utility: Import data from GitHub Gist
   * This can be used as part of the migration process
   */
  async importFromGistData(gistData: any): Promise<boolean> {
    await this.ensureInitialized();
    
    try {
      // Begin transaction to ensure all data is imported atomically
      await runTransaction(db, async (transaction) => {
        const userDocRef = this.getUserDocRef();
        
        // Import programs if they exist
        if (gistData.programs && Array.isArray(gistData.programs)) {
          for (const program of gistData.programs) {
            if (program && program.id) {
              const programRef = doc(db, 'users', this.userId!, 'programs', program.id);
              transaction.set(programRef, {
                ...program,
                importedAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              });
            }
          }
        }
        
        // Import user answers, bookmarks, analysis
        const userDocData: any = {
          importedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        if (gistData.userAnswers) {
          userDocData.userAnswers = gistData.userAnswers;
        }
        
        if (gistData.bookmarks) {
          userDocData.bookmarked = gistData.bookmarks;
        }
        
        if (gistData.analysis) {
          userDocData.lastAnalysis = gistData.analysis;
        }
        
        // Update user document with imported data
        transaction.set(userDocRef, userDocData, { merge: true });
        
        // Import progress items if they exist
        if (gistData.progress && Array.isArray(gistData.progress)) {
          for (const progressItem of gistData.progress) {
            if (progressItem) {
              const progressId = progressItem.id || 
                `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                
              const progressRef = doc(db, 'users', this.userId!, 'progress', progressId);
              transaction.set(progressRef, {
                ...progressItem,
                id: progressId,
                importedAt: serverTimestamp(),
                timestamp: progressItem.timestamp ? 
                  Timestamp.fromMillis(new Date(progressItem.timestamp).getTime()) : 
                  Timestamp.now()
              });
            }
          }
        }
        
        // Import conversations if they exist
        if (gistData.conversations) {
          for (const [sessionId, history] of Object.entries(gistData.conversations)) {
            if (history) {
              const conversationRef = doc(db, 'users', this.userId!, 'conversations', sessionId);
              transaction.set(conversationRef, {
                history,
                importedAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              });
            }
          }
        }
        
        // Import code examples if they exist
        if (gistData.codeExamples) {
          for (const [contextId, examples] of Object.entries(gistData.codeExamples)) {
            if (examples) {
              const codeExamplesRef = doc(db, 'users', this.userId!, 'codeExamples', contextId);
              transaction.set(codeExamplesRef, {
                examples,
                importedAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              });
            }
          }
        }
      });
      
      console.log('Successfully imported data from Gist to Firebase');
      return true;
    } catch (error) {
      console.error('Failed to import data from Gist:', error);
      return false;
    }
  }
}

// Create and export a singleton instance
const firebaseService = new FirebaseStorageService();
export default firebaseService;
