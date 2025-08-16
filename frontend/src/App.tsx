import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import './App.css';
import { marked } from 'marked';
import Login from './Login';
import Register from './Register';
import Dashboard from './Dashboard';
import AnalysisDetail from './AnalysisDetail';
import AnalysisForm from './AnalysisForm';
import Navbar from './Navbar'; // Import the new Navbar component
import { useTranslation } from 'react-i18next';
import i18n from 'i18next'; // Import i18n to manage language state
import { trackPageView, trackThemeToggle, trackLanguageChange } from './analytics';

import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';

// Component to track page views
const AnalyticsTracker = () => {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname);
  }, [location]);

  return null;
};

const Home = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  const { t } = useTranslation();

  return (
    <div className="about">
      <header>
        <h1>{t('zeitgeistEngine')}</h1>
        <p className="subtitle">{t('subtitle')}</p>
      </header>

      {isAuthenticated ? (
        <AnalysisForm />
      ) : (
        <div className="markdown-content" dangerouslySetInnerHTML={{ __html: marked(t('aboutContent')) }} />
      )}
    </div>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [theme, setTheme] = useState('light');

  const checkAuthStatus = () => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.body.classList.toggle('dark-mode', newTheme === 'dark');
    trackThemeToggle(newTheme);
  };

  useEffect(() => {
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
    window.location.href = '/login';
  };

  return (
    <Router>
      <AnalyticsTracker />
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
          <Route path="/login" element={<Login onLogin={checkAuthStatus} />} />
          <Route path="/register" element={<Register onRegister={checkAuthStatus} />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
