import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import AppLayout from '@/components/AppLayout';
import ContentProcessorPanel from '@/features/content-processor/components/ContentProcessorPanel';
import { useSettingsStore } from '@/features/progress/useSettingsStoreFirebase';

/**
 * Dashboard page component
 */
const DashboardPage: React.FC = () => {
  const { settings } = useSettingsStore();

  return (
    <AppLayout>
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Welcome{settings.name ? `, ${settings.name}` : ''}
          </Typography>
          
          <Typography variant="body1" color="text.secondary" paragraph>
            Process your content incrementally and work with AI-analyzed theory, questions, and tasks.
          </Typography>
          
          {/* Content Processor Panel */}
          <ContentProcessorPanel />
        </Box>
      </Container>
    </AppLayout>
  );
};

export default DashboardPage;
