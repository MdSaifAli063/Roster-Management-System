# 📅 RosterPro — Roster Management System

**Enterprise HR roster planning** for shift schedules, calendar grids, holidays, leave workflows, attendance reconciliation, and offline PDF extraction. Full-stack **React + Node.js + PostgreSQL**, with an optional **Python** document pipeline bundled in Docker.

🌐 **Live:** [https://roster-app-134407752215.asia-south1.run.app](https://roster-app-134407752215.asia-south1.run.app)  
💚 **Health:** [https://roster-app-134407752215.asia-south1.run.app/api/health](https://roster-app-134407752215.asia-south1.run.app/api/health)

---

## 📑 Table of contents

1. [What this system does](#-what-this-system-does)
2. [Architecture](#-architecture)
3. [Highlights](#-highlights)
4. [Features (detailed)](#-features-detailed)
5. [Roles & permissions](#-roles--permissions)
6. [Roster logic & cell codes](#-roster-logic--cell-codes)
7. [Attendance mismatch engine](#-attendance-mismatch-engine)
8. [Notifications & email](#-notifications--email)
9. [PDF extraction pipeline](#-pdf-extraction-pipeline)
10. [Database model](#-database-model)
11. [Tech stack](#-tech-stack)
12. [Quick start](#-quick-start)
13. [How the app runs (dev vs prod)](#-how-the-app-runs-dev-vs-prod)
14. [Project structure](#-project-structure)
15. [Frontend architecture](#-frontend-architecture)
16. [API reference](#-api-reference)
17. [Environment variables](#-environment-variables)
18. [Deployment](#-deployment)
19. [Troubleshooting](#-troubleshooting)
20. [NPM scripts & PDF CLI](#-npm-scripts--pdf-cli)

---

## 🎯 What this system does

RosterPro replaces spreadsheet-based shift planning with a single web app where HR and managers can:

1. **Define** employees, plants (sites), shifts, and weekly patterns (Mon–Sun on/off).
2. **Generate** month-wide rosters in bulk from those patterns.
3. **Override** individual cells when reality differs (manual edit on the grid).
4. **Compare** planned roster (`W` / `WO` / `H`) against **actual attendance** punches.
5. **Handle** leave requests, work reassignment when someone is absent, and holiday calendars.
6. **Notify** users in-app (and optionally by email) when events need attention.
7. **Extract** structured text and tables from PDFs (invoices, reports) without cloud AI.

Employees see a reduced UI: dashboard, read-only roster, their leave/attendance, and profile. Staff roles manage master data and planning.

---

## 🏗 Architecture

### Single-container production (Cloud Run)

```mermaid
flowchart TB
  subgraph browser [Browser]
    React[React SPA]
  end
  subgraph cloudrun [Cloud Run container]
    Express[Express API]
    Static[client/dist static]
    Py[Python run_api.py]
    Express --> Static
    Express -->|spawn| Py
  end
  subgraph data [Data]
    PG[(PostgreSQL)]
    Neon[(Neon / Cloud SQL)]
  end
  React -->|HTTPS /api/*| Express
  Express --> PG
  PG --- Neon
```

### Request flow (authenticated)

```mermaid
sequenceDiagram
  participant U as User
  participant R as React
  participant E as Express
  participant D as PostgreSQL
  U->>R: Login
  R->>E: POST /api/auth/login
  E->>D: Verify user
  E-->>R: JWT + user JSON
  R->>R: localStorage token
  R->>E: GET /api/rosters (Bearer token)
  E->>E: jwt.verify middleware
  E->>D: SQL query
  E-->>R: JSON roster rows
```

| Layer | Responsibility |
|-------|----------------|
| **React (`client/`)** | UI, routing, auth state, polling notifications, theme |
| **Express (`server/`)** | REST API, JWT, business rules, Excel export, PDF orchestration |
| **PostgreSQL** | All persistent data |
| **Python (`pdf-extractor/`)** | Offline PDF parse; Node spawns `run_api.py`, reads JSON from stdout |

**Important:** On Cloud Run, `ENABLE_SOCKET=false` — notifications use **HTTP polling** every ~20s, not WebSocket. Locally, Socket.IO can push events when enabled.

---

## ✨ Highlights

| | |
|---|---|
| 🎨 **UI** | Premium enterprise theme — CSS variables, glass cards, mesh background, dark/light mode, responsive layout, mobile bottom nav |
| ⌨️ **Productivity** | Command palette (`Ctrl`/`⌘` + `K`), toast notifications, skeleton loaders |
| 🔐 **Security** | JWT in `Authorization: Bearer` + optional cookie; `requireStaff` on sensitive routes |
| 📊 **Roster** | Bulk generation, cell editor, planned vs actual grids, Excel export |
| 🔔 **Alerts** | `user_notifications` table + polling; SMTP for leave/mismatch/reassignment |
| 📄 **PDF** | `excel_grid` table layout, camelot/pdfplumber, OCR — no LLM |

---

## 🧩 Features (detailed)

### 🏠 Dashboard & navigation

- **Dashboard** — Role-specific KPIs; employees can mark punch-in/out from dashboard endpoints.
- **Sidebar** — Sectioned navigation; collapsible on desktop; full-screen drawer on mobile (`< lg`).
- **Layout** — Sticky header (`z-50`), bottom tab bar on mobile for Home / Roster / People / Settings.
- **Command palette** — Global search/navigation via `CommandPalette.jsx` and `⌘K` / `Ctrl+K`.
- **User menu** — Avatar, profile link, settings, sign out.
- **Profile** — `PATCH /api/auth/profile` for name/email; `avatar_url` stored on `users` table.

### 📆 Roster & calendar

| Screen | Who | Purpose |
|--------|-----|---------|
| **Manage roster** | Staff | Select employees + date range + shift pattern → **Generate** fills `rosters` table |
| **View roster** | All | Read-only `RosterGrid` filtered by plant/employee/month |
| **Actual roster** | Staff | Side-by-side or overlay of planned status vs attendance punches |

**Bulk generation algorithm** (`POST /api/rosters/generate`):

1. For each employee and each date in range:
2. If date is a **holiday** (national or plant-specific) → status `H`.
3. Else if shift pattern has that weekday **off** → status `WO`.
4. Else → status `W` with shift times copied from linked `shifts` row.
5. Uses `ON CONFLICT (emp_id, roster_date) DO UPDATE` so re-running overwrites non-manual entries.

**Manual edits:** `PUT /api/rosters/cell/:empId/:date` sets `is_manual_override = true` so HR changes stick until regenerated with intent.

**Components:** `RosterGrid.jsx`, `MonthCalendar.jsx` (sizes `sm` / `md` / `lg`), modals for cell editing.

### 👥 People & shifts

- **Employees** — Linked to `plants`; optional `user_id` for login; filters by function, grade, BU, process, plant.
- **Shifts** — Start/end, mandatory window, optional stretched hours.
- **Shift patterns** — Boolean flags per weekday; tied to one shift.
- **Assignments** — `work_assignments` records `from_emp` → `to_emp` on a date with reason (leave/sick/etc.).
- **Plant master** — Site codes for filtering rosters and holidays.

### 🌴 Leave & attendance

**Leave workflow:**

1. Employee (or staff) submits `POST /api/leave` → `status = PENDING`.
2. Staff `PUT /api/leave/:id/approve` or `reject` → updates `reviewed_by`, `reviewed_at`.
3. In-app notification + optional email to HR/employee via `inAppNotifications` / `email.js`.

**Attendance:**

- Records in `attendance_records` — `punch_in`, `punch_out`, `status` (`PRESENT`, `ABSENT`, `ON_LEAVE`, …).
- Employees: `GET /api/attendance/my`, `POST mark-in` / `mark-out`.
- Staff: full list, manual `POST /`, **mismatch report** `GET /api/attendance/mismatches`.
- Staff can trigger `POST /api/attendance/notify-mismatches` to alert HR.

### 🎉 Holidays

- Per-date rows in `holidays` with optional `plant_id` or `is_national`.
- CSV import on staff route `POST /api/holidays/import`.
- Fallback JSON / iCal services for India public holidays when seeding or suggesting dates.

### 📈 Reports

- `GET /api/reports/roster` — Excel workbook of roster for filters (plant, dates).
- `GET /api/reports/attendance-summary` — Aggregated attendance export.
- Uses `xlsx` on the server; client `api/export.js` triggers download.

### 📄 PDF extractor (staff)

1. Upload PDF via `multipart/form-data` → temp file on server.
2. Node `pdfExtract.js` spawns `python run_api.py --input ...`.
3. Python `run_extraction()` detects text vs scanned pages, extracts text + tables.
4. **Table method `excel_grid`** — page-wide column boundaries from line gaps; label/value rows merged (e.g. `BILL TO | Name`).
5. Response JSON: pages, tables, metadata, `pdf_type`; UI shows grid + **Download JSON/CSV**.

Max upload enforced in route; timeout ~5 minutes for large files.

### 🔔 Notifications (UI)

- Stored in `user_notifications` (`type`, `title`, `message`, `link`, `payload` JSONB).
- Client polls `GET /api/notifications` + `GET /api/notifications/unread-count` every 20s (configurable via `VITE_NOTIFICATION_POLL_MS`).
- **Responsive panel** — viewport-clamped position, full-width on narrow screens, backdrop tap-to-close, Escape key.

### ⚙️ Settings & theme

- `ThemeContext` — persists light/dark; default dark; CSS variables in `index.css` (`--bg-primary`, `--sidebar-*`, etc.).

---

## 👤 Roles & permissions

| Role | Icon | Typical user | Access |
|------|------|--------------|--------|
| **ADMIN** | 🛡️ | System owner | All staff routes + user management |
| **HR_USER** | 📋 | HR team | Roster, employees, shifts, holidays, reports, PDF |
| **TRAINING_MANAGER** | 🎓 | Training lead | Same staff routes as HR (training use case) |
| **EMPLOYEE** | 👤 | Shop-floor / office staff | Dashboard, view roster, leave, attendance, profile |

**Enforcement:**

- **Frontend:** `ProtectedRoute` (must be logged in), `StaffRoute` (must be in `STAFF_ROLES` from `server/constants/roles.js`).
- **Backend:** `authenticate` middleware on almost all routes; `requireStaff` on writes to master data and roster generation.

**Signup** (`POST /api/auth/signup`) allows roles: `EMPLOYEE`, `HR_USER`, `TRAINING_MANAGER` — not self-service ADMIN.

---

## 📊 Roster logic & cell codes

Each `rosters` row is unique per `(emp_id, roster_date)`.

| Code | Meaning | Shift times stored? |
|------|---------|---------------------|
| **W** | Work day | ✅ From pattern’s shift |
| **WO** | Weekly off | ❌ Null shift |
| **H** | Holiday | ❌ Null shift |

Generation respects **plant-specific holidays** first, then pattern weekday flags (`mon`…`sun` on `shift_patterns`).

The grid UI colors cells by status and opens a modal to switch status or attach shift overrides.

---

## ⚖️ Attendance mismatch engine

Implemented in `server/services/attendanceMatcher.js` with **15-minute grace** on late punch-in.

| `mismatch_type` | When |
|-----------------|------|
| `NO_ROSTER` | Punch exists but no roster row |
| `ABSENT` | Planned `W`, no attendance or absent |
| `UNEXPECTED_LEAVE` | Planned `W`, attendance `ON_LEAVE` |
| `LATE` | Punch-in after mandatory start + grace |
| `EARLY_LEAVE` | Punch-out before mandatory end |
| `NO_PUNCH_OUT` | Present, punch-in only |
| `UNEXPECTED_PRESENT` | Planned `WO` but punched in |
| `HOLIDAY_WORK` | Planned `H` but worked |

Staff review mismatches on **Attendance** page; can notify via API to create `user_notifications` and optional email.

---

## 📬 Notifications & email

### In-app

| Event types (examples) | Created by |
|----------------------|------------|
| Leave submitted / approved / rejected | `leave.js` routes |
| Reassignment created | `assignments.js` |
| Attendance mismatches | `attendance.js` notify endpoint |

### Email (optional)

Set `EMAIL_ENABLED=true` and SMTP vars. Uses `nodemailer`; logs to `notification_log` table. If disabled, dev mode logs email body to console.

```env
EMAIL_ENABLED=true
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=...
SMTP_PASS=...
HR_NOTIFY_EMAIL=hr@roster.com
```

### Realtime modes

| Environment | Mechanism |
|-------------|-----------|
| Local `npm run dev` | Socket.IO when `ENABLE_SOCKET=true` |
| Cloud Run | Polling only (`ENABLE_SOCKET=false`) |
| Render (split deploy) | Socket.IO supported per `DEPLOY.md` |

---

## 📄 PDF extraction pipeline

```
Upload (multer) → temp PDF → spawn Python → JSON stdout → delete temp → respond
```

| Module | Role |
|--------|------|
| `detector.py` | Text-based vs scanned classification |
| `text_extractor.py` | pdfplumber → pdfminer → PyMuPDF |
| `table_extractor.py` | `excel_grid`, pdfplumber, camelot; scores best table |
| `ocr_extractor.py` | Tesseract for scanned pages |

**Docker image** installs: `python3`, `tesseract-ocr`, `poppler-utils`, pip deps from `requirements.txt`.

**Status endpoint:** `GET /api/pdf-extract/status` — checks Python binary and script path (used by UI banner).

---

## 🗄 Database model

Core tables (see `server/db/schema.sql`):

```mermaid
erDiagram
  users ||--o| employees : "user_id"
  plants ||--o{ employees : plant_id
  plants ||--o{ holidays : plant_id
  employees ||--o{ rosters : emp_id
  employees ||--o{ attendance_records : emp_id
  employees ||--o{ leave_requests : emp_id
  shifts ||--o{ shift_patterns : shift_id
  shift_patterns ||--o{ rosters : "via generation"
  shifts ||--o{ rosters : shift_id
  users ||--o{ user_notifications : user_id
  employees ||--o{ work_assignments : from_emp_id
  employees ||--o{ work_assignments : to_emp_id
```

| Table | Purpose |
|-------|---------|
| `users` | Login, role, `avatar_url` |
| `plants` | Location master |
| `employees` | HR record; may link to `users` |
| `shifts` / `shift_patterns` | Time definitions + weekly template |
| `rosters` | Planned day status per employee |
| `holidays` | Calendar exceptions |
| `attendance_records` | Actual punches |
| `leave_requests` | Workflow state |
| `work_assignments` | Coverage assignments |
| `user_notifications` | In-app feed |
| `notification_log` | Email audit trail |
| `roster_templates` | Saved templates (optional use) |

**Indexes:** `(emp_id, roster_date)`, `(roster_date)`, `(emp_id, attendance_date)`, notification user index.

**Migrations:** `npm run db:migrate` runs `schema.sql` + `migrate.js` patches. **Seed:** `npm run db:seed` demo users, plants, employees, sample rosters.

---

## 🛠 Tech stack

### Frontend (`client/`)

| Tech | Purpose |
|------|---------|
| ⚛️ React 19 | UI components & hooks |
| ⚡ Vite 8 | Dev HMR + production bundle |
| 🎨 Tailwind CSS 4 | Utility styling + `@theme` variables |
| 🧭 React Router 7 | SPA routes in `App.jsx` |
| 📡 Axios | API (`client/src/api/client.js`) |
| 🎯 Lucide React | Icons |
| 📅 date-fns | Relative timestamps in notifications |

### Backend (`server/`)

| Tech | Purpose |
|------|---------|
| 🟢 Express 5 | HTTP API (`app.js` factory for Vercel too) |
| 🐘 `pg` | PostgreSQL pool (`db/index.js`) |
| 🔑 jsonwebtoken + bcryptjs | Auth |
| 📧 nodemailer | Email |
| 📊 xlsx | Report downloads |
| 🔌 socket.io | Optional push (local/Render) |
| 📎 multer | PDF uploads |

### PDF (`pdf-extractor/`)

Python 3.9+, pdfplumber, PyMuPDF, pdfminer.six, camelot-py, pytesseract, pandas, opencv-headless.

### Infrastructure

| Platform | Notes |
|----------|-------|
| ☁️ **Cloud Run** | **Recommended** — `Dockerfile` multi-stage build |
| ▲ **Vercel** | `api/index.js` serverless wrapper; no Socket.IO |
| 🟣 **Render** | `render.yaml` optional API host |
| 💾 **Neon / Cloud SQL** | Managed Postgres |

---

## 🚀 Quick start

### 1️⃣ Prerequisites

- **Node.js 20+**
- **PostgreSQL 14+** (or Neon account)
- **Python 3.9+** (only if using PDF extract locally)
- **Git**

### 2️⃣ Database

```bash
cd server
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/roster_db
DATABASE_SSL=false
JWT_SECRET=use-a-long-random-string-here
PORT=5000
ENABLE_SOCKET=true
```

### 3️⃣ Install, migrate, seed

```bash
# From repo root
npm run install:all
npm run db:migrate
npm run db:seed
```

### 4️⃣ Run

```bash
npm run dev
```

Open **http://localhost:5000** — one process serves Vite middleware + `/api`.

### 🔑 Demo accounts

| Email | Password | Role |
|-------|----------|------|
| `admin@roster.com` | `admin123` | ADMIN |
| `hr@roster.com` | `admin123` | HR_USER |

---

## 🔄 How the app runs (dev vs prod)

| Mode | Command | Frontend | API |
|------|---------|----------|-----|
| **Development** | `npm run dev` | Vite middleware in Express (`setupClient.js`) | Same port :5000 |
| **Production** | `npm run start` | Static files from `client/dist` | Same port |
| **Client-only dev** | `cd client && npm run dev` | :5173 with proxy | Requires API on :5000 |
| **HTTPS local** | `npm run dev:https` | Same | Self-signed cert via `server/ssl.js` |

`server/index.js` boot sequence:

1. Load `.env` (`loadEnv.js`)
2. Test DB connection (exit if fail)
3. Require `JWT_SECRET`
4. `setupClient(app)` — Vite or static
5. Create HTTP/HTTPS server; optional Socket.IO
6. Listen on `0.0.0.0:PORT`

---

## 📁 Project structure

```
Roster Website/
├── client/
│   ├── src/
│   │   ├── components/     # Layout, Sidebar, RosterGrid, NotificationBell, ui/*
│   │   ├── pages/          # One file per route (Dashboard, ManageRoster, …)
│   │   ├── context/        # Auth, Theme, Notification, Toast
│   │   ├── api/            # Axios instance, export helpers
│   │   └── lib/            # utils, apiConfig
│   ├── index.css           # Design tokens, glass, sidebar theme
│   └── vite.config.js
├── server/
│   ├── app.js              # Express app (shared with Vercel)
│   ├── index.js            # Standalone server entry
│   ├── routes/             # Feature routers
│   ├── services/           # email, attendanceMatcher, pdfExtract, …
│   ├── middleware/auth.js  # JWT + requireStaff
│   ├── db/                 # schema.sql, migrate.js, seed.js
│   └── setupClient.js      # Vite middleware vs static
├── pdf-extractor/
│   ├── extractor/          # Python modules
│   ├── run_api.py          # Node integration entry
│   └── main.py             # CLI for local testing
├── api/index.js            # Vercel serverless handler
├── Dockerfile              # Cloud Run: Node + Python + Tesseract
├── DEPLOY-GCP.md           # Primary deploy guide
├── VERCEL.md / DEPLOY.md   # Alternate hosts
└── README.md               # This file
```

---

## 🖥 Frontend architecture

### Provider tree (`App.jsx`)

```
ThemeProvider
  └── AuthProvider
        └── NotificationProvider
              └── ToastProvider
                    └── BrowserRouter → Routes
```

### Auth flow

1. Login → JWT stored in `localStorage` (`token` + `user`).
2. Axios interceptor attaches `Authorization: Bearer <token>`.
3. On load, `GET /api/auth/me` refreshes user (validates token).
4. Logout clears storage; redirects to `/login`.

### Key components

| Component | Role |
|-----------|------|
| `Layout.jsx` | Header, sidebar toggle, mobile bottom nav |
| `Sidebar.jsx` | Role-filtered menu sections |
| `ProtectedRoute.jsx` | Redirect if not authenticated |
| `StaffRoute.jsx` | Redirect employees away from staff pages |
| `RosterGrid.jsx` | Month grid, cell click → edit |
| `NotificationBell.jsx` | Portal dropdown, responsive positioning |
| `CommandPalette.jsx` | Quick navigation |

### Styling

- **Dark default** in `ThemeContext`.
- Variables: `--bg-primary`, `--bg-secondary`, `--border`, `--accent-primary`, `--sidebar-bg`, etc.
- **Responsive:** `lg:` breakpoint for sidebar vs drawer; notification panel full-width below 640px.

---

## 🔌 API reference

Base URL: `/api` · Auth: `Authorization: Bearer <jwt>` unless noted.

### 🔐 Auth `/api/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/signup` | — | Register (allowed roles only) |
| POST | `/login` | — | Returns `{ token, user }` |
| GET | `/me` | ✅ | Current user profile |
| PATCH | `/profile` | ✅ | Update name, email, avatar |
| GET | `/roles` | — | Signup role list |

### 👥 Employees `/api/employees`

| Method | Path | Staff | Description |
|--------|------|-------|-------------|
| GET | `/` | | List with query filters |
| GET | `/filters` | | Distinct filter options |
| POST | `/` | ✅ | Create |
| PUT | `/:id` | ✅ | Update |
| DELETE | `/:id` | ✅ | Delete |

### 📆 Rosters `/api/rosters`

| Method | Path | Staff | Description |
|--------|------|-------|-------------|
| GET | `/` | | Query: `emp_id`, `emp_ids`, `start_date`, `end_date`, `plant_id` |
| POST | `/generate` | ✅ | Bulk generate from pattern |
| POST | `/bulk` | ✅ | Array of cell updates |
| PUT | `/cell/:empId/:date` | ✅ | Single cell |
| PUT | `/:id` | ✅ | Update by roster id |

### ⏰ Shifts `/api/shifts`

| GET/POST/PUT | `/`, `/:id` | Patterns: `/patterns`, `/patterns/:id` |

### 🌴 Leave `/api/leave`

| GET | `/` | List (own or all for staff) |
| POST | `/` | Submit request |
| PUT | `/:id/approve` | ✅ Staff |
| PUT | `/:id/reject` | ✅ Staff |

### 📋 Attendance `/api/attendance`

| GET | `/mismatches` | Mismatch report |
| GET | `/my` | Current employee records |
| POST | `/mark-in`, `/mark-out` | Self punch |
| POST | `/notify-mismatches` | ✅ Alert HR |

### 🔔 Notifications `/api/notifications`

| GET | `/` | List (`?limit=30`) |
| GET | `/unread-count` | Badge count |
| PATCH | `/read-all`, `/:id/read` | Mark read |
| DELETE | `/:id`, `/clear-all` | Remove |

### 📄 PDF `/api/pdf-extract`

| GET | `/status` | Engine health |
| POST | `/extract` | `multipart` field `file` + `pages`, `includeTables`, `includeOcr` |

### Others

- `/api/holidays` — CRUD + CSV import  
- `/api/plants` — Plant master  
- `/api/assignments` — Reassignments  
- `/api/reports/roster`, `/attendance-summary` — Downloads  
- `/api/dashboard/employee` — Employee KPIs + mark-in/out  
- `/api/calendar` — Combined calendar data  
- `/api/health` — `{ status: 'ok' }`  

---

## ⚙️ Environment variables

Full template: `server/.env.example`

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `DATABASE_SSL` | | `true` for Neon/Cloud SQL |
| `JWT_SECRET` | ✅ | Min ~32 random chars in production |
| `PORT` | | `5000` local, `8080` in Docker |
| `NODE_ENV` | | `production` enables static frontend |
| `CLIENT_URL` | | CORS allowlist (comma-separated origins) |
| `ENABLE_SOCKET` | | `false` on Cloud Run |
| `USE_HTTPS` | | Local HTTPS dev |
| `EMAIL_ENABLED` | | `true` to send real email |
| `SMTP_*` | | Mail server |
| `HR_NOTIFY_EMAIL` | | Default HR inbox |
| `PYTHON_PATH` | | e.g. `.venv/Scripts/python.exe` |
| `PDF_EXTRACTOR_ROOT` | | Path to `pdf-extractor/` |
| `VITE_NOTIFICATION_POLL_MS` | | Client poll interval (optional) |

---

## ☁️ Deployment

| Guide | Best for |
|-------|----------|
| **[DEPLOY-GCP.md](./DEPLOY-GCP.md)** | ☁️ **Recommended** — single URL, Docker, Python bundled |
| **[VERCEL.md](./VERCEL.md)** | Serverless + Neon |
| **[DEPLOY.md](./DEPLOY.md)** | Split frontend/API |

### Cloud Run (this project)

```powershell
gcloud config set project roster-system-496716
cd "d:\Roster Website"
gcloud builds submit --tag gcr.io/roster-system-496716/roster-app
gcloud run deploy roster-app `
  --image gcr.io/roster-system-496716/roster-app `
  --region asia-south1 `
  --allow-unauthenticated
```

| Item | Value |
|------|--------|
| GCP project | `roster-system-496716` |
| Service | `roster-app` |
| Region | `asia-south1` |
| Database | Neon or Cloud SQL (`DATABASE_SSL=true`) |

After deploy, run migrations against production DB once:

```bash
cd server && npm run db:migrate
```

---

## 🩺 Troubleshooting

| Problem | Check |
|---------|--------|
| ❌ Database connection failed | Postgres running? `DATABASE_URL` correct? `DATABASE_SSL` matches host? |
| ❌ JWT_SECRET missing | Set in `server/.env` |
| ❌ Port in use | Kill process on :5000 or change `PORT` |
| PDF extractor unavailable | `GET /api/pdf-extract/status`; install Python deps; set `PYTHON_PATH` |
| Notifications empty | Logged in? Poll working? Check `user_notifications` table |
| CORS errors in prod | Set `CLIENT_URL` to exact frontend origin |
| Cloud Run 502 on PDF | Image includes Python; check logs for `pip` / Tesseract errors |
| Vercel login works but socket doesn’t | Expected — use polling on serverless |

**Logs (Cloud Run):**

```powershell
gcloud run services logs read roster-app --region asia-south1 --limit 50
```

---

## 📜 NPM scripts & PDF CLI

### Root scripts

| Script | Description |
|--------|-------------|
| `npm run install:all` | `server` + `client` dependencies |
| `npm run dev` | Express + Vite middleware |
| `npm run dev:https` | HTTPS dev server |
| `npm run build` | Build `client/dist` only |
| `npm run start` | Build + production Express |
| `npm run db:migrate` | Apply schema/migrations |
| `npm run db:seed` | Demo data |

### PDF CLI (local)

```powershell
cd pdf-extractor
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python main.py --input invoice.pdf --output json
python main.py --input invoice.pdf --output all --pages 1-5
```

Deep PDF docs: **[pdf-extractor/README.md](./pdf-extractor/README.md)** (Tesseract, Poppler, Windows `winget` installs).

---

## 📄 License

Private / internal use — adjust for your organization.

---

<p align="center">
  <strong>RosterPro</strong> — plan shifts · track attendance · notify teams · extract PDFs<br/>
  <sub>Built with React, Express, PostgreSQL, and Python</sub>
</p>
