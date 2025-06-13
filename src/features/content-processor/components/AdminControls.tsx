import React from 'react';
import { Box, Typography, Button } from '@mui/material';

interface AdminControlsProps {
  isLoading: boolean;
  hasChunks: boolean;
  handleReset: () => void;
  handleExportToJson: () => void;
}

/**
 * Admin controls for resetting the processor and exporting data
 */
const AdminControls: React.FC<AdminControlsProps> = ({
  isLoading,
  hasChunks,
  handleReset,
  handleExportToJson
}) => {
  return (
    <Box sx={{ mt: 3, pt: 2, borderTop: '1px dashed #ccc' }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        Admin Controls
      </Typography>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="outlined"
          size="small"
          onClick={handleReset}
          disabled={isLoading}
        >
          Reset Processor
        </Button>
        <Button
          variant="outlined"
          size="small"
          color="success"
          onClick={handleExportToJson}
          disabled={isLoading || !hasChunks}
          startIcon={<span role="img" aria-label="download">📥</span>}
        >
          Export to JSON
        </Button>
      </Box>
    </Box>
  );
};

export default AdminControls;
