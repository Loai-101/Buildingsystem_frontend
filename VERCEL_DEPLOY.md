# Deploy to Vercel

The project is ready for Vercel. Build and SPA routing are configured. The backend is hosted on **Render** at `https://buildingsystem-backend.onrender.com`.

## Deploy from GitHub

1. Go to [vercel.com](https://vercel.com) and sign in (with GitHub).
2. **Add New** → **Project** → import your frontend repo (e.g. `Loai-101/Buildingsystem_frontend`).
3. Set **Root Directory**: click **Edit** and set to `Buildingsystem_frontend` (if the repo root is the parent folder). If your repo root is already the frontend folder, leave as `.` or empty.
4. **Environment variables** (required for production):
   - **`VITE_API_URL`** = `https://buildingsystem-backend.onrender.com/api`  
   Add this in **Settings → Environment Variables** so the frontend talks to the Render backend.
5. **Build Command**: `npm run build` (default).
6. **Output Directory**: `dist` (default).
7. Click **Deploy**.

## Backend (Render) – CORS

On **Render**, set the **FRONTEND_URL** environment variable to your Vercel app URL so the backend allows requests from the frontend:

- In Render dashboard: your backend service → **Environment** → add **FRONTEND_URL** = `https://your-app.vercel.app` (use the exact URL Vercel gives you after deploy).
- If you have multiple frontend URLs, use comma-separated: `https://app1.vercel.app,https://www.mysite.com`

## If your repo root is `Buildingsystem` (parent folder)

- In Vercel project settings, set **Root Directory** to **`Buildingsystem_frontend`** so Vercel runs `npm install` and `npm run build` inside the frontend folder.

## What’s configured

- **vercel.json**: SPA rewrites so routes like `/dashboard`, `/login`, `/users` serve `index.html` and React Router works.
- **Build**: `vite build` → output in `dist/`. `VITE_API_URL` is baked in at build time.

After deployment, set `VITE_API_URL` and redeploy if needed; then open the Vercel URL — login and all routes should work with the Render backend.
