from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from typing import Optional

from llm_integration import get_analysis
import database as db
import auth

from fastapi.responses import HTMLResponse

app = FastAPI()

frontend_ngrok_url = "https://57e6116b1724.ngrok-free.app" # <-- IMPORTANT: Change this

origins = [
    "http://localhost:5173",  # Your local dev environment
    frontend_ngrok_url       # Your public frontend
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

class UserLogin(BaseModel):
    email: str
    password: str

@app.on_event("startup")
def startup_db_client():
    db.create_user_table()
    db.create_analysis_table()

@app.post("/api/register")
async def register_user(user: UserCreate):
    db_user = db.get_user(user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    new_user = db.create_user(email=user.email, password=user.password)
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
    
    analysis_result = get_analysis(request.technology, request.language) # Pass language parameter
    
    # Save the analysis to the database
    analysis_id = db.save_analysis(user[0], request.technology, analysis_result)
    if not analysis_id:
        raise HTTPException(status_code=500, detail="Failed to save analysis.")

    return {**analysis_result, "id": analysis_id}

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
        <title>Zeitgeist Engine API</title>
      </head>
      <body>
        <h1>Zeitgeist Engine API</h1>
        <p>If you see this page, your backend is running and ngrok can be approved.</p>
      </body>
    </html>
    """