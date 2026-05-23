# Deploy on Google Cloud (frontend + backend together)

Use **Cloud Run** — one container serves the React app and Express API on the **same URL** (no Vercel/Render split).

Database: **Neon** (free, easy) or **Cloud SQL** (full GCP).

---

## What you get

| URL | Serves |
|-----|--------|
| `https://your-service-xxx.run.app/` | React app |
| `https://your-service-xxx.run.app/api/health` | API |
| `https://your-service-xxx.run.app/api/auth/login` | Login |

Notifications use **polling** (no WebSocket on Cloud Run).

---

## Part 1 — Database (Neon, recommended)

1. [console.neon.tech](https://console.neon.tech) → create project → copy **connection string**.
2. On your PC (once):

```powershell
cd "d:\Roster Website\server"
# Edit .env: DATABASE_URL=neon string, DATABASE_SSL=true, JWT_SECRET=...
npm install
npm run db:migrate
npm run db:seed
```

---

## Part 2 — Google Cloud project

1. Open [console.cloud.google.com](https://console.cloud.google.com).
2. Create or select a project.
3. Enable billing (Cloud Run has a free tier; card may be required).
4. Enable APIs (search in top bar → enable each):
   - **Cloud Run API**
   - **Artifact Registry API**
   - **Cloud Build API**

---

## Live deployment (project `roster-system-496716`)

| Item | Value |
|------|--------|
| **App URL** | https://roster-app-134407752215.asia-south1.run.app |
| **Health** | https://roster-app-134407752215.asia-south1.run.app/api/health |
| **Cloud SQL** | `roster-db` (asia-south1) |
| **Auth** | Sign up at `/login` or Google Sign-In (set `GOOGLE_CLIENT_ID` + build with `VITE_GOOGLE_CLIENT_ID`) |

Redeploy after code changes:

```powershell
cd "d:\Roster Website"
gcloud config set project roster-system-496716
gcloud builds submit --tag gcr.io/roster-system-496716/roster-app
gcloud run deploy roster-app --image gcr.io/roster-system-496716/roster-app --region asia-south1
```

---

## Part 3 — Deploy with Cloud Run (Console UI)

### A. Build from source (easiest)

1. Push your code to **GitHub** (if not already).
2. Cloud Console → **Cloud Run** → **Create service**.
3. Select **Deploy from source repository** (or “Continuously deploy from a repository”).
4. Connect GitHub → choose repo → branch `main`.
5. **Build type:** Dockerfile  
   **Dockerfile location:** `/Dockerfile` (repo root).
6. **Service name:** `roster-app`  
   **Region:** e.g. `asia-south1` (Mumbai) or `us-central1`.
7. **Authentication:** Allow unauthenticated invocations.
8. **Container → Variables & secrets** — add:

| Name | Value |
|------|--------|
| `DATABASE_URL` | Neon connection string |
| `DATABASE_SSL` | `true` |
| `JWT_SECRET` | Long random secret |
| `CLIENT_URL` | Leave empty for first deploy; update after step B |
| `EMAIL_ENABLED` | `false` |
| `ENABLE_SOCKET` | `false` |
| `NODE_ENV` | `production` |

9. **Container → Resources:** Memory **512 MiB** or **1 GiB**, CPU 1.
10. **Create** / **Deploy** — wait 5–15 minutes for first build.

### B. After first deploy

1. Copy the service URL, e.g. `https://roster-app-xxxxx-as.a.run.app`.
2. Cloud Run → your service → **Edit & deploy new revision**.
3. Set `CLIENT_URL` = that URL (no trailing slash).
4. Deploy new revision.

### C. Verify

- Open `https://YOUR-URL.run.app/api/health` → `{"status":"ok"}`
- Open `https://YOUR-URL.run.app/login`
- Create an employer account at `/login?mode=signup` (do **not** run `db:seed` on production)

---

## Part 4 — Deploy with `gcloud` CLI (optional)

Install [Google Cloud SDK](https://cloud.google.com/sdk/docs/install), then:

```powershell
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

cd "d:\Roster Website"

# Build and push image
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/roster-app

# Deploy
gcloud run deploy roster-app `
  --image gcr.io/YOUR_PROJECT_ID/roster-app `
  --region asia-south1 `
  --allow-unauthenticated `
  --set-env-vars "NODE_ENV=production,ENABLE_SOCKET=false,EMAIL_ENABLED=false,DATABASE_SSL=true" `
  --set-secrets "DATABASE_URL=DATABASE_URL:latest,JWT_SECRET=JWT_SECRET:latest"
```

(Create secrets in **Secret Manager** first, or pass env vars in the console instead.)

---

## Part 5 — Custom domain (optional)

Cloud Run → service → **Manage custom domains** → follow DNS steps.

Update `CLIENT_URL` to `https://yourdomain.com` and redeploy.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Build fails | Check Dockerfile path is repo root; view **Cloud Build** logs |
| Container won’t start | Logs → Cloud Run → service → **Logs**; usually bad `DATABASE_URL` |
| Login 500 | `DATABASE_SSL=true` for Neon; run migrate/seed |
| Login 401 | Use seeded user or sign up again |
| Cold start slow | Normal on free tier; first request may take a few seconds |

---

## Local Docker test (optional)

```powershell
cd "d:\Roster Website"
docker build -t roster-app .
docker run -p 8080:8080 --env-file server/.env -e PORT=8080 -e NODE_ENV=production -e ENABLE_SOCKET=false roster-app
```

Open http://localhost:8080

---

## Why GCP instead of Vercel-only?

| Vercel serverless | Cloud Run container |
|-------------------|---------------------|
| API + static split / limits | **Same server** as local `npm run start` |
| No long-lived process | Full Node + Express |
| Env/build issues | One Docker image, predictable |

You can keep using **Neon** for Postgres; it works from Cloud Run worldwide.
