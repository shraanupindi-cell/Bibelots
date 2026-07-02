# Bibelots

Map what you collect. Find what connects. Discover your collector archetype.

---

## Deploy in 4 steps

### Step 1 — Set up Supabase database
1. Go to supabase.com → your Trinkets project
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste everything from `SUPABASE_SETUP.sql`
5. Click **Run**

### Step 2 — Put this code on GitHub
1. Go to github.com → click **+** → **New repository**
2. Name it `bibelots`, keep it Public, click **Create repository**
3. Click **uploading an existing file**
4. Drag the entire `bibelots` folder contents into the upload area
5. Click **Commit changes**

### Step 3 — Deploy on Vercel
1. Go to vercel.com → **Add New Project**
2. Connect your GitHub account if not already connected
3. Select the `bibelots` repository
4. Click **Deploy** — Vercel detects it's a React app automatically

### Step 4 — Add environment variables in Vercel
1. In Vercel → your project → **Settings** → **Environment Variables**
2. Add these two:
   - `REACT_APP_SUPABASE_URL` = `https://hagcsyleytfohtenqsbr.supabase.co`
   - `REACT_APP_SUPABASE_ANON_KEY` = your anon key from Supabase
3. Click **Save** then **Redeploy**

Your site is live at `bibelots.vercel.app` (or similar).

---

## Local development
```
npm install
npm start
```
