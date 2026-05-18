# Deploy frontend on Vercel

RosterPro uses a **split deploy**: Vercel hosts the React app; **Render** (or similar) hosts the Express API + WebSockets; **Neon** hosts PostgreSQL.

You cannot run the full app on Vercel alone (no long-lived Socket.IO / single Express server on the free tier).

---

## Checklist

### 1. Database (Neon) + API (Render)

Complete [DEPLOY.md](./DEPLOY.md) sections **1** and **2** first:

- Neon `DATABASE_URL`, run `npm run db:migrate` and `npm run db:seed` in `server/`
- Render web service from `server/` with health check `/api/health`
- Note your API URL, e.g. `https://roster-api.onrender.com`

### 2. Import repo on Vercel

1. [vercel.com/new](https://vercel.com/new) → import your Git repository.
2. Choose **one** setup:

| Option | Root Directory | Notes |
|--------|----------------|--------|
| **A (recommended)** | `client` | Uses `client/vercel.json`; simplest |
| **B** | *(repo root)* | Uses root `vercel.json` + `postinstall` installs `client/` |

If the build log shows `npm run build --prefix client` but fails with **vite not found**, push the latest repo (Vite is in `dependencies`) or set Root Directory to **`client`**.

3. Framework: **Vite** (auto-detected).
4. Build settings should match `vercel.json` (no override needed).

### 3. Environment variables (Vercel → Project → Settings → Environment Variables)

| Name | Example | Required |
|------|---------|----------|
| `VITE_API_URL` | `https://roster-api.onrender.com/api` | **Yes** |
| `VITE_SOCKET_URL` | `https://roster-api.onrender.com` | Optional (auto-derived from `VITE_API_URL`) |

Apply to **Production** and **Preview** if previews should hit the same API.

Redeploy after changing env vars (Vite bakes them in at build time).

### 4. Point Render CORS at Vercel

On Render, set `CLIENT_URL` to your Vercel URL(s), no trailing slash:

```env
CLIENT_URL=https://roster-pro.vercel.app
```

For preview branches, add comma-separated URLs:

```env
CLIENT_URL=https://roster-pro.vercel.app,https://roster-pro-git-main-you.vercel.app
```

Redeploy the Render service after updating.

### 5. Verify

1. `https://your-api.onrender.com/api/health` → `{"status":"ok"}`
2. Open your Vercel URL → Sign in (`admin@roster.com` / `admin123` after seed)
3. Bell icon → live dot (green) when Socket.IO connects to Render
4. Leave / attendance → notifications should appear in real time

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Login fails / network error | Set `VITE_API_URL` with `/api` suffix; redeploy Vercel |
| CORS error in browser | Add exact Vercel URL to Render `CLIENT_URL` |
| Notifications never “live” | Set `VITE_API_URL` to full `https://...` URL; check Render logs |
| 404 on refresh (e.g. `/dashboard`) | `vercel.json` SPA rewrite should be present; redeploy |
| API sleeps (Render free) | First request may take ~30s; upgrade or use cron ping |

---

## Custom domain

1. Vercel → Domains → add `app.yourcompany.com`
2. Add the same URL to Render `CLIENT_URL`
3. No code changes required

---

## Local dev (unchanged)

```bash
npm run install:all
npm run dev
```

Open `http://localhost:5000` — no `VITE_*` vars needed.

Optional: `cd client && npm run dev` uses Vite proxy to `localhost:5000` for `/api` and `/socket.io`.
