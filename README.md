# TaskFlow — Task Automation & Job Processing Platform

Production-minded micro SaaS module built for the **Saarthi AI Private Limited** MERN Stack Developer technical assessment.

Users can register/login, create tasks, queue them in Redis via BullMQ, process jobs asynchronously, track status history, and receive live Socket.IO updates.

---

## Project Overview

TaskFlow is a production-minded micro SaaS module for task automation and asynchronous job processing. Users register and log in, create/queue tasks, track status history, upload files, and receive live Socket.IO updates while BullMQ workers process jobs in the background.

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 15, React 19, TypeScript, Redux Toolkit, TanStack Query, Socket.IO Client |
| Backend | Node.js, Express, TypeScript, Zod, Winston |
| Database | PostgreSQL + Prisma ORM (migrations, indexes, seed data) |
| Queue | BullMQ on Redis |
| Cache / Sessions | Redis (sessions, dashboard/task list cache, pub/sub for realtime) |
| Auth | JWT access + refresh tokens, bcrypt, RBAC (`USER` / `ADMIN`) |
| Realtime | Socket.IO + Redis pub/sub bridge |
| DevOps | Docker, docker-compose, GitHub Actions CI |

---

## Architecture

```text
┌────────────┐     REST / WS      ┌─────────────────┐
│  Next.js   │ ◄───────────────► │  Express API     │
│  Frontend  │                   │  + Socket.IO     │
└────────────┘                   └────────┬────────┘
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    ▼                     ▼                     ▼
             ┌────────────┐        ┌────────────┐        ┌────────────┐
             │ PostgreSQL │        │   Redis    │        │  BullMQ    │
             │  (Prisma)  │        │ cache/sess │        │   Queue    │
             └────────────┘        └─────▲──────┘        └─────▲──────┘
                                         │                     │
                                         │   pub/sub     ┌─────┴──────┐
                                         └───────────────┤   Worker   │
                                                         └────────────┘
```

**Request flow**

1. Authenticated user creates a task via REST.
2. Task is persisted as `PENDING` in PostgreSQL.
3. Job is added to BullMQ (optional delay for scheduled tasks).
4. Worker picks the job → sets `PROCESSING` → simulates work → `COMPLETED` / `FAILED`.
5. Worker publishes status on Redis; API process emits Socket.IO events to the user room.
6. Frontend invalidates React Query caches and refreshes UI live.

---

## Folder Structure

```text
app/
├── backend/
│   ├── prisma/                 # schema, migrations, seed
│   ├── src/
│   │   ├── config/             # env, db, redis, queue, logger
│   │   ├── controllers/        # HTTP adapters
│   │   ├── services/           # business logic
│   │   ├── repositories/       # data access (repository pattern)
│   │   ├── middleware/         # auth, validation, rate limit, upload, errors
│   │   ├── routes/
│   │   ├── workers/            # BullMQ worker
│   │   ├── socket/             # Socket.IO
│   │   ├── utils/
│   │   ├── app.ts
│   │   └── server.ts
│   ├── tests/
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/                # Next.js App Router pages
│   │   ├── components/
│   │   ├── features/           # Redux slices
│   │   ├── services/           # API clients
│   │   ├── hooks/
│   │   ├── store/
│   │   └── types/
│   └── Dockerfile
├── postman/
├── .github/workflows/ci.yml
├── docker-compose.yml
└── .env.example
```

---

## Prerequisites

- Node.js 18+
- PostgreSQL 16
- Redis 7
- Docker (optional, recommended)

---

## Quick Start (Docker)

```bash
cp .env.example .env
docker-compose up --build -d
```

Services:

- Frontend: http://localhost:3000
- API: http://localhost:5000/api/v1
- Health: http://localhost:5000/api/v1/health

Seeded accounts:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@taskflow.com` | `Admin@123` |
| User | `user@taskflow.com` | `User@123` |

---

## Local Development

### 1. Environment

```bash
cp .env.example .env
```

Ensure PostgreSQL and Redis are running and match `.env`.

### 2. Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

Optional dedicated worker (if `RUN_INLINE_WORKER=false`):

```bash
npm run dev:worker
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

---

## Environment Variables

See [`.env.example`](./.env.example) for the full list.

Important keys:

- `DATABASE_URL` — PostgreSQL connection string
- `REDIS_HOST` / `REDIS_PORT` / `REDIS_URL`
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`
- `CORS_ORIGIN` / `FRONTEND_URL`
- `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_SOCKET_URL`
- `RUN_INLINE_WORKER` — `false` in Docker API container so only the worker service processes jobs

---

## API Documentation

Base URL: `/api/v1`

Centralized response shape:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {},
  "meta": {}
}
```

### Auth

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/auth/register` | No | Register user |
| POST | `/auth/login` | No | Login, returns access + refresh tokens |
| POST | `/auth/refresh` | No | Rotate tokens |
| POST | `/auth/logout` | Yes | Invalidate refresh token + Redis session |
| GET | `/auth/me` | Yes | Current profile |

### Admin (RBAC)

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/admin/users` | Admin only | List users (`authorize(ADMIN)` middleware) |

### Tasks

| Method | Path | Description |
| --- | --- | --- |
| POST | `/tasks` | Create + enqueue (`multipart/form-data` supported) |
| GET | `/tasks` | List with search, filters, sort, pagination |
| GET | `/tasks/:id` | Task detail |
| PATCH | `/tasks/:id` | Update |
| DELETE | `/tasks/:id` | Delete |
| POST | `/tasks/:id/retry` | Requeue failed task |
| POST | `/tasks/:id/schedule` | Schedule future execution |

### Dashboard

| Method | Path | Description |
| --- | --- | --- |
| GET | `/dashboard/stats` | Task counts + BullMQ queue status |

Import Postman collection: [`postman/TaskFlow.postman_collection.json`](./postman/TaskFlow.postman_collection.json)

---

## Database Design

- `users` ↔ `tasks` (1:N, cascade delete)
- Enums for `Role`, `TaskStatus`, `TaskPriority`
- Indexes on `email`, `userId`, `status`, `priority`, `createdAt`, `scheduledAt`, `title`
- Prisma migrations under `backend/prisma/migrations`
- Seed script creates demo admin/user + sample tasks

Statuses: `PENDING` → `PROCESSING` → `COMPLETED` | `FAILED`

---

## Redis Integration

| Use | Detail |
| --- | --- |
| Sessions | `session:{userId}` with sliding TTL; required by auth middleware |
| Cache | Dashboard stats + task list query hashes (short TTL, invalidated on writes) |
| Queue | BullMQ connection for async job processing |
| Pub/Sub | Worker publishes task events; API relays to Socket.IO rooms |

---

## Authentication Flow

1. Register/Login hashes password with bcrypt and issues JWT access (short-lived) + refresh (long-lived).
2. Refresh token stored on user record; session metadata cached in Redis.
3. Protected routes require `Authorization: Bearer <accessToken>` and an active Redis session.
4. Refresh endpoint rotates tokens; logout clears DB refresh token + Redis session.
5. RBAC: `ADMIN` can view all tasks; `USER` scoped to own tasks.

---

## Engineering Decisions

- **Repository + Service layer** keeps controllers thin and testable.
- **Zod validation** + centralized error middleware for consistent API responses.
- **BullMQ** over ad-hoc timers for retries, delays, concurrency, and observability.
- **Redis pub/sub bridge** keeps Socket.IO on the API process while workers scale separately.
- **TanStack Query** for server state; **Redux Toolkit** for auth session + UI filters.
- **Dynamic imports** (`next/dynamic`) for client-heavy pages.
- **Helmet, CORS, rate limiting, compression** for baseline security/performance.

---

## Assumptions Made

- Task “processing” is simulated (1.5–4s) with ~15% random failure to demonstrate retries/status flow.
- Files are stored on local disk (`backend/uploads`); cloud storage is a natural next step.
- Access tokens are stored in `localStorage` for SPA simplicity (httpOnly cookies preferred for higher threat models).
- Single-region deployment assumed for Docker Compose demo.

---

## Trade-offs

| Choice | Trade-off |
| --- | --- |
| Inline worker in local API | Simpler DX; disabled in Docker via `RUN_INLINE_WORKER=false` |
| Local file storage | Fast to demo; not durable/multi-instance |
| Short Redis cache TTL | Freshness over peak cache hit rate |
| Simulated job work | Focuses assessment on architecture vs domain-specific processors |

---

## Testing

```bash
cd backend
npm test
```

Includes unit tests (JWT/errors) and API smoke tests (health/404).

CI: GitHub Actions builds/tests backend and builds frontend on push/PR.

---

## Video Walkthrough

Record a 5–10 minute screencast covering architecture, auth, queue/Redis, DB design, and trade-offs. Upload to Loom/Google Drive and add the public link here:

> **Video link:** _Add your Loom / Google Drive URL after recording_

Suggested outline:

1. Architecture diagram (1 min)
2. Folder structure walkthrough (1 min)
3. Auth + refresh + Redis session (2 min)
4. Create task → BullMQ → worker status transitions (3 min)
5. Socket.IO live updates (1 min)
6. DB schema / migrations / Docker (1–2 min)
7. Future improvements (1 min)

---

## Future Improvements

- Redis adapter for multi-instance Socket.IO
- S3/GCS uploads + virus scanning
- Per-task processor registry (email, report, webhook)
- OpenAPI/Swagger generation
- E2E tests (Playwright) + higher unit coverage
- httpOnly secure cookie auth
- Observability (OpenTelemetry, Prometheus metrics)
- Horizontal worker autoscaling

---

## Submission Checklist

- [x] Public GitHub repository (push when ready)
- [x] Comprehensive README
- [ ] Video walkthrough link
- [x] Postman collection
- [x] Docker + docker-compose
- [x] `.env.example`
- [x] Database migrations + seed
- [x] CI workflow (bonus)

---

Built for Saarthi AI Private Limited — MERN Stack Developer Technical Assessment.
