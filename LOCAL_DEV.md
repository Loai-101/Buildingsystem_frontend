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
