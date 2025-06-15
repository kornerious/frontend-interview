import React from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import TheoryList from './TheoryList';
import QuestionList from './QuestionList';
import TaskList from './TaskList';

interface ContentTabsPanelProps {
  tabValue: number;
  handleTabChange: (event: React.SyntheticEvent, newValue: number) => void;
  currentChunk: {
    theory?: any[];
    questions?: any[];
    tasks?: any[];
  };
}

/**
 * Tabbed content display for theory, questions, and tasks
 */
const ContentTabsPanel: React.FC<ContentTabsPanelProps> = ({
  tabValue,
  handleTabChange,
  currentChunk
}) => {
  return (
    <Box sx={{ width: '100%' }}>
      {/* Tabs for different content types */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 2, width: '100%' }}>
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ width: '100%' }}>
          <Tab label={`Theory (${currentChunk.theory?.length || 0})`} />
          <Tab label={`Questions (${currentChunk.questions?.length || 0})`} />
          <Tab label={`Tasks (${currentChunk.tasks?.length || 0})`} />
        </Tabs>
      </Box>

      {/* Tab panels */}
      <Box sx={{ width: '100%' }}>
        {tabValue === 0 && <TheoryList theory={currentChunk.theory || []} />}
        {tabValue === 1 && <QuestionList questions={currentChunk.questions || []} />}
        {tabValue === 2 && <TaskList tasks={currentChunk.tasks || []} />}
      </Box>
    </Box>
  );
};

export default ContentTabsPanel;
