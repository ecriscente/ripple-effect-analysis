import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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

  const handleAnalyze = async () => {
    if (!technology) {
      setError('Please enter a technology to analyze.');
      return;
    }

    setIsLoading(true);
    setError('');

    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in to analyze.');
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
        body: JSON.stringify({ technology }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analysis. Please try again.');
      }

      const data: AnalysisResponse = await response.json();
      navigate(`/analysis/${data.id}`); // Redirect to the new analysis detail page
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
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
            placeholder="Enter an emerging technology (e.g., 'Quantum Computing')"
            />
            <button onClick={handleAnalyze} disabled={isLoading}>
            {isLoading ? 'Analyzing...' : 'Analyze'}
            </button>
        </div>
        {error && <p className="error">{error}</p>}
    </div>
  );
};

export default AnalysisForm;
