/**
 * Emergency save functionality module
 * This module provides direct saving of programs and progress to GitHub Gist
 * It bypasses all optimizations and race conditions to ensure critical data is saved
 */

import { LearningProgram, Technology, UserProgress } from '@/types';
import gistStorageService from './gistStorageService';

/**
 * Creates a new program and saves it directly to GitHub Gist
 * This function is used for critical program creation and ensures it is saved reliably
 * @param topics Selected technologies for the program
 * @param duration Program duration in days
 * @returns The newly created program or null if save failed
 */
export async function createAndSaveProgram(topics: Technology[], duration: number): Promise<LearningProgram | null> {
  try {
    // Import necessary content generators to ensure we have theory, questions and tasks
    // We need to do a dynamic import to avoid circular dependencies
    const { generateLearningProgram } = await import('@/features/learning/planner');
    const { sampleTheoryBlocks } = await import('@/data/sampleTheory');
    const { sampleQuestions } = await import('@/data/sampleQuestions');
    const { codeTasks } = await import('@/data/sampleTasks');
    
    console.log('🚨 EMERGENCY SAVE: Creating program with proper content');
    
    // Generate a proper learning program with theory, questions and tasks
    const newProgram = generateLearningProgram(
      topics,
      duration,
      sampleTheoryBlocks,
      sampleQuestions,
      codeTasks
    );
    
    console.log('🚨 EMERGENCY SAVE: Program created, saving to GitHub Gist');
    console.log('Program content check:', {
      'Has topics': newProgram.topics.length > 0,
      'Daily plans': newProgram.dailyPlans.length,
      'First day theory blocks': newProgram.dailyPlans[0]?.theoryBlockIds?.length,
      'First day questions': newProgram.dailyPlans[0]?.questionIds?.length,
      'First day code task': !!newProgram.dailyPlans[0]?.codeTaskId
    });
    
    // Direct save to GitHub Gist with retries
    const saveSuccess = await gistStorageService.directSaveToGist({
      programs: [...(await gistStorageService.getAllPrograms()), newProgram]
    });
    
    if (saveSuccess) {
      console.log('✅ EMERGENCY SAVE: Program created and saved successfully');
      return newProgram;
    } else {
      console.error('❌ EMERGENCY SAVE: Failed to save new program');
      return null;
    }
  } catch (error) {
    console.error('❌ EMERGENCY SAVE: Critical error creating program:', error);
    return null;
  }
}

/**
 * Directly saves a program to GitHub Gist
 * This bypasses all queues and optimizations to ensure the program is saved
 * @param program The program to save
 * @returns Whether the save was successful
 */
export async function saveProgram(program: LearningProgram): Promise<boolean> {
  try {
    console.log('🚨 EMERGENCY SAVE: Saving program with ID:', program.id);
    
    // Get all programs first to ensure we don't lose any data
    const allPrograms = await gistStorageService.getAllPrograms();
    
    // Update or add the program
    const existingIndex = allPrograms.findIndex(p => p.id === program.id);
    if (existingIndex >= 0) {
      allPrograms[existingIndex] = program;
    } else {
      allPrograms.push(program);
    }
    
    // Direct save to GitHub Gist with retries
    const saveSuccess = await gistStorageService.directSaveToGist({
      programs: allPrograms
    });
    
    if (saveSuccess) {
      console.log('✅ EMERGENCY SAVE: Program saved successfully');
      return true;
    } else {
      console.error('❌ EMERGENCY SAVE: Failed to save program');
      return false;
    }
  } catch (error) {
    console.error('❌ EMERGENCY SAVE: Critical error saving program:', error);
    return false;
  }
}

/**
 * Directly saves progress to GitHub Gist
 * This bypasses all queues and optimizations to ensure the progress is saved
 * @param progress The progress item to save
 * @returns Whether the save was successful
 */
export async function saveProgress(progress: UserProgress): Promise<boolean> {
  try {
    console.log('🚨 EMERGENCY SAVE: Saving progress');
    
    // Get all progress first to ensure we don't lose any data
    const allProgress = await gistStorageService.getAllProgress();
    allProgress.push(progress);
    
    // Direct save to GitHub Gist with retries
    const saveSuccess = await gistStorageService.directSaveToGist({
      progress: allProgress
    });
    
    if (saveSuccess) {
      console.log('✅ EMERGENCY SAVE: Progress saved successfully');
      return true;
    } else {
      console.error('❌ EMERGENCY SAVE: Failed to save progress');
      return false;
    }
  } catch (error) {
    console.error('❌ EMERGENCY SAVE: Critical error saving progress:', error);
    return false;
  }
}
