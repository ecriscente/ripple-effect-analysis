import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface AnalysisSummary {
  0: number; // id
  1: string; // technology
  2: string; // created_at
}

const Dashboard = () => {
  const [analyses, setAnalyses] = useState<AnalysisSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    const fetchAnalyses = async () => {
      setIsLoading(true);
      setError('');
      const token = localStorage.getItem('token');

      if (!token) {
        setError(t('mustBeLoggedInViewAnalyses'));
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/analyses`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'ngrok-skip-browser-warning': '1',
          },
        });

        if (!response.ok) {
          throw new Error(t('failedToFetchAnalyses'));
        }

        const data: AnalysisSummary[] = await response.json();
        setAnalyses(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('unknownError'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalyses();
  }, [t]);

  return (
    <div className="dashboard">
      <h2>{t('myAnalyses')}</h2>
      {error && <p className="error">{error}</p>}
      {isLoading ? (
        <div className="loader"></div>
      ) : analyses.length === 0 ? (
        <div className="empty-state">
          <h3>{t('noAnalysesYet')}</h3>
          <p>{t('emptyDashboardMessage')}</p>
          <Link to="/" className="empty-state-button">
            {t('startFirstAnalysis')}
          </Link>
        </div>
      ) : (
        <ul>
          {analyses.map((analysis) => (
            <li key={analysis[0]}>
              <Link to={`/analysis/${analysis[0]}`}>
                <h3>{analysis[1]}</h3>
                <p>{new Date(analysis[2]).toLocaleString()}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Dashboard;