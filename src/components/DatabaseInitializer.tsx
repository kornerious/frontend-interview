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

    // Add delay helper for rate limiting API calls
    const delayBetweenApiCalls = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
    // Keep track of rate limit errors
    let hasHitRateLimit = false;
    let rateLimitResetTime: number | null = null;
  
    async function initializeDatabase() {
      try {
        
        // First load settings
        await initializeSettings();

        // Always try to initialize GitHub Gist storage if environment variables or settings have the token
        const settings = settingsStore.settings;
        const gistToken = settings.githubGistToken || process.env.NEXT_PUBLIC_GITHUB_GIST_TOKEN;
        const gistUrl = process.env.NEXT_PUBLIC_GIST_ID 
          ? `https://gist.githubusercontent.com/kornerious/${process.env.NEXT_PUBLIC_GIST_ID}/raw/${process.env.NEXT_PUBLIC_GIST_FILENAME || "FrontendDevInterview.json"}` 
          : null;
        
        if (gistToken) {

          try {
            // Initialize Gist service with explicit token
            const success = await gistStorageService.initialize(gistToken);
            
            // Add a delay after API call to avoid rate limiting
            await delayBetweenApiCalls(1000);
            
            if (success) {

              // If we have a specific Gist URL from env vars, load from that
              if (gistUrl) {

                try {
                  // Add delay before this API call
                  await delayBetweenApiCalls(1000);
                  
                  // Only try to import if we haven't hit rate limits
                  if (!hasHitRateLimit) {
                    const importSuccess = await settingsStore.importFromGistUrl(gistUrl);
                    if (importSuccess) {

                      // DON'T return early - we need to initialize the progress store
                      // Force a progress store initialization to load programs

                      try {
                        await initializeProgress();

                        
                        // Verify program was loaded
                        const currentProgram = progressStore.currentProgram;
                        if (currentProgram) {

                        } else {
                          console.warn('⚠️ No program loaded after initialization');
                        }
                      } catch (initError) {
                        console.error('❌ Error initializing progress after import:', initError);
                      }
                      
                      // Now we can return - everything is properly initialized
                      return;
                    }
                  } else {
                    console.warn("Skipping Gist import due to rate limits. Will retry later.");
                  }
                } catch (importError: any) {
                  console.error("Error loading from specified Gist:", importError);
                  
                  // Check for rate limit errors
                  if (importError?.message?.includes('API rate limit exceeded')) {
                    hasHitRateLimit = true;
                    console.warn("⚠️ Hit GitHub API rate limit during initialization");
                    
                    // Try to extract reset time
                    if (importError.response?.headers?.['x-ratelimit-reset']) {
                      rateLimitResetTime = parseInt(importError.response.headers['x-ratelimit-reset']) * 1000;
                      const resetDate = new Date(rateLimitResetTime);

                    }
                  }
                }
              }
              
              // Otherwise load settings from current Gist, but only if we haven't hit rate limits
              if (!hasHitRateLimit) {
                try {
                  // Add delay before API call
                  await delayBetweenApiCalls(1000);
                  
                  const gistSettings = await gistStorageService.getSettings();
                  if (gistSettings && Object.keys(gistSettings).length > 0) {

                    // Preserve token and storage preference
                    const mergedSettings = {
                      ...gistSettings,
                      githubGistToken: gistToken,
                      useGistStorage: true
                    };
                    settingsStore.loadFromGistSettings(mergedSettings);
                  }
                } catch (settingsError: any) {
                  console.error("Error loading settings from Gist:", settingsError);
                  
                  // Check for rate limit errors
                  if (settingsError?.message?.includes('API rate limit exceeded')) {
                    hasHitRateLimit = true;
                    console.warn("⚠️ Hit GitHub API rate limit while loading settings");
                  }
                }
              } else {
                console.warn("Skipping settings load due to rate limits. Will retry later.");
              }
            }
          } catch (error) {
            console.error("Error initializing GitHub Gist storage:", error);
          }
        }
        
        // Then load progress data
        try {
          // Add delay before loading progress
          await delayBetweenApiCalls(1000);
          
          // Only load progress if we haven't hit rate limits
          if (!hasHitRateLimit) {
            await initializeProgress();

            // Force a complete reload of the progress store data
            try {
              // Delay before reloading to avoid rate limits
              await delayBetweenApiCalls(1000);

              // Force a full refresh of the progress store data by calling _initializeFromDatabase again
              await initializeProgress();
              
              // Check if programs are loaded after reinitialization
              const currentProgram = progressStore.currentProgram;
              const archivedPrograms = progressStore.archivedPrograms || [];
              const totalPrograms = (currentProgram ? 1 : 0) + archivedPrograms.length;

            } catch (reloadError: any) {
              console.error("❌ Error reloading progress and program data:", reloadError);
              
              // Check for rate limit errors
              if (reloadError?.message?.includes('API rate limit exceeded')) {
                hasHitRateLimit = true;
                console.warn("⚠️ Hit GitHub API rate limit while reloading data");
              }
            }
          } else {
            console.warn("Skipping progress load due to rate limits. Will retry on next app launch.");
          }
        } catch (progressError: any) {
          console.error("Error loading progress:", progressError);
          
          // Check for rate limit errors
          if (progressError?.message?.includes('API rate limit exceeded')) {
            hasHitRateLimit = true;
            console.warn("⚠️ Hit GitHub API rate limit while loading progress");
          }
        }
        
        // Show warning if we hit rate limits
        if (hasHitRateLimit) {
          console.warn("⚠️ Some data couldn't be loaded due to GitHub API rate limits.");
          if (rateLimitResetTime) {
            const resetDate = new Date(rateLimitResetTime);
            console.warn(`Rate limits will reset at ${resetDate.toLocaleTimeString()}. Please try again after that time.`);
          }
        }
        
        // Verify database is accessible
        const settingsCheck = settingsStore.settings;

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
