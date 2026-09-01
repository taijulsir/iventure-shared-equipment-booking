# iVenture Shared Equipment Booking

[![CI Pipeline](https://github.com/taijulsir/iventure-shared-equipment-booking/actions/workflows/ci.yml/badge.svg)](https://github.com/taijulsir/iventure-shared-equipment-booking/actions/workflows/ci.yml)
[![Deployment Pipeline](https://github.com/taijulsir/iventure-shared-equipment-booking/actions/workflows/deploy.yml/badge.svg)](https://github.com/taijulsir/iventure-shared-equipment-booking/actions/workflows/deploy.yml)

An enterprise shared equipment booking and resource scheduling platform built with **Next.js (App Router)**, **NestJS**, **Prisma ORM**, and **PostgreSQL**. Designed with multi-tiered role governance, real-time catalog availability, automated approval workflows, and mathematical double-layer reservation overlap protection.

---

## Live Deployment

The application is deployed on a dedicated production Linux VPS behind Nginx with Let's Encrypt TLS:

- **Live Application (Frontend)**: [https://iventure-assesment.taijul.dev](https://iventure-assesment.taijul.dev)
- **API Base URL**: [https://iventure-assesment.taijul.dev/api](https://iventure-assesment.taijul.dev/api)
- **Health Check**: [https://iventure-assesment.taijul.dev/api/health](https://iventure-assesment.taijul.dev/api/health)

---

## API Documentation

- **Interactive Postman Documentation**: [https://documenter.getpostman.com/view/57462547/2sBYAuTrxi](https://documenter.getpostman.com/view/57462547/2sBYAuTrxi)
- **Postman Collection & Environment**: Available directly in this repository under [`postman/`](postman/):
  - Collection: [`postman/collections/iventure-api.postman_collection.json`](postman/collections/iventure-api.postman_collection.json)
  - Environment: [`postman/environments/iventure-local.postman_environment.json`](postman/environments/iventure-local.postman_environment.json)

---

## AI-Assisted Development Disclosure

In full compliance with assessment guidelines, AI-assisted development tools (including Claude, Antigravity, and DeepMind coding assistants) were utilized during the development lifecycle for:
- Initial scaffolding and boilerplate code generation
- Test fixture synthesis and Newman test case authoring
- Documentation generation and formatting
- Architectural review, vulnerability auditing, and edge-case discovery

**Developer Ownership & Verification**: Every line of code, Prisma schema definition, SQL migration, NestJS guard, React component, and automated test suite was critically reviewed, refactored, debugged, and manually verified by the developer against all assessment requirements and security standards.

---

## Key Features & RBAC Matrix

The system implements strict Role-Based Access Control (RBAC) with three distinct operational roles:

| Feature / Capability | Employee | Administrator | SuperAdmin |
|---|:---:|:---:|:---:|
| **Public Registration & Login** | ✅ | Direct DB Provisioning | Bootstrap Seed Only |
| **Browse & Filter Equipment Catalog** | ✅ | ✅ | ✅ |
| **Create Equipment Reservations** | ✅ | ✅ | ✅ |
| **View Personal Reservations** | ✅ | ✅ | ✅ |
| **Cancel Personal Active Reservations** | ✅ | ✅ (Own Only) | ✅ (Own Only) |
| **Automatic Approval Handling** | ✅ (Instant if unflagged) | — | — |
| **Equipment Catalog Management (CRUD)** | ❌ (403 Forbidden) | ✅ | ✅ |
| **Approve / Reject Pending Reservations** | ❌ (403 Forbidden) | ✅ | ✅ |
| **View All Company-Wide Reservations** | ❌ (403 Forbidden) | ✅ | ✅ |
| **User Directory & Role Management** | ❌ (403 Forbidden) | ❌ (403 Forbidden) | ✅ |
| **Promote Employee to Admin / Demote** | ❌ (403 Forbidden) | ❌ (403 Forbidden) | ✅ |

### Security & Invariants
- **Double-Layer Overlap Protection**: Application pre-check + PostgreSQL `EXCLUDE USING GIST` constraint with `btree_gist` extension prevents concurrent reservation collisions under high concurrency.
- **Secure Authentication**: Stateless JWTs stored strictly inside `HttpOnly`, `SameSite=Lax`, and `Secure` (in production) cookies.
- **Ownership Boundaries**: Strict server-side verification ensuring users can only view and cancel their own bookings.
- **Login Rate Limiting**: In-memory sliding window IP-based rate limiter guarding against brute-force login attacks.

---

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Vanilla CSS Design System with theme switching (Light/Dark mode), Lucide Icons.
- **Backend**: NestJS 12, Express platform, TypeScript, `@nestjs/jwt`, `bcrypt`, `class-validator`, `cookie-parser`.
- **Database & ORM**: PostgreSQL 16, Prisma ORM 7 (`@prisma/adapter-pg`), PostgreSQL `btree_gist` extension for GiST exclusion constraints.
- **DevOps & Infrastructure**: Docker, Docker Compose, Nginx Reverse Proxy, Let's Encrypt SSL/TLS, GitHub Actions CI/CD.
- **Testing**: Vitest (Unit & E2E), Supertest, Newman / Postman API Automated Regression Suite (152 assertions).

---

## Architecture & Documentation

- [Architecture Overview](docs/architecture.md): Monolith modular structure, data flow, domain boundaries, security posture.
- [Key Engineering Decisions](docs/decisions.md): Framework choices, UTC scheduling, double-layer conflict prevention, auth lifecycle.
- [Production Deployment Runbook](docs/deployment.md): VPS prerequisites, Docker Compose production stack, CI/CD pipeline, migrations, rollback.
- [Requirements Traceability Matrix](docs/requirements.md): Verification matrix mapping technical implementation to all assessment requirements.

---

## Database & Reservation Overlap Protection

Conflict prevention is enforced via two complementary layers:

1. **Application Layer (Fast Validation)**: Evaluates requested `[startTime, endTime)` intervals against active reservations (`PENDING`, `CONFIRMED`) and returns human-readable `409 Conflict` responses.
2. **Database Engine Layer (Authoritative Constraint)**: A PostgreSQL `EXCLUDE USING GIST` constraint on `tsrange("start_time", "end_time")` backed by the `btree_gist` extension ensures that even concurrent simultaneous requests cannot create overlapping active reservations at the database storage level.

Cancelled (`CANCELLED`) and Rejected (`REJECTED`) reservations immediately release their time slot and are excluded from conflict evaluations.

---

## Local Development Setup

### 1. Prerequisites
- **Node.js**: v22 LTS
- **Docker & Docker Compose**: for local PostgreSQL database

### 2. Start PostgreSQL
```bash
cp .env.example .env
docker compose up -d postgres
```

### 3. Start Backend
```bash
cd backend
cp .env.example .env
npm ci
npx prisma migrate dev
npm run seed:admin       # Seeds default local Admin account
npm run seed:superadmin  # Seeds SuperAdmin (requires SUPERADMIN_* in .env)
npm run start:dev        # Starts NestJS API on http://localhost:3000
```

### 4. Start Frontend
```bash
cd ../frontend
cp .env.example .env.local
npm ci
npm run dev              # Starts Next.js on http://localhost:3001
```

---

## Environment Variables

Environment templates are committed in the repository:
- **Root**: `.env.example`, `.env.production.example`
- **Backend**: `backend/.env.example`
- **Frontend**: `frontend/.env.example`

| Variable | Description | Example / Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://iventure:password@localhost:5432/iventure?schema=public` |
| `PORT` | Backend HTTP port | `3000` |
| `NODE_ENV` | Environment mode (`development` or `production`) | `development` |
| `JWT_SECRET` | Secret key for signing and verifying JWT tokens | Random 64-byte hex string |
| `JWT_EXPIRES_IN` | JWT token lifetime | `1h` |
| `COOKIE_SAME_SITE` | SameSite cookie policy | `lax` |
| `FRONTEND_ORIGIN` | Allowed CORS origin for frontend | `http://localhost:3001` |
| `NEXT_PUBLIC_API_BASE_URL` | Frontend API base URL | `http://localhost:3000` |
| `SUPERADMIN_EMAIL` | Bootstrap SuperAdmin email | `superadmin@iventure.local` |
| `SUPERADMIN_PASSWORD` | Bootstrap SuperAdmin password | Strong password string |
| `SUPERADMIN_NAME` | Bootstrap SuperAdmin full name | `Super Admin` |

---

## Quality Checks & Testing

The project maintains comprehensive test suites across all layers:

```bash
# -------------------------------------------------------------
# Backend Verification (from backend/ directory)
# -------------------------------------------------------------
cd backend

# 1. Linting
npm run lint

# 2. Unit Tests (111 passing tests)
npm run test

# 3. E2E Integration Tests (116 passing tests including Concurrency E2E)
npm run test:e2e

# 4. TypeScript & Production Build
npm run build

# 5. API Regression Test (Newman / Postman - 152 passing assertions)
npm run test:api

# -------------------------------------------------------------
# Frontend Verification (from frontend/ directory)
# -------------------------------------------------------------
cd ../frontend

# 1. Linting
npm run lint

# 2. Next.js Production Build
npm run build
```

---

## CI/CD Pipeline

The repository utilizes **GitHub Actions** for continuous integration and automated deployment:

1. **Continuous Integration (`.github/workflows/ci.yml`)**:
   - Triggers on all pushes and pull requests across `main` and feature branches.
   - Boots PostgreSQL with the `btree_gist` extension in a GitHub runner service container.
   - Executes backend lint, unit tests, e2e tests, build, frontend lint, frontend build, and the full Newman 152-assertion regression suite against the test server.

2. **Automated Production Deployment (`.github/workflows/deploy.yml`)**:
   - Triggers on push to `main`.
   - Connects securely to the VPS via SSH.
   - Applies Prisma migrations (`prisma migrate deploy`).
   - Builds optimized Docker production containers (`docker-compose.prod.yml`).
   - Performs zero-downtime rolling service restart with automated healthcheck verification.

---

## Documented Assumptions

Key architectural assumptions established in [`docs/decisions.md`](docs/decisions.md):
- **UTC Timezone Semantics**: All reservation start and end timestamps are stored, queried, and compared strictly in UTC to eliminate DST ambiguities and regional offsets.
- **Single SuperAdmin Model**: Exactly one system-wide SuperAdmin account is provisioned via the secure bootstrap script (`seed:superadmin.ts`), protected against public registration, role assignment, and self-demotion.
- **Stateless Cookie Auth**: Stateless JWT tokens are encapsulated within `HttpOnly` cookies without server-side session state for horizontal scalability.
- **Synchronous Approval Transitions**: Reservation status transitions (`PENDING -> CONFIRMED` or `REJECTED`) execute synchronously within atomic database transactions.
- **Strict Payload Whitelisting**: Any unexpected or malicious fields supplied in client request payloads (such as arbitrary role declarations during registration) are explicitly rejected with `400 Bad Request`.