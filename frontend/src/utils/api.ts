/**
 * API utility functions for making requests to the backend
 */

const getApiUrl = (): string => {
  return import.meta.env.VITE_API_URL || 'http://localhost:8000';
};

export const apiCall = async (endpoint: string, options?: RequestInit): Promise<Response> => {
  const apiUrl = getApiUrl();
  const url = `${apiUrl}${endpoint}`;
  
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
};

export { getApiUrl };