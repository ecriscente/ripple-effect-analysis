import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next'; // Import i18n to get the current language
import { trackAnalysisSubmission } from './analytics';
import { captureError, addBreadcrumb } from './sentry';
import { useAuthenticatedFetch } from './hooks/useAuthenticatedFetch';
import AnalysisLoader from './components/AnalysisLoader';
import './components/AnalysisComponents.css';

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
  const [showGuidance, setShowGuidance] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const authenticatedFetch = useAuthenticatedFetch();

  const handleExampleClick = (example: string) => {
    setTechnology(example);
  };

  const handleAnalyze = async () => {
    if (!technology) {
      setError(t('pleaseEnterTechnology'));
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      addBreadcrumb('Analysis submission started', 'user_action', { technology, language: i18n.language });
      
      const response = await authenticatedFetch(`${import.meta.env.VITE_API_URL}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ technology, language: i18n.language }), // Send current language
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle session expiration gracefully - don't report to Sentry or set error
        if (response.status === 401 && errorData.error === 'session_expired') {
          // User is already being redirected to login, just return silently
          return;
        }
        
        const errorMessage = t(errorData.detail) || t('failedToFetchAnalysis');
        
        // Report API errors to Sentry (but not session expiration)
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

  if (isLoading) {
    return <AnalysisLoader />;
  }

  return (
    <div className="analysis-form">
      {/* Main Input Section - Priority */}
      <div className="main-input-section">
        <h2 className="main-title">{t('enterTechnologyLabel')}</h2>
        <p className="subtitle">{t('inputGuidanceTextShort')}</p>
        
        {/* Quick Examples */}
        <div className="quick-examples">
          <span className="example-tag" onClick={() => handleExampleClick(t('exampleQuantumComputing'))}>
            {t('exampleQuantumComputing')}
          </span>
          <span className="example-tag" onClick={() => handleExampleClick(t('exampleBrainInterfaces'))}>
            {t('exampleBrainInterfaces')}
          </span>
          <span className="example-tag" onClick={() => handleExampleClick(t('exampleAutonomousVehicles'))}>
            {t('exampleAutonomousVehicles')}
          </span>
        </div>

        <div className="input-wrapper">
          <input
            id="technology-input"
            type="text"
            value={technology}
            onChange={(e) => setTechnology(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isLoading) {
                handleAnalyze();
              }
            }}
            placeholder={t('enterTechnology')}
            maxLength={100}
            className="technology-input"
          />
          <button 
            onClick={handleAnalyze} 
            disabled={isLoading || !technology.trim()}
            className="analyze-button"
          >
            {t('analyze')}
          </button>
        </div>
        
        <div className="input-footer">
          <span className="character-count">
            {technology.length}/100
          </span>
          <button 
            className="help-toggle" 
            onClick={() => setShowGuidance(!showGuidance)}
          >
            {showGuidance ? t('hideHelp') : t('showHelp')}
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Collapsible Detailed Guidance */}
      {showGuidance && (
        <div className="guidance-section">
          <div className="guidance-content">
            <div className="input-guidance">
              <h3>{t('whatToEnter')}</h3>
              <p>{t('inputGuidanceText')}</p>
            </div>
            
            <div className="output-guidance">
              <h3>{t('whatYouGet')}</h3>
              <div className="analysis-preview">
                <div className="preview-section">
                  <span className="preview-icon">🌊</span>
                  <div>
                    <h4>{t('primaryRipples')}</h4>
                    <p>{t('primaryRipplesDescription')}</p>
                  </div>
                </div>
                <div className="preview-section">
                  <span className="preview-icon">🎯</span>
                  <div>
                    <h4>{t('secondaryRipples')}</h4>
                    <p>{t('secondaryRipplesDescription')}</p>
                  </div>
                </div>
                <div className="preview-section">
                  <span className="preview-icon">💡</span>
                  <div>
                    <h4>{t('synthesis')}</h4>
                    <p>{t('synthesisDescription')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisForm;