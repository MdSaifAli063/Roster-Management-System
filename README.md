# Roster Management System

HR roster planning app — shift schedules, holidays, employee filters, and calendar grid views.

## Stack

- **Frontend:** React (Vite), Tailwind CSS, React Router
- **Backend:** Node.js, Express
- **Database:** PostgreSQL

## Quick start

### 1. Database

Create a PostgreSQL database (local, [Neon](https://neon.tech), or Supabase) and copy connection string:

```bash
cd server
cp .env.example .env
# Edit DATABASE_URL and JWT_SECRET
```

### 2. Server

```bash
cd server
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

API runs at `http://localhost:5000`.

### 3. Run (single server — frontend + API)

From the project root:

```bash
npm run install:all
npm run dev
```

Open **http://localhost:5000** — one process serves both the React app and `/api`.

**Production mode** (serves built static files):

```bash
npm run start
```

<details>
<summary>Separate client dev server (optional)</summary>

```bash
cd client && npm run dev   # http://localhost:5173 with API proxy
```

</details>

### Demo login

| Email | Password | Role |
|-------|----------|------|
| admin@roster.com | admin123 | ADMIN |
| hr@roster.com | admin123 | HR_USER |

## Features

- JWT authentication with role-based access
- Employee CRUD with multi-filter search
- Shift & weekly pattern management
- Bulk roster generation from shift patterns
- Calendar roster grid (W / WO / H) with cell edit modal
- Holiday calendar (single + CSV import)
- Plant/location master
- Work reassignment (leave/sick coverage)
- Excel roster export & attendance summary
- **Attendance mismatch detection** (planned vs actual punches)
- **Email notifications** (leave, reassignment, mismatch alerts)
- **Leave requests** with approve/reject workflow

## Deployment

| Guide | Contents |
|-------|----------|
| **[DEPLOY-GCP.md](./DEPLOY-GCP.md)** | **Recommended:** Google Cloud Run — frontend + API in one URL |
| **[VERCEL.md](./VERCEL.md)** | Vercel + Neon (serverless API) |
| **[DEPLOY.md](./DEPLOY.md)** | Neon + Render API + Vercel frontend |

| Service | Use |
|---------|-----|
| Neon | PostgreSQL (`DATABASE_SSL=true`) |
| Vercel | React + Express API (`api/index.js` + `vercel.json`) |
| Render | Optional split API (`render.yaml`) + live Socket.IO |

### Email (optional)

```env
EMAIL_ENABLED=true
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=...
SMTP_PASS=...
HR_NOTIFY_EMAIL=hr@roster.com
```

Without SMTP, emails are logged to the server console in development.

## Project structure

```
client/          React frontend
server/          Express API
  db/schema.sql  PostgreSQL schema
  db/seed.js     Sample data
```
