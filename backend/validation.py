"""
Input validation utilities for the backend
"""
import re
from typing import List, Optional
from fastapi import HTTPException


def validate_email(email: str) -> tuple[bool, Optional[str]]:
    """
    Validate email format and return validation result
    
    Returns:
        (is_valid: bool, error_message: Optional[str])
    """
    if not email or not isinstance(email, str):
        return False, "Email is required"
    
    email = email.strip()
    
    if not email:
        return False, "Email cannot be empty"
    
    # Comprehensive email regex
    email_pattern = r'^[a-zA-Z0-9.!#$%&\'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$'
    
    if not re.match(email_pattern, email):
        return False, "Invalid email format"
    
    # Check email length (RFC 5321 limit)
    if len(email) > 254:
        return False, "Email address too long"
    
    # Check for consecutive dots
    if '..' in email:
        return False, "Email cannot contain consecutive dots"
    
    # Check domain part
    try:
        local, domain = email.rsplit('@', 1)
        if not domain or len(domain) < 2:
            return False, "Invalid email domain"
        
        # Check local part length (RFC 5321 limit)
        if len(local) > 64:
            return False, "Email local part too long"
            
    except ValueError:
        return False, "Invalid email format"
    
    return True, None


def validate_password_strength(password: str) -> tuple[bool, List[str]]:
    """
    Validate password strength requirements
    
    Returns:
        (is_valid: bool, error_messages: List[str])
    """
    if not password or not isinstance(password, str):
        return False, ["Password is required"]
    
    errors = []
    
    # Length check
    if len(password) < 8:
        errors.append("Password must be at least 8 characters long")
    
    # Character variety checks
    if not re.search(r'[a-z]', password):
        errors.append("Password must contain at least one lowercase letter")
    
    if not re.search(r'[A-Z]', password):
        errors.append("Password must contain at least one uppercase letter")
    
    if not re.search(r'\d', password):
        errors.append("Password must contain at least one number")
    
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        errors.append("Password must contain at least one special character")
    
    # Check for common weak passwords
    weak_passwords = [
        'password', '123456', '12345678', 'qwerty', 'abc123',
        'password123', 'admin', 'letmein', 'welcome', '123456789',
        '1234567890', 'password1', 'qwertyuiop', 'asdfghjkl'
    ]
    
    if password.lower() in weak_passwords:
        errors.append("Password is too common and easily guessable")
    
    # Check for sequential characters
    if re.search(r'(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|123|234|345|456|567|678|789)', password.lower()):
        errors.append("Password should not contain sequential characters")
    
    # Check for repetitive characters
    if re.search(r'(.)\1{2,}', password):
        errors.append("Password should not contain repetitive characters")
    
    return len(errors) == 0, errors


def sanitize_input(input_str: str, max_length: Optional[int] = None) -> str:
    """
    Sanitize string input to prevent XSS and other injection attacks
    """
    if not isinstance(input_str, str):
        return ""
    
    # Remove null bytes and control characters
    sanitized = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', input_str)
    
    # Strip whitespace
    sanitized = sanitized.strip()
    
    # Limit length if specified
    if max_length and len(sanitized) > max_length:
        sanitized = sanitized[:max_length]
    
    return sanitized


def validate_registration_input(email: str, password: str, agreed_to_terms: bool) -> dict:
    """
    Comprehensive validation for user registration
    
    Returns:
        dict with 'valid' boolean and 'errors' list
    """
    errors = []
    
    # Sanitize inputs
    email = sanitize_input(email, 254)  # RFC 5321 email length limit
    
    # Validate email
    email_valid, email_error = validate_email(email)
    if not email_valid:
        errors.append(email_error)
    
    # Validate password
    password_valid, password_errors = validate_password_strength(password)
    if not password_valid:
        errors.extend(password_errors)
    
    # Validate terms agreement
    if not agreed_to_terms:
        errors.append("You must agree to the Terms of Service and Privacy Policy")
    
    return {
        'valid': len(errors) == 0,
        'errors': errors,
        'sanitized_email': email.lower()  # Normalize email to lowercase
    }


def raise_validation_error(message: str, details: Optional[List[str]] = None):
    """
    Raise a properly formatted validation error
    """
    error_detail = {"message": message}
    if details:
        error_detail["validation_errors"] = details
    
    raise HTTPException(status_code=422, detail=error_detail)