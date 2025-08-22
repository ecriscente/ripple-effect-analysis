import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthenticatedFetch } from './hooks/useAuthenticatedFetch';
import BetaUsageCard from './components/BetaUsageCard';

interface AnalysisSummary {
  0: string; // id (UUID)
  1: string; // technology
  2: string; // created_at
}

const Dashboard = () => {
  const [analyses, setAnalyses] = useState<AnalysisSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { t } = useTranslation();
  const authenticatedFetch = useAuthenticatedFetch();

  useEffect(() => {
    const fetchAnalyses = async () => {
      setIsLoading(true);
      setError('');

      try {
        const response = await authenticatedFetch(`${import.meta.env.VITE_API_URL}/api/analyses`);

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
  }, []); // Remove 't' dependency to prevent refetch on language change

  return (
    <div className="dashboard">
      <h2>{t('myAnalyses')}</h2>
      <BetaUsageCard />
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