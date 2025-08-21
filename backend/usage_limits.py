"""
Usage limits and tracking for analysis requests
Protects against abuse and manages costs during launch
"""

import os
from datetime import datetime, timedelta, timezone
from typing import Dict, Optional, Tuple
import psycopg
from config import ANALYSIS_LIMITS, get_user_tier, get_analysis_limit, get_cooldown_period

class UsageLimiter:
    def __init__(self, db_url: str):
        self.db_url = db_url
        # Tables are now created by migrations, no need to create them here
    
    def _init_usage_tables(self):
        """Create usage tracking tables if they don't exist"""
        with psycopg.connect(self.db_url) as conn:
            with conn.cursor() as cursor:
                # Check if users table exists before creating usage tables
                cursor.execute("""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_name = 'users'
                    )
                """)
                users_table_exists = cursor.fetchone()[0]
                
                if not users_table_exists:
                    print("Warning: Users table doesn't exist yet. Skipping usage table creation.")
                    return
                    
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS user_usage (
                        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                        last_analysis_at TIMESTAMP WITH TIME ZONE,
                        analyses_this_hour INTEGER DEFAULT 0,
                        analyses_this_day INTEGER DEFAULT 0,
                        analyses_this_month INTEGER DEFAULT 0,
                        hour_reset_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                        day_reset_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                        month_reset_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                        PRIMARY KEY (user_id)
                    )
                """)
                
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS global_usage (
                        date DATE PRIMARY KEY,
                        total_analyses INTEGER DEFAULT 0,
                        total_registrations INTEGER DEFAULT 0,
                        concurrent_analyses INTEGER DEFAULT 0,
                        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                    )
                """)
            conn.commit()
    
    def ensure_usage_tables_exist(self):
        """Retry creating usage tables (call after main tables are created)"""
        self._init_usage_tables()
    
    def can_user_analyze(self, user_id: str, email_verified: bool = False) -> Tuple[bool, str, Optional[datetime]]:
        """
        Check if user can perform an analysis
        
        Returns:
            (can_analyze: bool, reason: str, next_allowed: Optional[datetime])
        """
        user_tier = get_user_tier(user_id, email_verified)
        now = datetime.now(timezone.utc)
        
        with psycopg.connect(self.db_url) as conn:
            with conn.cursor() as cursor:
                # Get or create user usage record
                cursor.execute("""
                    INSERT INTO user_usage (user_id) VALUES (%s)
                    ON CONFLICT (user_id) DO NOTHING
                """, (user_id,))
                
                cursor.execute("""
                    SELECT 
                        last_analysis_at,
                        analyses_this_hour, hour_reset_at,
                        analyses_this_day, day_reset_at,
                        analyses_this_month, month_reset_at
                    FROM user_usage WHERE user_id = %s
                """, (user_id,))
                
                usage = cursor.fetchone()
                if not usage:
                    # First analysis for this user
                    return True, "First analysis allowed", None
                
                (last_analysis, hourly_count, hour_reset, 
                 daily_count, day_reset, monthly_count, month_reset) = usage
                
                # Reset counters if time periods have passed
                if now >= hour_reset + timedelta(hours=1):
                    hourly_count = 0
                if now >= day_reset + timedelta(days=1):
                    daily_count = 0
                if now >= month_reset + timedelta(days=30):  # Approximate month
                    monthly_count = 0
                
                # Check cooldown period
                cooldown_minutes = get_cooldown_period(user_tier)
                if last_analysis and now < last_analysis + timedelta(minutes=cooldown_minutes):
                    next_allowed = last_analysis + timedelta(minutes=cooldown_minutes)
                    return False, f"Please wait {cooldown_minutes} minutes between analyses", next_allowed
                
                # Check hourly limit
                hourly_limit = get_analysis_limit(user_tier, "per_hour")
                if hourly_count >= hourly_limit:
                    next_allowed = hour_reset + timedelta(hours=1)
                    return False, f"Hourly limit reached ({hourly_limit}). Try again next hour.", next_allowed
                
                # Check daily limit
                daily_limit = get_analysis_limit(user_tier, "per_day")
                if daily_count >= daily_limit:
                    next_allowed = day_reset + timedelta(days=1)
                    return False, f"Daily limit reached ({daily_limit}). Try again tomorrow.", next_allowed
                
                # Check monthly limit
                monthly_limit = get_analysis_limit(user_tier, "per_month")
                if monthly_count >= monthly_limit:
                    next_allowed = month_reset + timedelta(days=30)
                    return False, f"Monthly limit reached ({monthly_limit}). Consider email verification for higher limits.", next_allowed
                
                return True, "Analysis allowed", None
    
    def record_analysis(self, user_id: str) -> None:
        """Record that user has performed an analysis"""
        now = datetime.now(timezone.utc)
        
        with psycopg.connect(self.db_url) as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    UPDATE user_usage SET
                        last_analysis_at = %s,
                        analyses_this_hour = CASE 
                            WHEN %s >= hour_reset_at + INTERVAL '1 hour' 
                            THEN 1 
                            ELSE analyses_this_hour + 1 
                        END,
                        analyses_this_day = CASE 
                            WHEN %s >= day_reset_at + INTERVAL '1 day' 
                            THEN 1 
                            ELSE analyses_this_day + 1 
                        END,
                        analyses_this_month = CASE 
                            WHEN %s >= month_reset_at + INTERVAL '30 days' 
                            THEN 1 
                            ELSE analyses_this_month + 1 
                        END,
                        hour_reset_at = CASE 
                            WHEN %s >= hour_reset_at + INTERVAL '1 hour' 
                            THEN %s 
                            ELSE hour_reset_at 
                        END,
                        day_reset_at = CASE 
                            WHEN %s >= day_reset_at + INTERVAL '1 day' 
                            THEN %s 
                            ELSE day_reset_at 
                        END,
                        month_reset_at = CASE 
                            WHEN %s >= month_reset_at + INTERVAL '30 days' 
                            THEN %s 
                            ELSE month_reset_at 
                        END
                    WHERE user_id = %s
                """, (now, now, now, now, now, now, now, now, now, now, user_id))
                
                # Update global usage
                cursor.execute("""
                    INSERT INTO global_usage (date, total_analyses) VALUES (CURRENT_DATE, 1)
                    ON CONFLICT (date) DO UPDATE SET
                        total_analyses = global_usage.total_analyses + 1,
                        updated_at = CURRENT_TIMESTAMP
                """)
            conn.commit()
    
    def get_user_usage_stats(self, user_id: str, email_verified: bool = False) -> Dict:
        """Get current usage statistics for a user"""
        user_tier = get_user_tier(user_id, email_verified)
        
        with psycopg.connect(self.db_url) as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT 
                        analyses_this_hour, analyses_this_day, analyses_this_month,
                        last_analysis_at
                    FROM user_usage WHERE user_id = %s
                """, (user_id,))
                
                usage = cursor.fetchone()
                if not usage:
                    usage = (0, 0, 0, None)
                
                hourly_used, daily_used, monthly_used, last_analysis = usage
                
                return {
                    "user_tier": user_tier,
                    "usage": {
                        "hourly": {
                            "used": hourly_used,
                            "limit": get_analysis_limit(user_tier, "per_hour"),
                            "remaining": max(0, get_analysis_limit(user_tier, "per_hour") - hourly_used)
                        },
                        "daily": {
                            "used": daily_used,
                            "limit": get_analysis_limit(user_tier, "per_day"),
                            "remaining": max(0, get_analysis_limit(user_tier, "per_day") - daily_used)
                        },
                        "monthly": {
                            "used": monthly_used,
                            "limit": get_analysis_limit(user_tier, "per_month"),
                            "remaining": max(0, get_analysis_limit(user_tier, "per_month") - monthly_used)
                        }
                    },
                    "last_analysis_at": last_analysis.isoformat() if last_analysis else None,
                    "cooldown_minutes": get_cooldown_period(user_tier)
                }
    
    def get_global_usage_stats(self) -> Dict:
        """Get system-wide usage statistics"""
        with psycopg.connect(self.db_url) as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT 
                        COALESCE(SUM(total_analyses), 0) as total_today,
                        COALESCE(SUM(total_registrations), 0) as registrations_today
                    FROM global_usage 
                    WHERE date = CURRENT_DATE
                """)
                
                today_stats = cursor.fetchone()
                total_today, registrations_today = today_stats or (0, 0)
                
                cursor.execute("""
                    SELECT COUNT(*) FROM users 
                    WHERE created_at >= CURRENT_DATE
                """)
                actual_registrations = cursor.fetchone()[0]
                
                return {
                    "today": {
                        "analyses": total_today,
                        "registrations": actual_registrations
                    },
                    "limits": {
                        "daily_analyses": 500,
                        "daily_registrations": 100
                    },
                    "percentage_used": {
                        "analyses": (total_today / 500) * 100,
                        "registrations": (actual_registrations / 100) * 100
                    }
                }