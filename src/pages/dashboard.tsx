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
          <ContentProcessorPanel />
        </Box>
      </Container>
    </AppLayout>
  );
};

export default DashboardPage;
