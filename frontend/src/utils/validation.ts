// Validation utilities for forms - updated

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface PasswordStrength {
  score: number; // 0-4 (weak to very strong)
  feedback: string[];
  isValid: boolean;
}

// Email validation with comprehensive regex
export const validateEmail = (email: string): ValidationResult => {
  if (!email || email.trim() === '') {
    return { isValid: false, error: 'Email is required' };
  }

  // Comprehensive email regex that handles most valid email formats
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!emailRegex.test(email.trim())) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  // Additional checks for common issues
  const trimmedEmail = email.trim().toLowerCase();
  
  // Check for consecutive dots
  if (trimmedEmail.includes('..')) {
    return { isValid: false, error: 'Email cannot contain consecutive dots' };
  }

  // Check for valid domain length
  const domain = trimmedEmail.split('@')[1];
  if (!domain || domain.length < 2) {
    return { isValid: false, error: 'Please enter a valid email domain' };
  }

  // Check for common typos in popular domains
  const commonDomainTypos = {
    'gmial.com': 'gmail.com',
    'gmai.com': 'gmail.com',
    'yahooo.com': 'yahoo.com',
    'hotmial.com': 'hotmail.com',
    'outlok.com': 'outlook.com'
  };

  if (commonDomainTypos[domain as keyof typeof commonDomainTypos]) {
    return { 
      isValid: false, 
      error: `Did you mean ${commonDomainTypos[domain as keyof typeof commonDomainTypos]}?` 
    };
  }

  return { isValid: true };
};

// Password strength validation
export const validatePasswordStrength = (password: string): PasswordStrength => {
  if (!password) {
    return {
      score: 0,
      feedback: ['Password is required'],
      isValid: false
    };
  }

  const feedback: string[] = [];
  let score = 0;

  // Length check (minimum 8 characters)
  if (password.length < 8) {
    feedback.push('Password must be at least 8 characters long');
  } else {
    score += 1;
    if (password.length >= 12) {
      score += 1; // Bonus for longer passwords
    }
  }

  // Character variety checks
  const hasLowerCase = /[a-z]/.test(password);
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!hasLowerCase) feedback.push('Add lowercase letters');
  if (!hasUpperCase) feedback.push('Add uppercase letters');
  if (!hasNumbers) feedback.push('Add numbers');
  if (!hasSpecialChars) feedback.push('Add special characters (!@#$%^&*)');

  // Score based on character variety
  const varietyCount = [hasLowerCase, hasUpperCase, hasNumbers, hasSpecialChars].filter(Boolean).length;
  score += varietyCount;

  // Common password checks
  const commonPasswords = [
    'password', '123456', '12345678', 'qwerty', 'abc123', 
    'password123', 'admin', 'letmein', 'welcome', '123456789'
  ];
  
  if (commonPasswords.includes(password.toLowerCase())) {
    feedback.push('Avoid common passwords');
    score = Math.max(0, score - 2);
  }

  // Sequential characters check
  const hasSequential = /(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|123|234|345|456|567|678|789)/i.test(password);
  if (hasSequential) {
    feedback.push('Avoid sequential characters');
    score = Math.max(0, score - 1);
  }

  // Repetitive characters check
  const hasRepetitive = /(.)\1{2,}/.test(password);
  if (hasRepetitive) {
    feedback.push('Avoid repetitive characters');
    score = Math.max(0, score - 1);
  }

  // Determine final score and validation
  const maxScore = 6; // length(2) + variety(4)
  score = Math.min(score, maxScore);
  
  const isValid = score >= 3 && password.length >= 8 && varietyCount >= 3;

  if (feedback.length === 0) {
    if (score >= 5) {
      feedback.push('Very strong password!');
    } else if (score >= 4) {
      feedback.push('Strong password');
    } else if (score >= 3) {
      feedback.push('Good password');
    }
  }

  return {
    score,
    feedback,
    isValid
  };
};

// Password confirmation validation
export const validatePasswordConfirmation = (password: string, confirmPassword: string): ValidationResult => {
  if (!confirmPassword) {
    return { isValid: false, error: 'Please confirm your password' };
  }

  if (password !== confirmPassword) {
    return { isValid: false, error: 'Passwords do not match' };
  }

  return { isValid: true };
};

// Get password strength color for UI
export const getPasswordStrengthColor = (score: number): string => {
  if (score <= 1) return '#e74c3c'; // Red
  if (score <= 2) return '#f39c12'; // Orange
  if (score <= 3) return '#f1c40f'; // Yellow
  if (score <= 4) return '#2ecc71'; // Green
  return '#27ae60'; // Dark green
};

// Get password strength label
export const getPasswordStrengthLabel = (score: number): string => {
  if (score <= 1) return 'Very Weak';
  if (score <= 2) return 'Weak';
  if (score <= 3) return 'Fair';
  if (score <= 4) return 'Strong';
  return 'Very Strong';
};