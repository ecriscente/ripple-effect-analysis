"""
Configuration settings for Ripple Effect Analysis Platform
Includes security limits and launch protection settings
"""

import os
from datetime import timedelta

# Beta Launch Configuration
BETA_CONFIG = {
    "is_beta": True,
    "beta_start_date": "2025-08-20",
    "beta_end_date": "2025-10-20",  # 2 months beta period
    "beta_message": "🚀 You're part of our exclusive beta! Help us optimize for the full launch.",
    "post_beta_strategy": "launch_paid_tiers"  # or "remove_limits"
}

# Analysis limits - BETA VERSION (generous but protected)
ANALYSIS_LIMITS = {
    "beta_free": {
        "per_month": 50,     # Very generous - 50 analyses per month
        "per_day": 10,       # 10 per day - more than most users need
        "per_hour": 3,       # 3 per hour - reasonable pace
        "cooldown_minutes": 5  # Just 5 minutes between analyses
    },
    "beta_verified": {
        "per_month": 100,    # Even more generous for verified emails
        "per_day": 15,       # Higher daily limit
        "per_hour": 5,       # More flexible hourly rate
        "cooldown_minutes": 2  # Minimal cooldown
    },
    # Future launch limits (more conservative)
    "launch_free": {
        "per_month": 10,     # Post-beta: more conservative
        "per_day": 3,        
        "per_hour": 1,       
        "cooldown_minutes": 15
    },
    "launch_verified": {
        "per_month": 25,     
        "per_day": 5,        
        "per_hour": 2,       
        "cooldown_minutes": 10
    },
    "premium": {
        "per_month": 500,    # Paid tier
        "per_day": 50,
        "per_hour": 10,
        "cooldown_minutes": 1
    }
}

# System-wide protection limits
GLOBAL_LIMITS = {
    "new_registrations_per_day": 100,
    "analyses_per_day": 500,
    "max_concurrent_analyses": 10,
    "max_analysis_length": 100,  # Technology input character limit
    "max_failed_login_attempts": 5,
    "login_lockout_minutes": 15
}

# Rate limiting settings (requests per time window)
RATE_LIMITS = {
    "analysis_endpoint": "1 per minute",
    "login_endpoint": "5 per minute", 
    "register_endpoint": "3 per minute",
    "general_api": "100 per minute"
}

# Email verification settings
EMAIL_VERIFICATION = {
    "token_expiry_hours": 24,
    "max_resend_attempts": 3,
    "resend_cooldown_minutes": 5,
    "required_for_analysis": False  # Set to True after implementation
}

# Security settings
SECURITY = {
    "jwt_expiry_hours": 24,
    "password_min_length": 8,
    "session_timeout_hours": 24,
    "require_email_verification": False,  # Enable after implementation
    "analysis_requires_verification": False,  # Future: require verification for analyses
}

# Monitoring thresholds for alerts
MONITORING = {
    "high_usage_threshold": 0.8,  # Alert when 80% of limits reached
    "error_rate_threshold": 0.05,  # Alert on 5% error rate
    "registration_spike_per_hour": 50,
    "failed_login_spike_per_hour": 100
}

# Development vs Production settings
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

if ENVIRONMENT == "development":
    # More relaxed limits for development
    ANALYSIS_LIMITS["beta_free"]["per_hour"] = 10
    ANALYSIS_LIMITS["beta_free"]["cooldown_minutes"] = 1
    GLOBAL_LIMITS["new_registrations_per_day"] = 1000
    
elif ENVIRONMENT == "production":
    # Stricter limits for production launch
    SECURITY["require_email_verification"] = True  # Enable in production
    
# Feature flags for gradual rollout
FEATURE_FLAGS = {
    "enable_email_verification": True,   # Enabled for testing
    "enable_analysis_limits": True,      # Always enabled for cost protection
    "enable_rate_limiting": True,        # Always enabled for security
    "enable_premium_features": False,    # Future paid features
    "enable_public_gallery": False,     # Future community feature
}

# AI Cost protection
AI_COSTS = {
    "estimated_cost_per_analysis": 0.10,  # $0.10 per analysis (conservative estimate)
    "daily_budget_limit": 50.0,           # $50 per day maximum
    "monthly_budget_limit": 1000.0,       # $1000 per month maximum
    "cost_alert_threshold": 0.8,          # Alert at 80% of budget
}

def is_beta_active() -> bool:
    """Check if we're currently in beta period"""
    from datetime import datetime
    if not BETA_CONFIG["is_beta"]:
        return False
    
    # Simple date check - in production you'd want proper date parsing
    # For now, assume we're in beta
    return True

def get_user_tier(user_id: str, email_verified: bool = False) -> str:
    """
    Determine user tier based on current mode (beta/launch) and user status
    """
    if is_beta_active():
        # Beta mode tiers
        if email_verified:
            return "beta_verified"
        return "beta_free"
    else:
        # Post-beta/launch mode tiers
        if email_verified:
            return "launch_verified"
        return "launch_free"

def get_analysis_limit(user_tier: str, period: str) -> int:
    """
    Get analysis limit for user tier and time period
    
    Args:
        user_tier: "beta_free", "beta_verified", "launch_free", etc.
        period: "per_hour", "per_day", or "per_month"
    
    Returns:
        int: Maximum analyses allowed for the period
    """
    # Default fallback to beta_free if tier not found
    default_tier = "beta_free" if is_beta_active() else "launch_free"
    return ANALYSIS_LIMITS.get(user_tier, ANALYSIS_LIMITS[default_tier]).get(period, 1)

def get_cooldown_period(user_tier: str) -> int:
    """
    Get cooldown period in minutes between analyses for user tier
    """
    default_tier = "beta_free" if is_beta_active() else "launch_free"
    return ANALYSIS_LIMITS.get(user_tier, ANALYSIS_LIMITS[default_tier]).get("cooldown_minutes", 30)

def get_beta_status() -> dict:
    """
    Get current beta status and configuration
    """
    return {
        "is_beta": is_beta_active(),
        "beta_message": BETA_CONFIG["beta_message"] if is_beta_active() else None,
        "beta_end_date": BETA_CONFIG["beta_end_date"] if is_beta_active() else None,
        "limits_active": FEATURE_FLAGS.get("enable_analysis_limits", True)
    }