import React from 'react';
import { Box, Card, CardContent, Typography, Chip, Divider, Accordion, AccordionSummary, AccordionDetails, List, ListItem, Radio, FormControlLabel, RadioGroup } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { a11yDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import ReactMarkdown from 'react-markdown';

interface Question {
  id: string;
  title: string;
  description: string;
  type: 'mcq' | 'code' | 'open' | 'flashcard';
  options?: {
    id: string;
    text: string;
    isCorrect: boolean;
  }[];
  answer?: string;
  explanation?: string;
  difficulty?: string;
  tags?: string[];
}

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
            {/* Title */}
            <Typography variant="h5" component="h2" gutterBottom>
              {question.title}
            </Typography>
            
            {/* Metadata */}
            <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Chip 
                label={`Type: ${question.type}`} 
                size="small" 
                color="primary" 
                variant="outlined" 
              />
              {question.difficulty && (
                <Chip 
                  label={`Difficulty: ${question.difficulty}`} 
                  size="small" 
                  color="secondary" 
                  variant="outlined" 
                />
              )}
            </Box>
            
            {/* Tags */}
            {question.tags && question.tags.length > 0 && (
              <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {question.tags.map((tag) => (
                  <Chip key={tag} label={tag} size="small" />
                ))}
              </Box>
            )}
            
            <Divider sx={{ my: 2 }} />
            
            {/* Description */}
            <Box sx={{ mt: 2, mb: 3 }}>
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
                {question.description}
              </ReactMarkdown>
            </Box>
            
            {/* Multiple Choice Options */}
            {question.type === 'mcq' && question.options && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Options:
                </Typography>
                <RadioGroup>
                  {question.options.map((option) => (
                    <FormControlLabel
                      key={option.id}
                      value={option.id}
                      control={<Radio />}
                      label={option.text}
                    />
                  ))}
                </RadioGroup>
              </Box>
            )}
            
            {/* Answer and Explanation (in accordion) */}
            {(question.answer || question.explanation) && (
              <Accordion sx={{ mt: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>View Answer & Explanation</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {question.answer && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Answer:
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
                              <code {...props}>{children}</code>
                            );
                          }
                        }}
                      >
                        {question.answer}
                      </ReactMarkdown>
                    </Box>
                  )}
                  
                  {question.explanation && (
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Explanation:
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
                              <code {...props}>{children}</code>
                            );
                          }
                        }}
                      >
                        {question.explanation}
                      </ReactMarkdown>
                    </Box>
                  )}
                </AccordionDetails>
              </Accordion>
            )}
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default QuestionList;
