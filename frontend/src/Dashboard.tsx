import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [analyses, setAnalyses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalyses = async () => {
      setIsLoading(true);
      setError('');
      const token = localStorage.getItem('token');

      if (!token) {
        setError('You must be logged in to view your analyses.');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('http://localhost:8000/api/analyses', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch analyses.');
        }

        const data = await response.json();
        setAnalyses(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalyses();
  }, []);

  return (
    <div className="dashboard">
      <h2>My Analyses</h2>
      {error && <p className="error">{error}</p>}
      {isLoading ? (
        <div className="loader"></div>
      ) : (
        <ul>
          {analyses.map((analysis: any) => (
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
