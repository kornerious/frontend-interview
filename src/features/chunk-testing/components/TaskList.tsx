import React from 'react';
import { Box, Card, CardContent, Typography, Chip, Divider, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { a11yDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import ReactMarkdown from 'react-markdown';

interface Task {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  startingCode?: string;
  solutionCode?: string;
  testCases?: string[];
  hints?: string[];
  tags?: string[];
  timeEstimate?: number;
  complexity?: number;
  interviewRelevance?: number;
}

interface TaskListProps {
  tasks: Task[];
}

/**
 * Component to display a list of coding tasks
 */
const TaskList: React.FC<TaskListProps> = ({ tasks }) => {
  if (!tasks || tasks.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body1">No tasks found in this chunk.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {tasks.map((task) => (
        <Card key={task.id} sx={{ mb: 3, boxShadow: 3 }}>
          <CardContent>
            {/* Title */}
            <Typography variant="h5" component="h2" gutterBottom>
              {task.title}
            </Typography>
            
            {/* Metadata */}
            <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Chip 
                label={`Difficulty: ${task.difficulty}`} 
                size="small" 
                color="primary" 
                variant="outlined" 
              />
              {task.timeEstimate && (
                <Chip 
                  label={`Est. Time: ${task.timeEstimate} min`} 
                  size="small" 
                  color="secondary" 
                  variant="outlined" 
                />
              )}
              {task.complexity !== undefined && (
                <Chip 
                  label={`Complexity: ${task.complexity}/10`} 
                  size="small" 
                  color="info" 
                  variant="outlined" 
                />
              )}
              {task.interviewRelevance !== undefined && (
                <Chip 
                  label={`Interview Relevance: ${task.interviewRelevance}/10`} 
                  size="small" 
                  color="warning" 
                  variant="outlined" 
                />
              )}
            </Box>
            
            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
              <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {task.tags.map((tag) => (
                  <Chip key={tag} label={tag} size="small" />
                ))}
              </Box>
            )}
            
            <Divider sx={{ my: 2 }} />
            
            {/* Description */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                Task Description:
              </Typography>
              <ReactMarkdown
                components={{
                  code: ({ node, className, children, ...props }: any) => {
                    const inline = className?.indexOf('inline') !== -1;
                    const match = /language-([\w-]+)/.exec(className || '');
                    return !inline && match ? (
                      <SyntaxHighlighter
                        language={match[1]} 
                        style={a11yDark}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code
                        className={className}
                        style={{
                          backgroundColor: '#282c34',
                          color: '#abb2bf',
                          padding: '0.2em 0.4em',
                          borderRadius: '3px',
                          fontSize: '0.9em'
                        }}
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  }
                }}
              >
                {task.description}
              </ReactMarkdown>
            </Box>
            
            {/* Starting Code */}
            {task.startingCode && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Starting Code:
                </Typography>
                <SyntaxHighlighter
                  language="typescript"
                  style={a11yDark}
                >
                  {task.startingCode}
                </SyntaxHighlighter>
              </Box>
            )}
            
            {/* Test Cases */}
            {task.testCases && task.testCases.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Test Cases:
                </Typography>
                <Box component="ul" sx={{ pl: 2 }}>
                  {task.testCases.map((testCase, index) => (
                    <Typography component="li" key={index}>
                      {testCase}
                    </Typography>
                  ))}
                </Box>
              </Box>
            )}
            
            {/* Hints */}
            {task.hints && task.hints.length > 0 && (
              <Accordion sx={{ mt: 3 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>Hints</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box component="ol" sx={{ pl: 2 }}>
                    {task.hints.map((hint, index) => (
                      <Typography component="li" key={index} sx={{ mb: 1 }}>
                        {hint}
                      </Typography>
                    ))}
                  </Box>
                </AccordionDetails>
              </Accordion>
            )}
            
            {/* Solution */}
            {task.solutionCode && (
              <Accordion sx={{ mt: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>View Solution</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <SyntaxHighlighter
                    language="typescript"
                    style={a11yDark}
                  >
                    {task.solutionCode}
                  </SyntaxHighlighter>
                </AccordionDetails>
              </Accordion>
            )}
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default TaskList;
