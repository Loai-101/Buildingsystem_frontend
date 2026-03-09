# Run the app locally (terminal)

**Accounts and all data load the same way locally and on the hosted site.** Loading is driven only by the API response (no artificial timeouts).

## 1. Start the backend first

In one terminal:

```bash
cd Buildingsystem_backend
npm run dev
```

Wait until you see: `Server running on http://localhost:5000` and `MongoDB connected`.

## 2. Start the frontend

In another terminal:

```bash
cd Buildingsystem_frontend
npm run dev
```

Vite loads **.env.development**, which points to `http://localhost:5000/api`. Open the URL shown (e.g. http://localhost:5173), log in, then open **Accounts**. Data loads as soon as the API responds (typically under 1 second when the backend is local).

## 3. If Accounts is empty or you see an error

- **Backend not running:** Start it (step 1). You may see a toast: *"Backend not reachable. Start it to see data..."*
- **Wrong API URL:** When using `npm run dev`, the app uses **.env.development** (localhost). Do not delete that file.

## Hosted (Vercel) vs local

- **Local:** `npm run dev` uses .env.development → `VITE_API_URL=http://localhost:5000/api`. Run the backend for instant data.
- **Hosted:** The build uses .env.production → Render backend. Vercel can override with its own env vars.

## Local vs deploy data (separate)

So that **any update on localhost stays separate from deploy**:

1. In **Buildingsystem_backend**, create a file **`.env.local`** (it is gitignored and never pushed):
   ```
   USE_DEV_DATABASE=true
   ```
   Or copy from `.env.local.example`:  
   `cp .env.local.example .env.local`

2. When you run the backend locally (`npm run dev`), it loads `.env.local` and connects to the database **`buildingsystem_dev`** (same cluster, different name). The deployed server does not have `.env.local`, so it keeps using **`buildingsystem`** (production).

- **Local:** Data you add (new year, records, users, etc.) stays in `buildingsystem_dev` and **does not appear** on the deployed site.
- **Deploy:** Uses `buildingsystem`. Local and deploy data stay separate.
