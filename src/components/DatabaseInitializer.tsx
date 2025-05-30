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
            
            // Add a delay after API call to avoid rate limiting
            await delayBetweenApiCalls(1000);
            
            if (success) {
              console.log("GitHub Gist storage initialized successfully");
              
              // If we have a specific Gist URL from env vars, load from that
              if (gistUrl) {
                console.log("Loading data from specified Gist URL:", gistUrl);
                try {
                  // Add delay before this API call
                  await delayBetweenApiCalls(1000);
                  
                  // Only try to import if we haven't hit rate limits
                  if (!hasHitRateLimit) {
                    const importSuccess = await settingsStore.importFromGistUrl(gistUrl);
                    if (importSuccess) {
                      console.log("Successfully loaded data from specified Gist");
                      return; // Skip further initialization if we loaded from Gist
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
                      console.log(`Rate limit will reset at ${resetDate.toLocaleTimeString()}`);  
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
                    console.log("Loaded settings from Gist:", gistSettings);
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
            console.log("Progress data loaded");
            
            // Force a complete reload of the progress store data
            try {
              // Delay before reloading to avoid rate limits
              await delayBetweenApiCalls(1000);
              
              console.log("🔄 Reloading all progress and program data...");
              
              // Force a full refresh of the progress store data by calling _initializeFromDatabase again
              await initializeProgress();
              
              // Check if programs are loaded after reinitialization
              const currentProgram = progressStore.currentProgram;
              const archivedPrograms = progressStore.archivedPrograms || [];
              const totalPrograms = (currentProgram ? 1 : 0) + archivedPrograms.length;
              
              if (currentProgram || archivedPrograms.length > 0) {
                console.log(`📋 Verified ${totalPrograms} programs loaded (${archivedPrograms.length} archived, ${currentProgram ? '1 current' : '0 current'})`); 
              } else {
                console.log("⚠️ No programs found after reloading data");
                
                // Check programs directly from Gist service as a fallback
                const gistPrograms = await gistStorageService.getAllPrograms();
                if (gistPrograms && gistPrograms.length > 0) {
                  console.log(`🔍 Found ${gistPrograms.length} programs in Gist, but they weren't loaded into the store`);
                }
              }
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
