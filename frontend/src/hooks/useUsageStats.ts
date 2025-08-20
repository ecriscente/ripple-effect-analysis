import { useState, useEffect } from 'react';
import { useAuthenticatedFetch } from './useAuthenticatedFetch';

interface UsageStats {
  user_tier: string;
  usage: {
    hourly: { used: number; limit: number; remaining: number };
    daily: { used: number; limit: number; remaining: number };
    monthly: { used: number; limit: number; remaining: number };
  };
  last_analysis_at: string | null;
  cooldown_minutes: number;
  limits_disabled?: boolean;
}

export const useUsageStats = () => {
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const authenticatedFetch = useAuthenticatedFetch();

  useEffect(() => {
    let isMounted = true;

    const fetchUsageStats = async () => {
      // Check if user is authenticated before making API call
      const token = localStorage.getItem('token');
      if (!token) {
        if (isMounted) {
          setIsLoading(false);
          setError('User not authenticated');
        }
        return;
      }

      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://ripple-effect-analysis.onrender.com';
        const response = await authenticatedFetch(`${apiBaseUrl}/api/usage`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const usage: UsageStats = await response.json();
        
        // Only update state if component is still mounted
        if (isMounted) {
          setUsageStats(usage);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch usage stats');
          console.error('Failed to fetch usage stats:', err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // Only fetch if we have authenticatedFetch and are authenticated
    if (authenticatedFetch && localStorage.getItem('token')) {
      fetchUsageStats();
    } else if (isMounted) {
      setIsLoading(false);
    }

    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false;
    };
  }, [authenticatedFetch]); // Only depend on authenticatedFetch

  return { usageStats, isLoading, error };
};