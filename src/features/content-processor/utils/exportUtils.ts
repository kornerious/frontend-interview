import { ProcessedChunk } from '../types';

/**
 * Utility class for exporting processed chunks
 */
export class ExportUtils {
  /**
   * Export chunks to JSON and trigger download
   * @param chunks Array of processed chunks to export
   */
  static exportAndDownload(chunks: ProcessedChunk[]): void {
    try {
      // Convert to JSON string with pretty formatting
      const jsonData = JSON.stringify(chunks, null, 2);
      
      // Create a blob with the JSON data
      const blob = new Blob([jsonData], { type: 'application/json' });
      
      // Create a URL for the blob
      const url = URL.createObjectURL(blob);
      
      // Create a temporary anchor element
      const a = document.createElement('a');
      a.href = url;
      a.download = `content-chunks-${new Date().toISOString().split('T')[0]}.json`;
      
      // Append to body, click, and remove
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Release the URL object
      URL.revokeObjectURL(url);
      
      console.log(`Exported ${chunks.length} chunks to JSON`);
    } catch (error) {
      console.error('Error exporting chunks to JSON:', error);
      throw new Error(`Failed to export chunks: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
