/**
 * Service for managing response backups
 * Saves JSON responses from Gemini API to the local file system
 * Creates a history log file with all processing records
 */

import axios from 'axios';

export interface ResponseBackup {
  id: string;
  timestamp: string;
  source: string;
  content: string;
  metadata?: Record<string, any>;
}

export class ResponseBackupService {
  /**
   * Save a response backup to the local file system
   * @param response The response content to save
   * @param source The source of the response (e.g., 'gemini')
   * @param metadata Additional metadata to store with the backup
   */
  static async saveResponseBackup(
    response: string, 
    source: string = 'gemini', 
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      // Call the API endpoint to save the backup to the file system
      const result = await axios.post('/api/saveResponseBackup', {
        content: response,
        source,
        metadata: metadata || {
          timestamp: new Date().toISOString(),
          contentLength: response.length
        }
      });
      
      console.log(`Response backup saved successfully:`, result.data);
    } catch (error) {
      console.error('Error saving response backup:', error);
    }
  }
  
  /**
   * Get the processing history
   * This is a placeholder that would typically fetch from the backend
   */
  static async getProcessingHistory(): Promise<any[]> {
    try {
      const response = await axios.get('/api/getProcessingHistory');
      return response.data.history || [];
    } catch (error) {
      console.error('Error fetching processing history:', error);
      return [];
    }
  }
}

export default ResponseBackupService;
