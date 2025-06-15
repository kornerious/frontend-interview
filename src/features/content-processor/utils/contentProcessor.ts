import {ContentAnalyzer} from '../api/contentAnalyzer';
import {FileProcessor} from './fileProcessor';
import {ContentProcessorStorage} from './storageService';
import {ProcessingState, ProcessedChunk} from '../types';

export const CHUNK_SIZE = 100;

/**
 * Main content processor service
 */
export class ContentProcessor {
    // Path to the large markdown file
    private static readonly FILE_PATH = '/data/MyNotes.md';
    
    /**
     * Process content with AI
     * @param content Content to process
     * @param prompt Prompt to use
     * @param options Processing options
     */
    static async processWithAI(content: string, prompt: string, options?: {
        useLocalLlm?: boolean;
        localLlmModel?: string;
    }): Promise<string> {
        try {
            // Process with AI using ContentAnalyzer
            return await ContentAnalyzer.processWithPrompt(content, prompt, options);
        } catch (error) {
            console.error('Error processing content with AI:', error);
            throw error;
        }
    }
    
    /**
     * Read the next chunk from the file
     * @param state Current processing state
     */
    static async readNextChunk(state: ProcessingState): Promise<string> {
        try {
            // Read the next chunk for AI to analyze
            return await FileProcessor.readChunk(
                this.FILE_PATH,
                state.currentPosition
            );
        } catch (error) {
            console.error('Error reading next chunk:', error);
            throw error;
        }
    }
    
    /**
     * Read a specific chunk by line range
     * @param startLine Starting line number
     * @param endLine Ending line number
     */
    static async readChunk(startLine: number, endLine: number): Promise<string> {
        try {
            return await FileProcessor.readLineRange(this.FILE_PATH, startLine, endLine);
        } catch (error) {
            console.error(`Error reading chunk from line ${startLine} to ${endLine}:`, error);
            throw error;
        }
    }
    
    /**
     * Get a specific chunk by ID
     * @param chunkId Chunk ID to retrieve
     */
    static async getChunk(chunkId: string): Promise<ProcessedChunk | null> {
        try {
            return await ContentProcessorStorage.getProcessedChunk(chunkId);
        } catch (error) {
            console.error(`Error getting chunk ${chunkId}:`, error);
            throw error;
        }
    }
    
    /**
     * Save a processed chunk
     * @param chunk Processed chunk to save
     */
    static async saveProcessedChunk(chunk: ProcessedChunk): Promise<void> {
        try {
            await ContentProcessorStorage.saveProcessedChunk(chunk);
        } catch (error) {
            console.error(`Error saving processed chunk ${chunk.id}:`, error);
            throw error;
        }
    }

    /**
     * Initializes the content processor
     * @returns The initial processing state
     */
    static async initialize(): Promise<ProcessingState> {
        try {
            // Get current state or create default
            let state = await ContentProcessorStorage.getProcessingState();

            // If we don't have total lines yet, get them
            if (!state.totalLines || state.totalLines <= 0) {
                const totalLines = await FileProcessor.getTotalLines(this.FILE_PATH);
                state = {
                    ...state,
                    totalLines,
                    currentPosition: 0
                };
                await ContentProcessorStorage.saveProcessingState(state);
            }

            return state;
        } catch (error) {
            console.error('Error initializing content processor:', error);
            throw error;
        }
    }

    /**
     * Processes the next logical block of the file
     * @param options Optional processing options for using local LLM
     * @returns The processed chunk and updated state
     */
    static async processNextChunk(options?: {
        useLocalLlm?: boolean;
        localLlmModel?: string;
    }): Promise<{
        chunk: ProcessedChunk;
        state: ProcessingState;
    }> {
        try {
            // Get current state
            let state = await ContentProcessorStorage.getProcessingState();

            // Check if we've reached the end of the file
            if (FileProcessor.isProcessingComplete(state)) {
                throw new Error('Processing is already complete');
            }

            // Update state to indicate processing has started
            state = {
                ...state,
                isProcessing: true,
                error: null
            };
            await ContentProcessorStorage.saveProcessingState(state);

            // Read the next chunk for AI to analyze
            const content = await FileProcessor.readChunk(
                this.FILE_PATH,
                state.currentPosition
            );

            // Get the initial number of lines read
            const initialLinesRead = content.split('\n').length;

            // Process the chunk with AI and get logical block information
            const analysisResult = await ContentAnalyzer.analyzeContent(content, {
                useLocalLlm: options?.useLocalLlm,
                localLlmModel: options?.localLlmModel
            });

            // Determine the actual number of lines to process based on AI's suggestion
            let linesRead = initialLinesRead;
            if (analysisResult.logicalBlockInfo && analysisResult.logicalBlockInfo.suggestedEndLine > 0) {
                // AI has suggested a specific end line for the logical block
                linesRead = analysisResult.logicalBlockInfo.suggestedEndLine;
                console.log(`AI suggested ending logical block at line ${linesRead} (${linesRead - state.currentPosition} lines)`);
            }

            // Create a processed chunk
            const chunk: ProcessedChunk = {
                id: `chunk_${state.currentPosition}_${Date.now()}`,
                startLine: state.currentPosition,
                endLine: state.currentPosition + linesRead,
                processedDate: new Date().toISOString(),
                completed: false,
                ...analysisResult
            };

            // Save the processed chunk
            await ContentProcessorStorage.saveProcessedChunk(chunk);

            // Update the processing state
            const newPosition = Math.min(state.currentPosition + linesRead, state.totalLines);
            state = {
                ...state,
                currentPosition: newPosition,
                isProcessing: false,
                lastProcessedDate: new Date().toISOString()
            };
            await ContentProcessorStorage.saveProcessingState(state);

            return {chunk, state};
        } catch (error) {
            console.error('Error processing next chunk:', error);

            // Update state to indicate error
            const state = await ContentProcessorStorage.getProcessingState();
            const errorState: ProcessingState = {
                ...state,
                isProcessing: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
            await ContentProcessorStorage.saveProcessingState(errorState);

            throw error;
        }
    }

    /**
     * Gets all processed content
     * @returns All processed chunks
     */
    static async getAllProcessedContent(): Promise<ProcessedChunk[]> {
        return ContentProcessorStorage.getAllProcessedChunks();
    }

    /**
     * Marks a chunk as completed (user has finished working with it)
     * @param chunkId The ID of the chunk to mark as completed
     */
    static async markChunkAsCompleted(chunkId: string): Promise<void> {
        return ContentProcessorStorage.markChunkAsCompleted(chunkId);
    }

    /**
     * Resets the processing state (starts over)
     */
    static async resetProcessing(): Promise<ProcessingState> {
        await ContentProcessorStorage.resetProcessingState();
        return this.initialize();
    }

    /**
     * Gets the current processing progress percentage
     */
    static async getProgress(): Promise<number> {
        const state = await ContentProcessorStorage.getProcessingState();
        if (!state.totalLines) return 0;
        return Math.round((state.currentPosition / state.totalLines) * 100);
    }

    /**
     * Processes a specific line range in multiple chunks
     * @param startLine Starting line number (0-based)
     * @param endLine Ending line number (exclusive)
     * @param numChunks Number of chunks to process
     * @param options Optional processing options
     * @returns Array of processed chunks
     */
    static async processLineRange(
        startLine: number,
        endLine: number,
        numChunks: number,
        options?: {
            useLocalLlm?: boolean;
            localLlmModel?: string;
            processingDelay?: number;
        }
    ): Promise<ProcessedChunk[]> {
        console.log(`Processing line range ${startLine}-${endLine} in ${numChunks} chunks`);

        try {
            // Validate inputs
            if (startLine < 0 || endLine <= startLine || numChunks <= 0) {
                throw new Error('Invalid line range or chunk count');
            }

            // Get file content
            const response = await fetch(this.FILE_PATH);
            if (!response.ok) {
                throw new Error(`Failed to fetch file: ${response.statusText}`);
            }

            const text = await response.text();
            const allLines = text.split('\n');
            const totalLines = allLines.length;

            // Ensure endLine doesn't exceed total lines
            const actualEndLine = Math.min(endLine, totalLines);

            // Use fixed 100-line chunks (0-99, 100-199, etc.)
            const totalLinesToProcess = actualEndLine - startLine;
            const linesPerChunk = CHUNK_SIZE; // Use the constant defined at the top of the file
            
            // Calculate number of chunks needed based on fixed chunk size
            const calculatedNumChunks = Math.ceil(totalLinesToProcess / linesPerChunk);

            console.log(`Processing ${totalLinesToProcess} lines in ${calculatedNumChunks} chunks (${linesPerChunk} lines per chunk, adjusted from user request of ${numChunks} chunks)`);

            // Clear existing chunks
            await ContentProcessorStorage.clearAllProcessedChunks();

            // Reset processing state
            await this.resetProcessing();

            // Process each chunk
            const processedChunks: ProcessedChunk[] = [];

            console.log(`DEBUG: Total lines in file: ${totalLines}`);
            console.log(`DEBUG: Processing line range ${startLine}-${actualEndLine} in ${calculatedNumChunks} chunks`);

            for (let i = 0; i < calculatedNumChunks; i++) {
                try {
                    const chunkStartLine = startLine + (i * linesPerChunk);

                    // Stop if we've reached the end
                    if (chunkStartLine >= actualEndLine) {
                        console.log(`DEBUG: Stopping at chunk ${i + 1} because start line ${chunkStartLine} >= end line ${actualEndLine}`);
                        break;
                    }

                    // Calculate end line (exclusive) to avoid overlap with next chunk
                    const chunkEndLine = Math.min(chunkStartLine + linesPerChunk, actualEndLine);

                    console.log(`DEBUG: Processing chunk ${i + 1}/${calculatedNumChunks}: lines ${chunkStartLine}-${chunkEndLine}`);

                    // Get chunk content
                    const chunkContent = allLines.slice(chunkStartLine, chunkEndLine).join('\n');
                    console.log(`DEBUG: Chunk ${i + 1} content length: ${chunkContent.length} characters`);
                    
                    // Add extra debug for lines 600-700
                    if (chunkStartLine >= 600 && chunkStartLine < 700) {
                        console.log(`DEBUG: DETAILED INSPECTION FOR LINES ${chunkStartLine}-${chunkEndLine}`);
                        console.log(`DEBUG: First 100 chars: ${chunkContent.substring(0, 100)}`);
                        console.log(`DEBUG: Content has whitespace only: ${chunkContent.trim().length === 0}`);
                        console.log(`DEBUG: Content character count: ${chunkContent.length}`);
                        console.log(`DEBUG: Line count in chunk: ${chunkContent.split('\n').length}`);
                    }

                    if (chunkContent.trim().length === 0) {
                        console.log(`DEBUG: Chunk ${i + 1} is empty, skipping`);
                        continue;
                    }

                    // Process with AI
                    console.log(`DEBUG: Starting AI analysis for chunk ${i + 1} (lines ${chunkStartLine}-${chunkEndLine})`);
                    let analysisResult;
                    try {
                        analysisResult = await ContentAnalyzer.analyzeContent(chunkContent, {
                            useLocalLlm: options?.useLocalLlm,
                            localLlmModel: options?.localLlmModel
                        });
                        console.log(`DEBUG: AI analysis completed for chunk ${i + 1}`);
                        
                        // For chunks in the 600-700 range, log the analysis result structure
                        if (chunkStartLine >= 600 && chunkStartLine < 700) {
                            console.log(`DEBUG: Analysis result for chunk ${i + 1} has theory blocks: ${analysisResult.theory ? analysisResult.theory.length : 0}`);
                            console.log(`DEBUG: Analysis result for chunk ${i + 1} has questions: ${analysisResult.questions ? analysisResult.questions.length : 0}`);
                            console.log(`DEBUG: Analysis result for chunk ${i + 1} has tasks: ${analysisResult.tasks ? analysisResult.tasks.length : 0}`);
                        }
                    } catch (analysisError) {
                        console.error(`DEBUG: ERROR in AI analysis for chunk ${i + 1}:`, analysisError);
                        // Skip this chunk and continue with the next one instead of throwing
                        console.log(`DEBUG: Skipping chunk ${i + 1} due to analysis error and continuing...`);
                        continue; // Skip to the next iteration of the loop
                    }

                    // Create chunk with unique timestamp
                    const timestamp = Date.now() + i;
                    const chunk: ProcessedChunk = {
                        id: `chunk_${chunkStartLine}_${timestamp}`,
                        startLine: chunkStartLine,
                        endLine: chunkEndLine + 1, // Store as exclusive end line for internal processing
                        displayEndLine: chunkEndLine, // Store the actual inclusive end line for display
                        processedDate: new Date().toISOString(),
                        completed: true,
                        ...analysisResult
                    };

                    // Save chunk
                    await ContentProcessorStorage.saveProcessedChunk(chunk);
                    processedChunks.push(chunk);
                    console.log(`DEBUG: Saved AI-processed chunk ${i + 1}/${calculatedNumChunks} with ID ${chunk.id}`);


                    // Update processing state
                    const state = await ContentProcessorStorage.getProcessingState();
                    state.currentPosition = chunkEndLine;
                    await ContentProcessorStorage.saveProcessingState(state);

                    // Add delay between chunks if specified
                    if (i < calculatedNumChunks - 1 && options?.processingDelay) {
                        const delay = options.processingDelay || 0;
                        console.log(`DEBUG: Waiting ${delay} seconds before processing next chunk...`);
                        await new Promise(resolve => setTimeout(resolve, delay * 1000));
                    }
                } catch (chunkError) {
                    console.error(`ERROR processing chunk ${i + 1}:`, chunkError);
                    // Continue with next chunk even if this one fails
                }
            }

            // Get all processed chunks to verify
            const allChunks = await ContentProcessorStorage.getAllProcessedChunks();
            console.log(`Line range processing complete. Processed ${processedChunks.length} chunks.`);
            console.log(`Total chunks in storage: ${allChunks.length}`);

            return allChunks;
        } catch (error) {
            console.error('Error processing line range:', error);
            throw error;
        }
    }
}
