import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { trackUserRegistration } from './analytics';
import { 
  validateEmail, 
  validatePasswordStrength, 
  validatePasswordConfirmation
} from './utils/validation';
import PasswordStrengthIndicator from './components/PasswordStrength';

const Register = ({ onRegister }: { onRegister: () => void }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [error, setError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { t } = useTranslation();
    const navigate = useNavigate();

    // Real-time validation handlers
    const handleEmailChange = (value: string) => {
        setEmail(value);
        const emailValidation = validateEmail(value);
        setEmailError(emailValidation.isValid ? '' : emailValidation.error || '');
    };

    const handlePasswordChange = (value: string) => {
        setPassword(value);
        const passwordStrength = validatePasswordStrength(value);
        setPasswordError(passwordStrength.isValid ? '' : 'Password does not meet requirements');
        
        // Re-validate confirm password if it exists
        if (confirmPassword) {
            const confirmValidation = validatePasswordConfirmation(value, confirmPassword);
            setConfirmPasswordError(confirmValidation.isValid ? '' : confirmValidation.error || '');
        }
    };

    const handleConfirmPasswordChange = (value: string) => {
        setConfirmPassword(value);
        const confirmValidation = validatePasswordConfirmation(password, value);
        setConfirmPasswordError(confirmValidation.isValid ? '' : confirmValidation.error || '');
    };

    const validateForm = (): boolean => {
        let isValid = true;
        
        // Validate email
        const emailValidation = validateEmail(email);
        if (!emailValidation.isValid) {
            setEmailError(emailValidation.error || '');
            isValid = false;
        }

        // Validate password
        const passwordStrength = validatePasswordStrength(password);
        if (!passwordStrength.isValid) {
            setPasswordError('Password does not meet requirements');
            isValid = false;
        }

        // Validate password confirmation
        const confirmValidation = validatePasswordConfirmation(password, confirmPassword);
        if (!confirmValidation.isValid) {
            setConfirmPasswordError(confirmValidation.error || '');
            isValid = false;
        }

        // Validate terms agreement
        if (!agreedToTerms) {
            setError(t('mustAgreeToTerms'));
            isValid = false;
        }

        return isValid;
    };

    const handleRegister = async () => {
        setError('');
        setIsSubmitting(true);

        // Validate form before submission
        if (!validateForm()) {
            setIsSubmitting(false);
            return;
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    email: email.trim().toLowerCase(), 
                    password, 
                    agreedToTerms 
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                
                // Handle validation errors (422 status)
                if (response.status === 422 && data.detail?.validation_errors) {
                    const validationErrors = data.detail.validation_errors;
                    setError(validationErrors.join(', '));
                } else {
                    // Handle other errors
                    setError(data.detail || t('failedToRegister'));
                }
                return;
            }

            trackUserRegistration('email');
            onRegister(); // Notify parent component
            // Handle successful registration, e.g., redirect to login
            navigate('/login');

        } catch (err) {
            setError(err instanceof Error ? err.message : t('unknownError'));
        } finally {
            setIsSubmitting(false);
        }
    };

    // Get password strength for display
    const passwordStrength = validatePasswordStrength(password);
    const isFormValid = validateEmail(email).isValid && 
                       passwordStrength.isValid && 
                       validatePasswordConfirmation(password, confirmPassword).isValid && 
                       agreedToTerms;

    return (
        <div className="auth-container">
            <h2>{t('register')}</h2>
            
            {/* Email field */}
            <div className="form-field">
                <input
                    type="email"
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    placeholder={t('email')}
                    className={emailError ? 'error-input' : ''}
                    disabled={isSubmitting}
                    autoComplete="email"
                />
                {emailError && <p className="field-error">{emailError}</p>}
            </div>

            {/* Password field */}
            <div className="form-field">
                <input
                    type="password"
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    placeholder={t('password')}
                    className={passwordError ? 'error-input' : ''}
                    disabled={isSubmitting}
                    autoComplete="new-password"
                />
                {password && <PasswordStrengthIndicator strength={passwordStrength} />}
                {passwordError && <p className="field-error">{passwordError}</p>}
            </div>

            {/* Confirm Password field */}
            <div className="form-field">
                <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                    placeholder={t('confirmPassword')}
                    className={confirmPasswordError ? 'error-input' : ''}
                    disabled={isSubmitting}
                    autoComplete="new-password"
                />
                {confirmPasswordError && <p className="field-error">{confirmPasswordError}</p>}
                {confirmPassword && !confirmPasswordError && (
                    <p className="field-success">✓ Passwords match</p>
                )}
            </div>

            <div className="terms-agreement">
                <label>
                    <input
                        type="checkbox"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        disabled={isSubmitting}
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
                onClick={handleRegister} 
                disabled={!isFormValid || isSubmitting}
                className={isFormValid ? 'valid-form' : ''}
            >
                {isSubmitting ? 'Creating Account...' : t('register')}
            </button>
            
            {error && <p className="error">{error}</p>}
        </div>
    );
};

export default Register;