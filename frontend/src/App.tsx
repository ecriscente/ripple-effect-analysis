import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import './App.css';
import { marked } from 'marked';
import AuthFlow from './AuthFlow';
import Dashboard from './Dashboard';
import AnalysisDetail from './AnalysisDetail';
import AnalysisForm from './AnalysisForm';
import Navbar from './Navbar'; // Import the new Navbar component
import BetaBanner from './components/BetaBanner';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next'; // Import i18n to manage language state
import { trackPageView, trackThemeToggle, trackLanguageChange } from './analytics';
import { initSentry, SentryErrorBoundary, setUserContext, clearUserContext, addBreadcrumb } from './sentry';
import { useBackendKeepAlive } from './hooks/useBackendKeepAlive';

import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import EmailVerification from './EmailVerification';

// Component to track page views
const AnalyticsTracker = () => {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname);
  }, [location]);

  return null;
};

// Floating CTA Button for mobile non-authenticated users
const FloatingCTA = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show floating CTA on mobile for non-authenticated users on homepage
    const shouldShow = !isAuthenticated && 
                      location.pathname === '/' && 
                      window.innerWidth <= 768;
    setIsVisible(shouldShow);

    // Handle window resize
    const handleResize = () => {
      const shouldShow = !isAuthenticated && 
                        location.pathname === '/' && 
                        window.innerWidth <= 768;
      setIsVisible(shouldShow);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isAuthenticated, location.pathname]);

  const handleClick = () => {
    navigate('/auth');
  };

  if (!isVisible) return null;

  return (
    <button 
      className="floating-cta show-mobile" 
      onClick={handleClick}
      aria-label={t('getStarted')}
    >
      {t('getStarted')}
    </button>
  );
};

// Hero Section Component for non-authenticated users
const HeroSection = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/auth');
  };

  const handleTryDemo = () => {
    navigate('/login');
  };

  return (
    <div className="hero-section">
      <div className="hero-content">
        <h1 className="hero-title">{t('heroTitle')}</h1>
        <p className="hero-subtitle">{t('heroSubtitle')}</p>
        
        <div className="hero-actions">
          <button className="cta-primary" onClick={handleGetStarted}>
            {t('tryItNow')}
          </button>
          <button className="cta-secondary" onClick={handleTryDemo}>
            {t('login')}
          </button>
        </div>
        
        <p className="hero-note">{t('noSignupRequired')}</p>
        
        {/* Preview of what users will get */}
        <div className="feature-preview">
          <h3>{t('whatYouGet')}</h3>
          <div className="preview-items">
            <div className="preview-item">
              <strong>{t('primaryRipples')}</strong>
              <p>{t('primaryRipplesDescription')}</p>
            </div>
            <div className="preview-item">
              <strong>{t('secondaryRipples')}</strong>
              <p>{t('secondaryRipplesDescription')}</p>
            </div>
            <div className="preview-item">
              <strong>{t('synthesis')}</strong>
              <p>{t('synthesisDescription')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Home = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  const { t } = useTranslation();
  const [showFullArticle, setShowFullArticle] = useState(false);

  return (
    <div className="about">
      <header>
        <h1>{t('zeitgeistEngine')}</h1>
        <p className="subtitle">{t('subtitle')}</p>
      </header>

      {isAuthenticated ? (
        <AnalysisForm />
      ) : (
        <>
          <HeroSection />
          
          {/* Collapsible detailed article */}
          <div className="article-section">
            <button 
              className="toggle-article-btn"
              onClick={() => setShowFullArticle(!showFullArticle)}
            >
              {showFullArticle ? t('hideHelp') : t('learnMore')}
            </button>
            
            {showFullArticle && (
              <div className="markdown-content" dangerouslySetInnerHTML={{ __html: marked(t('aboutContent')) }} />
            )}
          </div>
        </>
      )}
    </div>
  );
}

const AppContent = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [theme, setTheme] = useState('light');
  const navigate = useNavigate();

  // Keep backend alive during business hours
  const now = new Date();
  const hour = now.getHours();
  const isBusinessHours = hour >= 8 && hour <= 20;
  
  // Activate keep-alive during business hours
  if (isBusinessHours) {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://ripple-effect-analysis.onrender.com';
    useBackendKeepAlive(apiBaseUrl, 600000); // 10 minutes
  }

  const checkAuthStatus = () => {
    const token = localStorage.getItem('token');
    const isAuth = !!token;
    setIsAuthenticated(isAuth);
    
    // Update Sentry user context
    if (isAuth) {
      // You could decode the JWT to get user info, for now just set authenticated state
      setUserContext({ id: 'authenticated-user' });
      addBreadcrumb('User authenticated', 'auth');
    } else {
      clearUserContext();
      addBreadcrumb('User logged out', 'auth');
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.body.classList.toggle('dark-mode', newTheme === 'dark');
    trackThemeToggle(newTheme);
  };

  useEffect(() => {
    // Initialize Sentry for error monitoring
    initSentry();
    
    checkAuthStatus();
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.body.classList.toggle('dark-mode', savedTheme === 'dark');

    // Load and set language from localStorage
    const savedLanguage = localStorage.getItem('language') || 'en';
    i18n.changeLanguage(savedLanguage);
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Save language to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('language', i18n.language);
    trackLanguageChange(i18n.language);
  }, [i18n.language]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    checkAuthStatus();
    navigate('/login');
  };

  return (
    <>
      <AnalyticsTracker />
      <BetaBanner />
      <div className="container">
        <Navbar
          isAuthenticated={isAuthenticated}
          handleLogout={handleLogout}
          theme={theme}
          toggleTheme={toggleTheme}
        />
        <Routes>
          <Route path="/" element={<Home isAuthenticated={isAuthenticated} />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/analysis/:id" element={<AnalysisDetail />} />
          <Route path="/auth" element={<AuthFlow onAuth={checkAuthStatus} />} />
          <Route path="/login" element={<AuthFlow onAuth={checkAuthStatus} initialMode="login" />} />
          <Route path="/register" element={<AuthFlow onAuth={checkAuthStatus} initialMode="register" />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/verify-email" element={<EmailVerification />} />
        </Routes>
        <FloatingCTA isAuthenticated={isAuthenticated} />
      </div>
    </>
  );
};

function App() {
  return (
    <SentryErrorBoundary fallback={({ error, resetError }) => (
      <div className="error-boundary">
        <h2>Something went wrong</h2>
        <p>We've been notified of this error and will fix it soon.</p>
        <button onClick={resetError}>Try again</button>
        {import.meta.env.DEV && <pre>{error instanceof Error ? error.toString() : 'Unknown error'}</pre>}
      </div>
    )}>
      <Router>
        <AppContent />
      </Router>
    </SentryErrorBoundary>
  );
}

export default App;
