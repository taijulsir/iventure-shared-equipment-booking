# iVenture Shared Equipment Booking

Modern enterprise shared equipment booking application built with **Next.js** (App Router), **NestJS**, **Prisma ORM**, and **PostgreSQL**.

---

## Architecture & Documentation

- [Architecture Overview](docs/architecture.md): Modular monolith design, domain modules, database schema, security posture.
- [Production Deployment Runbook](docs/deployment.md): VPS prerequisites, Docker Compose production stack, CI/CD pipeline, migrations, rollback.
- [Key Engineering Decisions](docs/decisions.md): Framework choices, UTC scheduling, conflict prevention, auth lifecycle.

---

## Local Development Setup

### 1. Prerequisites
- **Node.js**: v22 LTS
- **Docker Engine & Docker Compose**: for local PostgreSQL database

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

## Quality Checks & Testing

From the repository root or component directories:

```bash
# Backend checks
cd backend
npm run lint
npm run test           # Unit tests
npm run test:e2e       # E2E tests against PostgreSQL
npm run build

# Frontend checks
cd ../frontend
npm run lint
npm run build

# API Regression Suite (requires running backend + postgres)
cd ../backend
npm run test:api       # Newman / Postman automated suite
```

---

## Production Deployment

Production deployment is automated via GitHub Actions (`.github/workflows/deploy.yml`) deploying to the target VPS via `docker-compose.prod.yml`. Refer to the full [Deployment Runbook](docs/deployment.md) for VPS configuration and zero-downtime migration steps.