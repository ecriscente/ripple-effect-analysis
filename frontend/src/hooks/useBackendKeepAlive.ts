import { useEffect, useRef } from 'react';

// Custom hook for keeping backend alive
export const useBackendKeepAlive = (apiBaseUrl: string, interval: number = 600000) => {
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    const pingBackend = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/health`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          console.log('Backend keep-alive ping successful');
        }
      } catch (error) {
        console.error('Backend keep-alive ping failed:', error);
      }
    };

    // Initial ping
    pingBackend();

    // Set up interval (every 10 minutes by default)
    intervalRef.current = setInterval(pingBackend, interval);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [apiBaseUrl, interval]);
};