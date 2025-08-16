import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { trackUserLogin } from './analytics';

const Login = ({ onLogin }: { onLogin: () => void }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { t } = useTranslation();

    const handleLogin = async () => {
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
            window.location.href = '/';

        } catch (err) {
            setError(err instanceof Error ? err.message : t('unknownError'));
        }
    };

    return (
        <div className="auth-container">
            <h2>{t('login')}</h2>
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
            <button onClick={handleLogin}>{t('login')}</button>
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