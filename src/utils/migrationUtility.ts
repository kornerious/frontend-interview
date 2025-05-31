import gistStorageService from './gistStorageService';
import firebaseService from './firebaseService';

/**
 * Utility to migrate data from GitHub Gists to Firebase
 * This can be run once to transfer all existing data
 */
export async function migrateFromGistToFirebase(): Promise<{
  success: boolean;
  message: string;
  details?: string;
}> {
  try {
    console.log('Starting migration from GitHub Gists to Firebase...');
    
    // STEP 1: Initialize Gist storage
    console.log('Step 1: Initializing GitHub Gist service...');
    const gistInitialized = await gistStorageService.initialize();
    if (!gistInitialized) {
      return { 
        success: false, 
        message: 'Failed to initialize Gist storage service. Check your GitHub token.',
        details: 'Make sure your GitHub token has the "gist" scope enabled.'
      };
    }
    console.log('✓ GitHub Gist service initialized successfully');
    
    // STEP 2: Initialize Firebase
    console.log('Step 2: Initializing Firebase service...');
    try {
      const firebaseInitialized = await firebaseService.initialize();
      if (!firebaseInitialized) {
        return { 
          success: false, 
          message: 'Failed to initialize Firebase service.',
          details: 'Please make sure anonymous authentication is enabled in your Firebase project. Go to the Firebase Console > Authentication > Sign-in methods and enable Anonymous authentication.'
        };
      }
      console.log('✓ Firebase service initialized successfully');
    } catch (firebaseError: any) {
      console.error('Firebase initialization error details:', firebaseError);
      return {
        success: false,
        message: 'Failed to initialize Firebase service.',
        details: `Error: ${firebaseError?.message || 'Unknown error'}. Most common cause: Anonymous authentication is not enabled in your Firebase project. Go to the Firebase Console > Authentication > Sign-in methods and enable Anonymous authentication.`
      };
    }
    
    console.log('Both services initialized. Collecting data from Gist...');
    
    // Collect all data from Gist
    const programs = await gistStorageService.getAllPrograms();
    const progress = await gistStorageService.getAllProgress();
    const userAnswers = await gistStorageService.getUserAnswers();
    const analysis = await gistStorageService.getAnalysis();
    const bookmarks = await gistStorageService.getBookmarks();
    
    // Attempt to get conversations and code examples if they exist
    let conversations = {};
    try {
      conversations = {
        'default-session': await gistStorageService.getConversationHistory()
      };
    } catch (error) {
      console.warn('Could not retrieve conversation history:', error);
    }
    
    let codeExamples = {};
    try {
      codeExamples = {
        'global': await gistStorageService.getCodeExamples()
      };
    } catch (error) {
      console.warn('Could not retrieve code examples:', error);
    }
    
    // Prepare complete data bundle
    const completeGistData = {
      programs,
      progress,
      userAnswers,
      analysis,
      bookmarks,
      conversations,
      codeExamples
    };
    
    console.log('Data collected from Gist. Starting import to Firebase...');
    console.log(`Found ${programs.length} programs and ${progress.length} progress records`);
    
    // Import to Firebase
    const importResult = await firebaseService.importFromGistData(completeGistData);
    
    if (importResult) {
      return {
        success: true,
        message: `Successfully migrated data to Firebase! Imported ${programs.length} programs and ${progress.length} progress records.`
      };
    } else {
      return {
        success: false,
        message: 'Failed to import data to Firebase. Check the console for more details.'
      };
    }
    
  } catch (error: any) {
    console.error('Migration failed:', error);
    return {
      success: false,
      message: `Migration failed: ${error.message || 'Unknown error'}`
    };
  }
}

/**
 * Helper function to validate migration success
 * This function will compare counts of critical data between Gist and Firebase
 */
export async function validateMigration(): Promise<{
  success: boolean;
  message: string;
  details: {
    gist: {
      programs: number;
      progress: number;
      answers: number;
    };
    firebase: {
      programs: number;
      progress: number;
      answers: number;
    }
  }
}> {
  try {
    // Get counts from Gist
    const gistPrograms = await gistStorageService.getAllPrograms();
    const gistProgress = await gistStorageService.getAllProgress();
    const gistAnswers = await gistStorageService.getUserAnswers();
    
    // Get counts from Firebase
    const firebasePrograms = await firebaseService.getAllPrograms();
    const firebaseProgress = await firebaseService.getAllProgress();
    const firebaseAnswers = await firebaseService.getUserAnswers();
    
    const details = {
      gist: {
        programs: gistPrograms.length,
        progress: gistProgress.length,
        answers: Object.keys(gistAnswers).length
      },
      firebase: {
        programs: firebasePrograms.length,
        progress: firebaseProgress.length,
        answers: Object.keys(firebaseAnswers).length
      }
    };
    
    // Check if counts match
    const programsMatch = details.gist.programs === details.firebase.programs;
    const progressMatch = details.gist.progress === details.firebase.progress;
    const answersMatch = details.gist.answers === details.firebase.answers;
    
    const allMatch = programsMatch && progressMatch && answersMatch;
    
    return {
      success: allMatch,
      message: allMatch 
        ? 'Migration validation successful! All data counts match.' 
        : 'Migration validation failed. Some data counts do not match.',
      details
    };
  } catch (error: any) {
    console.error('Validation failed:', error);
    return {
      success: false,
      message: `Validation failed: ${error.message || 'Unknown error'}`,
      details: {
        gist: { programs: 0, progress: 0, answers: 0 },
        firebase: { programs: 0, progress: 0, answers: 0 }
      }
    };
  }
}
