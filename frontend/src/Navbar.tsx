import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';

interface NavbarProps {
  isAuthenticated: boolean;
  handleLogout: () => void;
  theme: string;
  toggleTheme: () => void;
}

const Navbar = ({ isAuthenticated, handleLogout, theme, toggleTheme }: NavbarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const navbarRef = useRef<HTMLElement>(null); // Ref for the navbar element
  const { t } = useTranslation();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = event.target.value;
    
    // Explicitly save to localStorage immediately
    localStorage.setItem('language', newLanguage);
    
    i18n.changeLanguage(newLanguage);
    closeMenu(); // Close menu after language selection
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navbarRef.current && !navbarRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    };

    // Add event listener when component mounts
    document.addEventListener('mousedown', handleClickOutside);

    // Clean up event listener when component unmounts
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [navbarRef]); // Re-run effect if navbarRef changes

  return (
    <nav className="navbar" ref={navbarRef}> {/* Attach ref to the nav element */}
      <div className="navbar-brand">
        <Link to="/" onClick={closeMenu}>{t('zeitgeistEngine')}</Link>
      </div>
      
      {/* Show auth button prominently on mobile when not authenticated */}
      {!isAuthenticated && (
        <div className="mobile-auth-buttons">
          <Link to="/auth" className="mobile-auth-btn" onClick={closeMenu}>
            {t('signIn')}
          </Link>
        </div>
      )}
      
      <button className="hamburger-menu" onClick={toggleMenu}>
        <span className="hamburger-icon"></span>
        <span className="hamburger-icon"></span>
        <span className="hamburger-icon"></span>
      </button>
      
      <div className={`navbar-links ${isOpen ? 'open' : ''}`}>
        <Link to="/" onClick={closeMenu}>{t('home')}</Link>
        {isAuthenticated ? (
          <>
            <Link to="/dashboard" onClick={closeMenu}>{t('dashboard')}</Link>
            <Link to="/" onClick={() => { handleLogout(); closeMenu(); }}>{t('logout')}</Link>
          </>
        ) : (
          <Link to="/auth" onClick={closeMenu}>{t('signIn')}</Link>
        )}
        <button onClick={toggleTheme} className="theme-toggle-button">
          {theme === 'light' ? t('darkMode') : t('lightMode')}
        </button>
        <select onChange={handleLanguageChange} value={i18n.language} className="language-select">
          <option value="en">English</option>
          <option value="pt">Português</option>
        </select>
      </div>
    </nav>
  );
};

export default Navbar;
