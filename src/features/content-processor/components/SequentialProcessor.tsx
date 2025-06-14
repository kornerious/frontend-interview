import { MultiStageProcessingOptions, ProcessingStage } from '../api/multiStageProcessor';
import { ContentProcessorStorage } from '../utils/storageService';

interface SequentialProcessorProps {
  startLine: number;
  endLine: number;
  processingDelay: number;
  useLocalLlm: boolean;
  localLlmInitialized: boolean;
  selectedModel: string;
  setIsSequentialProcessing: (value: boolean) => void;
  storeProcessLineRange: (startLine: number, endLine: number, numChunks: number, options?: MultiStageProcessingOptions) => Promise<void>;
  enhanceTheory: (chunkId: string, options?: MultiStageProcessingOptions) => Promise<void>;
  generateQuestions: (chunkId: string, options?: MultiStageProcessingOptions) => Promise<void>;
  generateTasks: (chunkId: string, options?: MultiStageProcessingOptions) => Promise<void>;
  setStoreProcessingStage: (stage: ProcessingStage) => void;
  setSelectedChunkId: (id: string) => void;
}

/**
 * Service for sequential multi-stage processing
 */
const SequentialProcessor = {
  /**
   * Process all chunks sequentially with theory enhancement, question generation, and task generation
   */
  processAllChunksSequentially: async ({
    startLine,
    endLine,
    processingDelay,
    useLocalLlm,
    localLlmInitialized,
    selectedModel,
    setIsSequentialProcessing,
    storeProcessLineRange,
    enhanceTheory,
    generateQuestions,
    generateTasks,
    setStoreProcessingStage,
    setSelectedChunkId
  }: SequentialProcessorProps) => {
    try {
      // Validate inputs
      if (startLine < 0 || endLine <= startLine || processingDelay < 0) {
        alert('Please enter valid line range and delay');
        return;
      }
      
      // Calculate number of chunks based on line range (1 chunk per 100 lines)
      const lineCount = endLine - startLine;
      const calculatedNumChunks = Math.max(1, Math.ceil(lineCount / 100));
      
      setIsSequentialProcessing(true);
      console.log(`Starting sequential processing for lines ${startLine}-${endLine} with ${calculatedNumChunks} chunks...`);
      
      // First process the line range to extract theory
      const options: MultiStageProcessingOptions = {
        processingDelay,
        maxChunks: calculatedNumChunks,
        useLocalLlm: useLocalLlm && localLlmInitialized,
        localLlmModel: useLocalLlm && localLlmInitialized ? selectedModel : undefined,
        stage: 'theory-extraction'
      };
      
      // Step 1: Process line range to extract theory chunks
      await storeProcessLineRange(startLine, endLine, calculatedNumChunks, options);
      console.log('Theory extraction completed. Getting all chunks...');
      
      // Get all processed chunks after initial processing
      const allProcessedChunks = await ContentProcessorStorage.getAllProcessedChunks();
      console.log(`Found ${allProcessedChunks.length} chunks to process sequentially`);
      
      // Force update the UI with all processed chunks
      useContentProcessorStore.setState({ allChunks: allProcessedChunks });
      
      // Filter chunks that are within our line range
      const chunksToProcess = allProcessedChunks.filter(chunk => 
        chunk.startLine >= startLine && chunk.endLine <= endLine
      );
      
      console.log(`Filtered ${chunksToProcess.length} chunks within the specified line range`);
      
      // Step 2: Enhance theory for each chunk
      for (const chunk of chunksToProcess) {
        console.log(`Enhancing theory for chunk ${chunk.id} (${chunk.startLine}-${chunk.endLine})`);
        setStoreProcessingStage('theory-enhancement');
        await enhanceTheory(chunk.id, {
          useLocalLlm: useLocalLlm && localLlmInitialized,
          localLlmModel: useLocalLlm && localLlmInitialized ? selectedModel : undefined
        });
        
        // Add delay between chunks if specified
        if (processingDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, processingDelay * 1000));
        }
      }
      
      // Step 3: Generate questions for each chunk
      for (const chunk of chunksToProcess) {
        console.log(`Generating questions for chunk ${chunk.id} (${chunk.startLine}-${chunk.endLine})`);
        setStoreProcessingStage('question-generation');
        await generateQuestions(chunk.id, {
          useLocalLlm: useLocalLlm && localLlmInitialized,
          localLlmModel: useLocalLlm && localLlmInitialized ? selectedModel : undefined
        });
        
        // Add delay between chunks if specified
        if (processingDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, processingDelay * 1000));
        }
      }
      
      // Step 4: Generate tasks for each chunk
      for (const chunk of chunksToProcess) {
        console.log(`Generating tasks for chunk ${chunk.id} (${chunk.startLine}-${chunk.endLine})`);
        setStoreProcessingStage('task-generation');
        await generateTasks(chunk.id, {
          useLocalLlm: useLocalLlm && localLlmInitialized,
          localLlmModel: useLocalLlm && localLlmInitialized ? selectedModel : undefined
        });
        
        // Add delay between chunks if specified
        if (processingDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, processingDelay * 1000));
        }
      }
      
      // Get updated chunks after all processing
      const updatedChunks = await ContentProcessorStorage.getAllProcessedChunks();
      useContentProcessorStore.setState({ allChunks: updatedChunks });
      
      // Set the current chunk to the first one in our processed range
      if (updatedChunks.length > 0) {
        const firstChunk = updatedChunks.find(chunk => 
          chunk.startLine >= startLine && chunk.endLine <= endLine
        );
        if (firstChunk) {
          useContentProcessorStore.setState({ currentChunk: firstChunk });
          setSelectedChunkId(firstChunk.id);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error during sequential processing:', error);
      alert(`Error during sequential processing: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    } finally {
      setIsSequentialProcessing(false);
    }
  }
};

// Add import for useContentProcessorStore at the top
import { useContentProcessorStore } from '../store/useContentProcessorStore';

export default SequentialProcessor;
