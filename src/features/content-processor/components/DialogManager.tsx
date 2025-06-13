import React from 'react';
import RewriteChunkDialog from './RewriteChunkDialog';

interface DialogManagerProps {
  isRewriteDialogOpen: boolean;
  handleCloseRewriteDialog: () => void;
  currentChunkId: string | null;
  useLocalLlm: boolean;
  selectedModel: string;
}

/**
 * Component to manage dialog components
 */
const DialogManager: React.FC<DialogManagerProps> = ({
  isRewriteDialogOpen,
  handleCloseRewriteDialog,
  currentChunkId,
  useLocalLlm,
  selectedModel
}) => {
  return (
    <>
      {/* Rewrite chunk dialog */}
      <RewriteChunkDialog
        open={isRewriteDialogOpen}
        onClose={handleCloseRewriteDialog}
        chunkId={currentChunkId || ''}
        useLocalLlm={useLocalLlm}
        localLlmModel={selectedModel}
      />
    </>
  );
};

export default DialogManager;
