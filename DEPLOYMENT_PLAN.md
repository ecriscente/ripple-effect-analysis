# Deployment Plan: The Zeitgeist Engine

This document outlines a strategy for deploying "The Zeitgeist Engine" web application, leveraging free-tier cloud services where possible. The project consists of a React/TypeScript frontend and a FastAPI backend with a SQLite database.

## 1. Project Components Overview

*   **Frontend:** React.js (TypeScript) - A Single Page Application (SPA) that serves static files (HTML, CSS, JavaScript).
*   **Backend:** FastAPI (Python) - A web API that handles business logic, LLM integration, and database interactions.
*   **Database:** SQLite - A file-based database.

## 2. General Deployment Strategy

Given the distinct nature of the frontend (static assets) and backend (dynamic API), the most efficient and cost-effective approach is to deploy them separately. This allows us to utilize specialized services optimized for each component.

## 3. Frontend Deployment Options (Static Site Hosting)

These services are excellent for hosting React applications, offering fast global CDNs, automatic deployments from Git, and generous free tiers.

### Option A: Vercel

*   **Pros:**
    *   Extremely easy setup and integration with GitHub, GitLab, or Bitbucket.
    *   Automatic deployments on every `git push`.
    *   Global CDN for fast content delivery.
    *   Generous free tier suitable for most small to medium projects.
    *   Built-in SSL/TLS.
*   **Cons:** Primarily designed for static sites and serverless functions; while it can host SPAs, complex server-side rendering might require paid tiers.
*   **Setup Steps:**
    1.  Sign up for a Vercel account (can use GitHub for quick signup).
    2.  Click "New Project" and import your Git repository (`zeitgeist-engine`).
    3.  Vercel will usually auto-detect the React project in the `frontend/` directory. If not, manually configure:
        *   **Root Directory:** `frontend/`
        *   **Build Command:** `npm run build`
        *   **Output Directory:** `frontend/dist` (or `frontend/build` depending on your Vite config)
    4.  Click "Deploy." Vercel will build and deploy your application.

### Option B: Netlify

*   **Pros:**
    *   Similar to Vercel, with easy Git integration and automatic deployments.
    *   Excellent free tier, including custom domains and SSL.
    *   Powerful build system and CDN.
*   **Cons:** Similar to Vercel.
*   **Setup Steps:**
    1.  Sign up for a Netlify account (can use GitHub).
    2.  Click "Add new site" -> "Import an existing project."
    3.  Connect your Git provider and select your `zeitgeist-engine` repository.
    4.  Configure your build settings:
        *   **Base directory:** `frontend/`
        *   **Build command:** `npm run build`
        *   **Publish directory:** `frontend/dist` (or `frontend/build`)
    5.  Click "Deploy site."

## 4. Backend Deployment Options (Web Service Hosting)

These services allow you to run your FastAPI application as a persistent web service.

### Option A: Render

*   **Pros:**
    *   Supports various languages and frameworks, including Python/FastAPI.
    *   Generous free tier for web services (up to 750 hours/month, but services sleep after 15 minutes of inactivity and spin up on request, causing cold starts).
    *   Automatic deployments from Git.
    *   Managed PostgreSQL database available (paid tier, but good for future scaling).
*   **Cons:** Free tier services will experience cold starts (a delay when the first request comes in after inactivity).
*   **Setup Steps:**
    1.  Sign up for a Render account (can use GitHub).
    2.  Go to "New" -> "Web Service."
    3.  Connect your Git repository (`zeitgeist-engine`).
    4.  Configure the service:
        *   **Root Directory:** `backend/`
        *   **Runtime:** Python 3
        *   **Build Command:** `pip install -r requirements.txt`
        *   **Start Command:** `uvicorn main:app --host 0.0.0.0 --port 8000` (Ensure `main:app` points to your FastAPI instance)
        *   **Environment Variables:** Add `GEMINI_API_KEY` and any other sensitive variables.
    5.  Click "Create Web Service."

### Option B: Railway

*   **Pros:**
    *   Developer-friendly platform with a focus on ease of use.
    *   Generous free tier (up to $5 usage credit per month).
    *   Supports many languages and databases.
    *   Automatic deployments from Git.
*   **Cons:** Free tier limits might be hit with high usage.
*   **Setup Steps:**
    1.  Sign up for a Railway account (can use GitHub).
    2.  Click "New Project" -> "Deploy from Git Repo."
    3.  Select your `zeitgeist-engine` repository.
    4.  Railway will often auto-detect the Python project. If not, configure:
        *   **Build Command:** `pip install -r requirements.txt`
        *   **Start Command:** `uvicorn main:app --host 0.0.0.0 --port 8000`
        *   **Environment Variables:** Add `GEMINI_API_KEY` and any other sensitive variables.
    5.  Deploy the service.

## 5. Database Considerations (SQLite in Cloud)

Your current setup uses SQLite, which is a file-based database. This is generally **not recommended for cloud deployments** of web services because:
*   **Ephemeral Filesystems:** Most free-tier web service hosts use ephemeral filesystems, meaning any data written to the disk (like your `zeitgeist.db` file) will be lost when the service restarts, scales, or moves to a different server.
*   **Concurrency:** SQLite is not designed for high concurrency from multiple web service instances.

**Recommendation for Production:**
For a production environment, you should migrate to a managed relational database service. Many cloud providers offer free tiers or low-cost options for small databases:

*   **Supabase (PostgreSQL):** Offers a very generous free tier for a managed PostgreSQL database, including a web interface. This is an excellent choice for a free-tier-focused project.
*   **Render PostgreSQL:** Render offers managed PostgreSQL databases, but typically these are on paid tiers.
*   **Railway PostgreSQL:** Similar to Render, Railway provides managed PostgreSQL, often requiring paid tiers for persistent usage.

**Action for SQLite:**
For initial free-tier deployment, you might get away with SQLite if your usage is extremely low and you accept data loss on restarts. However, for any serious use, **migrating to a persistent database like PostgreSQL (e.g., on Supabase's free tier)** is crucial. This would involve:
1.  Choosing a managed database service.
2.  Updating your `backend/database.py` to connect to the new database (e.g., using `SQLAlchemy` with `psycopg2` for PostgreSQL).
3.  Migrating existing data (if any) to the new database.

## 6. Environment Variables

Regardless of the chosen platform, ensure you set your `GEMINI_API_KEY` (and any other sensitive information like database connection strings if you migrate) as **environment variables** on the hosting service. **Never commit sensitive information directly into your Git repository.**

## 7. High-Level Deployment Checklist

1.  **Frontend:**
    *   Choose Vercel or Netlify.
    *   Connect Git repository.
    *   Configure build and publish directories.
    *   Deploy.
2.  **Backend:**
    *   Choose Render or Railway.
    *   Connect Git repository.
    *   Configure build and start commands.
    *   Set `GEMINI_API_KEY` as an environment variable.
    *   Deploy.
3.  **Database (Crucial for Production):**
    *   **Strongly consider migrating from SQLite to a managed PostgreSQL service (e.g., Supabase free tier).**
    *   Update backend code to connect to the new database.
    *   Migrate data.
4.  **Connect Frontend to Backend:**
    *   Once the backend is deployed, it will have a public URL.
    *   Update your frontend's API calls (e.g., in `frontend/src/AnalysisForm.tsx`) to point to this new backend URL instead of `http://localhost:8000`. This can often be done using environment variables in your frontend hosting service (e.g., `VITE_API_URL` for Vite).

This plan provides a solid foundation for deploying your application with minimal cost, while also highlighting critical considerations for scaling and data persistence in a production environment.
