import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const useAuthenticatedFetch = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const authenticatedFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error(t('mustBeLoggedIn'));
    }

    const defaultHeaders = {
      'Authorization': `Bearer ${token}`,
      'ngrok-skip-browser-warning': '1',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers: defaultHeaders,
    });

    // Handle 401 Unauthorized - token expired or invalid
    if (response.status === 401) {
      localStorage.removeItem('token');
      navigate('/login');
      // Return a special response instead of throwing to prevent Sentry errors
      return new Response(
        JSON.stringify({ 
          error: 'session_expired', 
          message: t('sessionExpiredPleaseLogin') 
        }),
        { 
          status: 401, 
          statusText: 'Session Expired',
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return response;
  }, [navigate, t]); // Only recreate when navigate or t changes

  return authenticatedFetch;
};