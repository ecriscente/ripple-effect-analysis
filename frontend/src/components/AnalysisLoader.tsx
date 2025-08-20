import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const AnalysisLoader = () => {
  const { t } = useTranslation();
  const [currentPhrase, setCurrentPhrase] = useState(0);

  // Get loading phrases from translations
  const loadingPhrases = t('loadingPhrases', { returnObjects: true }) as string[];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhrase((prev) => (prev + 1) % loadingPhrases.length);
    }, 3000); // Change phrase every 3 seconds

    return () => clearInterval(interval);
  }, [loadingPhrases.length]);

  return (
    <div className="analysis-loader">
      <div className="loader-animation">
        <div className="ripple-effect">
          <div className="ripple"></div>
          <div className="ripple"></div>
          <div className="ripple"></div>
        </div>
      </div>
      
      <div className="loader-content">
        <h3>{t('analyzingYourTechnology')}</h3>
        <p className="loading-phrase" key={currentPhrase}>
          {loadingPhrases[currentPhrase]}
        </p>
        
        <div className="progress-dots">
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot"></span>
        </div>
        
        <p className="estimated-time">{t('estimatedTime')}</p>
      </div>
    </div>
  );
};

export default AnalysisLoader;