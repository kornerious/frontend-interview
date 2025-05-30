import { LearningProgram, TheoryBlock, Question, CodeTask, Technology, DailyPlan } from '@/types';
import dayjs from 'dayjs';

/**
 * Generates a learning program based on user preferences
 */
export function generateLearningProgram(
  technologies: Technology[],
  durationDays: number,
  allTheoryBlocks: TheoryBlock[],
  allQuestions: Question[],
  allCodeTasks: CodeTask[]
): LearningProgram {
  // Filter content by selected technologies
  const filteredTheoryBlocks = allTheoryBlocks.filter(block => 
    technologies.includes(block.technology)
  );
  
  const filteredQuestions = allQuestions.filter(question => 
    technologies.some(tech => question.tags?.includes(tech.toLowerCase()) || 
                            question.topic.toLowerCase().includes(tech.toLowerCase()))
  );
  
  const filteredCodeTasks = allCodeTasks.filter(task => 
    technologies.some(tech => task.tags.includes(tech.toLowerCase()))
  );
  
  // Distribute content evenly across days
  const theoryBlocksPerDay = Math.max(1, Math.ceil(filteredTheoryBlocks.length / durationDays));
  const questionsPerDay = Math.max(3, Math.ceil(filteredQuestions.length / durationDays));
  
  // Create daily plans
  const dailyPlans: DailyPlan[] = [];
  
  for (let day = 1; day <= durationDays; day++) {
    const theoryStartIdx = (day - 1) * theoryBlocksPerDay;
    const questionsStartIdx = (day - 1) * questionsPerDay;
    
    // Get theory blocks for this day
    const dayTheoryBlocks = filteredTheoryBlocks
      .slice(theoryStartIdx, theoryStartIdx + theoryBlocksPerDay)
      .map(block => block.id);
    
    // Get questions for this day
    const dayQuestions = filteredQuestions
      .slice(questionsStartIdx, questionsStartIdx + questionsPerDay)
      .map(question => question.id);
    
    // Get a code task for this day - cycle through available tasks
    const codeTaskIdx = (day - 1) % filteredCodeTasks.length;
    const codeTaskId = filteredCodeTasks[codeTaskIdx]?.id || '';
    
    dailyPlans.push({
      day,
      theoryBlockIds: dayTheoryBlocks,
      questionIds: dayQuestions,
      codeTaskId,
      completed: false
    });
  }
  
  // Create the learning program
  const programId = `prog_${Date.now()}`;
  
  return {
    id: programId,
    dateStarted: dayjs().format('YYYY-MM-DD'),
    topics: technologies,
    durationDays,
    currentDay: 1,
    dailyPlans,
    progress: []
  };
}

/**
 * Adjusts the learning program based on user progress
 */
export function adaptLearningProgram(
  program: LearningProgram,
  allTheoryBlocks: TheoryBlock[],
  allQuestions: Question[],
  allCodeTasks: CodeTask[]
): LearningProgram {
  const updatedDailyPlans = [...program.dailyPlans];
  
  // Analyze weak areas based on progress
  const incorrectQuestionIds = program.progress
    .filter(p => !p.isCorrect)
    .map(p => p.questionId);
  
  // Find questions related to incorrect answers
  const weakQuestions = allQuestions
    .filter(q => incorrectQuestionIds.includes(q.id));
  
  // Extract tags from weak areas
  const weakTags = new Set<string>();
  weakQuestions.forEach(q => {
    q.tags?.forEach(tag => weakTags.add(tag));
  });
  
  // Find additional content for weak areas
  const reinforcementTheory = allTheoryBlocks
    .filter(t => t.tags.some(tag => weakTags.has(tag)))
    .filter(t => !updatedDailyPlans.some(p => p.theoryBlockIds.includes(t.id)))
    .slice(0, 2)
    .map(t => t.id);
  
  const reinforcementQuestions = allQuestions
    .filter(q => q.tags?.some(tag => weakTags.has(tag)))
    .filter(q => !incorrectQuestionIds.includes(q.id))
    .filter(q => !updatedDailyPlans.some(p => p.questionIds.includes(q.id)))
    .slice(0, 3)
    .map(q => q.id);
  
  const reinforcementTask = allCodeTasks
    .filter(t => t.tags.some(tag => weakTags.has(tag)))
    .filter(t => !updatedDailyPlans.some(p => p.codeTaskId === t.id))
    .slice(0, 1)
    .map(t => t.id)[0];
  
  // Insert reinforcement day if needed
  if (reinforcementTheory.length > 0 || reinforcementQuestions.length > 0) {
    // Find the next uncompleted day
    const nextUncompletedIdx = updatedDailyPlans.findIndex(p => !p.completed);
    
    if (nextUncompletedIdx > -1) {
      // Add reinforcement content to the next day
      updatedDailyPlans[nextUncompletedIdx] = {
        ...updatedDailyPlans[nextUncompletedIdx],
        theoryBlockIds: [...updatedDailyPlans[nextUncompletedIdx].theoryBlockIds, ...reinforcementTheory],
        questionIds: [...updatedDailyPlans[nextUncompletedIdx].questionIds, ...reinforcementQuestions],
        codeTaskId: reinforcementTask || updatedDailyPlans[nextUncompletedIdx].codeTaskId
      };
    }
  }
  
  return {
    ...program,
    dailyPlans: updatedDailyPlans
  };
}
