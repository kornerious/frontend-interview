import { create } from 'zustand';
import { UserSettings, Technology, AIProvider } from '@/types';
import gistStorageService from '@/utils/gistStorageService';
import { getAIService } from '@/utils/aiService';

interface SettingsState {
  settings: UserSettings;
  gistInitialized: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  setName: (name: string) => void;
  setTechnologies: (technologies: Technology[]) => void;
  setLearningDuration: (duration: number) => void;
  toggleDarkMode: () => void;
  setCodeEditorTheme: (theme: string) => void;
  setAIProvider: (provider: AIProvider) => void;
  setOpenAIApiKey: (apiKey: string) => void;
  setClaudeApiKey: (apiKey: string) => void;
  setGeminiApiKey: (apiKey: string) => void;
  setGithubGistToken: (apiKey: string) => void;
  toggleUseGistStorage: () => void;
  importFromGistUrl: (url: string) => Promise<boolean>;
  loadFromGistSettings: (settings: UserSettings) => void;
  toggleSaveAnswers: () => void;
  saveToFile: (filename?: string) => Promise<string>;
  loadFromFile: (fileContent: string) => Promise<boolean>;
  _initializeFromDatabase: () => Promise<void>;
}

const defaultSettings: UserSettings = {
  name: "User",
  selectedTechnologies: ["React", "TypeScript", "JavaScript"],
  learningDuration: 30, // days
  darkMode: true,
  codeEditorTheme: "vs-dark",
  aiProvider: "claude", // Set Claude as default
  openAIApiKey: "",
  claudeApiKey: process.env.NEXT_PUBLIC_CLAUDE_API_KEY || "",
  geminiApiKey: "",
  githubGistToken: process.env.NEXT_PUBLIC_GITHUB_GIST_TOKEN || "",
  useGistStorage: !!process.env.NEXT_PUBLIC_GITHUB_GIST_TOKEN, // Auto-enable if token exists
  saveAnswers: true,
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: { ...defaultSettings },
  gistInitialized: false,
  isSaving: false,
  lastSaved: null,
  
  setName: (name) => {
    set(state => {
      const newSettings = { ...state.settings, name };
      
      // Use gistStorageService directly
      if (state.settings.githubGistToken) {
        gistStorageService.saveSettings(newSettings).catch(console.error);
      }
      
      return { settings: newSettings };
    });
  },
  
  setTechnologies: (technologies) => {
    set(state => {
      const newSettings = { ...state.settings, selectedTechnologies: technologies };
      
      // Use gistStorageService directly
      if (state.settings.githubGistToken) {
        gistStorageService.saveSettings(newSettings).catch(console.error);
      }
      
      return { settings: newSettings };
    });
  },
  
  setLearningDuration: (duration) => {
    set(state => {
      console.log('🔄 Setting learning duration to', duration);
      // Important: Force duration to be a number
      const numericDuration = typeof duration === 'string' ? parseInt(duration, 10) : duration;
      
      const newSettings = { ...state.settings, learningDuration: numericDuration };
      
      // Critical fix: Make sure the Gist is updated directly first to prevent race conditions
      const saveToGist = async () => {
        if (state.settings.useGistStorage && state.settings.githubGistToken) {
          try {
            console.log('🔄 Directly saving learning duration to Gist', numericDuration);
            // Initialize Gist storage to ensure it's ready
            await gistStorageService.initialize(state.settings.githubGistToken);
            
            // Get the latest settings from Gist to avoid overwriting
            const gistSettings = await gistStorageService.getSettings() || {};
            
            // Create updated settings with the new duration
            const mergedSettings = {
              ...gistSettings,
              learningDuration: numericDuration,
              // Make sure we preserve the token
              githubGistToken: state.settings.githubGistToken
            };
            
            // Save directly to Gist
            await gistStorageService.saveSettings(mergedSettings);
            console.log('✅ Successfully saved learning duration to Gist', numericDuration);
          } catch (error) {
            console.error('❌ Error saving learning duration to Gist:', error);
          }
        }
      };
      
      // Start the save process without waiting
      saveToGist();
      
      return { settings: newSettings };
    });
  },
  
  toggleDarkMode: () => {
    set(state => {
      const newDarkMode = !state.settings.darkMode;
      // Get the associated code editor theme
      const newCodeEditorTheme = newDarkMode ? "vs-dark" : "light";
      
      // Create new settings object with updated values
      const newSettings = { 
        ...state.settings, 
        darkMode: newDarkMode,
        codeEditorTheme: newCodeEditorTheme 
      };
      
      // Save to Gist storage if enabled
      if (state.settings.githubGistToken) {
        (async () => {
          try {
            // Initialize gist service if needed
            if (!state.gistInitialized) {
              await gistStorageService.initialize(state.settings.githubGistToken);
              set({ gistInitialized: true });
            }
            
            // Save directly to Gist
            const saved = await gistStorageService.saveSettings(newSettings);
            console.log("Saved dark mode settings to Gist:", saved ? "SUCCESS" : "FAILED");
            
            // Update lastSaved timestamp if successful
            if (saved) {
              set({ lastSaved: new Date() });
            }
          } catch (error) {
            console.error("Error saving dark mode settings to Gist:", error);
          }
        })();
      }
      
      return { settings: newSettings };
    });
  },
  
  setCodeEditorTheme: (theme) => {
    set(state => {
      const newSettings = { ...state.settings, codeEditorTheme: theme };
      
      // Save only to Gist storage
      if (state.settings.githubGistToken) {
        gistStorageService.saveSettings(newSettings).catch(console.error);
      }
      
      return { settings: newSettings };
    });
  },
  
  setAIProvider: (provider) => {
    set(state => {
      const newSettings = { ...state.settings, aiProvider: provider };
      gistStorageService.saveSettings(newSettings).catch(console.error);
      
      // Initialize the selected AI service based on provider
      const initializeSelectedService = async () => {
        const aiService = await getAIService(provider);
        switch (provider) {
          case 'openai':
            if (state.settings.openAIApiKey) {
              try {
                await aiService.initialize({ apiKey: state.settings.openAIApiKey });
              } catch (error) {
                console.error('Error initializing OpenAI service:', error);
              }
            }
            break;
          case 'claude':
            if (state.settings.claudeApiKey) {
              try {
                await aiService.initialize({ apiKey: state.settings.claudeApiKey });
                console.log('Claude service initialized successfully');
              } catch (error) {
                console.error('Error initializing Claude service:', error);
              }
            }
            break;
          case 'gemini':
            if (state.settings.geminiApiKey) {
              try {
                await aiService.initialize({ apiKey: state.settings.geminiApiKey });
                console.log('Gemini service initialized');
              } catch (error) {
                console.error('Error initializing Gemini service:', error);
              }
            }
            break;
        }
      };
      
      initializeSelectedService();
      return { settings: newSettings };
    });
  },
  
  setOpenAIApiKey: (apiKey) => {
    set(state => {
      const newSettings = { ...state.settings, openAIApiKey: apiKey };
      gistStorageService.saveSettings(newSettings).catch(console.error);
      
      // Only initialize OpenAI if it's the selected provider
      if (apiKey && state.settings.aiProvider === 'openai') {
        // Use the AI service factory - must be done asynchronously
        (async () => {
          try {
            const service = await getAIService('openai');
            await service.initialize({ apiKey });
          } catch (error) {
            console.error('Error initializing OpenAI service:', error);
          }
        })();
      }
      
      return { settings: newSettings };
    });
  },
  
  setClaudeApiKey: (apiKey) => {
    set(state => {
      const newSettings = { ...state.settings, claudeApiKey: apiKey };
      gistStorageService.saveSettings(newSettings).catch(console.error);
      
      console.log('Claude API Key set:', apiKey ? 'API key provided' : 'No API key');
      
      // Initialize Claude if it's the selected provider
      if (apiKey && state.settings.aiProvider === 'claude') {
        console.log('Attempting to initialize Claude service with provided key...');
        
        // Use the AI service factory - must be done asynchronously
        (async () => {
          try {
            const service = await getAIService('claude');
            console.log('Claude service retrieved from factory');
            
            const result = await service.initialize({ apiKey });
            console.log('Claude service initialized result:', result);
            
            if (!result) {
              console.error('Claude service initialization returned false');
            } else {
              console.log('Claude API key set and service initialized successfully');
            }
          } catch (error) {
            console.error('Error initializing Claude service:', error);
          }
        })();
      }
      
      return { settings: newSettings };
    });
  },
  
  setGeminiApiKey: (apiKey) => {
    set(state => {
      const newSettings = { ...state.settings, geminiApiKey: apiKey };
      gistStorageService.saveSettings(newSettings).catch(console.error);
      
      // Also save to GitHub Gist if enabled
      if (state.settings.useGistStorage && state.settings.githubGistToken) {
        gistStorageService.saveSettings(newSettings).catch(console.error);
      }
      
      // Initialize Gemini if it's the selected provider
      if (apiKey && state.settings.aiProvider === 'gemini') {
        const initializeGemini = async () => {
          const aiService = await getAIService("gemini");
          try {
            await aiService.initialize({ apiKey });
            console.log("Gemini service initialized successfully");
          } catch (error) {
            console.error("Error initializing Gemini service:", error);
          }
        };
        
        initializeGemini();
      }
      
      return { settings: newSettings };
    });
  },
  
  setGithubGistToken: (apiKey) => {
    set(state => {
      const newSettings = { ...state.settings, githubGistToken: apiKey };
      
      // Save to GitHub Gist to ensure settings persistence
      gistStorageService.saveSettings(newSettings).catch(console.error);
      
      // If we're using Gist storage and have a token, initialize Gist service
      if (apiKey && state.settings.useGistStorage) {
        const initializeGistStorage = async () => {
          try {
            await gistStorageService.initialize(apiKey);
            console.log("GitHub Gist storage initialized successfully");
            
            // If initialization was successful, also save settings to gist
            await gistStorageService.saveSettings(newSettings);
          } catch (error) {
            console.error("Error initializing GitHub Gist storage:", error);
          }
        };
        
        initializeGistStorage();
      }
      
      return { settings: newSettings };
    });
  },

  toggleUseGistStorage: () => {
    set(state => {
      // Create new settings object with toggled useGistStorage
      const newSettings = {
        ...state.settings,
        useGistStorage: !state.settings.useGistStorage
      };
      
      console.log('Toggling Gist storage to:', newSettings.useGistStorage);
      console.log('Has Gist token:', !!newSettings.githubGistToken);
      
      // Save new settings to database
      gistStorageService.saveSettings(newSettings)
        .then(() => console.log('Settings saved to local database'))
        .catch(err => console.error('Error saving to local database:', err));
      
      // If enabling Gist storage, ensure it's initialized
      if (newSettings.useGistStorage) {
        console.log('Enabling Gist storage, starting initialization');
        
        // Get token from settings or environment
        const token = newSettings.githubGistToken || process.env.NEXT_PUBLIC_GITHUB_GIST_TOKEN;
        
        if (!token) {
          console.error('No GitHub token available, cannot enable Gist storage');
          return { settings: newSettings };
        }
        
        const initializeGistStorage = async () => {
          try {
            console.log('Initializing Gist storage with token:', token.substring(0, 5) + '...');
            const success = await gistStorageService.initialize(token);
            
            if (success) {
              console.log('GitHub Gist storage initialized successfully');
              
              // Get settings from Gist
              const gistSettings = await gistStorageService.getSettings();
              console.log('Retrieved settings from Gist:', gistSettings);
              
              if (gistSettings && Object.keys(gistSettings).length > 0) {
                // Keep the token and useGistStorage settings from current settings
                const mergedSettings = {
                  ...gistSettings,
                  githubGistToken: token,
                  useGistStorage: true
                };
                
                console.log('Merging Gist settings with local settings');
                
                // Save merged settings back to database
                // Save directly to Gist storage
                await gistStorageService.saveSettings(mergedSettings);
                
                // Update state with merged settings
                console.log('Settings updated with Gist data');
                set({ settings: mergedSettings });
              }
              else {
                // No settings in Gist yet, save current settings to Gist
                console.log('No settings found in Gist, saving current settings');
                await gistStorageService.saveSettings(newSettings);
                console.log('Current settings saved to Gist');
              }
            }
            else {
              console.error('Failed to initialize GitHub Gist storage');
            }
          } catch (error) {
            console.error('Error initializing GitHub Gist storage:', error);
          }
        };
        
        // Start the initialization process
        initializeGistStorage();
      } else {
        console.log('Gist storage disabled');
      }
      
      return { settings: newSettings };
    });
  },
  
  importFromGistUrl: async (url) => {
    try {
      // Use token from settings or environment variables
      const settings = get().settings;
      const token = settings.githubGistToken || process.env.NEXT_PUBLIC_GITHUB_GIST_TOKEN;
      
      if (!token) {
        console.error("GitHub token is required for importing from Gist URL");
        return false;
      }
      
      // Initialize Gist service if not already
      // Don't require useGistStorage to be true, as we might be initializing from env vars
      await gistStorageService.initialize(token);
      
      // Import data from the provided URL
      const success = await gistStorageService.importFromGistUrl(url);
      
      if (success) {
        console.log("Successfully imported data from Gist URL");
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error importing from Gist URL:", error);
      return false;
    }
  },
  
  toggleSaveAnswers: () => {
    set(state => {
      const newSettings = { ...state.settings, saveAnswers: !state.settings.saveAnswers };
      gistStorageService.saveSettings(newSettings).catch(console.error);
      
      // Also save to GitHub Gist if enabled
      if (state.settings.useGistStorage && state.settings.githubGistToken) {
        gistStorageService.saveSettings(newSettings).catch(console.error);
      }
      
      return { settings: newSettings };
    });
  },
  
  saveToFile: async (filename?: string) => {
    const state = get();
    const defaultFilename = `frontend-interview-app-settings-${new Date().toISOString().split("T")[0]}.json`;
    const saveFilename = filename || defaultFilename;
    
    // Create export data structure - omit sensitive data like API keys
    const exportData = {
      settings: {
        ...state.settings,
        // Don't include API keys in exported file for security
        openAIApiKey: "",
        claudeApiKey: "",
        geminiApiKey: ""
      },
      // Get data directly from Gist storage
      programs: await gistStorageService.getAllPrograms(),
      progress: await gistStorageService.getAllProgress()
    };
    
    // Create a Blob with the data
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    
    // Create download link and trigger it
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = saveFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return saveFilename;
  },
  
  loadFromFile: async (fileContent: string) => {
    try {
      const importData = JSON.parse(fileContent);
      
      // Validate the file structure
      if (!importData.settings || !importData.programs || !importData.progress) {
        throw new Error("Invalid file format");
      }
      
      // Merge imported settings with current settings (retain API keys)
      const currentSettings = get().settings;
      const mergedSettings = {
        ...importData.settings,
        // Preserve API keys for security
        openAIApiKey: currentSettings.openAIApiKey || importData.settings.openAIApiKey || "",
        claudeApiKey: currentSettings.claudeApiKey || importData.settings.claudeApiKey || "",
        geminiApiKey: currentSettings.geminiApiKey || importData.settings.geminiApiKey || ""
      };
      
      // Save imported data directly to Gist
      if (currentSettings.githubGistToken) {
        await gistStorageService.saveSettings(mergedSettings);
        
        // Save each program
        for (const program of importData.programs) {
          await gistStorageService.saveProgram(program);
        }
        
        // Save progress records
        for (const record of importData.progress) {
          await gistStorageService.saveProgress(record);
        }
      }
      
      // Update state
      set({ settings: mergedSettings });
      
      return true;
    } catch (error) {
      console.error("Error loading data from file:", error);
      return false;
    }
  },
  
  loadFromGistSettings: (gistSettings) => {
    // Update state with settings from Gist
    set({ settings: gistSettings });
    
    // Also save to local database for backup
    // Settings are already in Gist storage
    // No need to save back to gistStorageService
  },

  _initializeFromDatabase: async () => {
    try {
      console.log('🔄 Starting settings initialization');
      
      // CRITICAL FIX: Always get the direct Gist data first when Gist token is available
      // This ensures we don't overwrite any previously saved values
      const gistToken = process.env.NEXT_PUBLIC_GITHUB_GIST_TOKEN;
      let currentSettings = null;
      
      // First try to get settings directly from Gist if a token exists
      if (gistToken) {
        try {
          console.log('🔍 Gist token exists, initializing Gist storage first');
          await gistStorageService.initialize(gistToken);
          currentSettings = await gistStorageService.getSettings();
          console.log('📦 Retrieved settings directly from Gist', {
            learningDuration: currentSettings?.learningDuration,
            darkMode: currentSettings?.darkMode,
            hasToken: !!currentSettings?.githubGistToken
          });
        } catch (gistError) {
          console.error('❌ Error getting settings from Gist:', gistError);
        }
      }

      if (!currentSettings) {
        console.log('🔍 No settings found in Gist, using defaults');
        currentSettings = {};
      }
      
      if (currentSettings) {
        // IMPORTANT: Maintain the existing values, especially learningDuration
        const normalizedSettings = {
          ...defaultSettings,
          ...currentSettings,
          // Preserve these specific fields exactly as they are in Gist
          learningDuration: currentSettings.learningDuration ?? defaultSettings.learningDuration,
          // Ensure aiProvider exists (for backward compatibility)
          aiProvider: currentSettings.aiProvider || "claude", // Default to Claude
          claudeApiKey: currentSettings.claudeApiKey || "",
          geminiApiKey: currentSettings.geminiApiKey || "",
          githubGistToken: currentSettings.githubGistToken || "",
          useGistStorage: currentSettings.githubGistToken ? true : (currentSettings.useGistStorage || false)
        };
        
        console.log('✅ Applying normalized settings with learning duration:', normalizedSettings.learningDuration);
        set({ settings: normalizedSettings });
        
        // Only save back if we need to normalize
        if (JSON.stringify(normalizedSettings) !== JSON.stringify(currentSettings)) {
          console.log('⚠️ Settings needed normalization, but NOT saving during initialization');
          // Don't save during initialization - this wastes API calls
          // Just use the normalized settings in memory
        }
        
        // Initialize appropriate AI service based on selected provider
        const aiProvider = normalizedSettings.aiProvider;
        const aiService = await getAIService(aiProvider);
        let apiKey = '';
        
        switch (aiProvider) {
          case 'openai':
            apiKey = normalizedSettings.openAIApiKey;
            break;
          case 'claude':
            apiKey = normalizedSettings.claudeApiKey;
            break;
          case 'gemini':
            apiKey = normalizedSettings.geminiApiKey;
            break;
        }
        
        if (apiKey) {
          try {
            await aiService.initialize({ apiKey });
            console.log(`✅ ${aiProvider} service initialized successfully`);
          } catch (error) {
            console.error(`❌ Error initializing ${aiProvider} service:`, error);
          }
        } else {
          console.log(`ℹ️ No API key found for ${aiProvider}`);
        }
      } else {
        // No settings found anywhere, save default settings
        console.log('⚠️ No settings found, saving defaults');
        set({ settings: defaultSettings });
        
        // Save directly to Gist if we have a token
        if (defaultSettings.githubGistToken) {
          await gistStorageService.initialize(defaultSettings.githubGistToken);
          await gistStorageService.saveSettings(defaultSettings);
        }
      }
    } catch (error) {
      console.error('❌ Error during settings initialization:', error);
    }
  }
}));
