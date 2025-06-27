import React, { useState } from 'react';
import './App.css';

// Define the structure of the analysis response
interface AnalysisSection {
  title: string;
  points: string[];
}

interface AnalysisResponse {
  primary_ripples: AnalysisSection;
  secondary_ripples: AnalysisSection;
  synthesis: AnalysisSection;
}

function App() {
  const [technology, setTechnology] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(text);
      setTimeout(() => setCopiedSection(null), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy:', err);
      // Optionally, provide user feedback that copying failed
    }
  };

  const handleAnalyze = async () => {
    if (!technology) {
      setError('Please enter a technology to analyze.');
      return;
    }

    setIsLoading(true);
    setError('');
    setAnalysis(null);

    try {
      const response = await fetch('http://localhost:8000/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ technology }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analysis. Please try again.');
      }

      const data: AnalysisResponse = await response.json();
      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <header>
        <h1>The Zeitgeist Engine</h1>
        <p className="subtitle">A Framework for Predicting Humanity's Next Necessities</p>
      </header>

      <div className="input-section">
        <input
          type="text"
          value={technology}
          onChange={(e) => setTechnology(e.target.value)}
          placeholder="Enter an emerging technology (e.g., 'Quantum Computing')"
        />
        <button onClick={handleAnalyze} disabled={isLoading}>
          {isLoading ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {isLoading && <div className="loader"></div>}

      {analysis && (
        <div className="results">
          <div className="result-section">
            <div className="section-header">
              <h2>{analysis.primary_ripples.title}</h2>
              <button onClick={() => handleCopy(analysis.primary_ripples.points.join('\n'))}>
                {copiedSection === 'primary' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <ul>
              {analysis.primary_ripples.points.map((point, index) => (
                <li key={index} dangerouslySetInnerHTML={{ __html: point }}></li>
              ))}
            </ul>
          </div>

          <div className="result-section">
            <div className="section-header">
              <h2>{analysis.secondary_ripples.title}</h2>
              <button onClick={() => handleCopy(analysis.secondary_ripples.points.join('\n'))}>
                {copiedSection === 'secondary' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <ul>
              {analysis.secondary_ripples.points.map((point, index) => (
                <li key={index} dangerouslySetInnerHTML={{ __html: point }}></li>
              ))}
            </ul>
          </div>

          <div className="result-section">
            <div className="section-header">
              <h2>{analysis.synthesis.title}</h2>
              <button onClick={() => handleCopy(analysis.synthesis.points.join('\n'))}>
                {copiedSection === 'synthesis' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <ul>
              {analysis.synthesis.points.map((point, index) => (
                <li key={index} dangerouslySetInnerHTML={{ __html: point }}></li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
