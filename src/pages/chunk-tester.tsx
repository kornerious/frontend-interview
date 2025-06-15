import { NextPage } from 'next';
import { Box, Container } from '@mui/material';
import ChunkTestingPanel from '../features/chunk-testing/components/ChunkTestingPanel';
import ChunkTestingTheme from '../features/chunk-testing/components/ChunkTestingTheme';

const ChunkTesterPage: NextPage = () => {
  return (
    <ChunkTestingTheme>
      <Container maxWidth={false} sx={{ py: 4 }}>
        <Box sx={{ minHeight: '100vh' }}>
          <ChunkTestingPanel />
        </Box>
      </Container>
    </ChunkTestingTheme>
  );
};

export default ChunkTesterPage;
