import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { trackUserLogin } from './analytics';

const Login = ({ onLogin }: { onLogin: () => void }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { t } = useTranslation();
    const navigate = useNavigate();

    const handleLogin = async () => {
        setIsLoading(true);
        setError('');
        
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || t('failedToLogin'));
            }

            const data = await response.json();
            localStorage.setItem('token', data.access_token);
            trackUserLogin('email');
            onLogin(); // Notify parent component
            navigate('/');

        } catch (err) {
            setError(err instanceof Error ? err.message : t('unknownError'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !isLoading) {
            handleLogin();
        }
    };

    return (
        <div className="auth-container">
            <h2>{t('login')}</h2>
            <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t('email')}
            />
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t('password')}
            />
            <button onClick={handleLogin} disabled={isLoading}>
                {isLoading ? (
                    <span className="loading-button">
                        <span className="spinner"></span>
                        {t('loggingIn')}
                    </span>
                ) : (
                    t('login')
                )}
            </button>
            {error && <p className="error">{error}</p>}
            <p>
                <Link to="/forgot-password">{t('forgotPassword')}</Link>
            </p>
            <p>
                {t('dontHaveAccount')} <Link to="/register">{t('register')}</Link>
            </p>
        </div>
    );
};

export default Login;