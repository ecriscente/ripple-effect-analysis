import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next'; // Import i18n to get the current language

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
      const response = await fetch('http://localhost:8000/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ technology, language: i18n.language }), // Send current language
      });

      if (!response.ok) {
        throw new Error(t('failedToFetchAnalysis'));
      }

      const data: AnalysisResponse = await response.json();
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
