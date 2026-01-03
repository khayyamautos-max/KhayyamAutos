# 🚀 Complete Deployment Guide: GitHub → Vercel

This guide will walk you through deploying your Bike Parts System to GitHub and Vercel.

---

## 📋 Prerequisites

Before starting, make sure you have:
- ✅ A GitHub account
- ✅ A Vercel account (sign up at https://vercel.com)
- ✅ Your Supabase credentials ready
- ✅ Git installed on your computer

---

## 📦 STEP 1: Prepare Your Code for GitHub

### 1.1 Check Current Status
Open your terminal in the project folder and run:
```bash
git status
```

### 1.2 Initialize Git (if not already done)
If you see "not a git repository", run:
```bash
git init
```

### 1.3 Add All Files
```bash
git add .
```

### 1.4 Create Initial Commit
```bash
git commit -m "Initial commit: Bike Parts System"
```

---

## 🔗 STEP 2: Push to GitHub

### 2.1 Create a New Repository on GitHub
1. Go to https://github.com/new
2. **Repository name:** `bike-parts-system` (or any name you prefer)
3. **Description:** "Bike Parts Management System"
4. **Visibility:** Choose **Private** (recommended) or **Public**
5. **DO NOT** check "Initialize with README" (we already have code)
6. Click **"Create repository"**

### 2.2 Connect Local Repository to GitHub
After creating the repository, GitHub will show you commands. Use these:

```bash
# Add GitHub as remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/bike-parts-system.git

# Rename main branch (if needed)
git branch -M main

# Push your code
git push -u origin main
```

**Note:** You'll be asked for your GitHub username and password (or personal access token).

---

## ⚙️ STEP 3: Set Up Vercel Project

### 3.1 Import Project to Vercel
1. Go to https://vercel.com/dashboard
2. Click **"Add New..."** → **"Project"**
3. Click **"Import Git Repository"**
4. Find and select your `bike-parts-system` repository
5. Click **"Import"**

### 3.2 Configure Project Settings
Vercel will auto-detect Next.js. Keep these settings:
- **Framework Preset:** Next.js (auto-detected)
- **Root Directory:** `./` (default)
- **Build Command:** `npm run build` (default)
- **Output Directory:** `.next` (default)
- **Install Command:** `npm install` (default)

**DO NOT click "Deploy" yet!** We need to add environment variables first.

---

## 🔐 STEP 4: Add Environment Variables in Vercel

### 4.1 Go to Environment Variables
1. In the Vercel project setup page, scroll down to **"Environment Variables"**
2. Or after creating project, go to: **Settings** → **Environment Variables**

### 4.2 Add First Variable
Click **"Add New"** and enter:

**Variable 1:**
- **Key:** `NEXT_PUBLIC_SUPABASE_URL`
- **Value:** `https://tvcpnewfoqmgvqmucxsd.supabase.co`
- **Environments:** ✅ Production ✅ Preview ✅ Development (select all three)
- Click **"Save"**

### 4.3 Add Second Variable
Click **"Add New"** again and enter:

**Variable 2:**
- **Key:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Y3BuZXdmb3FtZ3ZxbXVjeHNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NDA5MzksImV4cCI6MjA4MzAxNjkzOX0.k9kVJwCFSahxOt0dYNydm71gsL_TOiIx2V8zLojEUwY`
- **Environments:** ✅ Production ✅ Preview ✅ Development (select all three)
- Click **"Save"**

### 4.4 Verify Variables
You should see both variables listed. Make sure they're enabled for all environments.

---

## 🚀 STEP 5: Deploy to Vercel

### 5.1 Start Deployment
1. Scroll back to the top of the project setup page
2. Click **"Deploy"** button
3. Wait for the build to complete (usually 2-3 minutes)

### 5.2 Monitor Build Process
You'll see:
- ✅ Installing dependencies
- ✅ Building application
- ✅ Deploying

If there are any errors, Vercel will show them. Most common issues:
- Missing environment variables (we just added them)
- Build errors (check the logs)

---

## ✅ STEP 6: Verify Deployment

### 6.1 Get Your Live URL
After deployment completes, Vercel will give you a URL like:
- `https://bike-parts-system.vercel.app`

### 6.2 Test Your Application
1. Click the URL to open your live site
2. Try logging in with one of your test accounts
3. Test key features:
   - ✅ Dashboard loads
   - ✅ POS works
   - ✅ Inventory displays
   - ✅ Customers page works

---

## 🔄 STEP 7: Set Up Automatic Deployments

### 7.1 Automatic Deployments
Vercel automatically deploys when you push to GitHub:
- **Main branch** → Production deployment
- **Other branches** → Preview deployments

### 7.2 Update Your Code
To update your live site:
```bash
# Make your changes
git add .
git commit -m "Your update message"
git push origin main
```

Vercel will automatically:
1. Detect the push
2. Build the new version
3. Deploy it (usually in 2-3 minutes)

---

## 🛠️ STEP 8: Configure Custom Domain (Optional)

### 8.1 Add Domain
1. Go to your Vercel project → **Settings** → **Domains**
2. Enter your domain name (e.g., `bikeparts.yourdomain.com`)
3. Follow Vercel's instructions to configure DNS

---

## 📝 STEP 9: Update Supabase Redirect URLs

### 9.1 Add Vercel URL to Supabase
1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/tvcpnewfoqmgvqmucxsd
2. Navigate to: **Authentication** → **URL Configuration**
3. Add your Vercel URL to **"Redirect URLs"**:
   - `https://your-project.vercel.app/dashboard`
   - `https://your-project.vercel.app/auth/callback`
4. Click **"Save"**

---

## 🔍 Troubleshooting

### Build Fails
- Check Vercel build logs for specific errors
- Ensure all environment variables are set
- Verify `package.json` has all dependencies

### Authentication Not Working
- Check Supabase redirect URLs include your Vercel domain
- Verify environment variables are correct
- Check Supabase RLS policies are set up

### Database Connection Issues
- Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
- Check `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set
- Ensure Supabase project is active

---

## 📊 Quick Reference

### Environment Variables Needed:
```
NEXT_PUBLIC_SUPABASE_URL=https://tvcpnewfoqmgvqmucxsd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Git Commands:
```bash
git add .
git commit -m "Your message"
git push origin main
```

### Vercel Dashboard:
- Project Settings: https://vercel.com/dashboard
- Environment Variables: Settings → Environment Variables
- Deployment Logs: Deployments → Click on deployment

---

## ✅ Checklist

Before deploying, make sure:
- [ ] Code is committed to Git
- [ ] Repository is pushed to GitHub
- [ ] Vercel project is created
- [ ] Environment variables are added
- [ ] Supabase redirect URLs are updated
- [ ] Build completes successfully
- [ ] Site is accessible and functional

---

## 🎉 You're Done!

Your Bike Parts System is now live on Vercel! 🚀

Every time you push to GitHub, Vercel will automatically deploy your updates.

---

**Need Help?**
- Vercel Docs: https://vercel.com/docs
- GitHub Docs: https://docs.github.com
- Supabase Docs: https://supabase.com/docs

