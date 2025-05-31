/**
 * Settings Store Manager
 * Always uses Firebase for settings storage
 */

import { useSettingsStore as useFirebaseSettingsStore } from './useSettingsStoreFirebase';
import { UserSettings } from '@/types';

// Always use Firebase settings store
export const useSettingsStore = useFirebaseSettingsStore;

/**
 * Helper function to import settings into Firebase (preserved for compatibility)
 */
export async function migrateSettingsToFirebase(settings?: any): Promise<boolean> {
  try {
    if (settings) {
      // Set provided settings in Firebase store
      useSettingsStore.setState({ settings });
    }
    
    // Call the initialization method to ensure settings are properly saved
    await useSettingsStore.getState()._initializeFromDatabase();
    
    console.log('✓ Settings successfully saved to Firebase');
    return true;
  } catch (error) {
    console.error('❌ Error saving settings to Firebase:', error);
    return false;
  }
}

/**
 * Helper function to get current settings regardless of storage mechanism
 */
export function getCurrentSettings(): UserSettings {
  return useSettingsStore.getState().settings;
}

/**
 * Initialize settings from the appropriate database
 */
export async function initializeSettings(): Promise<void> {
  await useSettingsStore.getState()._initializeFromDatabase();
}
