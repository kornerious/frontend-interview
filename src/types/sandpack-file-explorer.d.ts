declare module 'sandpack-file-explorer' {
  import { FC } from 'react';
  
  export interface SandpackFileExplorerProps {
    autoHiddenFiles?: boolean;
  }
  
  export const SandpackFileExplorer: FC<SandpackFileExplorerProps>;
  export const SandpackFileTree: FC<any>;
  export const SandpackFilesProvider: FC<any>;
  export function useSandpackFiles(): any;
}
