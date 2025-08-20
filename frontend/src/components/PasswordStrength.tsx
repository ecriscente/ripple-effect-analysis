import { type PasswordStrength as PasswordStrengthType, getPasswordStrengthColor, getPasswordStrengthLabel } from '../utils/validation';
import './PasswordStrength.css';

interface PasswordStrengthProps {
  strength: PasswordStrengthType;
  showFeedback?: boolean;
}

const PasswordStrength = ({ strength, showFeedback = true }: PasswordStrengthProps) => {
  const strengthColor = getPasswordStrengthColor(strength.score);
  const strengthLabel = getPasswordStrengthLabel(strength.score);
  const strengthPercent = Math.max(10, (strength.score / 5) * 100); // Minimum 10% for visibility

  return (
    <div className="password-strength">
      <div className="strength-bar-container">
        <div className="strength-label">
          <span className="strength-text">{strengthLabel}</span>
          <span className="strength-score">{strength.score}/5</span>
        </div>
        <div className="strength-bar">
          <div 
            className="strength-fill"
            style={{ 
              width: `${strengthPercent}%`,
              backgroundColor: strengthColor,
              transition: 'all 0.3s ease'
            }}
          />
        </div>
      </div>
      
      {showFeedback && strength.feedback.length > 0 && (
        <div className="strength-feedback">
          {strength.feedback.map((feedback, index) => (
            <div 
              key={index} 
              className={`feedback-item ${strength.isValid && feedback.includes('!') ? 'positive' : 'suggestion'}`}
            >
              {strength.isValid && feedback.includes('!') ? '✓' : '•'} {feedback}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PasswordStrength;