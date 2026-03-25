from dotenv import load_dotenv
load_dotenv()

import os
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.starlette import StarletteIntegration

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from typing import Optional

import secrets
from datetime import datetime, timedelta

from llm_integration import get_analysis, validate_technology # Import validate_technology
import database as db
import auth
import email_service
from usage_limits import UsageLimiter
from config import FEATURE_FLAGS, get_beta_status
from validation import validate_registration_input, raise_validation_error
from migrate import run_migrations

from fastapi.responses import HTMLResponse

# Initialize Sentry
sentry_dsn = os.getenv("SENTRY_DSN")
environment = os.getenv("ENVIRONMENT", "development")

if sentry_dsn:
    sentry_sdk.init(
        dsn=sentry_dsn,
        # Add data like request headers and IP for users
        send_default_pii=True,
        environment=environment,
        traces_sample_rate=0.1 if environment == "production" else 1.0,
        release=f"ripple-effect-analysis-backend@{os.getenv('APP_VERSION', 'dev')}",
    )
    print("Sentry initialized successfully")

app = FastAPI()

# Database configuration - initialize usage limiter later
DB_NAME = os.getenv("POSTGRES_DB", "zeitgeist_db")
DB_USER = os.getenv("POSTGRES_USER", "user")
DB_PASSWORD = os.getenv("POSTGRES_PASSWORD", "password")
DB_HOST = os.getenv("POSTGRES_HOST", "localhost")
DB_PORT = os.getenv("POSTGRES_PORT", "5432")
from urllib.parse import quote_plus
DB_PASSWORD_ENCODED = quote_plus(DB_PASSWORD)
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD_ENCODED}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Usage limiter will be initialized after database setup
usage_limiter = None

# Environment validation
required_env_vars = ["POSTGRES_HOST", "POSTGRES_USER", "POSTGRES_PASSWORD", "POSTGRES_DB"]
missing_vars = [var for var in required_env_vars if not os.getenv(var)]
if missing_vars:
    print(f"Warning: Missing environment variables: {missing_vars}")

# Get frontend URL from environment variable, fallback to localhost for dev
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")

origins = [
    "http://localhost:5173",      # Your local dev environment
    "https://localhost:5173",     # Local HTTPS
    frontend_url,                 # Configurable frontend URL
    "https://ripple-effect.erion.dev",  # Production frontend
    "https://ripple-effect-analysis.vercel.app"  # Vercel default domain
]

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

class AnalysisRequest(BaseModel):
    technology: str
    language: Optional[str] = "en" # Added language parameter

class UserCreate(BaseModel):
    email: str
    password: str
    agreedToTerms: bool

class UserLogin(BaseModel):
    email: str
    password: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class UserCheckRequest(BaseModel):
    email: str

class UnifiedAuthRequest(BaseModel):
    email: str
    password: str
    action: str  # "login" or "register"
    agreedToTerms: Optional[bool] = False

@app.on_event("startup")
def startup_db_client():
    global usage_limiter
    try:
        # Initialize database connection pool first
        db.init_db_pool()
        print("Database connection pool initialized successfully")
        
        # Run database migrations (creates all tables and handles schema updates)
        print("🚀 Running database migrations...")
        migration_success = run_migrations()
        if migration_success:
            print("✅ Database migrations completed successfully")
        else:
            print("⚠️ Database migrations encountered issues, but continuing...")
        
        # Initialize usage limiter (migrations should have created the tables)
        usage_limiter = UsageLimiter(DATABASE_URL)
        print("Usage limiter initialized successfully")
        
    except Exception as e:
        print(f"Warning: Database initialization failed: {e}")
        # Don't crash the app, just log the error
        if sentry_dsn:
            sentry_sdk.capture_exception(e)

@app.post("/api/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    user = db.get_user(request.email)
    if not user:
        # Still return a success message to prevent email enumeration
        return {"message": "If an account with that email exists, a password reset link has been sent."}

    token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(hours=1)
    db.create_password_reset_token(user[0], token, expires_at)

    # Use configurable frontend URL for password reset links
    reset_link = f"{frontend_url}/reset-password/{token}"
    email_service.send_password_reset_email(request.email, reset_link)

    return {"message": "If an account with that email exists, a password reset link has been sent."}

@app.post("/api/reset-password")
async def reset_password(request: ResetPasswordRequest):
    user = db.get_user_by_reset_token(request.token)
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    db.update_user_password(user[0], request.new_password)
    db.delete_password_reset_token(request.token)

    return {"message": "Password has been reset successfully."}

@app.get("/api/verify-email")
async def verify_email(token: str):
    """Verify email address using the token from the verification link"""
    if not token:
        raise HTTPException(status_code=400, detail="Verification token is required")
    
    user_id = db.verify_email_token(token)
    if not user_id:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")
    
    return {"message": "Email verified successfully! You can now log in."}

@app.post("/api/resend-verification")
async def resend_verification_email(email_request: dict):
    """Resend verification email to user"""
    email = email_request.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    
    # Check if user exists and get verification status
    user_status = db.get_user_verification_status(email)
    if not user_status:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_id, email_verified, current_token = user_status
    
    if email_verified:
        raise HTTPException(status_code=400, detail="Email is already verified")
    
    from config import FEATURE_FLAGS
    if not FEATURE_FLAGS.get("enable_email_verification", False):
        raise HTTPException(status_code=400, detail="Email verification is not enabled")
    
    try:
        # Generate new verification token
        verification_token = db.resend_verification_token(user_id)
        
        # Create verification link
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
        verification_link = f"{frontend_url}/verify-email?token={verification_token}"
        
        # Send verification email
        email_service.send_email_verification(email, verification_link)
        
        return {"message": "Verification email sent. Please check your inbox."}
    except Exception as e:
        print(f"Error resending verification email: {e}")
        raise HTTPException(status_code=500, detail="Failed to send verification email")

@app.get("/api/verification-status")
async def get_verification_status(token: str = Depends(oauth2_scheme)):
    """Get current user's email verification status"""
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    email = auth.verify_token(token, credentials_exception)
    user_status = db.get_user_verification_status(email)
    if not user_status:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_id, email_verified, verification_token = user_status
    
    return {
        "email_verified": email_verified,
        "has_pending_verification": verification_token is not None
    }


@app.post("/api/register")
async def register_user(user: UserCreate):
    # Comprehensive input validation
    validation_result = validate_registration_input(
        email=user.email,
        password=user.password,
        agreed_to_terms=user.agreedToTerms
    )
    
    if not validation_result['valid']:
        raise_validation_error(
            "Registration validation failed",
            validation_result['errors']
        )
    
    # Use sanitized email
    sanitized_email = validation_result['sanitized_email']
    
    # Check if user already exists
    db_user = db.get_user(sanitized_email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create the user
    new_user = db.create_user(
        email=sanitized_email, 
        password=user.password, 
        terms_agreed=user.agreedToTerms
    )
    
    if not new_user:
        raise HTTPException(status_code=500, detail="Could not create user account")
    
    # Send email verification if feature is enabled
    from config import FEATURE_FLAGS
    if FEATURE_FLAGS.get("enable_email_verification", False):
        try:
            # Generate verification token
            verification_token = db.create_email_verification_token(new_user[0])
            
            # Create verification link
            frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
            verification_link = f"{frontend_url}/verify-email?token={verification_token}"
            
            # Send verification email
            email_service.send_email_verification(sanitized_email, verification_link)
            
            return {
                "email": new_user[1],
                "message": "Account created successfully. Please check your email to verify your account.",
                "verification_required": True
            }
        except Exception as e:
            print(f"Error sending verification email: {e}")
            # Don't fail registration if email fails
            return {
                "email": new_user[1],
                "message": "Account created successfully.",
                "verification_required": False
            }
    else:
        return {"email": new_user[1]}

@app.post("/api/check-user")
async def check_user_exists(request: UserCheckRequest):
    """
    Check if a user exists without exposing sensitive data.
    Returns whether user exists and needs to register or can login.
    """
    try:
        # Normalize email (trim and lowercase)
        email = request.email.strip().lower()
        
        # Check if user exists
        db_user = db.get_user(email)
        user_exists = db_user is not None
        
        return {
            "exists": user_exists,
            "needs_registration": not user_exists,
            "email": email  # Return normalized email
        }
    except Exception as e:
        print(f"Error checking user: {e}")
        # Don't expose internal errors to client
        raise HTTPException(status_code=500, detail="Unable to check user status")

@app.post("/api/login")
async def login_user(user: UserLogin):
    db_user = db.get_user(user.email)
    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    if not db.verify_password(user.password, db_user[2]):
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/auth")
async def unified_auth(request: UnifiedAuthRequest):
    """
    Unified authentication endpoint that handles both login and registration.
    Provides clearer error messages and user guidance.
    """
    try:
        # Normalize email
        email = request.email.strip().lower()
        
        if request.action == "login":
            # Handle login
            db_user = db.get_user(email)
            if not db_user:
                raise HTTPException(
                    status_code=400, 
                    detail="We don't recognize this email. Would you like to create an account?"
                )
            
            if not db.verify_password(request.password, db_user[2]):
                raise HTTPException(
                    status_code=400, 
                    detail="Incorrect password. Try again or reset your password."
                )
            
            access_token = auth.create_access_token(data={"sub": email})
            return {"access_token": access_token, "token_type": "bearer", "action": "login"}
            
        elif request.action == "register":
            # Handle registration
            if db.get_user(email):
                raise HTTPException(
                    status_code=400, 
                    detail="An account with this email already exists. Try logging in instead."
                )
            
            # Simplified validation - just check terms agreement
            if not request.agreedToTerms:
                raise HTTPException(
                    status_code=400, 
                    detail="Please agree to the Terms of Service to create your account."
                )
            
            # Create user with simplified password requirements
            if len(request.password) < 8:
                raise HTTPException(
                    status_code=400, 
                    detail="Password must be at least 8 characters long."
                )
            
            new_user = db.create_user(email, request.password, request.agreedToTerms)
            
            if not new_user:
                raise HTTPException(status_code=500, detail="Could not create user account")
            
            # Send email verification if feature is enabled
            from config import FEATURE_FLAGS
            if FEATURE_FLAGS.get("enable_email_verification", False):
                try:
                    # Generate verification token
                    verification_token = db.create_email_verification_token(new_user[0])
                    
                    # Create verification link
                    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
                    verification_link = f"{frontend_url}/verify-email?token={verification_token}"
                    
                    # Send verification email
                    email_service.send_email_verification(email, verification_link)
                    
                    access_token = auth.create_access_token(data={"sub": email})
                    return {
                        "access_token": access_token, 
                        "token_type": "bearer", 
                        "action": "register",
                        "message": "Welcome! Your account has been created. Please check your email to verify your account.",
                        "verification_required": True
                    }
                except Exception as e:
                    print(f"Error sending verification email: {e}")
                    # Don't fail registration if email fails
                    access_token = auth.create_access_token(data={"sub": email})
                    return {
                        "access_token": access_token, 
                        "token_type": "bearer", 
                        "action": "register",
                        "message": "Welcome! Your account has been created.",
                        "verification_required": False
                    }
            else:
                access_token = auth.create_access_token(data={"sub": email})
                return {
                    "access_token": access_token, 
                    "token_type": "bearer", 
                    "action": "register",
                    "message": "Welcome! Your account has been created."
                }
        else:
            raise HTTPException(status_code=400, detail="Invalid action. Use 'login' or 'register'.")
            
    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except Exception as e:
        print(f"Unified auth error: {e}")
        raise HTTPException(status_code=500, detail="Authentication failed. Please try again.")

@app.post("/api/analyze")
async def analyze_technology(request: AnalysisRequest, token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    email = auth.verify_token(token, credentials_exception)
    user = db.get_user(email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check usage limits if enabled and usage limiter is initialized
    if FEATURE_FLAGS.get("enable_analysis_limits", True) and usage_limiter:
        # Get user's email verification status
        user_verification = db.get_user_verification_status(email)
        email_verified = user_verification[1] if user_verification else False
        
        can_analyze, reason, next_allowed = usage_limiter.can_user_analyze(
            user[0], 
            email_verified=email_verified
        )
        
        if not can_analyze:
            # Add next allowed time to error response if available
            error_detail = {"message": reason}
            if next_allowed:
                error_detail["next_allowed_at"] = next_allowed.isoformat()
            
            raise HTTPException(
                status_code=429,  # Too Many Requests
                detail=error_detail
            )
    
    try:
        # Add user context to Sentry
        sentry_sdk.set_user({"id": str(user[0]), "email": email})
        sentry_sdk.set_tag("technology", request.technology)
        sentry_sdk.set_tag("language", request.language)
        
        # Validate technology using LLM
        if not validate_technology(request.technology, request.language):
            sentry_sdk.add_breadcrumb(
                message="Technology validation failed",
                category="validation",
                data={"technology": request.technology, "language": request.language}
            )
            raise HTTPException(status_code=400, detail="invalidTechnology") # Return a key for frontend translation

        analysis_result = get_analysis(request.technology, request.language) # Pass language parameter
        
        # Save the analysis to the database
        analysis_id = db.save_analysis(user[0], request.technology, analysis_result)
        if not analysis_id:
            sentry_sdk.capture_message("Failed to save analysis to database", level="error")
            raise HTTPException(status_code=500, detail="Failed to save analysis.")

        # Record successful analysis usage
        if FEATURE_FLAGS.get("enable_analysis_limits", True) and usage_limiter:
            usage_limiter.record_analysis(user[0])

        sentry_sdk.add_breadcrumb(
            message="Analysis completed successfully",
            category="analysis",
            data={"analysis_id": analysis_id, "technology": request.technology}
        )
        
        return {**analysis_result, "id": analysis_id}
        
    except HTTPException:
        raise  # Re-raise HTTP exceptions as-is
    except Exception as e:
        sentry_sdk.capture_exception(e)
        raise HTTPException(status_code=500, detail="An unexpected error occurred during analysis.")

@app.get("/api/analyses")
async def get_user_analyses(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    email = auth.verify_token(token, credentials_exception)
    user = db.get_user(email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    analyses = db.get_analyses_by_user_id(user[0])
    return analyses

@app.get("/api/usage")
async def get_user_usage(token: str = Depends(oauth2_scheme)):
    """Get current user's usage statistics and limits"""
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    email = auth.verify_token(token, credentials_exception)
    user = db.get_user(email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if FEATURE_FLAGS.get("enable_analysis_limits", True) and usage_limiter:
        # Get user's email verification status
        user_verification = db.get_user_verification_status(email)
        email_verified = user_verification[1] if user_verification else False
        
        usage_stats = usage_limiter.get_user_usage_stats(
            user[0],
            email_verified=email_verified
        )
        return usage_stats
    else:
        return {"limits_disabled": True}

@app.get("/api/beta-status")
async def get_beta_status_endpoint():
    """Get current beta status and messaging for public display"""
    return get_beta_status()

@app.get("/api/analysis/{analysis_id}")
async def get_single_analysis(analysis_id: str, token: str = Depends(oauth2_scheme)):
    # Validate UUID format
    try:
        import uuid
        uuid.UUID(analysis_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid analysis ID format")
    
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    email = auth.verify_token(token, credentials_exception)
    user = db.get_user(email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    analysis = db.get_analysis_by_id(analysis_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    # Authorize: Ensure the analysis belongs to the current user
    if analysis["user_id"] != user[0]:
        raise HTTPException(status_code=403, detail="Not authorized to view this analysis")

    return analysis

@app.get("/health")
@app.head("/health")
async def health_check():
    """Simple health check endpoint for keep-alive monitoring services."""
    try:
        # Test database connection
        conn = db.get_db()
        db.return_db_connection(conn)
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "service": "ripple-effect-analysis-backend",
            "database": "connected"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "timestamp": datetime.utcnow().isoformat(),
            "service": "ripple-effect-analysis-backend",
            "error": str(e)
        }

@app.get("/", response_class=HTMLResponse)
async def root():
    return """
    <!DOCTYPE html>
    <html>
      <head>
        <title>Ripple Effect Analysis API</title>
      </head>
      <body>
        <h1>Ripple Effect Analysis API</h1>
        <p>If you see this page, your backend is running and ngrok can be approved.</p>
        <p><a href="/health">Health Check</a> | <a href="/docs">API Documentation</a></p>
      </body>
    </html>
    """