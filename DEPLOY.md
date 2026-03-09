# Deploy (no server changes required)

Deploy the frontend as-is. **No server-side configuration or code changes are needed.**

- **Build:** Uses `npm run build`. Vite loads `.env.production`, which sets `VITE_API_URL` to your backend (e.g. Render). The built app talks to that API.
- **Hosting (e.g. Vercel):** `vercel.json` is already set: build output is `dist`, and all routes rewrite to `/index.html` so client-side routing (Accounts, Back to months, etc.) works the same as locally.
- **Optional:** In your host’s dashboard you can set `VITE_API_URL` to override the API URL; if you don’t, the value from `.env.production` in the repo is used.

Behavior is the same on deploy as in local production build (`npm run build` + `npm run preview`).
