from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from llm_integration import get_analysis # Import our new module

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

class AnalysisRequest(BaseModel):
    technology: str

@app.post("/api/analyze")
async def analyze_technology(request: AnalysisRequest):
    """
    This endpoint now calls our LLM integration module.
    """
    analysis_result = get_analysis(request.technology)
    return analysis_result
