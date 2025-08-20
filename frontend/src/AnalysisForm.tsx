import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next'; // Import i18n to get the current language
import { trackAnalysisSubmission } from './analytics';
import { captureError, addBreadcrumb } from './sentry';
import { useAuthenticatedFetch } from './hooks/useAuthenticatedFetch';

// Define the structure of the analysis response
interface AnalysisSection {
  title: string;
  points: string[];
}

interface AnalysisResponse {
  id: number;
  primary_ripples: AnalysisSection;
  secondary_ripples: AnalysisSection;
  synthesis: AnalysisSection;
}

const AnalysisForm = () => {
  const [technology, setTechnology] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { t } = useTranslation();
  const authenticatedFetch = useAuthenticatedFetch();

  const handleAnalyze = async () => {
    if (!technology) {
      setError(t('pleaseEnterTechnology'));
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      addBreadcrumb('Analysis submission started', 'user_action', { technology, language: i18n.language });
      
      const response = await authenticatedFetch(`${import.meta.env.VITE_API_BASE_URL}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ technology, language: i18n.language }), // Send current language
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = t(errorData.detail) || t('failedToFetchAnalysis');
        
        // Report API errors to Sentry
        captureError(new Error(`Analysis API Error: ${errorMessage}`), {
          technology,
          language: i18n.language,
          statusCode: response.status,
          errorData
        });
        
        throw new Error(errorMessage);
      }

      const data: AnalysisResponse = await response.json();
      trackAnalysisSubmission(technology, i18n.language);
      addBreadcrumb('Analysis submission successful', 'user_action', { analysisId: data.id });
      navigate(`/analysis/${data.id}`); // Redirect to the new analysis detail page
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('unknownError');
      setError(errorMessage);
      
      // Report unexpected errors to Sentry
      if (err instanceof Error) {
        captureError(err, { technology, language: i18n.language, context: 'analysis_submission' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="analysis-form">
        <div className="input-section">
            <input
            type="text"
            value={technology}
            onChange={(e) => setTechnology(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                handleAnalyze();
                }
            }}
            placeholder={t('enterTechnology')}
            maxLength={100} // Added character limit
            />
            <button onClick={handleAnalyze} disabled={isLoading}>
            {isLoading ? t('analyzing') : t('analyze')}
            </button>
        </div>
        {error && <p className="error">{error}</p>}
    </div>
  );
};

export default AnalysisForm;