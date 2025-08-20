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
      throw new Error(t('sessionExpiredPleaseLogin'));
    }

    return response;
  }, [navigate, t]); // Only recreate when navigate or t changes

  return authenticatedFetch;
};