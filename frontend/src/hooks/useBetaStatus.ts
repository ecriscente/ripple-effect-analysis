import { useState, useEffect } from 'react';

interface BetaStatus {
  is_beta: boolean;
  beta_message: string | null;
  beta_end_date: string | null;
  limits_active: boolean;
}

let cachedBetaStatus: BetaStatus | null = null;
let betaStatusPromise: Promise<BetaStatus> | null = null;

export const useBetaStatus = () => {
  const [betaStatus, setBetaStatus] = useState<BetaStatus | null>(cachedBetaStatus);
  const [isLoading, setIsLoading] = useState(!cachedBetaStatus);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBetaStatus = async () => {
      // Return cached data if available
      if (cachedBetaStatus) {
        setBetaStatus(cachedBetaStatus);
        setIsLoading(false);
        return;
      }

      // Return existing promise if already fetching
      if (betaStatusPromise) {
        try {
          const status = await betaStatusPromise;
          setBetaStatus(status);
          setIsLoading(false);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to fetch beta status');
          setIsLoading(false);
        }
        return;
      }

      // Create new fetch promise
      betaStatusPromise = (async () => {
        try {
          const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://ripple-effect-analysis.onrender.com';
          const response = await fetch(`${apiBaseUrl}/api/beta-status`);
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const status: BetaStatus = await response.json();
          cachedBetaStatus = status;
          return status;
        } catch (err) {
          betaStatusPromise = null; // Reset promise on error
          throw err;
        } finally {
          betaStatusPromise = null; // Reset promise when done
        }
      })();

      try {
        const status = await betaStatusPromise;
        setBetaStatus(status);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch beta status');
        console.error('Failed to fetch beta status:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBetaStatus();
  }, []); // Empty dependency array - only fetch once

  return { betaStatus, isLoading, error };
};