import React, { useEffect, useState } from 'react';
import { useProgressStore } from '@/features/progress/useProgressStoreFirebase';
import { useSettingsStore } from '@/features/progress/useSettingsStore';
import { Box, CircularProgress, Typography } from '@mui/material';
import firebaseService from '@/utils/firebaseService';

/**
 * Component that initializes the database when the app starts
 * This ensures all data is loaded from Firebase, which provides cloud storage for your settings and progress
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
        console.log('Initializing Firebase database...');
        
        // Initialize Firebase service
        const isInitialized = await firebaseService.initialize();
        if (!isInitialized) {
          console.error('Failed to initialize Firebase service');
          // Even if there's an error, we should still show the app
          setInitialized(true);
          setLoading(false);
          return;
        }
        
        console.log('Firebase initialized successfully');
        
        // First load settings
        console.log('Loading settings from Firebase...');
        await initializeSettings();
        console.log('Settings loaded successfully');
        
        // Then load progress data
        console.log('Loading progress data from Firebase...');
        await initializeProgress();
        console.log('Progress data loaded successfully');
        
        // Verify program data
        const currentProgram = progressStore.currentProgram;
        const archivedPrograms = progressStore.archivedPrograms || [];
        const totalPrograms = (currentProgram ? 1 : 0) + archivedPrograms.length;
        
        console.log(`Loaded ${totalPrograms} program(s) from Firebase`);
        if (currentProgram) {
          console.log('Current active program:', currentProgram.id);
        }
        
        // Verify database is accessible
        const settingsCheck = settingsStore.settings;
        console.log('Settings verified, database is accessible');

        setInitialized(true);
      } catch (error) {
        console.error('Error initializing database:', error);
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
