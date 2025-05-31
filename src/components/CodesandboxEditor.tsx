import React, { useEffect, useState } from 'react';
import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
  SandpackConsole,
  SandpackFiles,
  useSandpack
} from "@codesandbox/sandpack-react";
import { autocompletion, completionKeymap } from "@codemirror/autocomplete";
import { nightOwl } from "@codesandbox/sandpack-themes";
import {
  SandpackFileExplorer,
} from "sandpack-file-explorer";
import firebaseService from "@/utils/firebaseService";

// Custom code change listener component
const CodeChangeListener = ({ onChange, activeFile, contextId }: { onChange: (code: string) => void, activeFile: string, contextId: string }) => {
  const { sandpack } = useSandpack();
  
  // Monitor code changes and report back to parent component
  useEffect(() => {
    // Set up a timer to check for code changes every 500ms
    const intervalId = setInterval(() => {
      if (sandpack && sandpack.files && activeFile && sandpack.files[activeFile]) {
        const currentCode = sandpack.files[activeFile].code || "";
        onChange(currentCode);
        
        // Also save to database with file path as the ID
        // Make sure we have a valid string value for the database
        if (typeof currentCode === "string") {
          firebaseService.saveCodeExample(activeFile, currentCode, contextId)
            .catch(err => console.error(`Error saving code for ${activeFile}:`, err));
        }
      }
    }, 500);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [sandpack, onChange, activeFile, contextId]);
  
  return null;
};

interface CodesandboxEditorProps {
  code: string;
  language: string;
  onChange: (code: string) => void;
  theme?: string;
  readOnly?: boolean;
  contextId?: string; // Identifier for storage context (theory, question, task ID)
}

const CodesandboxEditor: React.FC<CodesandboxEditorProps> = ({
  code,
  language,
  onChange,
  theme = 'dark',
  readOnly = false,
  contextId = "global"
}) => {
  // Maintain state for files
  const [sandpackFiles, setSandpackFiles] = useState<SandpackFiles>({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Determine the template based on language
  const getTemplate = () => {
    switch (language.toLowerCase()) {
      case 'javascript':
      case 'js':
        return 'vanilla' as const;
      case 'typescript':
      case 'ts':
        return 'vanilla-ts' as const;
      case 'react':
      case 'jsx':
        return 'react' as const;
      case 'react-ts':
      case 'tsx':
        return 'react-ts' as const;
      default:
        return 'static' as const;
    }
  };

  // Initialize files on component mount or when code/language changes
  useEffect(() => {
    // Only do this once on mount or when contextId changes
    if (!isLoaded) {
      // Load saved code examples from database first
      const loadSavedCode = async () => {
        try {
          // Try to load saved code examples for this context
          const savedExamples = await firebaseService.getCodeExamples(contextId);
          
          // If we have saved code, use it
          if (savedExamples && Object.keys(savedExamples).length > 0) {
            setSandpackFiles(savedExamples);
            setIsLoaded(true);
            return;
          }
        } catch (error) {
          console.error("Error loading saved code examples:", error);
        }
        
        // If no saved code or error occurred, initialize with defaults
        let files: SandpackFiles = {};
        const template = getTemplate();
        
        // Initialize with appropriate file structure based on template
        if (template === "static") {
          files = {
            '/index.html': code || '<div id="app"></div>',
            '/index1.html': '<p>Additional page</p>',
            '/styles.css': 'body { font-family: sans-serif; }',
            '/public/logo.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-11.5 -10.23174 23 20.46348">
<title>React Logo</title>
<circle cx="0" cy="0" r="2.05" fill="#61dafb"/>
<g stroke="#61dafb" stroke-width="1" fill="none">
<ellipse rx="11" ry="4.2"/>
<ellipse rx="11" ry="4.2" transform="rotate(60)"/>
<ellipse rx="11" ry="4.2" transform="rotate(120)"/>
</g>
</svg>
`
          };
        } else if (template === "vanilla" || template === "vanilla-ts") {
          const ext = template === "vanilla" ? ".js" : ".ts";
          files = {
            [`/index${ext}`]: code || '// Your code here',
            '/index.html': '<div id="app"></div>',
            '/styles.css': 'body { font-family: sans-serif; }'
          };
        } else if (template === "react" || template === "react-ts") {
          const ext = template === "react" ? ".jsx" : ".tsx";
          files = {
            [`/App${ext}`]: code || '// Your React code here',
            '/index.html': '<div id="root"></div>',
            '/styles.css': '.App { font-family: sans-serif; padding: 20px; }'
          };
        } else {
          files = {
            '/index.js': code || '// Your code here',
            '/index.html': '<div id="app"></div>'
          };
        }
        
        // Save initial files to database - convert SandpackFiles to Record<string, string>
        const filesForDb: Record<string, string> = {};
        
        // Extract code content from SandpackFiles
        Object.entries(files).forEach(([path, content]) => {
          if (typeof content === "string") {
            filesForDb[path] = content;
          } else if (content && typeof content === "object" && content.code) {
            filesForDb[path] = content.code;
          }
        });
        
        firebaseService.saveCodeExamples(filesForDb, contextId)
          .catch(err => console.error("Error saving initial code examples:", err));
        
        setSandpackFiles(files);
        setIsLoaded(true);
      };
      
      loadSavedCode();
    }
  }, [code, language, contextId, isLoaded]);

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (e) => {
        if (e.target && e.target.result) {
          // Add the uploaded file to the sandbox
          const newFile = {
            [`/uploads/${file.name}`]: e.target.result as string
          };
          
          setSandpackFiles(prev => ({ ...prev, ...newFile }));
        }
      };
      
      reader.readAsText(file);
    }
  };

  // Get the active file path
  const getActiveFile = (): string => {
    // Determine the main file based on template
    const template = getTemplate();
    
    if (template === 'static') {
      return '/index.html';
    } else if (template === 'vanilla') {
      return '/index.js';
    } else if (template === 'vanilla-ts') {
      return '/index.ts';
    } else if (template === 'react') {
      return '/App.jsx';
    } else if (template === 'react-ts') {
      return '/App.tsx';
    }
    
    return '/index.js';
  };

  return (
    <SandpackProvider
      template={getTemplate()}
      theme={nightOwl}
      files={sandpackFiles}
      options={{
        activeFile: getActiveFile(),
        visibleFiles: Object.keys(sandpackFiles),
        experimental_enableServiceWorker: true,
      }}
    >
      {/* Code change listener to send updates back to parent */}
      {onChange && <CodeChangeListener onChange={onChange} activeFile={getActiveFile()} contextId={contextId} />}
      
      <SandpackLayout>
        <div style={{ display: 'flex', flexDirection: 'column', width: '250px' }}>
          {/* File upload button */}
          <div style={{ padding: '10px', borderBottom: '1px solid #333' }}>
            <input 
              type="file" 
              onChange={handleFileUpload} 
              style={{ fontSize: '12px', width: '100%' }}
            />
          </div>
          
          {/* File explorer */}
          <div style={{ 
            overflow: 'auto', 
            flex: 1,
            maxHeight: '400px'
          }}>
            <SandpackFileExplorer />
          </div>
        </div>
        
        {/* Code editor */}
        <SandpackCodeEditor
          showTabs
          showLineNumbers={true}
          showInlineErrors
          wrapContent
          closableTabs
          extensions={[autocompletion()]}
          extensionsKeymap={completionKeymap as any}
        />
        
        {/* Preview and console */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1 }}>
          <SandpackPreview
            showOpenInCodeSandbox={true}
            showRefreshButton={true}
            style={{ flex: 1 }}
          />
          <SandpackConsole style={{ height: '150px' }} />
        </div>
      </SandpackLayout>
    </SandpackProvider>
  );
};

export default CodesandboxEditor;
