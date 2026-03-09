# Run the app locally (terminal)

Your account data is in the database. To see it when you run the app on your machine:

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

Open the URL shown (e.g. http://localhost:5173), log in, then open **Accounts**. You should see your years and records (e.g. 2025 with Rent, Maintenance, etc.).

## 3. If Accounts is still empty

- Ensure **Buildingsystem_frontend/.env** has: `VITE_API_URL=http://localhost:5000/api`
- Restart the frontend dev server after changing `.env`
- If the backend is not running, you’ll see a toast: *"Backend not reachable. Start it to see data..."*

## Why the server (deployed) site works without this

The deployed frontend (e.g. Vercel) uses the deployed backend (e.g. Render). Both are always on, so data loads. Locally, the frontend calls `http://localhost:5000/api`; if the backend isn’t running, no data is returned.
