import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const AnalysisDetail = () => {
  const { id } = useParams();
  const [analysis, setAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalysis = async () => {
      setIsLoading(true);
      setError('');
      const token = localStorage.getItem('token');

      if (!token) {
        setError('You must be logged in to view this analysis.');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`http://localhost:8000/api/analysis/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to fetch analysis.');
        }

        const data = await response.json();
        setAnalysis(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchAnalysis();
    }
  }, [id]);

  return (
    <div className="analysis-detail">
      {error && <p className="error">{error}</p>}
      {isLoading && <div className="loader"></div>}
      {analysis && (
        <div className="results">
          <h1>{analysis.technology}</h1>
          <p><em>Analysis from {new Date(analysis.created_at).toLocaleString()}</em></p>
          <div className="result-section">
            <h2>{analysis.primary_ripples.title}</h2>
            <ul>
              {analysis.primary_ripples.points.map((point: string, index: number) => (
                <li key={index} dangerouslySetInnerHTML={{ __html: point.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}></li>
              ))}
            </ul>
          </div>
          <div className="result-section">
            <h2>{analysis.secondary_ripples.title}</h2>
            <ul>
              {analysis.secondary_ripples.points.map((point: string, index: number) => (
                <li key={index} dangerouslySetInnerHTML={{ __html: point.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}></li>
              ))}
            </ul>
          </div>
          <div className="result-section">
            <h2>{analysis.synthesis.title}</h2>
            <ul>
              {analysis.synthesis.points.map((point: string, index: number) => (
                <li key={index} dangerouslySetInnerHTML={{ __html: point.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}></li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisDetail;
