import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { sendPageView } from '@/lib/google_analytics';

export const RouteChangeATracker = (): null => {
  const location = useLocation();

  useEffect(() => {
    sendPageView(location.pathname + location.search, document.title);
  }, [location]);

  return null;
};
