# Vaultoo

> **Vaultoo is the core product.** Selectra is a demo application used solely to showcase Vaultoo's integration capabilities in a real-world scenario.

Vaultoo is a **zero-trust access orchestration platform** that lets account owners securely share credentials with requesters — without ever exposing passwords — using OTP-verified, time-limited sessions with real-time monitoring.

Selectra serves as a **reference integration**: a standalone AI interview web app that demonstrates how any third-party application can plug into Vaultoo's access control system. It is not a product of Vaultoo — it exists purely to make the platform's capabilities tangible and testable.

---

## Architecture

| Layer                         | Tech                                                         | Description                                                                                                           |
| ----------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| **Vaultoo** _(Core Platform)_ | Next.js 14 · TypeScript · Tailwind CSS · Prisma · PostgreSQL | The main product — owner dashboard, API server, session engine, encrypted credential vault                            |
| **Selectra** _(Demo App)_     | Flask · Vanilla JS/CSS                                       | A sample third-party app that integrates with Vaultoo to demonstrate OTP access, live monitoring, and session control |
| **Database**                  | PostgreSQL (Neon)                                            | User accounts, encrypted credentials, access requests, sessions, activity logs                                        |

```
┌─────────────────────────────────────────────────────────────┐
│                        VAULTOO                              │
│  Next.js Dashboard · REST API · Session Management          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ Sessions │ │ Requests │ │ Activity │ │ Settings │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│              ▲                    ▲                          │
└──────────────┼────────────────────┼─────────────────────────┘
               │  OTP Verify        │  Screen Frames
               │  Session Status    │  Activity Logs
┌──────────────┼────────────────────┼─────────────────────────┐
│              ▼                    │                          │
│                       SELECTRA                              │
│  Flask App · AI Interview Agent · Live Screen Capture       │
└─────────────────────────────────────────────────────────────┘
```

---

## Features

### Vaultoo — Core Platform

- **Account Vault** — Store platform credentials with AES-256 encryption; passwords are never exposed to requesters
- **Access Requests** — Requesters submit time-limited access requests; owners approve/deny with one click
- **OTP Sessions** — Approved requests generate a one-time password; requester verifies OTP to start a session
- **Live Screen Feed** — Real-time screenshots of what the requester sees in Selectra, streamed to the owner dashboard
- **Session Kill Switch** — Instantly terminate any active session and force logout the requester from Selectra
- **Session Extensions** — Requesters can request more time; owners approve/deny extension requests
- **Activity Logging** — Every action during a session is logged with timestamps, URLs, and risk flags
- **Sentinel Risk Engine** — Automated risk level assessment (LOW / MEDIUM / HIGH / CRITICAL) per session
- **Fully Responsive** — Mobile-first dashboard with collapsible sidebar, hamburger menu, and adaptive layouts

### Selectra — Demo Integration App

> Selectra is **not a Vaultoo product**. It is a pre-built demo application used to illustrate what a real Vaultoo integration looks like end-to-end. Any third-party app can replicate this same integration pattern.

- **Vaultoo OTP Login** — Secure temporary access granted via Vaultoo-issued OTP; no passwords are ever shared
- **Live Screen Capture** — Streams screenshots to the Vaultoo owner dashboard every 3 seconds during an active session
- **Session Timer** — Visual countdown with auto-extension requests and forced logout when the session expires
- **AI Interview Agent** — Multi-role interview simulator included as demo app functionality (Frontend, Backend, Full Stack, DevOps, etc.)
- **Real-Time Scoring** — Four-dimension answer scoring: Clarity, Accuracy, Completeness, Confidence
- **Responsive Design** — Hamburger navigation, stacked layouts on mobile, adaptive chat interface

---

## Data Model

```
User ──┬── Account (encrypted credentials)
       ├── AccessRequest ──── Session ──── ActivityLog
       └── (Owner/Requester relations)
```

| Model             | Key Fields                                                |
| ----------------- | --------------------------------------------------------- |
| **User**          | email, name, password (hashed), role (OWNER/USER)         |
| **Account**       | platform, encryptedEmail, encryptedPassword, encryptionIV |
| **AccessRequest** | requester, owner, account, duration, status, OTP          |
| **Session**       | sessionToken, expiresAt, riskLevel, latestFrame           |
| **ActivityLog**   | action, url, details, riskFlag                            |

---

## API Routes

### Authentication

| Method | Route                | Description                  |
| ------ | -------------------- | ---------------------------- |
| POST   | `/api/auth/register` | Create account               |
| POST   | `/api/auth/login`    | Sign in (returns JWT cookie) |
| POST   | `/api/auth/logout`   | Sign out                     |
| GET    | `/api/auth/me`       | Get current user             |

### Dashboard

| Method   | Route                        | Description                      |
| -------- | ---------------------------- | -------------------------------- |
| GET/POST | `/api/accounts`              | List / create encrypted accounts |
| GET/POST | `/api/requests`              | List / create access requests    |
| POST     | `/api/requests/[id]/approve` | Approve request & generate OTP   |
| POST     | `/api/requests/[id]/deny`    | Deny request                     |
| POST     | `/api/requests/[id]/extend`  | Approve extension request        |
| GET      | `/api/sessions`              | List all sessions                |
| POST     | `/api/sessions/[id]/kill`    | Kill switch — terminate session  |
| GET      | `/api/sentinel`              | Sentinel risk analysis           |
| GET/POST | `/api/edit-requests`         | Account edit requests            |

### Public / Selectra Integration

| Method | Route                       | Description                      |
| ------ | --------------------------- | -------------------------------- |
| POST   | `/api/v1/verify-otp`        | Verify OTP and start session     |
| GET    | `/api/v1/session-status`    | Check if session is still active |
| POST   | `/api/v1/activity`          | Log activity from Selectra       |
| POST   | `/api/v1/screen-share`      | Receive screenshot frame         |
| GET    | `/api/v1/screen-share`      | Poll latest frame                |
| POST   | `/api/v1/request-extension` | Request session extension        |
| POST   | `/api/v1/webhook/terminate` | Webhook: force terminate session |

---

## Tech Stack

**Vaultoo:**

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Framer Motion
- Prisma ORM 5.22
- PostgreSQL (Neon)
- bcryptjs (password hashing)
- jose (JWT tokens)
- CryptoJS (AES-256 credential encryption)
- html2canvas (screen capture on client)

**Selectra:**

- Python / Flask
- Vanilla JavaScript
- CSS3 with custom design system
- Google Gemini API (AI interview agent)

---

## Project Structure

```
├── Selectra/                    # Flask interview platform
│   ├── app.py                   # Flask server
│   ├── requirements.txt
│   └── static/
│       ├── index.html           # Single-page app
│       ├── script.js            # Client logic + Vaultoo integration
│       └── style.css            # Design system + responsive styles
│
└── Vaultoo/                     # Next.js dashboard
    ├── prisma/schema.prisma     # Database schema
    ├── src/
    │   ├── middleware.ts         # Auth middleware
    │   ├── app/
    │   │   ├── layout.tsx        # Root layout
    │   │   ├── page.tsx          # Landing redirect
    │   │   ├── login/            # Login page
    │   │   ├── register/         # Registration page
    │   │   ├── dashboard/        # Protected dashboard
    │   │   │   ├── page.tsx      # Overview
    │   │   │   ├── sessions/     # Active sessions
    │   │   │   ├── requests/     # Incoming requests
    │   │   │   ├── activity/     # Activity log + screen feeds
    │   │   │   ├── settings/     # Account management
    │   │   │   ├── my-sessions/  # User's own sessions
    │   │   │   └── request-access/ # Request access form
    │   │   ├── access/           # Public access pages
    │   │   └── api/              # API routes
    │   ├── components/           # UI components
    │   ├── hooks/                # Custom hooks
    │   ├── lib/                  # Utilities (auth, crypto, prisma, etc.)
    │   └── types/                # TypeScript types
    └── package.json
```

---

## Environment Variables

### Vaultoo (`Vaultoo/.env`)

```env
DATABASE_URL=           # PostgreSQL connection (pooled)
DIRECT_URL=             # PostgreSQL connection (direct)
JWT_SECRET=             # JWT signing secret
ENCRYPTION_KEY=         # AES-256 key for credential encryption
NEXT_PUBLIC_APP_URL=    # App URL (e.g., https://vaultoo.vercel.app)
SMTP_HOST=              # Email SMTP host
SMTP_PORT=              # Email SMTP port
SMTP_USER=              # Email username
SMTP_PASS=              # Email password
SMTP_FROM=              # From email address
WEBHOOK_SECRET=         # Webhook auth secret
```

---

## Deployment

Both are deployed on **Vercel**. Vaultoo is the primary deployment; Selectra is deployed separately as the demo companion app.

| App          | Role                 | URL                                                          |
| ------------ | -------------------- | ------------------------------------------------------------ |
| **Vaultoo**  | Core platform        | [vaultoo.vercel.app](https://vaultoo.vercel.app)             |
| **Selectra** | Demo integration app | [selectra-rose.vercel.app](https://selectra-rose.vercel.app) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.9+
- PostgreSQL database

### Vaultoo

```bash
cd Vaultoo
npm install
cp .env.example .env      # Fill in your environment variables
npx prisma db push         # Push schema to database
npm run dev                # Starts on port 3001
```

### Selectra

```bash
cd Selectra
pip install -r requirements.txt
python app.py              # Starts on port 5000
```

---

## Security

- Passwords hashed with **bcryptjs** (salt rounds: 12)
- Credentials encrypted with **AES-256-CBC** before storage
- JWT auth tokens stored in **httpOnly cookies**
- OTP codes are **time-limited** and **single-use**
- Sessions auto-expire and can be **instantly killed**
- Activity logging with **risk flag detection**
- CORS headers configured for cross-origin Selectra integration

---

## License

Private project. All rights reserved.
