import { Octokit } from '@octokit/rest';
import { LearningProgram } from '@/types';
import { rateLimitState, detectRateLimit } from '@/components/RateLimitAlert';

interface GistData {
  settings?: any;
  progress?: any;
  programs?: LearningProgram[];
  userAnswers?: any;
  analysis?: any;
  bookmarks?: any;
  conversations?: any;
  codeExamples?: any;
}

/**
 * Rate limit manager to handle GitHub API rate limits
 * GitHub has a rate limit of 5000 requests per hour for authenticated requests
 */
class RateLimitManager {
  private lastCallTime: number = 0;
  private minTimeBetweenCalls: number = 500; // Minimum 500ms between calls
  private requestCount: number = 0;
  private resetTime: number = 0;
  private remainingCalls: number = 5000; // Default GitHub limit
  
  // Cache for get requests to avoid unnecessary duplicates
  private cache: Record<string, {data: any, timestamp: number}> = {};
  private readonly cacheTTL = 10000; // 10 seconds cache TTL
  
  constructor() {
    // Reset counter every hour
    setInterval(() => {
      this.requestCount = 0;
      console.log('🔄 Rate limit counter reset');
    }, 60 * 60 * 1000);
  }
  
  /**
   * Update rate limit info from GitHub response headers
   */
  updateLimits(headers: any) {
    if (headers && headers['x-ratelimit-remaining']) {
      this.remainingCalls = parseInt(headers['x-ratelimit-remaining']);
      
      if (headers['x-ratelimit-reset']) {
        this.resetTime = parseInt(headers['x-ratelimit-reset']) * 1000;
      }
      
      // Log when we're getting low on remaining calls
      if (this.remainingCalls < 100) {
        console.warn(`⚠️ GitHub API rate limit running low: ${this.remainingCalls} remaining calls`);
        console.log(`Reset time: ${new Date(this.resetTime).toLocaleTimeString()}`);
      }
    }
  }
  
  /**
   * Check if a call can be made, and wait if needed
   */
  async throttleIfNeeded(): Promise<void> {
    this.requestCount++;
    
    // Calculate dynamic delay based on remaining calls
    // As we get fewer remaining calls, we wait longer between them
    let dynamicDelay = this.minTimeBetweenCalls;
    
    if (this.remainingCalls < 100) {
      // Exponential backoff as we approach rate limit
      dynamicDelay = this.minTimeBetweenCalls * (1 + (100 - this.remainingCalls) / 10);
    }
    
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCallTime;
    
    if (timeSinceLastCall < dynamicDelay) {
      const waitTime = dynamicDelay - timeSinceLastCall;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastCallTime = Date.now();
  }
  
  /**
   * Get cached data if available, otherwise execute the API call
   */
  async getCachedOrFetch<T>(cacheKey: string, fetchFn: () => Promise<T>): Promise<T> {
    // Check cache first
    const cachedItem = this.cache[cacheKey];
    const now = Date.now();
    
    if (cachedItem && (now - cachedItem.timestamp) < this.cacheTTL) {
      console.log(`🔍 Using cached data for: ${cacheKey}`);
      return cachedItem.data;
    }
    
    // Otherwise make the API call with throttling
    await this.throttleIfNeeded();
    try {
      const data = await fetchFn();
      
      // Cache the result
      this.cache[cacheKey] = {
        data,
        timestamp: now
      };
      
      return data;
    } catch (error: any) {
      // Check if this is a rate limit error
      if (error?.message?.includes('API rate limit exceeded')) {
        // Extract reset time if available
        if (error.response?.headers?.['x-ratelimit-reset']) {
          this.resetTime = parseInt(error.response.headers['x-ratelimit-reset']) * 1000;
          this.remainingCalls = 0;
          console.warn(`⛔ Rate limit exceeded. Reset at ${new Date(this.resetTime).toLocaleTimeString()}`);
        }
      }
      throw error;
    }
  }
}

class GistStorageService {
  private octokit: Octokit | null = null;
  private gistId: string | null = null;
  private fileName: string = process.env.NEXT_PUBLIC_GIST_FILENAME || 'FrontendDevInterview.json';
  private cachedData: GistData = {};
  private isInitialized: boolean = false;
  private envGistId = process.env.NEXT_PUBLIC_GIST_ID;
  
  // Rate limit manager to control API call frequency
  private rateLimiter = new RateLimitManager();

  /**
   * Initialize GitHub Gist storage with provided token
   */
  async initialize(token?: string): Promise<boolean> {
    console.log("🔄 Initializing GitHub Gist storage...");
    console.log("📋 Previously initialized:", this.isInitialized);
    console.log("📋 Previous Gist ID:", this.gistId);
    
    if (this.isInitialized && this.octokit && this.gistId) {
      console.log("✅ Gist storage already initialized - reusing existing connection");
      return true;
    }

    try {
      // Get token from provided token or environment variables
      const authToken = token || process.env.NEXT_PUBLIC_GITHUB_GIST_TOKEN;
      
      console.log("🔑 Using GitHub token:", authToken ? `${authToken.substring(0, 5)}...` : "None");
      
      if (!authToken) {
        console.error("❌ No GitHub token provided for Gist initialization");
        return false;
      }

      // Initialize Octokit
      console.log("🔄 Creating Octokit instance...");
      this.octokit = new Octokit({
        auth: authToken
      });

      // Get Gist filename from environment variables or use default
      this.fileName = process.env.NEXT_PUBLIC_GIST_FILENAME || "FrontendDevInterview.json";
      console.log("📄 Using filename:", this.fileName);
      
      // Find or create the Gist using findOrCreateGist method
      console.log("🔍 Finding or creating Gist...");
      await this.findOrCreateGist();
      
      // Verify we have a Gist ID after findOrCreateGist
      if (!this.gistId) {
        console.error("❌ Failed to find or create Gist");
        return false;
      }
      
      console.log("✅ Using Gist ID:", this.gistId);
      
      // Load initial data from Gist
      console.log("🔄 Loading initial data from Gist...");
      await this.loadFromGist();
      
      this.isInitialized = true;
      console.log("✅ GitHub Gist storage initialized successfully");
      console.log("📋 Final Gist ID:", this.gistId);
      console.log("📋 Final filename:", this.fileName);
      return true;
    } catch (error) {
      console.error("❌ Error initializing GitHub Gist storage:", error);
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Find existing gist or create a new one
   */
  private async findOrCreateGist(): Promise<void> {
    if (!this.octokit) return;

    try {
      // If we have a specific Gist ID from environment variables, use that directly
      if (this.envGistId) {
        this.gistId = this.envGistId;
        console.log("Using gist ID from environment variables:", this.gistId);
        
        // Initialize the Gist with default data if it's empty
        try {
          const gist = await this.octokit.gists.get({ gist_id: this.gistId });
          if (!gist.data.files || 
              !gist.data.files[this.fileName] || 
              !gist.data.files[this.fileName]?.content || 
              gist.data.files[this.fileName]?.content === "{}") {
            console.log("Gist exists but is empty, initializing with default data");
            await this.octokit.gists.update({
              gist_id: this.gistId,
              files: {
                [this.fileName]: {
                  content: JSON.stringify(this.getDefaultData(), null, 2)
                }
              }
            });
            console.log("Gist initialized with default data");
          }
        } catch (error) {
          console.error("Error checking or initializing existing Gist:", error);
        }
        return;
      }
      
      // Otherwise look for existing gist with our filename
      const gists = await this.octokit.gists.list();
      
      const existingGist = gists.data.find(gist => 
        gist.files && 
        gist.files[this.fileName] !== undefined
      );
      
      if (existingGist) {
        this.gistId = existingGist.id;
        console.log('Found existing gist:', this.gistId);
        return;
      }
      
      // Create new gist if none exists
      const newGist = await this.octokit.gists.create({
        description: 'Frontend Interview App Data',
        public: false,
        files: {
          [this.fileName]: {
            content: JSON.stringify(this.getDefaultData(), null, 2)
          }
        }
      });
      
      this.gistId = newGist.data.id || null;
      console.log('Created new gist:', this.gistId);
    } catch (error) {
      console.error('Error finding/creating gist:', error);
      throw error;
    }
  }

  /**
   * Load all data from Gist with protection against concurrent loads
   */
  private async loadFromGist(): Promise<GistData> {
    // If there's an existing load operation in progress, return that promise
    // This prevents multiple simultaneous loads which could lead to data race conditions
    if (this.loadPromise) {
      console.log('Reusing existing load promise');
      return this.loadPromise;
    }

    // Create a new load promise
    this.loadPromise = this._loadFromGist();
    
    try {
      // Wait for the load to complete and return directly
      return await this.loadPromise;
    } finally {
      // Clear the load promise so future loads can proceed
      this.loadPromise = null;
    }
  }

  /**
   * Actual implementation of loading data from Gist
   */
  private async _loadFromGist(): Promise<GistData> {
    if (!this.octokit || !this.gistId) {
      console.error('Cannot load from Gist: Not initialized');
      return this.getDefaultData();
    }

    try {
      console.log('Loading data from Gist ID:', this.gistId || 'unknown');
      const gistId = this.gistId as string;
      
      const response = await this.octokit.gists.get({
        gist_id: gistId
      });
      
      const gistData = response.data;
      const fileName = this.fileName || "FrontendDevInterview.json";
      
      if (gistData.files && gistData.files[fileName] && gistData.files[fileName]?.content) {
        try {
          // Try to parse the content as JSON
          const parsedData = JSON.parse(gistData.files[fileName]?.content || '{}');
          
          // Ensure all required data structures exist
          const structuredData = this.ensureDataStructure(parsedData);
          
          // Store a deep clone of the data to prevent accidental mutations
          this.cachedData = JSON.parse(JSON.stringify(structuredData));
          console.log('Loaded data keys:', Object.keys(this.cachedData));
          return this.cachedData;
        } catch (jsonError) {
          console.error('Error parsing Gist JSON:', jsonError);
          return this.getDefaultData();
        }
      } else {
        console.error('Gist file not found or empty');
        return this.getDefaultData();
      }
    } catch (error) {
      console.error('Error loading from Gist:', error);
      return this.getDefaultData();
    }
  }

  // Lock for save operations to prevent race conditions
  private saveLock = false;
  private saveQueue: (() => Promise<boolean>)[] = [];
  private loadPromise: Promise<GistData> | null = null; // Single shared load promise to prevent multiple simultaneous loads
  
  /**
   * Direct save to gist - bypasses the queue for critical data
   * Implements retry logic and proper merge handling
   */
  async directSaveToGist(data: Partial<GistData>): Promise<boolean> {
    // Check if we're currently rate limited
    if (rateLimitState.isRateLimited) {
      console.warn('⚠️ DIRECT SAVE: Skipping save due to active rate limit');
      return false;
    }
    
    if (!this.isInitialized || !this.octokit || !this.gistId) {
      console.error('❌ Cannot save - not initialized');
      return false;
    }
    
    // Maximum number of retry attempts
    const MAX_RETRIES = 3;
    let attempt = 0;
    
    while (attempt < MAX_RETRIES) {
      try {
        // First, get the latest data to ensure we're working with current state
        // This helps prevent race conditions with other components saving
        await this.loadFromGist();
        
        // Deep merge the new data with existing data
        const mergedData = this.deepMerge(this.cachedData, data);
        
        // Check if data would actually change by comparing stringified versions
        const currentDataStr = JSON.stringify(this.cachedData, null, 2);
        const newDataStr = JSON.stringify(mergedData, null, 2);
        
        // If no changes detected, skip API call
        if (currentDataStr === newDataStr) {
          console.log('⏭️ DIRECT SAVE: No changes detected, skipping update call');
          return true; // Success since nothing needs to be saved
        }
        
        // Update cached data with merged data
        this.cachedData = mergedData;
        
        // Use the rateLimiter to avoid hitting API limits
        const saveOperation = async () => {
          // Create content as a stringified version of the cached data
          const content = JSON.stringify(mergedData, null, 2);
          
          // Update the gist with merged data - only if there are actual changes
          const response = await this.octokit!.gists.update({
            gist_id: this.gistId!,
            files: {
              [this.fileName]: {
                content
              }
            }
          });
          
          // Update rate limit info from response headers
          if (response.headers) {
            this.rateLimiter.updateLimits(response.headers);
          }
          
          // Verify the update was successful
          return response.status >= 200 && response.status < 300;
        };
        
        // Execute the save operation with throttling
        const success = await this.rateLimiter.getCachedOrFetch(
          `save_${this.gistId}_${Date.now()}`, // Unique key for each save
          saveOperation
        );
        
        if (success) {
          console.log('✅ DIRECT SAVE: Successfully saved data to Gist');
          return true;
        }
        
        // If we reach here, the save wasn't successful but didn't throw an error
        attempt++;
        console.warn(`⚠️ DIRECT SAVE: Attempt ${attempt} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
        
      } catch (error: any) {
        attempt++;
        
        // Check if this is a rate limit error
        if (detectRateLimit(error)) {
          console.warn('⚠️ DIRECT SAVE: Rate limit detected, save failed');
          return false; // Don't retry if we hit rate limits
        }
        
        // Log and retry for other errors
        console.error('❌ DIRECT SAVE: Error saving to Gist:', error.message);
        
        if (attempt >= MAX_RETRIES) {
          console.error('❌ DIRECT SAVE: All retry attempts failed');
          return false;
        }
        
        // Wait before retrying with exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        console.warn(`⚠️ DIRECT SAVE: Retrying in ${delay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    return false; // All attempts failed
  }
  
  /**
   * Deep merge utility to properly merge nested objects and arrays
   */
  private deepMerge(target: any, source: any): any {
    if (source === null || typeof source !== 'object') return source;
    if (target === null || typeof target !== 'object') return source;

    const output = {...target};
    
    Object.keys(source).forEach(key => {
      if (Array.isArray(source[key])) {
        // For arrays, merge with existing arrays if they exist
        if (Array.isArray(target[key])) {
          // When dealing with programs, progress, etc., use ID-based merging
          if (['programs', 'progress'].includes(key) && source[key].length > 0 && source[key][0]?.id) {
            // Handle arrays of objects with IDs by merging objects with the same ID
            const targetMap = new Map(target[key].map((item: any) => [item.id, item]));
            source[key].forEach((sourceItem: any) => {
              targetMap.set(sourceItem.id, sourceItem);
            });
            output[key] = Array.from(targetMap.values());
          } else {
            // For simple arrays or arrays without IDs, concatenate and remove duplicates
            // Use filter instead of Set to avoid downlevel iteration issues
            const combined = [...target[key]];
            source[key].forEach((item: any) => {
              if (!combined.includes(item)) {
                combined.push(item);
              }
            });
            output[key] = combined;
          }
        } else {
          // If target doesn't have this array yet, use the source array
          output[key] = [...source[key]];
        }
      } else if (typeof source[key] === 'object') {
        // For nested objects, recursively merge
        if (key in target) {
          output[key] = this.deepMerge(target[key], source[key]);
        } else {
          output[key] = source[key];
        }
      } else {
        // For primitive values, use the source value
        output[key] = source[key];
      }
    });
    
    return output;
  }

  /**
   * Process the next save in the queue
   */
  private async processNextSave(): Promise<void> {
    if (this.saveQueue.length === 0 || this.saveLock) {
      return;
    }
    
    this.saveLock = true;
    try {
      const nextSave = this.saveQueue.shift();
      if (nextSave) {
        await nextSave();
      }
    } finally {
      this.saveLock = false;
      // Process next item in queue if any
      if (this.saveQueue.length > 0) {
        await this.processNextSave();
      }
    }
  }

  /**
   * Save data to Gist with locking to prevent race conditions
   */
  async saveToGist(data: Partial<GistData>): Promise<boolean> {
    console.log('saveToGist called with data:', Object.keys(data));
    
    if (!this.isInitialized || !this.octokit || !this.gistId) {
      console.error('Gist storage not initialized - cannot save');
      return false;
    }

    // Deep clone the data to ensure we don't have any reference issues
    const clonedData = JSON.parse(JSON.stringify(data));

    // Create a save function to add to queue
    const saveFunction = async (): Promise<boolean> => {
      try {
        // First, get the latest data from Gist to avoid overwrites
        const latestData = await this.loadFromGist();
        
        // Make a copy of the latest data before merging
        const baseData = JSON.parse(JSON.stringify(latestData));
        
        // Log what we're about to merge for debugging purposes
        console.log('Base data keys:', Object.keys(baseData));
        console.log('New data keys:', Object.keys(clonedData));
        
        // Deep merge the new data with existing data
        const mergedData = this.deepMerge(baseData, clonedData);
        
        // Store the merged data in cache
        this.cachedData = mergedData;
        
        console.log('Updating Gist with ID:', this.gistId || 'unknown');
        console.log('Saving data keys:', Object.keys(this.cachedData));
        
        if (clonedData.programs) {
          console.log('Saving programs count:', (clonedData.programs || []).length);
          console.log('Total programs in merged data:', (mergedData.programs || []).length);
        }
        
        console.log('Creating direct URL for', this.gistId);
        const gistId = this.gistId as string;
        const fileName = this.fileName || "FrontendDevInterview.json";
        
        if (!this.octokit) {
          console.error('Cannot update Gist: Octokit is not initialized');
          return false;
        }
        
        const response = await this.octokit.gists.update({
          gist_id: gistId,
          files: {
            [fileName]: {
              content: JSON.stringify(this.cachedData, null, 2)
            }
          }
        });
        
        const status = response?.status || 0;
        console.log(`Gist update response status: ${status} (${status === 200 ? 'success' : 'error'})`);
        
        if (status === 200) {
          // Verify the data was saved correctly by comparing key structures
          // This is an extra safety check against data loss
          try {
            // Re-fetch immediately to check if our save was successful
            const verifyData = await this._loadFromGist();
            const savedProgramsCount = (verifyData.programs || []).length;
            const expectedProgramsCount = (mergedData.programs || []).length;
            
            if (savedProgramsCount < expectedProgramsCount) {
              console.error(`Data integrity check failed! Expected ${expectedProgramsCount} programs but found ${savedProgramsCount}. Will retry save.`);
              return false; // Will cause a retry if error recovery is enabled
            }
          } catch (verifyError) {
            console.error('Error verifying save:', verifyError);
          }
        }
        
        return status === 200;
      } catch (error) {
        console.error('Error saving data to Gist:', error);
        return false;
      }
    };
    
    // Add save function to queue
    this.saveQueue.push(saveFunction);
    
    // If no save is in progress, start processing the queue
    if (!this.saveLock) {
      await this.processNextSave();
    }
    
    return true; // Return true to indicate the save was queued
  }

  /**
   * Import data from a specific Gist URL
   * This method now avoids unnecessary PATCH operations during initialization
   */
  async importFromGistUrl(url: string): Promise<boolean> {
    if (!this.isInitialized || !this.octokit) {
      console.error('Gist storage not initialized');
      return false;
    }

    try {
      // Parse the URL to extract the Gist ID
      let gistId: string | null = null;
      
      // Handle standard GitHub Gist URLs (gist.github.com/user/gistid)
      if (url.includes('gist.github.com')) {
        const urlParts = url.split('/');
        gistId = urlParts[urlParts.length - 1];
        if (gistId && gistId.includes('#')) {
          gistId = gistId.split('#')[0]; // Remove fragment identifier
        }
        
        console.log('🔍 Extracted Gist ID from URL:', gistId);
        
        if (gistId) {
          // Use the Octokit API to get the raw content
          const response = await this.octokit.gists.get({ gist_id: gistId });
          
          // Check for rate limit headers
          if (response.headers && response.headers['x-ratelimit-remaining']) {
            const remaining = parseInt(response.headers['x-ratelimit-remaining']);
            if (remaining < 100) {
              console.warn(`⚠️ GitHub API rate limit running low: ${remaining} remaining calls`);
            }
          }
          
          if (response.data.files && response.data.files[this.fileName]) {
            const fileContent = response.data.files[this.fileName];
            if (fileContent && fileContent.content) {
              this.cachedData = JSON.parse(fileContent.content);
            }
          } else {
            console.error('❌ Could not find the expected file in the Gist');
            return false;
          }
        } else {
          console.error('❌ Could not extract Gist ID from URL');
          return false;
        }
      } else {
        // Handle direct raw URLs
        const response = await fetch(url);
        if (!response.ok) {
          console.error(`❌ HTTP error! status: ${response.status}`);
          return false;
        }
        
        this.cachedData = await response.json();
      }
      
      // IMPORTANT: No PATCH operation here anymore!
      // Previously this method was unnecessarily saving the data back to the same Gist
      // during initialization, which was causing rate limit errors
      
      console.log('✅ Successfully imported data from Gist to memory');
      return true;
    } catch (error) {
      console.error('❌ Error importing data from Gist URL:', error);
      throw error; // Rethrow so the caller can handle rate limit errors
    }
  }

  // Specific methods for each data type
  
  /**
   * Save settings to Gist
   */
  // Track when the last settings save was performed to prevent race conditions
  private lastSettingsSaveTime = 0;
  private settingsLock = false;
  
  async saveSettings(settings: any): Promise<boolean> {
    console.log('📣 DIRECT DEBUG: saveSettings called with:', {
      darkMode: settings.darkMode,
      codeEditorTheme: settings.codeEditorTheme,
      learningDuration: settings.learningDuration,
      githubGistToken: settings.githubGistToken ? '[TOKEN EXISTS]' : '[NO TOKEN]'
    });
    
    if (!this.isInitialized || !this.octokit || !this.gistId) {
      console.error('❌ GIST ERROR: Not initialized, missing octokit or gistId');
      return false;
    }
    
    // Prevent multiple simultaneous settings updates
    if (this.settingsLock) {
      console.log('⚠️ Settings update already in progress, waiting...');
      // Wait for the lock to be released, with a timeout
      let waitTime = 0;
      while (this.settingsLock && waitTime < 5000) {
        await new Promise(resolve => setTimeout(resolve, 100));
        waitTime += 100;
      }
      
      if (this.settingsLock) {
        console.error('❌ Timed out waiting for settings lock to release');
        return false;
      }
    }
    
    // Acquire the lock
    this.settingsLock = true;
    
    try {
      // Update our timestamp to track this save operation
      this.lastSettingsSaveTime = Date.now();
      const currentSaveTime = this.lastSettingsSaveTime;
      
      // Direct approach using Octokit
      const gistId = this.gistId;
      const fileName = this.fileName;
      
      console.log(`📣 Using Gist ID: ${gistId}, filename: ${fileName}`);
      
      // Get current Gist content
      const gistResponse = await this.octokit.gists.get({ gist_id: gistId });
      
      // Parse existing content or create new structure
      let gistContent = {};
      if (gistResponse.data.files && gistResponse.data.files[fileName]) {
        try {
          const fileContent = gistResponse.data.files[fileName];
          if (fileContent && fileContent.content) {
            gistContent = JSON.parse(fileContent.content);
          }
        } catch (e) {
          console.error("❌ Error parsing Gist content:", e);
          gistContent = {};
        }
      }
      
      // Make sure we have a settings object
      const typedGistContent = gistContent as { settings?: Record<string, any> };
      if (!typedGistContent.settings) {
        typedGistContent.settings = {};
      }
      
      // Parse learningDuration as a number to ensure consistency
      const learningDuration = typeof settings.learningDuration === "string" ?
        parseInt(settings.learningDuration, 10) : 
        (settings.learningDuration || 14);
      
      // Preserve GitHub token if it exists but wasn't provided in this update
      const existingGithubToken = typedGistContent.settings.githubGistToken;
      const newGithubToken = settings.githubGistToken;
      const finalGithubToken = newGithubToken || existingGithubToken || "";
      
      // Update with the new settings, prioritizing the provided settings
      typedGistContent.settings = {
        ...typedGistContent.settings,
        ...settings,
        // Force these values to be explicitly set
        darkMode: settings.darkMode !== undefined ? settings.darkMode : typedGistContent.settings.darkMode,
        codeEditorTheme: settings.codeEditorTheme || typedGistContent.settings.codeEditorTheme,
        learningDuration: learningDuration,
        githubGistToken: finalGithubToken
      };
      
      console.log("📣 Updating Gist with settings:", {
        ...typedGistContent.settings,
        githubGistToken: typedGistContent.settings?.githubGistToken ? '[TOKEN EXISTS]' : '[NO TOKEN]'
      });
      
      // Double check that we're still the most recent save operation
      if (currentSaveTime !== this.lastSettingsSaveTime) {
        console.log('⚠️ A newer settings save operation has started, aborting this one');
        return false;
      }
      
      // Update the Gist directly
      const updateResponse = await this.octokit.gists.update({
        gist_id: gistId,
        files: {
          [fileName]: {
            content: JSON.stringify(typedGistContent, null, 2)
          }
        }
      });
      
      const success = updateResponse.status === 200;
      console.log(`📣 GIST UPDATE: ${success ? "✅ SUCCESS" : "❌ FAILED"}`);
      
      // Cache the updated data locally
      this.cachedData = typedGistContent as GistData;
      
      return success;
    } catch (error) {
      console.error('❌ CRITICAL ERROR saving settings to Gist:', error);
      return false;
    } finally {
      // Always release the lock when done
      this.settingsLock = false;
    }
  }

  /**
   * Gets default data structure for a new Gist
   */
  private getDefaultData(): GistData {
    return {
      settings: { 
        darkMode: false, 
        name: '', 
        selectedTechnologies: [], 
        learningDuration: 14,
        useGistStorage: true,
        codeEditorTheme: 'vs-dark',
        aiProvider: 'claude',
        saveAnswers: true
      },
      progress: [],
      programs: [],
      userAnswers: {},
      analysis: {},
      bookmarks: { questions: [], tasks: [], theory: [] },
      conversations: {},
      codeExamples: {}
    };
  }

  /**
   * Ensures all required data structures exist in loaded data
   */
  private ensureDataStructure(data: any): GistData {
    const defaultData = this.getDefaultData();
    
    // Make sure all top-level properties exist
    Object.keys(defaultData).forEach(key => {
      if (!data[key]) {
        data[key] = defaultData[key as keyof GistData];
      }
    });
    
    // Ensure settings has all required properties
    if (data.settings) {
      const defaultSettings = defaultData.settings;
      Object.keys(defaultSettings).forEach(key => {
        if (data.settings[key] === undefined) {
          data.settings[key] = defaultSettings[key as keyof typeof defaultSettings];
        }
      });
    }
    
    // Ensure bookmarks has the required structure
    if (!data.bookmarks || typeof data.bookmarks !== 'object') {
      data.bookmarks = defaultData.bookmarks;
    } else {
      ['questions', 'tasks', 'theory'].forEach(category => {
        if (!Array.isArray(data.bookmarks[category])) {
          data.bookmarks[category] = [];
        }
      });
    }
    
    return data as GistData;
  }

  async getSettings(): Promise<any> {
    await this.loadFromGist();
    return this.cachedData.settings || this.getDefaultData().settings;
  }

  // Programs
  async saveProgram(program: LearningProgram): Promise<boolean> {
    console.log('💾 Saving program with ID:', program?.id);
    if (!this.isInitialized || !program?.id) return false;
    
    // For programs, we need to merge with existing programs array carefully
    await this.loadFromGist();
    let programs = [...(this.cachedData.programs || [])];
    
    // Find if program already exists
    const existingIndex = programs.findIndex(p => p.id === program.id);
    
    if (existingIndex >= 0) {
      programs[existingIndex] = program; // Update
    } else {
      programs.push(program); // Add new
    }
    
    // Use direct save for programs as they are critical data
    return this.directSaveToGist({ programs });
  }

  /**
   * Get all learning programs
   */
  async getAllPrograms(): Promise<LearningProgram[]> {
    try {
      // Make sure we get fresh data from the gist
      await this.loadFromGist();
      
      // Get programs from cached data
      const programs = this.cachedData.programs || [];
      
      // Log for debugging
      console.log(`🔍 getAllPrograms found ${programs.length} programs in cached data`);
      if (programs.length > 0) {
        console.log('🧾 Program IDs:', programs.map(p => p.id).join(', '));
      }
      
      return programs;
    } catch (error) {
      // If we hit an error (like rate limit), return whatever is in cache
      console.error('❌ Error in getAllPrograms:', error);
      
      // Don't let rate limits prevent us from returning cached data
      if (detectRateLimit(error)) {
        console.warn('⚠️ Rate limit detected in getAllPrograms, returning cached data');
      }
      
      return this.cachedData.programs || [];
    }
  }

  // Progress
  async saveProgress(progressItem: any): Promise<boolean> {
    console.log('💾 Saving progress item:', progressItem?.questionId || 'unknown');
    
    // For progress, we need to merge with existing progress array carefully
    await this.loadFromGist();
    let progress = [...(this.cachedData.progress || [])];
    
    // Add the new progress item
    progress.push(progressItem);
    
    // Use direct save which handles optimistic updates and race conditions
    return this.directSaveToGist({ progress });
  }
  
  async getProgress(): Promise<any[]> {
    await this.loadFromGist();
    return this.cachedData.progress || [];
  }

  // Analysis
  async saveAnalysis(analysis: Record<string, any>): Promise<boolean> {
    console.log('💾 Saving analysis data');
    // Use direct save for analysis as it contains critical user data
    return this.directSaveToGist({ analysis });
  }

  async getAnalysis(): Promise<Record<string, any>> {
    await this.loadFromGist();
    return this.cachedData.analysis || this.getDefaultData().analysis;
  }

  // User Answers
  async saveUserAnswers(userAnswers: Record<string, string>): Promise<boolean> {
    console.log('💾 Saving user answers');
    // Use direct save for user answers as they are important user data
    return this.directSaveToGist({ userAnswers });
  }

  async getUserAnswers(): Promise<Record<string, string>> {
    await this.loadFromGist();
    return this.cachedData.userAnswers || this.getDefaultData().userAnswers;
  }

  // Bookmarks
  async saveBookmarks(bookmarks: { questions: string[], tasks: string[], theory: string[] }): Promise<boolean> {
    console.log('💾 Saving bookmarks');
    // Use direct save for bookmarks as they are important user data
    return this.directSaveToGist({ bookmarks });
  }

  async getBookmarks(): Promise<{ questions: string[], tasks: string[], theory: string[] }> {
    await this.loadFromGist();
    return this.cachedData.bookmarks || this.getDefaultData().bookmarks;
  }

  // Conversations
  async saveConversationHistory(history: any[], sessionId = 'default-session'): Promise<boolean> {
    const conversations = this.cachedData.conversations || {};
    conversations[sessionId] = history;
    return this.saveToGist({ conversations });
  }

  async getConversationHistory(sessionId = 'default-session'): Promise<any[]> {
    await this.loadFromGist();
    const conversations = this.cachedData.conversations || this.getDefaultData().conversations || {};
    return conversations[sessionId] || [];
  }

  // Code Examples
  async saveCodeExample(id: string, code: string, contextId = 'global'): Promise<boolean> {
    // Don't log every code example save to reduce console noise
    const codeExamples = this.cachedData.codeExamples || {};
    const contextExamples = codeExamples[contextId] || {};
    
    contextExamples[id] = code;
    codeExamples[contextId] = contextExamples;
    
    // Use regular save for code examples to avoid rate limiting
    // Code examples aren't as critical as programs and progress
    return this.saveToGist({ codeExamples });
  }

  // Add debounce support for frequent saves
  private saveDebounceTimers: Record<string, NodeJS.Timeout> = {};
  private lastSaveTime = 0;
  private readonly MIN_SAVE_INTERVAL = 2000; // Minimum time between saves (ms)
  
  /**
   * Debounced save to prevent excessive API calls
   * This will ensure we don't make more than one save every MIN_SAVE_INTERVAL ms
   */
  private debouncedSave(key: string, saveFunction: () => Promise<boolean>): Promise<boolean> {
    // Clear any existing timer for this key
    if (this.saveDebounceTimers[key]) {
      clearTimeout(this.saveDebounceTimers[key]);
    }
    
    return new Promise((resolve) => {
      this.saveDebounceTimers[key] = setTimeout(async () => {
        // Check if we need to wait to respect rate limits
        const now = Date.now();
        const timeSinceLastSave = now - this.lastSaveTime;
        
        if (timeSinceLastSave < this.MIN_SAVE_INTERVAL) {
          const waitTime = this.MIN_SAVE_INTERVAL - timeSinceLastSave;
          await new Promise(r => setTimeout(r, waitTime));
        }
        
        // Perform the save
        try {
          const result = await saveFunction();
          this.lastSaveTime = Date.now();
          resolve(result);
        } catch (error) {
          console.error('Debounced save error:', error);
          resolve(false);
        }
      }, 500); // Debounce for 500ms
    });
  }
  
  async saveCodeExamples(examples: Record<string, string>, contextId = 'global'): Promise<boolean> {
    // Don't log every save to reduce console noise
    const codeExamples = this.cachedData.codeExamples || {};
    codeExamples[contextId] = examples;
    
    // Use debounced regular save for code examples to avoid rate limiting
    return this.debouncedSave(`codeExamples_${contextId}`, () => {
      return this.saveToGist({ codeExamples });
    });
  }

  async getCodeExamples(contextId = 'global'): Promise<Record<string, string>> {
    await this.loadFromGist();
    const codeExamples = this.cachedData.codeExamples || this.getDefaultData().codeExamples || {};
    return codeExamples[contextId] || {};
  }
  
  // Get current Gist ID (for testing/debugging)
  getCurrentGistId(): string | null | undefined {
    return this.gistId;
  }
}

// Create a singleton instance
const gistStorageService = new GistStorageService();
export default gistStorageService;
