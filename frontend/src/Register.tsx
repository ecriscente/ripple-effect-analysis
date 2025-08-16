import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { trackUserRegistration } from './analytics';

const Register = ({ onRegister }: { onRegister: () => void }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [error, setError] = useState('');
    const { t } = useTranslation();

    const handleRegister = async () => {
        if (!agreedToTerms) {
            setError(t('mustAgreeToTerms'));
            return;
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password, agreedToTerms }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || t('failedToRegister'));
            }

            trackUserRegistration('email');
            onRegister(); // Notify parent component
            // Handle successful registration, e.g., redirect to login
            window.location.href = '/login';

        } catch (err) {
            setError(err instanceof Error ? err.message : t('unknownError'));
        }
    };

    return (
        <div className="auth-container">
            <h2>{t('register')}</h2>
            <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('email')}
            />
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('password')}
            />
            <div className="terms-agreement">
                <label>
                    <input
                        type="checkbox"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
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
            <button onClick={handleRegister} disabled={!agreedToTerms}>
                {t('register')}
            </button>
            {error && <p className="error">{error}</p>}
        </div>
    );
};

export default Register;