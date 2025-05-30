import { useState, useEffect, useCallback } from 'react';
import gistStorageService from '../../utils/gistStorageService';
import { TimeEntry } from '@/types';

/**
 * Hook for tracking time spent on different activities
 */
export function useTimeTracking() {
  const [currentActivity, setCurrentActivity] = useState<TimeEntry | null>(null);
  const [allTimeEntries, setAllTimeEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load existing time entries from gist on component mount
  useEffect(() => {
    const loadEntries = async () => {
      try {
        setIsLoading(true);
        const settings = await gistStorageService.getSettings();
        const entries = settings?.customData?.timeEntries || [];
        if (entries && entries.length > 0) {
          setAllTimeEntries(entries);
        }
      } catch (error) {
        console.error('Failed to load time entries:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadEntries();
  }, []);
  
  // Save time entries whenever they change
  useEffect(() => {
    if (allTimeEntries.length > 0 && !isLoading) {
      const saveEntries = async () => {
        try {
          const settings = await gistStorageService.getSettings() || {};
          const customData = settings.customData || {};
          await gistStorageService.saveSettings({
            ...settings,
            customData: {
              ...customData,
              timeEntries: allTimeEntries
            }
          });
        } catch (error) {
          console.error('Failed to save time entries:', error);
        }
      };
      saveEntries();
    }
  }, [allTimeEntries, isLoading]);

  // Update timer for current activity
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    
    if (currentActivity && !currentActivity.completed) {
      intervalId = setInterval(() => {
        const startTime = new Date(currentActivity.startTime).getTime();
        const currentTime = Date.now();
        const duration = Math.floor((currentTime - startTime) / 1000);
        
        setCurrentActivity(prev => {
          if (prev) {
            return { ...prev, duration };
          }
          return null;
        });
      }, 1000);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [currentActivity]);

  /**
   * Start tracking time for an activity
   */
  const startTimer = useCallback((activity: 'theory' | 'question' | 'coding' | 'review', itemId: string, tags: string[] = []): TimeEntry => {
    // First, stop any current timer
    if (currentActivity) {
      stopTimer();
    }
    
    // Create new time entry
    const newEntry: TimeEntry = {
      id: `time_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      activity,
      itemId,
      startTime: new Date().toISOString(),
      endTime: null,
      duration: 0,
      completed: false,
      tags
    };
    
    setCurrentActivity(newEntry);
    setAllTimeEntries(prev => [...prev, newEntry]);
    
    return newEntry;
  }, [currentActivity]);

  /**
   * Stop the current timer
   */
  const stopTimer = useCallback((): TimeEntry | null => {
    if (!currentActivity) {
      return null;
    }
    
    const endTime = new Date().toISOString();
    const startTime = new Date(currentActivity.startTime).getTime();
    const endTimeMs = new Date(endTime).getTime();
    const duration = Math.floor((endTimeMs - startTime) / 1000);
    
    const completedEntry: TimeEntry = {
      ...currentActivity,
      endTime,
      duration,
      completed: true
    };
    
    setAllTimeEntries(prev => 
      prev.map(entry => 
        entry.id === completedEntry.id ? completedEntry : entry
      )
    );
    
    setCurrentActivity(null);
    
    return completedEntry;
  }, [currentActivity]);

  /**
   * Get total time spent by activity type
   */
  const getTotalTimeByActivity = useCallback((): Record<string, number> => {
    const totals: Record<string, number> = {
      theory: 0,
      question: 0,
      coding: 0,
      review: 0
    };
    
    allTimeEntries.forEach(entry => {
      if (entry.completed && entry.activity in totals) {
        totals[entry.activity] += entry.duration;
      }
    });
    
    return totals;
  }, [allTimeEntries]);

  /**
   * Get average time for a specific type of question or task
   */
  const getAverageTimeForTag = useCallback((tag: string): number => {
    const relevantEntries = allTimeEntries.filter(entry => 
      entry.completed && entry.tags.includes(tag)
    );
    
    if (relevantEntries.length === 0) {
      return 0;
    }
    
    const totalDuration = relevantEntries.reduce((sum, entry) => sum + entry.duration, 0);
    return Math.round(totalDuration / relevantEntries.length);
  }, [allTimeEntries]);

  /**
   * Get time spent on a specific item
   */
  const getTimeForItem = useCallback((itemId: string): number => {
    const relevantEntries = allTimeEntries.filter(entry => 
      entry.completed && entry.itemId === itemId
    );
    
    if (relevantEntries.length === 0) {
      return 0;
    }
    
    return relevantEntries.reduce((sum, entry) => sum + entry.duration, 0);
  }, [allTimeEntries]);

  /**
   * Format seconds as a readable time string (HH:MM:SS)
   */
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    const parts = [];
    
    if (hours > 0) {
      parts.push(`${hours}h`);
    }
    
    if (minutes > 0 || hours > 0) {
      parts.push(`${minutes}m`);
    }
    
    parts.push(`${secs}s`);
    
    return parts.join(' ');
  };

  return {
    currentActivity,
    allTimeEntries,
    isTracking: !!currentActivity,
    startTimer,
    stopTimer,
    getTotalTimeByActivity,
    getAverageTimeForTag,
    getTimeForItem,
    formatTime
  };
}
