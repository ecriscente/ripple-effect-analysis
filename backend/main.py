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

frontend_production_url = "https://ripple-effect.erion.dev"

origins = [
    "http://localhost:5173",      # Your local dev environment
    frontend_production_url       # Your production frontend
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

@app.on_event("startup")
def startup_db_client():
    db.create_user_table()
    db.create_analysis_table()
    db.create_password_reset_table()

@app.post("/api/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    user = db.get_user(request.email)
    print(f"User found: {user}")  # For debugging purposes
    if not user:
        # Still return a success message to prevent email enumeration
        return {"message": "If an account with that email exists, a password reset link has been sent."}

    token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(hours=1)
    db.create_password_reset_token(user[0], token, expires_at)

    # Use production frontend URL for password reset links
    reset_link = f"{frontend_production_url}/reset-password/{token}"
    print(f"Password reset link: {reset_link}")  # For debugging purposes
    email_service.send_password_reset_email(request.email, reset_link)
    print(f"Password reset email sent to {request.email}")

    return {"message": "If an account with that email exists, a password reset link has been sent."}

@app.post("/api/reset-password")
async def reset_password(request: ResetPasswordRequest):
    user = db.get_user_by_reset_token(request.token)
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    db.update_user_password(user[0], request.new_password)
    db.delete_password_reset_token(request.token)

    return {"message": "Password has been reset successfully."}


@app.post("/api/register")
async def register_user(user: UserCreate):
    if not user.agreedToTerms:
        raise HTTPException(status_code=400, detail="You must agree to the Terms of Service and Privacy Policy to register")
    
    db_user = db.get_user(user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    new_user = db.create_user(email=user.email, password=user.password, terms_agreed=user.agreedToTerms)
    if not new_user:
        raise HTTPException(status_code=400, detail="Could not create user")
    return {"email": new_user[1]}

@app.post("/api/login")
async def login_user(user: UserLogin):
    db_user = db.get_user(user.email)
    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    if not db.verify_password(user.password, db_user[2]):
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

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

@app.get("/api/analysis/{analysis_id}")
async def get_single_analysis(analysis_id: int, token: str = Depends(oauth2_scheme)):
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
      </body>
    </html>
    """