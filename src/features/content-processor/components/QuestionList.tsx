import React from 'react';
import { Question } from '@/types';
import { Box, Card, CardContent, Typography, Chip, Divider, List, ListItem, ListItemIcon, ListItemText, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { a11yDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface QuestionListProps {
  questions: Question[];
}

/**
 * Component to display a list of questions
 */
const QuestionList: React.FC<QuestionListProps> = ({ questions }) => {
  if (!questions || questions.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body1">No questions found in this chunk.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {questions.map((question) => (
        <Card key={question.id} sx={{ mb: 3, boxShadow: 3 }}>
          <CardContent>
            {/* Topic and metadata */}
            <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
              <Typography variant="subtitle1" color="text.secondary" sx={{ mr: 1 }}>
                {question.topic}
              </Typography>
              <Chip 
                label={question.level} 
                size="small" 
                color={
                  question.level === 'easy' ? 'success' : 
                  question.level === 'medium' ? 'warning' : 'error'
                }
              />
              <Chip 
                label={question.type} 
                size="small" 
                color="primary" 
                variant="outlined" 
              />
            </Box>
            
            {/* Question text */}
            <Typography variant="h6" component="h2" gutterBottom>
              {question.question}
            </Typography>
            
            {/* Options for multiple choice */}
            {question.options && question.options.length > 0 && (
              <Box sx={{ mt: 2, mb: 3 }}>
                <List dense>
                  {question.options.map((option, index) => (
                    <ListItem key={index}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        {option === question.answer ? (
                          <CheckCircleOutlineIcon color="success" />
                        ) : (
                          <RadioButtonUncheckedIcon />
                        )}
                      </ListItemIcon>
                      <ListItemText primary={option} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
            
            <Divider sx={{ my: 2 }} />
            
            {/* Answer */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography color="primary">View Answer</Typography>
              </AccordionSummary>
              <AccordionDetails>
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
                  {question.answer}
                </ReactMarkdown>
              </AccordionDetails>
            </Accordion>
            
            {/* Example code if present */}
            {question.example && (
              <Box sx={{ mt: 2 }}>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Example Code</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
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
                      {question.example}
                    </ReactMarkdown>
                  </AccordionDetails>
                </Accordion>
              </Box>
            )}
            
            {/* Key concepts */}
            {question.keyConcepts && question.keyConcepts.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Key Concepts:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                  {question.keyConcepts.map((concept, index) => (
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

export default QuestionList;
