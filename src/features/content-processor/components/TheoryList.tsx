import React from 'react';
import { TheoryBlock } from '@/types';
import { Box, Card, CardContent, Typography, Chip, Divider, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { a11yDark } from 'react-syntax-highlighter/dist/cjs/styles/prism'
interface TheoryListProps {
  theory: TheoryBlock[];
}

/**
 * Component to display a list of theory blocks
 */
const TheoryList: React.FC<TheoryListProps> = ({ theory }) => {
  if (!theory || theory.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body1">No theory content found in this chunk.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {theory.map((item) => (
        <Card key={item.id} sx={{ mb: 3, boxShadow: 3 }}>
          <CardContent>
            {/* Title */}
            <Typography variant="h5" component="h2" gutterBottom>
              {item.title}
            </Typography>
            
            {/* Metadata */}
            <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Chip 
                label={`Complexity: ${item.complexity}/10`} 
                size="small" 
                color="primary" 
                variant="outlined" 
              />
              <Chip 
                label={`Interview Relevance: ${item.interviewRelevance}/10`} 
                size="small" 
                color="secondary" 
                variant="outlined" 
              />
              <Chip 
                label={`Level: ${item.learningPath}`} 
                size="small" 
                color="info" 
                variant="outlined" 
              />
            </Box>
            
            {/* Prerequisites */}
            {item.prerequisites && item.prerequisites.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Prerequisites:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                  {item.prerequisites.map((prereq) => (
                    <Chip key={prereq} label={prereq} size="small" />
                  ))}
                </Box>
              </Box>
            )}
            
            <Divider sx={{ my: 2 }} />
            
            {/* Content */}
            <Box sx={{ mt: 2 }}>
              <ReactMarkdown
                components={{
                  code: ({ node, className, children, ...props }: any) => {
                    const inline = className?.indexOf('inline') !== -1;
                    const match = /language-([\w-]+)/.exec(className || '');
                    return !inline && match ? (
                      <SyntaxHighlighter
                      language={match[1]} style={a11yDark}  
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
                {item.content}
              </ReactMarkdown>
            </Box>
            
            {/* Examples */}
            {item.examples && item.examples.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Examples
                </Typography>
                {item.examples.map((example) => (
                  <Accordion key={example.id} sx={{ mb: 1 }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography>{example.title}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <SyntaxHighlighter
                        language={example.language || "typescript"}
                        style={a11yDark}
                      >
                        {example.code}
                      </SyntaxHighlighter>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default TheoryList;
