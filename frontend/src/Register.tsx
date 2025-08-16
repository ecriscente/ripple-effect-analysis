import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { trackUserRegistration } from './analytics';

const Register = ({ onRegister }: { onRegister: () => void }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { t } = useTranslation();

    const handleRegister = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
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
            <button onClick={handleRegister}>{t('register')}</button>
            {error && <p className="error">{error}</p>}
        </div>
    );
};

export default Register;