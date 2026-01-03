# Complete Setup Guide - GitHub, Vercel & Supabase

## 📋 Step-by-Step Setup Instructions

### Step 1: Get Your Supabase Keys

1. **Go to your Supabase project dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project (or create a new one)

2. **Get your API keys:**
   - Click on **Settings** (gear icon) in the left sidebar
   - Click on **API** in the settings menu
   - You'll see two important values:
     - **Project URL** (this is your `NEXT_PUBLIC_SUPABASE_URL`)
     - **anon/public key** (this is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

3. **Copy these values** - You'll need them in the next steps

---

### Step 2: Set Up Database Schema

1. **In Supabase Dashboard:**
   - Go to **SQL Editor** (in the left sidebar)
   - Click **New Query**

2. **Run the schema scripts in order:**
   - Copy and paste the contents of `scripts/001_initial_schema.sql`
   - Click **Run** (or press Ctrl+Enter)
   - Wait for success message
   
   - Then run `scripts/003_pos_functions.sql` (IMPORTANT for POS checkout)
   - Click **Run**
   
   - Optionally run `scripts/002_seed_data.sql` for sample data

---

### Step 3: Create Local Environment File

1. **Create `.env.local` file in your project root:**
   - In your project folder, create a new file named `.env.local`
   - **Important:** This file is already in `.gitignore`, so it won't be committed to GitHub

2. **Add your Supabase keys:**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. **Replace the values:**
   - `https://your-project-id.supabase.co` → Your actual Supabase Project URL
   - `your-anon-key-here` → Your actual anon/public key

4. **Save the file**

---

### Step 4: Test Locally

1. **Restart your dev server:**
   ```bash
   # Stop the current server (Ctrl+C)
   # Then restart:
   npm run dev
   ```

2. **Open your browser:**
   - Go to `http://localhost:3000`
   - You should see your app!

---

### Step 5: Push to GitHub

1. **Initialize Git (if not already done):**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Connect to GitHub:**
   ```bash
   git remote add origin https://github.com/your-username/your-repo-name.git
   git branch -M main
   git push -u origin main
   ```

   Or use GitHub Desktop/GitHub CLI if you prefer.

---

### Step 6: Deploy to Vercel

1. **Go to Vercel:**
   - Visit: https://vercel.com
   - Sign in with your GitHub account

2. **Import your project:**
   - Click **Add New Project**
   - Select your GitHub repository
   - Click **Import**

3. **Configure environment variables in Vercel:**
   - Before deploying, click **Environment Variables**
   - Add these two variables:
     - **Name:** `NEXT_PUBLIC_SUPABASE_URL`
       **Value:** Your Supabase Project URL
     - **Name:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
       **Value:** Your Supabase anon key
   - Make sure they're added for **Production**, **Preview**, and **Development**
   - Click **Save**

4. **Deploy:**
   - Click **Deploy**
   - Wait for deployment to complete
   - Your site will be live at `https://your-project.vercel.app`

---

### Step 7: Update Supabase Redirect URLs

1. **In Supabase Dashboard:**
   - Go to **Authentication** → **URL Configuration**
   - Add your Vercel URL to **Redirect URLs:**
     - `https://your-project.vercel.app/**`
     - `https://your-project.vercel.app/auth/callback`
   - Add localhost for development:
     - `http://localhost:3000/**`
     - `http://localhost:3000/auth/callback`
   - Click **Save**

---

## 🔐 Security Notes

✅ **Safe to share:**
- Your Supabase Project URL (it's public)
- Your anon/public key (it's designed to be public, protected by RLS)

❌ **Never share:**
- Your Supabase service_role key (if you see it, keep it secret!)
- Any private keys

---

## 📝 Quick Checklist

- [ ] Got Supabase Project URL and anon key
- [ ] Created `.env.local` file with keys
- [ ] Ran database schema scripts in Supabase
- [ ] Tested locally (app works on localhost:3000)
- [ ] Pushed code to GitHub
- [ ] Connected GitHub repo to Vercel
- [ ] Added environment variables in Vercel
- [ ] Deployed to Vercel
- [ ] Updated Supabase redirect URLs
- [ ] Tested deployed site

---

## 🆘 Need Help?

If you want me to help you set this up, you can share:
1. Your Supabase Project URL (safe to share)
2. Confirmation that you've run the SQL scripts
3. Any error messages you're seeing

**I can help you troubleshoot any issues!**

