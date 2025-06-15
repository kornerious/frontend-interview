import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { firebaseConfig } from './firebaseConfig';

// Define the chunk interface
export interface TestChunk {
  id: string;
  startLine: number;
  endLine: number;
  processedDate: string;
  content: string;
  completed: boolean;
}

/**
 * Simple Firebase storage service for test chunks
 * This service is designed to be clear and easy to understand
 */
export class TestChunkStorage {
  // Firebase keys
  private static readonly TEST_CHUNKS_KEY = 'testChunks';
  
  // Firebase app instance
  private static app = initializeApp(firebaseConfig, 'chunk-testing');
  private static db = getFirestore(TestChunkStorage.app);
  private static auth = getAuth(TestChunkStorage.app);
  private static userId: string | null = null;
  
  /**
   * Initialize Firebase if not already initialized
   */
  private static async initialize(): Promise<void> {
    if (this.userId) return;
    
    console.log('Initializing Firebase for TestChunkStorage...');
    
    try {
      // Sign in anonymously
      const userCredential = await signInAnonymously(this.auth);
      this.userId = userCredential.user.uid;
      
      console.log('Firebase initialized successfully for TestChunkStorage');
    } catch (error) {
      console.error('Error initializing Firebase:', error);
      throw error;
    }
  }
  
  /**
   * Get the user document reference
   */
  private static getUserDocRef() {
    if (!this.userId) {
      throw new Error('User ID not available. Make sure Firebase is initialized.');
    }
    return doc(this.db, 'test-users', this.userId);
  }
  
  /**
   * Save a test chunk
   * @param chunk The chunk to save
   */
  static async saveChunk(chunk: TestChunk): Promise<void> {
    try {
      await this.initialize();
      
      console.log(`Saving test chunk with ID: ${chunk.id} for range ${chunk.startLine}-${chunk.endLine}...`);
      
      // Calculate and log the chunk size
      const chunkJson = JSON.stringify(chunk);
      const chunkSizeKB = (chunkJson.length / 1024).toFixed(2);
      console.log(`Test chunk size: ${chunkSizeKB} KB`);
      
      // Get the user document reference
      const userDocRef = this.getUserDocRef();
      
      // Get existing document
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.exists() ? userDoc.data() : {};
      
      // Get existing chunks or create empty object
      const testChunks = userData[this.TEST_CHUNKS_KEY] || {};
      
      // Add or update the chunk
      testChunks[chunk.id] = chunk;
      
      // Update the document
      await setDoc(userDocRef, {
        [this.TEST_CHUNKS_KEY]: testChunks,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      console.log(`Test chunk ${chunk.id} saved successfully`);
    } catch (error) {
      console.error('Error saving test chunk:', error);
      throw error;
    }
  }
  
  /**
   * Get all test chunks
   * @returns Array of test chunks
   */
  static async getAllChunks(): Promise<TestChunk[]> {
    try {
      await this.initialize();
      
      console.log('Getting all test chunks...');
      
      // Get the user document reference
      const userDocRef = this.getUserDocRef();
      
      // Get the document
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        console.log('No test chunks found');
        return [];
      }
      
      // Get the chunks
      const userData = userDoc.data();
      const testChunks = userData[this.TEST_CHUNKS_KEY] || {};
      
      // Convert to array
      const chunksArray = Object.values(testChunks) as TestChunk[];
      
      // Sort by line range
      chunksArray.sort((a, b) => a.startLine - b.startLine);
      
      console.log(`Found ${chunksArray.length} test chunks`);
      return chunksArray;
    } catch (error) {
      console.error('Error getting test chunks:', error);
      throw error;
    }
  }
  
  /**
   * Delete a test chunk
   * @param chunkId The ID of the chunk to delete
   */
  static async deleteChunk(chunkId: string): Promise<void> {
    try {
      await this.initialize();
      
      console.log(`Deleting test chunk with ID: ${chunkId}...`);
      
      // Get the user document reference
      const userDocRef = this.getUserDocRef();
      
      // Get existing document
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        console.log('No test chunks found');
        return;
      }
      
      // Get existing chunks
      const userData = userDoc.data();
      const testChunks = userData[this.TEST_CHUNKS_KEY] || {};
      
      // Remove the chunk
      delete testChunks[chunkId];
      
      // Update the document
      await setDoc(userDocRef, {
        [this.TEST_CHUNKS_KEY]: testChunks,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      console.log(`Test chunk ${chunkId} deleted successfully`);
    } catch (error) {
      console.error('Error deleting test chunk:', error);
      throw error;
    }
  }
  
  /**
   * Clear all test chunks
   */
  static async clearAllChunks(): Promise<void> {
    try {
      await this.initialize();
      
      console.log('Clearing all test chunks...');
      
      // Get the user document reference
      const userDocRef = this.getUserDocRef();
      
      // Update the document
      await setDoc(userDocRef, {
        [this.TEST_CHUNKS_KEY]: {},
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      console.log('All test chunks cleared successfully');
    } catch (error) {
      console.error('Error clearing test chunks:', error);
      throw error;
    }
  }
}
