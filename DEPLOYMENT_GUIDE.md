# 🚀 Deployment Guide - Free Tier CI/CD

This guide walks you through deploying your Ripple Effect Analysis app using **100% free tier** services with automated CI/CD.

## 📋 **Prerequisites Checklist**

- [x] ✅ Supabase PostgreSQL database configured
- [x] ✅ Google Analytics and Sentry integrated
- [x] ✅ GitHub repository with latest code
- [x] ✅ Vercel account setup
- [x] ✅ Render account setup  
- [ ] 🔧 GitHub Secrets configured (optional - only needed for custom CI/CD)

## 🎯 **Deployment Stack (100% Free)**

- **Frontend**: Vercel (unlimited personal projects)
- **Backend**: Render (750 hours/month, sleeps after 15min)
- **Database**: Supabase PostgreSQL (500MB free)
- **CI/CD**: GitHub Actions (2,000 minutes/month)

## 📋 **Step-by-Step Setup**

### **1. Setup Vercel (Frontend Hosting)**

1. **Go to [vercel.com](https://vercel.com)** and sign up with GitHub
2. **Import your repository**:
   - Click "New Project"
   - Import `ripple-effect-analysis` repository
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. **Add Environment Variables**:
   - `VITE_API_BASE_URL` = `https://your-app-name.onrender.com` (we'll get this from Render)
   - `VITE_GA_MEASUREMENT_ID` = `G-GDMS3BXY7R`
   - `VITE_SENTRY_DSN` = `https://8e91d8e566d04d5c0612fe637220c804@o4509854703616000.ingest.de.sentry.io/4509854706106448`
4. **Deploy** - Vercel will give you a URL like `https://ripple-effect-analysis.vercel.app`
   
   > **Note**: Vercel's GitHub integration automatically handles deployments when you push to your main branch. GitHub secrets are only needed if you want custom CI/CD workflows.

### **2. Setup Render (Backend Hosting)**

1. **Go to [render.com](https://render.com)** and sign up with GitHub
2. **Create Web Service**:
   - Connect GitHub repository
   - **Root Directory**: `backend`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port 8000`
3. **Add Environment Variables**:
   ```
   POSTGRES_DB=postgres
   POSTGRES_USER=postgres.nkqakhgthjwrfqsznykw
   POSTGRES_PASSWORD=x$fS2Gt7phh5T@Z
   POSTGRES_HOST=aws-1-sa-east-1.pooler.supabase.com
   POSTGRES_PORT=6543
   SECRET_KEY=d66bbff9a3227ca1d95a8ae72ec83243ce6138b291bfdc6ddc9becf5984c6373
   GEMINI_API_KEY=AIzaSyB9v_KHyxQCE-Faj_JPSdA0oe7eXnNCfEo
   SENDGRID_API_KEY=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
   SENDGRID_FROM_EMAIL=me@erion.dev
   SENTRY_DSN=https://5a7af04cc223e8c0787ab14736260eab@o4509854703616000.ingest.de.sentry.io/4509854735990864
   ENVIRONMENT=production
   ```
4. **Deploy** - Render will give you a URL like `https://ripple-effect-analysis.onrender.com`

### **3. Update Frontend API URL**

1. **Go back to Vercel**
2. **Update Environment Variable**:
   - `VITE_API_BASE_URL` = `https://your-backend-url.onrender.com` (from step 2)
3. **Redeploy** frontend

### **4. Setup GitHub Secrets (CI/CD) - OPTIONAL**

> **Skip this section if using Vercel's built-in GitHub integration** - your deployments will work automatically without these secrets.

**Only set up GitHub secrets if you need custom CI/CD workflows or programmatic deployments.**

1. **Go to your GitHub repository** → Settings → Secrets and variables → Actions
2. **Add Repository Secrets**:

   **Vercel Secrets:**
   - `VERCEL_TOKEN` = (Get from Vercel Settings → Tokens)
   - `VERCEL_ORG_ID` = (Get from Vercel Project Settings)
   - `VERCEL_PROJECT_ID` = (Get from Vercel Project Settings)

   **Render Secrets:**
   - `RENDER_API_KEY` = (Get from Render Account Settings → API Keys)
   - `RENDER_SERVICE_ID` = (Get from Render Service Settings)

   **App Secrets:**
   - `VITE_GA_MEASUREMENT_ID` = `G-GDMS3BXY7R`
   - `VITE_SENTRY_DSN` = `https://8e91d8e566d04d5c0612fe637220c804@o4509854703616000.ingest.de.sentry.io/4509854706106448`
   - `VITE_API_BASE_URL` = `https://your-backend-url.onrender.com`
   - `GEMINI_API_KEY` = `AIzaSyB9v_KHyxQCE-Faj_JPSdA0oe7eXnNCfEo`

## 🔄 **CI/CD Workflow**

**Basic Setup (Vercel + Render GitHub Integration):**
- **Frontend Changes**: Auto-deploy to Vercel when pushed to main
- **Backend Changes**: Auto-deploy to Render when pushed to main

**Advanced Setup (with GitHub Secrets):**
- **Pull Requests**: Automatic testing + preview deployments
- **Merge to Main**: Automatic deployment to production
- **Custom Workflows**: Use GitHub Actions for complex CI/CD pipelines

## 🎯 **Final URLs**

- **Frontend**: `https://ripple-effect-analysis.vercel.app`
- **Backend**: `https://ripple-effect-analysis.onrender.com`
- **Database**: Supabase (already configured)

## ⚠️ **Free Tier Limitations**

- **Render**: 15-second cold start after 15 minutes of inactivity
- **Supabase**: 500MB database storage limit
- **GitHub Actions**: 2,000 build minutes/month
- **Vercel**: No limitations on personal projects

## 🚀 **Ready for Production!**

Your app is now enterprise-ready with:
- ✅ Automatic deployments
- ✅ Error monitoring (Sentry)
- ✅ Analytics (Google Analytics)
- ✅ Persistent database (Supabase)
- ✅ SSL certificates
- ✅ Global CDN
- ✅ Preview deployments for PRs