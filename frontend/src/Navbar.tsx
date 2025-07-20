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

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
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
          <>
            <Link to="/login" onClick={closeMenu}>{t('login')}</Link>
            <Link to="/register" onClick={closeMenu}>{t('register')}</Link>
          </>
        )}
        <button onClick={toggleTheme} className="theme-toggle-button">
          {theme === 'light' ? t('darkMode') : t('lightMode')}
        </button>
        <button onClick={() => changeLanguage('en')} className="theme-toggle-button">
          EN
        </button>
        <button onClick={() => changeLanguage('pt')} className="theme-toggle-button">
          PT
        </button>
      </div>
    </nav>
  );
};

export default Navbar;