# 🚀 Deployment Guide - Free Tier CI/CD

This guide walks you through deploying your Ripple Effect Analysis app using **100% free tier** services with automated CI/CD.

## 📋 **Prerequisites Checklist**

- [x] ✅ Supabase PostgreSQL database configured
- [x] ✅ Google Analytics and Sentry integrated
- [x] ✅ GitHub repository with latest code
- [x] ✅ Vercel account setup
- [x] ✅ Render account setup

## 🎯 **Deployment Stack (100% Free)**

- **Frontend**: Vercel (unlimited personal projects)
- **Backend**: Render (750 hours/month, sleeps after 15min)
- **Database**: Supabase PostgreSQL (500MB free)
- **CI/CD**: Built-in platform integrations (GitHub → Vercel/Render)

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
   - `VITE_GA_MEASUREMENT_ID` = `your-google-analytics-id`
   - `VITE_SENTRY_DSN` = `your-sentry-frontend-dsn`
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
   POSTGRES_DB=your_database_name
   POSTGRES_USER=your_supabase_user
   POSTGRES_PASSWORD=your_supabase_password
   POSTGRES_HOST=your_supabase_host
   POSTGRES_PORT=6543
   SECRET_KEY=your_secret_key_for_jwt
   GEMINI_API_KEY=your_google_gemini_api_key
   SENDGRID_API_KEY=your_sendgrid_api_key
   SENDGRID_FROM_EMAIL=your_verified_sender_email
   SENTRY_DSN=your_sentry_backend_dsn
   ENVIRONMENT=production
   ```
4. **Deploy** - Render will give you a URL like `https://ripple-effect-analysis.onrender.com`

### **3. Update Frontend API URL**

1. **Go back to Vercel**
2. **Update Environment Variable**:
   - `VITE_API_BASE_URL` = `https://your-backend-url.onrender.com` (from step 2)
3. **Redeploy** frontend

## 🔄 **Automatic Deployment**

Your deployment is now fully automated through platform integrations:

- **Frontend Changes**: Auto-deploy to Vercel when pushed to main
- **Backend Changes**: Auto-deploy to Render when pushed to main
- **No configuration needed**: GitHub workflows and secrets are not required
- **Instant deployments**: Push to main branch triggers automatic builds

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