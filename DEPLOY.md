# Deployment Guide

Deploy the Roster Management System using **Neon** (database), **Render** (API), and **Vercel** (frontend).

## 1. PostgreSQL on Neon

1. Create a project at [neon.tech](https://neon.tech).
2. Copy the connection string (`postgresql://...`).
3. Enable **SSL** (required for Neon).

```env
DATABASE_URL=postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
DATABASE_SSL=true
```

### Run migrations (once)

From your machine with `DATABASE_URL` set:

```bash
cd server
cp .env.example .env
# paste DATABASE_URL and JWT_SECRET
npm install
npm run db:migrate
npm run db:seed
```

---

## 2. API on Render

1. Push this repo to GitHub.
2. [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint** (or Web Service).
3. Point to `render.yaml` or create a Web Service:
   - **Root directory:** `server`
   - **Build:** `npm install`
   - **Start:** `npm start`
4. Set environment variables:

| Variable | Value |
|----------|--------|
| `DATABASE_URL` | Neon connection string |
| `DATABASE_SSL` | `true` |
| `JWT_SECRET` | long random string |
| `CLIENT_URL` | `https://your-app.vercel.app` |
| `EMAIL_ENABLED` | `true` (optional) |
| `SMTP_*` | Mailtrap / Resend / SendGrid SMTP |
| `HR_NOTIFY_EMAIL` | `hr@company.com` |

5. After deploy, note the API URL: `https://roster-api.onrender.com`

Run migrations against Neon if you have not already (step 1).

---

## 3. Frontend on Vercel

1. [vercel.com](https://vercel.com) → Import Git repo.
2. Set **Root Directory** to `client`.
3. Environment variable:

| Variable | Value |
|----------|--------|
| `VITE_API_URL` | `https://roster-api.onrender.com/api` |

4. Deploy. Update Render `CLIENT_URL` to your Vercel URL (include `https://`, no trailing slash).

For preview deployments, add preview URLs to `CLIENT_URL` comma-separated:

```env
CLIENT_URL=https://roster.vercel.app,https://roster-git-main-you.vercel.app
```

---

## 4. Email (optional)

Works with any SMTP provider.

### Mailtrap (development)

```env
EMAIL_ENABLED=true
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-user
SMTP_PASS=your-pass
SMTP_FROM=RosterPro <noreply@mailtrap.io>
HR_NOTIFY_EMAIL=admin@roster.com
```

### Resend SMTP

```env
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=resend
SMTP_PASS=re_xxxx
```

When `EMAIL_ENABLED=false`, emails are **logged to the server console** and stored in `notification_log`.

---

## 5. Verify

- `GET https://your-api.onrender.com/api/health` → `{ "status": "ok" }`
- Login at Vercel URL with `admin@roster.com` / `admin123`
- **Actual Roster** → should show purple mismatch cells after seed
- **Leave** → submit request → check server logs or inbox
- **Reassignment** → creates assignment + sends email

---

## Local development

```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
cd client && npm run dev
```

Client proxies `/api` to `localhost:5000` via Vite (no `VITE_API_URL` needed locally).
