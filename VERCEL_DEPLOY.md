# Deploy to Vercel

The project is ready for Vercel. Build and SPA routing are configured.

## Deploy from GitHub

1. Go to [vercel.com](https://vercel.com) and sign in (with GitHub).
2. **Add New** → **Project** → import `Loai-101/Buildingsystem_frontend`.
3. Set **Root Directory**: click **Edit** and set to `Buildingsystem_frontend` (if the repo root is the parent folder). If your repo root is already `Buildingsystem_frontend`, leave it as `.` or leave empty.
4. **Build Command**: `npm run build` (default).
5. **Output Directory**: `dist` (default).
6. Click **Deploy**.

## If your repo root is `Buildingsystem` (parent folder)

- In Vercel project settings, set **Root Directory** to **`Buildingsystem_frontend`** so Vercel runs `npm install` and `npm run build` inside the frontend folder.

## What’s configured

- **vercel.json**: SPA rewrites so routes like `/dashboard`, `/login`, `/users` serve `index.html` and React Router works.
- **Build**: `vite build` → output in `dist/`.

After deployment, open the generated URL; login and all routes should work.
