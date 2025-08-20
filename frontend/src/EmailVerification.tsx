import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { apiCall } from './utils/api';

interface VerificationResponse {
  message: string;
}

const EmailVerification: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [status, setStatus] = useState<'loading' | 'verifying' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const hasVerified = useRef(false);

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Verification token is missing.');
      return;
    }

    // Prevent double execution in React StrictMode
    if (hasVerified.current) {
      return;
    }
    hasVerified.current = true;

    const verifyEmail = async () => {
      try {
        // Set to verifying state before making the API call
        setStatus('verifying');
        
        // Add a small delay to ensure users see the verifying state
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const response = await apiCall(`/api/verify-email?token=${token}`);
        const data: VerificationResponse = await response.json();
        
        if (response.ok) {
          setStatus('success');
          setMessage(data.message);
          
          // Redirect to login after 4 seconds
          setTimeout(() => {
            navigate('/login');
          }, 4000);
        } else {
          setStatus('error');
          setMessage(data.message || 'Verification failed.');
        }
      } catch (error) {
        setStatus('error');
        setMessage('Network error occurred during verification.');
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className="verification-container">
      <div className="verification-card">
        <h2>{t('emailVerification')}</h2>

        {(status === 'loading' || status === 'verifying') && (
          <div className="verification-status loading">
            <div className="loader"></div>
            <p>{status === 'loading' ? t('loadingVerification') : t('verifyingEmail')}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="verification-status success">
            <div className="status-icon success-icon">✓</div>
            <h3>{t('emailVerified')}</h3>
            <p className="status-message">{message}</p>
            <p className="redirect-note">{t('redirectingToLogin')}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="verification-status error">
            <div className="status-icon error-icon">✕</div>
            <h3>{t('verificationFailed')}</h3>
            <p className="status-message">{message}</p>
            <button onClick={() => navigate('/login')}>
              {t('backToLogin')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailVerification;