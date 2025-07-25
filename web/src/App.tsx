import '@mantine/core/styles.css';

import { useEffect } from 'react';
import { MantineProvider } from '@mantine/core';

import { RouteChangeATracker } from '@/features/google/Analytics';
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
      <RouteChangeATracker />
      <MantineProvider theme={theme}>
        <Router />
      </MantineProvider>
    </>
  );
}
