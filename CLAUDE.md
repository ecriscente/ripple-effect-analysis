# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

The Zeitgeist Engine is a web application that automates the "Ripple Effect Analysis" framework for emerging technology assessment. It consists of a React/TypeScript frontend and a FastAPI Python backend that integrates with Google's Gemini API to analyze technologies through a structured prompt engineering approach.

## Development Commands

### Backend (FastAPI)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```
The backend runs at http://localhost:8000

### Frontend (React/Vite)
```bash
cd frontend
npm install
npm run dev      # Development server
npm run build    # Production build
npm run lint     # ESLint
npm run preview  # Preview production build
```
The frontend runs at http://localhost:5173

### Testing
Backend tests are in `backend/tests/` using standard Python testing patterns.

## Architecture

### Backend Structure
- `main.py`: FastAPI application with CORS middleware and `/api/analyze` endpoint
- `llm_integration.py`: Core logic implementing the Ripple Effect Analysis framework with three sequential Gemini API calls
- Uses the `gemini-1.5-flash` model for analysis generation

### Frontend Structure  
- React functional components with TypeScript
- CSS Modules for styling (`App.module.css`)
- Tailwind CSS for utility classes
- Vite for build tooling and development server

### Analysis Framework
The application implements a three-step Ripple Effect Analysis:
1. **Primary Ripples**: Direct technological consequences and capabilities
2. **Secondary Ripples**: Human and societal reactions to the technology
3. **Synthesis**: Business opportunities combining technological capabilities with human needs

Each step uses specific prompt templates defined in `llm_integration.py:34-68` to generate structured analysis outputs.

## Environment Setup

Create a `.env` file in the `backend/` directory:
```
GEMINI_API_KEY="your_gemini_api_key_here"
```

## Key Implementation Details

- The frontend calls the backend at `http://localhost:8000/api/analyze` (App.tsx:45)
- Response parsing handles bullet points and markdown formatting (llm_integration.py:18-25)
- Copy-to-clipboard functionality is implemented for each analysis section
- Error handling covers both API failures and missing environment variables