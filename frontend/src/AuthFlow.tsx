import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { trackUserLogin, trackUserRegistration } from './analytics';

interface AuthFlowProps {
  onAuth: () => void;
  initialMode?: 'login' | 'register';
}

type AuthStep = 'email' | 'password' | 'register';

const AuthFlow = ({ onAuth, initialMode }: AuthFlowProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [currentStep, setCurrentStep] = useState<AuthStep>('email');
  const [mode, setMode] = useState<'login' | 'register'>(initialMode || 'login');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userExists, setUserExists] = useState<boolean | null>(null);
  
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Reset form when mode changes
  useEffect(() => {
    setPassword('');
    setError('');
    setSuccessMessage('');
    setAgreedToTerms(false);
    if (mode === 'login') {
      setCurrentStep(userExists ? 'password' : 'email');
    } else {
      setCurrentStep('register');
    }
  }, [mode, userExists]);

  const checkUserExists = async (emailToCheck: string) => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/check-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToCheck.trim().toLowerCase() }),
      });

      if (!response.ok) {
        throw new Error('Unable to check account status');
      }

      const data = await response.json();
      setUserExists(data.exists);
      setEmail(data.email); // Use normalized email
      
      if (data.exists) {
        setMode('login');
        setCurrentStep('password');
      } else {
        setMode('register');
        setCurrentStep('register');
      }
    } catch (err) {
      setError('Unable to check account status. Please try again.');
      console.error('User check error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async () => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    await checkUserExists(email.trim());
  };

  const handleAuth = async () => {
    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    if (mode === 'register') {
      if (password.length < 8) {
        setError('Password must be at least 8 characters long');
        return;
      }
      if (!agreedToTerms) {
        setError(t('mustAgreeToTerms'));
        return;
      }
    }

    try {
      setIsLoading(true);
      setError('');

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          action: mode,
          agreedToTerms: mode === 'register' ? agreedToTerms : undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || `Failed to ${mode}`);
      }

      const data = await response.json();
      localStorage.setItem('token', data.access_token);
      
      // Track analytics
      if (mode === 'login') {
        trackUserLogin('email');
      } else {
        trackUserRegistration('email');
      }
      
      // Handle email verification requirement
      if (data.verification_required) {
        // Show verification message but still log user in
        setError(''); // Clear any existing errors
        setSuccessMessage(data.message || 'Please check your email to verify your account.');
        // Still proceed with login, but show the verification message
      }
      
      onAuth();
      navigate('/');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to ${mode}`;
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      if (currentStep === 'email') {
        handleEmailSubmit();
      } else {
        handleAuth();
      }
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
  };

  const goBackToEmail = () => {
    setCurrentStep('email');
    setUserExists(null);
    setPassword('');
    setError('');
  };

  const getStepTitle = () => {
    if (currentStep === 'email') {
      return t('enterEmailToContinue');
    } else if (mode === 'login') {
      return t('welcomeBack');
    } else {
      return t('createAccount');
    }
  };

  const getButtonText = () => {
    if (isLoading) {
      if (currentStep === 'email') return t('checkingAccount');
      return mode === 'login' ? t('signingIn') : t('creatingAccount');
    }
    
    if (currentStep === 'email') return t('continue');
    return mode === 'login' ? t('login') : t('register');
  };

  const canSubmit = () => {
    if (currentStep === 'email') {
      return email.trim().length > 0;
    }
    
    if (mode === 'login') {
      return password.trim().length > 0;
    }
    
    // Register mode
    return password.length >= 8 && agreedToTerms;
  };

  return (
    <div className="auth-container">
      <h2>{getStepTitle()}</h2>
      
      {/* Email Step */}
      {currentStep === 'email' && (
        <>
          <div className="form-field">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t('email')}
              disabled={isLoading}
              autoComplete="email"
              autoFocus
            />
          </div>
          
          <button 
            onClick={handleEmailSubmit} 
            disabled={!canSubmit() || isLoading}
            className={canSubmit() ? 'valid-form' : ''}
          >
            {isLoading ? (
              <span className="loading-button">
                <span className="spinner"></span>
                {getButtonText()}
              </span>
            ) : (
              getButtonText()
            )}
          </button>
        </>
      )}

      {/* Password Step (Login) */}
      {currentStep === 'password' && mode === 'login' && (
        <>
          <div className="email-display">
            <span>{email}</span>
            <button type="button" onClick={goBackToEmail} className="edit-email-btn">
              {t('tryAgain')}
            </button>
          </div>
          
          <div className="form-field">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t('enterPassword')}
              disabled={isLoading}
              autoComplete="current-password"
              autoFocus
            />
          </div>
          
          <button 
            onClick={handleAuth} 
            disabled={!canSubmit() || isLoading}
            className={canSubmit() ? 'valid-form' : ''}
          >
            {isLoading ? (
              <span className="loading-button">
                <span className="spinner"></span>
                {getButtonText()}
              </span>
            ) : (
              getButtonText()
            )}
          </button>
          
          <p>
            <Link to="/forgot-password">{t('forgotPasswordLink')}</Link>
          </p>
          
          <p>
            {t('needAccount')}{' '}
            <button type="button" onClick={switchMode} className="link-button">
              {t('switchToRegister')}
            </button>
          </p>
        </>
      )}

      {/* Registration Step */}
      {currentStep === 'register' && mode === 'register' && (
        <>
          <div className="email-display">
            <span>{email}</span>
            <button type="button" onClick={goBackToEmail} className="edit-email-btn">
              {t('tryAgain')}
            </button>
          </div>
          
          <div className="form-field">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t('choosePassword')}
              disabled={isLoading}
              autoComplete="new-password"
              autoFocus
            />
            {password && (
              <div className="password-hint">
                {password.length >= 8 ? (
                  <span className="field-success">✓ Password meets requirements</span>
                ) : (
                  <span className="field-error">Password must be at least 8 characters</span>
                )}
              </div>
            )}
          </div>

          <div className="terms-agreement">
            <label>
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                disabled={isLoading}
              />
              <span>
                {t('agreeToTerms')}{' '}
                <a href="/terms-of-service.html" target="_blank" rel="noopener noreferrer">
                  {t('termsOfService')}
                </a>{' '}
                {t('and')}{' '}
                <a href="/privacy-policy.html" target="_blank" rel="noopener noreferrer">
                  {t('privacyPolicy')}
                </a>
              </span>
            </label>
          </div>
          
          <button 
            onClick={handleAuth} 
            disabled={!canSubmit() || isLoading}
            className={canSubmit() ? 'valid-form' : ''}
          >
            {isLoading ? (
              <span className="loading-button">
                <span className="spinner"></span>
                {getButtonText()}
              </span>
            ) : (
              getButtonText()
            )}
          </button>
          
          <p>
            {t('haveAccount')}{' '}
            <button type="button" onClick={switchMode} className="link-button">
              {t('switchToLogin')}
            </button>
          </p>
        </>
      )}

      {error && <p className="error">{error}</p>}
      {successMessage && <p className="success-message">{successMessage}</p>}
    </div>
  );
};

export default AuthFlow;