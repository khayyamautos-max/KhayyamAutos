# Vercel Environment Variables Setup

## Add these to your Vercel project:

1. Go to your Vercel project dashboard
2. Click on **Settings** → **Environment Variables**
3. Add the following variables:

### For Production, Preview, and Development:

**Variable 1:**
- **Name:** `NEXT_PUBLIC_SUPABASE_URL`
- **Value:** `https://tvcpnewfoqmgvqmucxsd.supabase.co`

**Variable 2:**
- **Name:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Y3BuZXdmb3FtZ3ZxbXVjeHNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NDA5MzksImV4cCI6MjA4MzAxNjkzOX0.k9kVJwCFSahxOt0dYNydm71gsL_TOiIx2V8zLojEUwY`

4. Make sure to select all three environments: **Production**, **Preview**, and **Development**
5. Click **Save**
6. Redeploy your application for the changes to take effect

---

## ⚠️ Important Security Notes:

✅ **Safe to use (already added above):**
- `NEXT_PUBLIC_SUPABASE_URL` - Public project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public anon key (protected by RLS)

❌ **NEVER add these to Vercel or commit them:**
- `sb_secret_R1ejpKrkucWfbStuAsOWTw_iuZC7znf` - Secret key (keep private!)
- Service role secret - Only use server-side, never expose to client

The anon key is safe because it's protected by Row Level Security (RLS) policies in your database.

