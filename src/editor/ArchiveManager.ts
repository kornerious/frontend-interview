import { LearningProgram } from '@/types';
import firebaseService from '../utils/firebaseService';

/**
 * Archive Manager for handling program backups and storage using GitHub Gists
 */
export class ArchiveManager {
  private static instance: ArchiveManager;
  
  private constructor() {
    // No need for initialization - firebaseService handles Gist initialization
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): ArchiveManager {
    if (!ArchiveManager.instance) {
      ArchiveManager.instance = new ArchiveManager();
    }
    return ArchiveManager.instance;
  }
  
  /**
   * Save program to archive
   */
  public async saveProgram(program: LearningProgram): Promise<void> {
    try {
      // Get existing programs
      const programs = await this.getAllPrograms();
      
      // Add or update program
      const existingIndex = programs.findIndex(p => p.id === program.id);
      if (existingIndex !== -1) {
        programs[existingIndex] = program;
      } else {
        programs.push(program);
      }
      
      // Save using firebaseService for Gist storage
      for (const prog of programs) {
        await firebaseService.saveProgram(prog);
      }
      
      // Export as file
      this.exportProgramAsFile(program);
    } catch (error) {
      console.error('Error saving program:', error);
      throw error;
    }
  }
  
  /**
   * Get all archived programs
   */
  public async getAllPrograms(): Promise<LearningProgram[]> {
    try {
      // Use firebaseService to get programs from Gist
      const programs = await firebaseService.getAllPrograms();
      return programs || [];
    } catch (error) {
      console.error('Error getting programs from Gist:', error);
      return [];
    }
  }
  
  /**
   * Get a specific program by ID
   */
  public async getProgramById(id: string): Promise<LearningProgram | null> {
    try {
      const programs = await this.getAllPrograms();
      return programs.find(p => p.id === id) || null;
    } catch (error) {
      console.error('Error getting program:', error);
      return null;
    }
  }
  
  /**
   * Delete a program
   */
  public async deleteProgram(id: string): Promise<void> {
    try {
      // First get the existing programs
      const programs = await this.getAllPrograms();
      // Filter out the program to delete
      const updatedPrograms = programs.filter(p => p.id !== id);
      
      // We need to recreate the entire programs list in Gist storage
      // First, clear current programs by overwriting with empty array
      await firebaseService.saveSettings({
        ...await firebaseService.getSettings() || {},
        programs: [] 
      } as any); // Type assertion to handle programs property
      
      // Then save each remaining program
      for (const prog of updatedPrograms) {
        await firebaseService.saveProgram(prog);
      }
    } catch (error) {
      console.error('Error deleting program from Gist:', error);
      throw error;
    }
  }
  
  /**
   * Export program as TypeScript file
   */
  private exportProgramAsFile(program: LearningProgram): void {
    // Create content
    const content = `// Program metadata and progress snapshot
export const program = ${JSON.stringify(program, null, 2)};`;
    
    // Create blob and download link
    const blob = new Blob([content], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `frontend-prep_${program.id}.ts`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  
  /**
   * Import program from TypeScript file
   */
  public async importProgramFromFile(file: File): Promise<LearningProgram | null> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const content = event.target?.result as string;
          
          // Extract program object using regex
          const regex = /export const program = (\{[\s\S]*\});/;
          const match = content.match(regex);
          
          if (!match || !match[1]) {
            throw new Error('Invalid program file format');
          }
          
          // Parse the program object
          const programData = JSON.parse(match[1]) as LearningProgram;
          
          // Save to archive
          await this.saveProgram(programData);
          
          resolve(programData);
        } catch (error) {
          console.error('Error importing program:', error);
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };
      
      reader.readAsText(file);
    });
  }
}
