import '@mantine/core/styles.css';

import { useEffect } from 'react';
import { MantineProvider } from '@mantine/core';
import { initializeGA } from '@/lib/google_analytics';
import { Router } from './Router';
import { theme } from './theme';

export default function App() {
  useEffect(() => {
    if (import.meta.env.PROD && import.meta.env.VITE_GA_MEASUREMENT_ID) {
      initializeGA();
    }
  }, []);

  return (
    <>
      <MantineProvider theme={theme}>
        <Router />
      </MantineProvider>
    </>
  );
}
