import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next'; // Import i18n to get the current language
import { trackAnalysisSubmission } from './analytics';

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

  const handleAnalyze = async () => {
    if (!technology) {
      setError(t('pleaseEnterTechnology'));
      return;
    }

    setIsLoading(true);
    setError('');

    const token = localStorage.getItem('token');
    if (!token) {
      setError(t('mustBeLoggedInAnalyze'));
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ technology, language: i18n.language }), // Send current language
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Use the errorData.detail as a translation key
        throw new Error(t(errorData.detail) || t('failedToFetchAnalysis'));
      }

      const data: AnalysisResponse = await response.json();
      trackAnalysisSubmission(technology, i18n.language);
      navigate(`/analysis/${data.id}`); // Redirect to the new analysis detail page
    } catch (err) {
      setError(err instanceof Error ? err.message : t('unknownError'));
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