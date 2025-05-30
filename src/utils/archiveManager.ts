import { LearningProgram } from '@/types';
import gistStorageService from './gistStorageService';

/**
 * ArchiveManager handles the saving and loading of program archives as TypeScript files
 * Now using GitHub Gists for cloud storage instead of localforage
 */
export class ArchiveManager {
  /**
   * Save the current learning program as a TypeScript file
   * @param program The current learning program to save
   * @returns Promise that resolves when the file is saved
   */
  static async saveAsTypeScriptFile(program: LearningProgram): Promise<void> {
    try {
      // Generate the TypeScript content
      const fileContent = this.generateTypeScriptContent(program);
      
      // Create a file name based on the program's date and ID
      const fileName = `frontend-prep_${program.dateStarted.split('T')[0]}.ts`;
      
      // Use the File System Access API if available
      if ('showSaveFilePicker' in window) {
        try {
          const opts = {
            types: [{
              description: 'TypeScript file',
              accept: { 'text/typescript': ['.ts'] }
            }],
            suggestedName: fileName
          };
          
          // @ts-ignore - TypeScript doesn't know about showSaveFilePicker yet
          const handle = await window.showSaveFilePicker(opts);
          const writable = await handle.createWritable();
          await writable.write(fileContent);
          await writable.close();
          
          return;
        } catch (err) {
          // User canceled or other error, fall back to download method
          console.log('File System Access API failed, falling back to download', err);
        }
      }
      
      // Fallback method for browsers without File System Access API
      const blob = new Blob([fileContent], { type: 'text/typescript' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error saving program as TypeScript file:', error);
      throw error;
    }
  }
  
  /**
   * Generate TypeScript content from the learning program
   * @param program The learning program to convert to TypeScript
   * @returns A string containing the TypeScript representation of the program
   */
  private static generateTypeScriptContent(program: LearningProgram): string {
    const timestamp = new Date().toISOString();
    
    return `// Frontend Interview Prep Program
// Generated: ${timestamp}
// Program ID: ${program.id}

import { LearningProgram } from './types';

/**
 * This file contains a snapshot of your Frontend Interview Prep program.
 * You can import this file back into the app to restore your progress.
 */
export const program: LearningProgram = ${JSON.stringify(program, null, 2)};

/**
 * To restore this program:
 * 1. Go to the Settings page
 * 2. Click "Import Program"
 * 3. Select this file
 */
`;
  }
  
  /**
   * Save a program to GitHub Gists for archiving
   * @param program The program to archive
   */
  static async archiveProgram(program: LearningProgram): Promise<void> {
    try {
      // Use gistStorageService to save the program
      // Each program is saved individually in the Gist
      await gistStorageService.saveProgram(program);
      
      // Get the existing settings
      const settings = await gistStorageService.getSettings() || {};
      
      // Update the archived programs list in the settings
      // Type assertion to handle custom fields
      const archivedIds = (settings as any).archivedProgramIds || [];
      if (!archivedIds.includes(program.id)) {
        archivedIds.push(program.id);
        
        // Save the updated settings with the new archived program ID
        await gistStorageService.saveSettings({
          ...settings,
          archivedProgramIds: archivedIds
        } as any);
      }
    } catch (error) {
      console.error('Error archiving program to Gist:', error);
      throw error;
    }
  }
  
  /**
   * Get all archived programs from GitHub Gists
   * @returns Array of archived learning programs
   */
  static async getArchivedPrograms(): Promise<LearningProgram[]> {
    try {
      // Get all programs from gistStorageService
      const allPrograms = await gistStorageService.getAllPrograms() || [];
      
      // Get the list of archived program IDs
      const settings = await gistStorageService.getSettings() || {};
      // Type assertion to handle custom fields
      const archivedIds = (settings as any).archivedProgramIds || [];
      
      // Filter programs to only return the archived ones
      return allPrograms.filter(program => archivedIds.includes(program.id));
    } catch (error) {
      console.error('Error retrieving archived programs from Gist:', error);
      return [];
    }
  }
  
  /**
   * Delete an archived program by ID from GitHub Gists
   * @param programId The ID of the program to delete
   */
  static async deleteArchivedProgram(programId: string): Promise<void> {
    try {
      // Get current settings
      const settings = await gistStorageService.getSettings() || {};
      
      // Remove the program ID from the archived list
      // Type assertion to handle custom fields
      const archivedIds = (settings as any).archivedProgramIds || [];
      const updatedArchivedIds = archivedIds.filter((id: string) => id !== programId);
      
      // Update settings with the new archived IDs list
      await gistStorageService.saveSettings({
        ...settings,
        archivedProgramIds: updatedArchivedIds
      } as any);
      
      // Note: We don't delete the actual program from storage
      // We just remove it from the archived list, so it can be unarchived later if needed
    } catch (error) {
      console.error('Error removing program from archived list in Gist:', error);
      throw error;
    }
  }
}
