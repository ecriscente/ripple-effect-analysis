# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"Ripple Effect Analysis" is a full-stack web application that automates the Ripple Effect Analysis framework for emerging technologies. The application uses FastAPI (backend) and React with TypeScript (frontend) to provide structured analysis of technology impacts using Google Gemini AI.

## Development Commands

### Frontend (React/TypeScript/Vite)
```bash
cd frontend
npm install          # Install dependencies
npm run dev          # Start development server (http://localhost:5173)
npm run build        # Build for production (TypeScript compilation + Vite build)
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

### Backend (FastAPI/Python)
```bash
cd backend
python -m venv venv  # Create virtual environment
source venv/bin/activate  # Activate (Linux/Mac) or venv\Scripts\activate (Windows)
pip install -r requirements.txt  # Install dependencies
uvicorn main:app --reload  # Start development server (http://localhost:8000)
python llm_integration.py  # Test LLM integration standalone
python -m pytest    # Run backend tests
```

### Database (PostgreSQL)
```bash
docker-compose up -d  # Start PostgreSQL database
docker-compose down   # Stop database
```

## Architecture

### Backend Structure
- **main.py**: FastAPI application with authentication, CORS, and API endpoints
- **llm_integration.py**: Google Gemini AI integration for technology analysis using structured prompts
- **database.py**: PostgreSQL operations using psycopg for user management and analysis storage
- **auth.py**: JWT token-based authentication system
- **email_service.py**: SendGrid email service for password resets
- **prompts/**: Multilingual prompt templates (en/pt) for AI analysis phases

### Frontend Structure
- **App.tsx**: Main router with authentication state, theme management, and i18n
- **AnalysisForm.tsx**: Technology input form with language selection
- **Dashboard.tsx**: User's saved analyses list
- **AnalysisDetail.tsx**: Individual analysis view with formatted results
- **Navbar.tsx**: Navigation with theme toggle and language switcher
- **i18n.ts**: Internationalization configuration (English/Portuguese)

### Key Features
- **Multi-phase AI Analysis**: Technology validation → Primary ripples → Secondary ripples → Synthesis
- **Internationalization**: English and Portuguese support with localized prompts and UI
- **Authentication**: JWT-based login/register with password reset via email
- **Theme Support**: Light/dark mode with localStorage persistence
- **Responsive Design**: Mobile-friendly interface

### Environment Variables
Backend requires `.env` file:
```
GEMINI_API_KEY=your_gemini_api_key
POSTGRES_DB=zeitgeist_db
POSTGRES_USER=user
POSTGRES_PASSWORD=password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```

### API Endpoints
- `POST /api/register` - User registration
- `POST /api/login` - User authentication
- `POST /api/analyze` - Submit technology for analysis (requires auth)
- `GET /api/analyses` - Get user's analysis history (requires auth)
- `GET /api/analysis/{id}` - Get specific analysis (requires auth)
- `POST /api/forgot-password` - Request password reset
- `POST /api/reset-password` - Complete password reset

### Testing
- Backend tests in `backend/tests/` using pytest
- Run backend tests: `cd backend && python -m pytest`
- No frontend test framework currently configured

### Database Schema
- **users**: id, email, hashed_password, terms_agreed, terms_agreed_at, created_at
- **analyses**: id, user_id, technology, analysis_result (JSON), created_at
- **password_reset_tokens**: user_id, token, expires_at

### Deployment Notes
- Frontend builds to static files via Vite
- Backend deployable as ASGI application
- PostgreSQL database via Docker Compose
- CORS configured for localhost development and production
- **Live Application**: https://ripple-effect.erion.dev

## Project Context & Vision

### Ripple Effect Framework
This application implements the "Ripple Effect Analysis" framework - a systematic methodology for analyzing emerging technologies by examining:
1. **Primary Ripples**: Direct technological consequences and capabilities
2. **Secondary Ripples**: Human and societal reactions to those changes
3. **Synthesis**: Business opportunities at the intersection of technology and human needs

### Development Phases
- **Phase 1 (Complete)**: Core MVP with LLM integration and basic UI
- **Phase 2 (Complete)**: User authentication, data persistence, internationalization, dark mode
- **Phase 3 (Complete)**: Password reset functionality, UI/UX refinements
- **Future Phases**: Team collaboration, advanced exports, trend database, public API

### Key Documentation
- **SECURITY_REPORT.md**: Critical security assessment with vulnerabilities, fixes, and launch protection strategies
- **ROADMAP.md**: Comprehensive development roadmap with prioritized features, timelines, and business opportunities
- **achievements.md**: Detailed project completion status and feature history
- **DEPLOYMENT_PLAN.md**: Comprehensive deployment strategy for free-tier cloud services
- **NOTES.md**: Strategic roadmap and future development priorities
- **The_Ripple_Effect_of_AI.md**: Framework explanation and methodology
- **Ripple_Effect_Framework_Guide.md**: Practical guide for using the analysis framework

### Core Principles
- Prompt confidentiality and continuous optimization are highest priorities
- Focus on workflow integration and user experience
- Support for multiple languages (English/Portuguese as foundation)
- Human-centered approach to technology analysis