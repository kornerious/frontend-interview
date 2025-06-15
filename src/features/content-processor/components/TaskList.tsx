import React from 'react';
import { CodeTask } from '@/types';
import { Box, Card, CardContent, Typography, Chip, Divider, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { a11yDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface TaskListProps {
  tasks: CodeTask[] | any;
}

/**
 * Component to display a list of coding tasks
 */
const TaskList: React.FC<TaskListProps> = ({ tasks }) => {
  // Console log removed
  
  // Ensure tasks is always an array
  const taskArray = Array.isArray(tasks) ? tasks : [];
  
  // Console log removed
  
  if (taskArray.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body1">No tasks found in this chunk.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {taskArray.map((task) => (
        <Card key={task.id} sx={{ mb: 3, boxShadow: 3 }}>
          <CardContent>
            {/* Title */}
            <Typography variant="h5" component="h2" gutterBottom>
              {task.title}
            </Typography>
            
            {/* Metadata */}
            <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
              <Chip 
                label={task.difficulty} 
                size="small" 
                color={
                  task.difficulty === 'easy' ? 'success' : 
                  task.difficulty === 'medium' ? 'warning' : 'error'
                }
              />
              <Chip 
                icon={<AccessTimeIcon />}
                label={`${task.timeEstimate} min`} 
                size="small" 
                color="default" 
                variant="outlined" 
              />
              <Chip 
                label={`Complexity: ${task.complexity}/10`} 
                size="small" 
                color="primary" 
                variant="outlined" 
              />
              <Chip 
                label={`Interview Relevance: ${task.interviewRelevance}/10`} 
                size="small" 
                color="secondary" 
                variant="outlined" 
              />
            </Box>
            
            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
              <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {task.tags.map((tag: string, index: number) => (
                  <Chip key={index} label={tag} size="small" />
                ))}
              </Box>
            )}
            
            <Divider sx={{ my: 2 }} />
            
            {/* Description */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Description:
              </Typography>
              <ReactMarkdown
                components={{
                  img: ({ node, src, alt, ...props }) => {
                    // Handle paths correctly and avoid duplicates
                    let imgSrc = src || '';
                    
                    // If it doesn't start with / or http, add /images/ prefix
                    if (!imgSrc.startsWith('/') && !imgSrc.startsWith('http')) {
                      imgSrc = `/images/${imgSrc}`;
                    }
                    
                    // Fix duplicate /images/images/ issue
                    imgSrc = imgSrc.replace('/images/images/', '/images/');
                    
                    return <img src={imgSrc} alt={alt || ''} {...props} style={{ maxWidth: '100%' }} />;
                  },
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
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Starting Code:
              </Typography>
              <SyntaxHighlighter
                language="typescript"
                style={a11yDark}
              >
                {task.startingCode}
              </SyntaxHighlighter>
            </Box>
            
            {/* Hints */}
            {task.hints && task.hints.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Hints ({task.hints.length})</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box component="ol" sx={{ pl: 2 }}>
                      {task.hints.map((hint: string, index: number) => (
                        <Box component="li" key={index} sx={{ mb: 1 }}>
                          <Typography>{hint}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              </Box>
            )}
            
            {/* Solution */}
            <Box sx={{ mt: 2 }}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography color="primary">View Solution</Typography>
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
            </Box>
            
            {/* Related Concepts */}
            {task.relatedConcepts && task.relatedConcepts.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Related Concepts:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                  {task.relatedConcepts.map((concept: string, index: number) => (
                    <Chip key={index} label={concept} size="small" color="info" />
                  ))}
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default TaskList;
