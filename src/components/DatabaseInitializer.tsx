import React, { useEffect, useState } from 'react';
import { useProgressStore } from '@/features/progress/useProgressStore';
import { useSettingsStore } from '@/features/progress/useSettingsStore';
import { Box, CircularProgress, Typography } from '@mui/material';
import gistStorageService from "@/utils/gistStorageService";

/**
 * Component that initializes the database when the app starts
 * This ensures all data is loaded from GitHub Gists, which provides cloud storage for your settings and progress
 */
const DatabaseInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const progressStore = useProgressStore();
  const settingsStore = useSettingsStore();

  useEffect(() => {
    // Make TypeScript happy with our custom initialization methods
    const initializeProgress = (progressStore as any)._initializeFromDatabase;
    const initializeSettings = (settingsStore as any)._initializeFromDatabase;

    async function initializeDatabase() {
      try {
        console.log("Initializing database...");
        
        // First load settings
        await initializeSettings();
        console.log("Settings loaded");

        // Always try to initialize GitHub Gist storage if environment variables or settings have the token
        const settings = settingsStore.settings;
        const gistToken = settings.githubGistToken || process.env.NEXT_PUBLIC_GITHUB_GIST_TOKEN;
        const gistUrl = process.env.NEXT_PUBLIC_GIST_ID 
          ? `https://gist.githubusercontent.com/kornerious/${process.env.NEXT_PUBLIC_GIST_ID}/raw/${process.env.NEXT_PUBLIC_GIST_FILENAME || "FrontendDevInterview.json"}` 
          : null;
        
        if (gistToken) {
          console.log("Initializing GitHub Gist storage with token:", gistToken.substring(0, 5) + "...");
          console.log("Using Gist ID from env:", process.env.NEXT_PUBLIC_GIST_ID);
          console.log("Using Gist filename from env:", process.env.NEXT_PUBLIC_GIST_FILENAME || "FrontendDevInterview.json");
          
          try {
            // Initialize Gist service with explicit token
            const success = await gistStorageService.initialize(gistToken);
            
            if (success) {
              console.log("GitHub Gist storage initialized successfully");
              
              // If we have a specific Gist URL from env vars, load from that
              if (gistUrl) {
                console.log("Loading data from specified Gist URL:", gistUrl);
                try {
                  const importSuccess = await settingsStore.importFromGistUrl(gistUrl);
                  if (importSuccess) {
                    console.log("Successfully loaded data from specified Gist");
                    return; // Skip further initialization if we loaded from Gist
                  }
                } catch (importError) {
                  console.error("Error loading from specified Gist:", importError);
                }
              }
              
              // Otherwise load settings from current Gist
              const gistSettings = await gistStorageService.getSettings();
              if (gistSettings && Object.keys(gistSettings).length > 0) {
                console.log("Loaded settings from Gist:", gistSettings);
                // Preserve token and storage preference
                const mergedSettings = {
                  ...gistSettings,
                  githubGistToken: gistToken,
                  useGistStorage: true
                };
                settingsStore.loadFromGistSettings(mergedSettings);
              }
            }
          } catch (error) {
            console.error("Error initializing GitHub Gist storage:", error);
          }
        }
        
        // Then load progress data
        await initializeProgress();
        console.log("Progress data loaded");
        
        // Verify database is accessible
        const settingsCheck = settingsStore.settings;
        console.log("Database initialization complete. Settings:", settingsCheck);
        
        setInitialized(true);
      } catch (error) {
        console.error("Error initializing database:", error);
        // Even if there's an error, we should still show the app
        setInitialized(true);
      } finally {
        setLoading(false);
      }
    }

    initializeDatabase();
  }, []);

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100vh',
          bgcolor: theme => theme.palette.background.default
        }}
      >
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading your data...
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Data is being loaded from persistent storage
        </Typography>
      </Box>
    );
  }

  return <>{children}</>;
};

export default DatabaseInitializer;
