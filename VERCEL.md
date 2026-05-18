# Deploy on Vercel + Neon (all-in-one)

One Vercel project serves:

- **React app** → static files from `client/dist`
- **Express API** → serverless function at `/api/*`
- **PostgreSQL** → [Neon](https://neon.tech) (external, free tier)

Real-time Socket.IO is **disabled**; notifications refresh every ~20 seconds (polling).

---

## 1. Neon database

1. Create a project at [neon.tech](https://neon.tech).
2. Copy the connection string (include `?sslmode=require`).
3. On your PC (once):

```powershell
cd "d:\Roster Website\server"
copy .env.example .env
# Paste DATABASE_URL and JWT_SECRET into .env
npm install
npm run db:migrate
npm run db:seed
```

---

## 2. Vercel project

1. Push this repo to GitHub.
2. [vercel.com/new](https://vercel.com/new) → Import repo.
3. **Root Directory:** leave empty (repo root). Uses root `vercel.json`.
4. **Environment variables** — add from [`.env.vercel.example`](./.env.vercel.example):

| Variable | Required | Example |
|----------|----------|---------|
| `DATABASE_URL` | Yes | `postgresql://...@ep-xxx.neon.tech/neondb?sslmode=require` |
| `DATABASE_SSL` | Yes | `true` |
| `JWT_SECRET` | Yes | long random string |
| `EMAIL_ENABLED` | No | `false` |
| `VITE_API_URL` | **No** | Leave unset — API is same domain `/api` |

5. Deploy.

---

## 3. Verify

| Check | Expected |
|-------|----------|
| `https://YOUR-APP.vercel.app/api/health` | `{"status":"ok"}` |
| Login / Sign up | Works (no 405) |
| Bell icon | Green refresh icon; updates within ~20s |

---

## 4. Custom domain (optional)

1. Vercel → Domains → add your domain.
2. Set env var: `CLIENT_URL=https://yourdomain.com`
3. Redeploy.

---

## Local development

Still use one local server (optional Socket.IO):

```powershell
npm run install:all
cd server
# .env with local DATABASE_URL
npm run dev
```

Open `http://localhost:5000`.

To disable Socket.IO locally: `ENABLE_SOCKET=false` in `server/.env`.

Separate Vite dev server:

```powershell
cd client && npm run dev
```

Proxies `/api` → `localhost:5000`.

---

## Legacy: Vercel frontend + Render API

If you prefer split deploy, set on Vercel:

```env
VITE_API_URL=https://your-api.onrender.com/api
```

And deploy API on Render per [DEPLOY.md](./DEPLOY.md).

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `/api/health` 404 | Root Directory must be repo root; `api/index.js` must exist |
| 500 on API | Check Neon `DATABASE_URL`, run migrations |
| Signup 405 | Redeploy latest code; do not set wrong `VITE_API_URL` |
| Cold start slow | First request after idle may take a few seconds (serverless) |
| Notifications delayed | Normal — polling every 20s; lower `VITE_NOTIFICATION_POLL_MS` |
