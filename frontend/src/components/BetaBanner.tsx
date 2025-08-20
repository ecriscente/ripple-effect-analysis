import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useBetaStatus } from '../hooks/useBetaStatus';
import './BetaBanner.css';

const BetaBanner = () => {
  const { t } = useTranslation();
  const { betaStatus, isLoading } = useBetaStatus();
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    // Store dismissal in localStorage so it doesn't reappear immediately
    localStorage.setItem('beta-banner-dismissed', 'true');
  };

  // Check if banner was previously dismissed (reset daily)
  useEffect(() => {
    const dismissed = localStorage.getItem('beta-banner-dismissed');
    const lastDismissed = localStorage.getItem('beta-banner-dismissed-date');
    const today = new Date().toDateString();
    
    if (dismissed && lastDismissed === today) {
      setIsVisible(false);
    } else if (dismissed && lastDismissed !== today) {
      // Reset dismissal if it's a new day
      localStorage.removeItem('beta-banner-dismissed');
      localStorage.removeItem('beta-banner-dismissed-date');
    }
  }, []);

  if (isLoading || !betaStatus?.is_beta || !isVisible) {
    return null;
  }

  return (
    <div className="beta-banner">
      <div className="beta-banner-content">
        <span className="beta-badge">BETA</span>
        <span className="beta-message">{t('betaBanner.message')}</span>
        <button 
          className="beta-banner-dismiss" 
          onClick={handleDismiss}
          aria-label={t('betaBanner.dismiss')}
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default BetaBanner;