import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { trackAnalysisView } from './analytics';

interface AnalysisSection {
  title: string;
  points: string[];
}

interface AnalysisData {
  user_id: number;
  technology: string;
  primary_ripples: AnalysisSection;
  secondary_ripples: AnalysisSection;
  synthesis: AnalysisSection;
  created_at: string;
}

const AnalysisDetail = () => {
  const { id } = useParams();
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { t } = useTranslation();

  const formatMarkdown = (text: string): string => {
    return text
      .replace(/###\s*(.*?)$/gm, '<h3>$1</h3>')                    // ### headers
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')            // **bold text**
      .replace(/([^*\n]*?):\*\*(?:\s|$)/gm, '<strong>$1:</strong> ') // text:** patterns
      .replace(/([^*\n]*?)\*\*(?:\s|$)/gm, '<strong>$1</strong> ') // text** patterns (no colon)
      .replace(/\*([^*\n]+)\*/g, '<em>$1</em>')                    // *italic*
      .replace(/`([^`]+)`/g, '<code>$1</code>')                    // `code`
      .replace(/\n/g, '<br>');                                     // line breaks
  };

  useEffect(() => {
    const fetchAnalysis = async () => {
      setIsLoading(true);
      setError('');
      const token = localStorage.getItem('token');

      if (!token) {
        setError(t('mustBeLoggedInViewAnalyses'));
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/analysis/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'ngrok-skip-browser-warning': '1',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || t('failedToFetchAnalysis'));
        }

        const data: AnalysisData = await response.json();
        setAnalysis(data);
        trackAnalysisView(id || '', data.technology);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('unknownError'));
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchAnalysis();
    }
  }, [id, t]);

  return (
    <div className="analysis-detail">
      {error && <p className="error">{error}</p>}
      {isLoading && <div className="loader"></div>}
      {analysis && (
        <div className="results">
          <h1>{analysis.technology}</h1>
          <p><em>{t('analysisFrom')} {new Date(analysis.created_at).toLocaleString()}</em></p>
          <div className="result-section">
            <h2>{analysis.primary_ripples.title}</h2>
            <ul>
              {analysis.primary_ripples.points.map((point: string, index: number) => (
                <li key={index} dangerouslySetInnerHTML={{ __html: formatMarkdown(point) }}></li>
              ))}
            </ul>
          </div>
          <div className="result-section">
            <h2>{analysis.secondary_ripples.title}</h2>
            <ul>
              {analysis.secondary_ripples.points.map((point: string, index: number) => (
                <li key={index} dangerouslySetInnerHTML={{ __html: formatMarkdown(point) }}></li>
              ))}
            </ul>
          </div>
          <div className="result-section">
            <h2>{analysis.synthesis.title}</h2>
            <ul>
              {analysis.synthesis.points.map((point: string, index: number) => (
                <li key={index} dangerouslySetInnerHTML={{ __html: formatMarkdown(point) }}></li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisDetail;