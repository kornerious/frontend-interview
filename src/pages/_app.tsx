import React, { useEffect, useState } from 'react';
import { AppProps } from 'next/app';
import Head from 'next/head';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { useSettingsStore } from '@/features/progress/useSettingsStore';
import DatabaseInitializer from '@/components/DatabaseInitializer';

// No need to import CSS for react-markdown in newer versions

function MyApp({ Component, pageProps }: AppProps) {
  const { settings } = useSettingsStore();
  const [isClient, setIsClient] = useState(false);
  
  // Handle client-side rendering
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Create theme based on settings
  const theme = createTheme({
    palette: {
      mode: settings.darkMode ? 'dark' : 'light',
      primary: {
        main: '#1976d2',
      },
      secondary: {
        main: '#9c27b0',
      }
    },
    typography: {
      fontFamily: [
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
      ].join(','),
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarWidth: 'thin',
            '&::-webkit-scrollbar': {
              width: '8px',
              height: '8px',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: settings.darkMode ? '#2d2d2d' : '#f5f5f5',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: settings.darkMode ? '#666' : '#ccc',
              borderRadius: '4px',
              '&:hover': {
                backgroundColor: settings.darkMode ? '#888' : '#999',
              },
            },
          },
          pre: {
            backgroundColor: settings.darkMode ? '#2d2d2d' : '#f5f5f5',
            padding: '1rem',
            borderRadius: '4px',
            overflow: 'auto',
          },
          code: {
            backgroundColor: settings.darkMode ? '#3d3d3d' : '#f0f0f0',
            padding: '0.2em 0.4em',
            borderRadius: '3px',
            fontSize: '0.9em',
          },
        },
      },
    },
  });

  // Use a default dark theme for server-side rendering
  if (!isClient) {
    return (
      <>
        <Head>
          <title>Frontend Interview Prep</title>
          <meta name="viewport" content="initial-scale=1, width=device-width" />
        </Head>
        <ThemeProvider theme={createTheme({ palette: { mode: 'dark' } })}>
          <CssBaseline />
          <Component {...pageProps} />
        </ThemeProvider>
      </>
    );
  }
  
  return (
    <>
      <Head>
        <title>Frontend Interview Prep</title>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
      </Head>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <DatabaseInitializer>
          <Component {...pageProps} />
        </DatabaseInitializer>
      </ThemeProvider>
    </>
  );
}

export default MyApp;
