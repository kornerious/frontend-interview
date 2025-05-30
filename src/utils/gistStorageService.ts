import { Octokit } from '@octokit/rest';

interface GistData {
  settings?: any;
  progress?: any;
  programs?: any;
  userAnswers?: any;
  analysis?: any;
  bookmarks?: any;
  conversations?: any;
  codeExamples?: any;
}

class GistStorageService {
  private octokit: Octokit | null = null;
  private gistId: string | null | undefined = null;
  private isInitialized = false;
  private cachedData: GistData = {};
  private fileName = process.env.NEXT_PUBLIC_GIST_FILENAME || "FrontendDevInterview.json";
  private envGistId = process.env.NEXT_PUBLIC_GIST_ID;

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
      
      this.gistId = newGist.data.id;
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
        if (gistId.includes('#')) {
          gistId = gistId.split('#')[0]; // Remove fragment identifier
        }
        
        console.log('Extracted Gist ID from URL:', gistId);
        
        // Use the Octokit API to get the raw content
        const response = await this.octokit.gists.get({ gist_id: gistId });
        if (response.data.files && response.data.files[this.fileName]) {
          const fileContent = response.data.files[this.fileName];
          if (fileContent && fileContent.content) {
            this.cachedData = JSON.parse(fileContent.content);
          }
        } else {
          console.error('Could not find the expected file in the Gist');
          return false;
        }
      } else {
        // Handle direct raw URLs
        const response = await fetch(url);
        if (!response.ok) {
          console.error(`HTTP error! status: ${response.status}`);
          return false;
        }
        
        this.cachedData = await response.json();
      }
      
      // Update our gist with the imported data
      if (this.gistId) {
        await this.octokit.gists.update({
          gist_id: this.gistId,
          files: {
            [this.fileName]: {
              content: JSON.stringify(this.cachedData, null, 2)
            }
          }
        });
      }
      
      console.log('Successfully imported data from Gist');
      return true;
    } catch (error) {
      console.error('Error importing data from Gist URL:', error);
      return false;
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
  async saveProgram(program: any): Promise<boolean> {
    const programs = this.cachedData.programs || [];
    const index = programs.findIndex((p: any) => p.id === program.id);
    
    if (index !== -1) {
      programs[index] = program;
    } else {
      programs.push(program);
    }
    
    return this.saveToGist({ programs });
  }

  async getAllPrograms(): Promise<any[]> {
    await this.loadFromGist();
    return this.cachedData.programs || this.getDefaultData().programs;
  }

  async getProgram(id: string): Promise<any | undefined> {
    await this.loadFromGist();
    const programs = this.cachedData.programs || this.getDefaultData().programs;
    return programs.find((p: any) => p.id === id);
  }

  // Progress
  async saveProgress(progress: any): Promise<boolean> {
    const allProgress = this.cachedData.progress || [];
    allProgress.push(progress);
    return this.saveToGist({ progress: allProgress });
  }

  async getAllProgress(): Promise<any[]> {
    await this.loadFromGist();
    return this.cachedData.progress || this.getDefaultData().progress;
  }

  // User Answers
  async saveUserAnswers(answers: Record<string, string>): Promise<boolean> {
    return this.saveToGist({ userAnswers: answers });
  }

  async getUserAnswers(): Promise<Record<string, string>> {
    await this.loadFromGist();
    return this.cachedData.userAnswers || this.getDefaultData().userAnswers;
  }

  // Analysis
  async saveAnalysis(analysis: Record<string, any>): Promise<boolean> {
    return this.saveToGist({ analysis });
  }

  async getAnalysis(): Promise<Record<string, any>> {
    await this.loadFromGist();
    return this.cachedData.analysis || this.getDefaultData().analysis;
  }

  // Bookmarks
  async saveBookmarks(bookmarks: { questions: string[], tasks: string[], theory: string[] }): Promise<boolean> {
    return this.saveToGist({ bookmarks });
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
    const conversations = this.cachedData.conversations || this.getDefaultData().conversations;
    return conversations[sessionId] || [];
  }

  // Code Examples
  async saveCodeExample(id: string, code: string, contextId = 'global'): Promise<boolean> {
    const codeExamples = this.cachedData.codeExamples || {};
    const contextExamples = codeExamples[contextId] || {};
    
    contextExamples[id] = code;
    codeExamples[contextId] = contextExamples;
    
    return this.saveToGist({ codeExamples });
  }

  async saveCodeExamples(examples: Record<string, string>, contextId = 'global'): Promise<boolean> {
    const codeExamples = this.cachedData.codeExamples || {};
    codeExamples[contextId] = examples;
    
    return this.saveToGist({ codeExamples });
  }

  async getCodeExamples(contextId = 'global'): Promise<Record<string, string>> {
    await this.loadFromGist();
    const codeExamples = this.cachedData.codeExamples || this.getDefaultData().codeExamples;
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
