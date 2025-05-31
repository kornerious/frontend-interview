import { create } from 'zustand';
import { UserSettings, Technology, AIProvider } from '@/types';
import firebaseService from '@/utils/firebaseService';
import { getAIService } from '@/utils/aiService';
interface SettingsState {
  settings: UserSettings;
  isInitialized: boolean;
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
  useGistStorage: false, // Set to false when using Firebase
  saveAnswers: true,
};

// Cache settings locally to improve loading times
const SETTINGS_CACHE_KEY = 'frontend_interview_settings';

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: { ...defaultSettings },
  isInitialized: false,
  isSaving: false,
  lastSaved: null,
  
  setName: (name) => {
    set(state => {
      const newSettings = { ...state.settings, name };
      
      // Save to Firebase
      firebaseService.saveSettings(newSettings).catch(console.error);
      

      return { 
        settings: newSettings,
        lastSaved: new Date() 
      };
    });
  },
  
  setTechnologies: (technologies) => {
    set(state => {
      const newSettings = { ...state.settings, selectedTechnologies: technologies };
      
      // Save to Firebase
      firebaseService.saveSettings(newSettings).catch(console.error);

      return { 
        settings: newSettings,
        lastSaved: new Date() 
      };
    });
  },
  
  setLearningDuration: (duration) => {
    set(state => {
      // Important: Force duration to be a number
      const numericDuration = typeof duration === 'string' ? parseInt(duration, 10) : duration;
      
      const newSettings = { ...state.settings, learningDuration: numericDuration };
      
      // Save to Firebase with background execution to prevent UI blocking
      const saveToFirebase = async () => {
        try {
          // Get the latest settings from Firebase to avoid overwriting
          const firebaseSettings = await firebaseService.getSettings() || {};
          
          // Create updated settings with the new duration
          const mergedSettings = {
            ...firebaseSettings,
            learningDuration: numericDuration,
          };
          
          // Save directly to Firebase
          await firebaseService.saveSettings(mergedSettings);

          // Update last saved date
          set({ lastSaved: new Date() });
        } catch (error) {
          console.error('❌ Error saving learning duration to Firebase:', error);
        }
      };
      
      // Start the save process without waiting
      saveToFirebase();
      
      return { settings: newSettings };
    });
  },
  
  toggleDarkMode: () => {
    set(state => {
      const darkMode = !state.settings.darkMode;
      const codeEditorTheme = darkMode ? 'vs-dark' : 'light';
      
      const newSettings = { 
        ...state.settings, 
        darkMode,
        codeEditorTheme
      };
      
      // Save to Firebase
      firebaseService.saveSettings(newSettings).catch(console.error);

      return { 
        settings: newSettings,
        lastSaved: new Date() 
      };
    });
  },
  
  setCodeEditorTheme: (theme) => {
    set(state => {
      const newSettings = { ...state.settings, codeEditorTheme: theme };
      
      // Save to Firebase
      firebaseService.saveSettings(newSettings).catch(console.error);

      return { 
        settings: newSettings,
        lastSaved: new Date() 
      };
    });
  },
  
  setAIProvider: (provider) => {
    set(state => {
      const newSettings = { ...state.settings, aiProvider: provider };
      
      // Initialize the selected AI service based on provider
      const initializeSelectedService = async () => {
        try {
          const aiService = await getAIService(provider);
          
          // Check which API key to use
          let apiKey = '';
          switch (provider) {
            case 'openai':
              apiKey = state.settings.openAIApiKey;
              break;
            case 'claude':
              apiKey = state.settings.claudeApiKey;
              break;
            case 'gemini':
              apiKey = state.settings.geminiApiKey;
              break;
          }
          
          // Initialize with API key if available
          if (apiKey) {
            await aiService.initialize({ apiKey });
            console.log(`✓ Initialized ${provider} AI service successfully`);
          } else {
            console.warn(`⚠️ No API key available for ${provider}`);
          }
        } catch (error) {
          console.error(`❌ Error initializing ${provider} service:`, error);
        }
      };
      
      // Start initialization without waiting
      initializeSelectedService();
      
      // Save to Firebase
      firebaseService.saveSettings(newSettings).catch(console.error);

      return { 
        settings: newSettings,
        lastSaved: new Date() 
      };
    });
  },
  
  setOpenAIApiKey: (apiKey) => {
    set(state => {
      const newSettings = { ...state.settings, openAIApiKey: apiKey };
      
      // Save to Firebase
      firebaseService.saveSettings(newSettings).catch(console.error);

      return { 
        settings: newSettings,
        lastSaved: new Date() 
      };
    });
  },
  
  setClaudeApiKey: (apiKey) => {
    set(state => {
      const newSettings = { ...state.settings, claudeApiKey: apiKey };
      
      // Initialize Claude if it's the current provider
      if (state.settings.aiProvider === 'claude') {
        getAIService('claude')
          .then(service => service.initialize({ apiKey }))
          .then(() => console.log('✓ Claude service initialized with new API key'))
          .catch(error => console.error('❌ Error initializing Claude:', error));
      }
      
      // Save to Firebase
      firebaseService.saveSettings(newSettings).catch(console.error);

      return { 
        settings: newSettings,
        lastSaved: new Date() 
      };
    });
  },
  
  setGeminiApiKey: (apiKey) => {
    set(state => {
      const newSettings = { ...state.settings, geminiApiKey: apiKey };
      
      // Initialize Gemini if it's the current provider
      const initializeGemini = async () => {
        if (state.settings.aiProvider === 'gemini') {
          try {
            const geminiService = await getAIService('gemini');
            await geminiService.initialize({ apiKey });
            console.log('✓ Gemini service initialized with new API key');
          } catch (error) {
            console.error('❌ Error initializing Gemini:', error);
          }
        }
      };
      
      // Start initialization without waiting
      initializeGemini();
      
      // Save to Firebase
      firebaseService.saveSettings(newSettings).catch(console.error);

      return { 
        settings: newSettings,
        lastSaved: new Date() 
      };
    });
  },
  
  setGithubGistToken: (apiKey) => {
    set(state => {
      const newSettings = { ...state.settings, githubGistToken: apiKey };
      
      // Save to Firebase
      firebaseService.saveSettings(newSettings).catch(console.error);

      return { 
        settings: newSettings,
        lastSaved: new Date() 
      };
    });
  },
  
  toggleUseGistStorage: () => {
    set(state => {
      // This is a no-op in Firebase implementation, always returns true
      // Kept for API compatibility with the original store
      return state;
    });
  },
  
  toggleSaveAnswers: () => {
    set(state => {
      const newSettings = { ...state.settings, saveAnswers: !state.settings.saveAnswers };
      
      // Save to Firebase
      firebaseService.saveSettings(newSettings).catch(console.error);

      return { 
        settings: newSettings,
        lastSaved: new Date() 
      };
    });
  },
  
  saveToFile: async (filename = 'frontend-interview-settings.json') => {
    const { settings } = get();
    const exportData = JSON.stringify(settings, null, 2);
    
    // Create a blob for download
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create download link and trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    
    return filename;
  },
  
  loadFromFile: async (fileContent: string) => {
    try {
      // Parse JSON
      const importData = JSON.parse(fileContent);
      
      // Validate that it contains required fields
      if (!importData.name || !Array.isArray(importData.selectedTechnologies)) {
        console.error('Invalid settings file format');
        return false;
      }
      
      // Current settings
      const currentSettings = get().settings;
      
      // Merge imported settings with current settings
      // Preserve API keys if not provided in imported data
      const mergedSettings: UserSettings = {
        ...currentSettings,
        ...importData,
        // Preserve API keys if not present in import
        openAIApiKey: importData.openAIApiKey || currentSettings.openAIApiKey || "",
        claudeApiKey: importData.claudeApiKey || currentSettings.claudeApiKey || "",
        geminiApiKey: importData.geminiApiKey || currentSettings.geminiApiKey || "",
        // Always use Firebase storage in this implementation, so useGistStorage is false
        useGistStorage: false
      };
      
      // Save to Firebase
      await firebaseService.saveSettings(mergedSettings);

      // Update state
      set({ 
        settings: mergedSettings,
        lastSaved: new Date() 
      });
      
      return true;
    } catch (error) {
      console.error("Error loading data from file:", error);
      return false;
    }
  },
  
  _initializeFromDatabase: async () => {
    try {
      // Initialize Firebase and get settings
      await firebaseService.initialize();
      
      // Get settings from Firebase
      const firebaseSettings = await firebaseService.getSettings();
      
      if (firebaseSettings) {
        // Merge with default settings
        const normalizedSettings = {
          ...defaultSettings,
          ...firebaseSettings,
          // Always use Firebase in this implementation, so useGistStorage is false
          useGistStorage: false
        };
        
        // Update state
        set({ 
          settings: normalizedSettings,
          isInitialized: true 
        });
        
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
            console.log(`✓ Initialized ${aiProvider} AI service successfully`);
          } catch (error) {
            console.error(`❌ Error initializing ${aiProvider} service:`, error);
          }
        }
      } else {
        // No settings found in Firebase, use defaults
        console.log('No settings found in Firebase, using defaults...');
        
        // Save default settings to Firebase
        await firebaseService.saveSettings(defaultSettings);
        
        // Update state
        set({ 
          settings: { ...defaultSettings },
          isInitialized: true 
        });
      }
    } catch (error) {
      console.error('❌ Error during settings initialization:', error);
      
      // Fallback to default settings if initialization fails
      set({ 
        settings: { ...defaultSettings },
        isInitialized: true 
      });
    }
  }
}));
