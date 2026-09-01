# Deployment

Exact setup steps for the CI/CD pipeline and the production VPS deployment described in `docs/architecture.md`, "Deployment Architecture". This document is the operational runbook; architectural rationale and alternatives-considered live in `docs/decisions.md`.

## 1. Overview

- **CI** (`.github/workflows/ci.yml`): runs on every pull request into `development` or `main`, and on every push to `development` or `main`. Backend lint/unit/build, backend e2e + Prisma checks against a real PostgreSQL service container, frontend lint/build, and the full Newman/Postman regression suite.
- **CD** (`.github/workflows/deploy.yml`): runs only after CI finishes successfully on `main` (`workflow_run`, gated on `conclusion == 'success'`). Never triggers from `development`, and never runs independently of CI passing first.
- Deployment target: one VPS running the three-service stack in `docker-compose.prod.yml` (PostgreSQL, backend, frontend), built from this repo's own Dockerfiles.

## 2. One-time VPS setup

Do this once, before the first automated deployment:

1. Install Docker Engine and the Docker Compose plugin on the VPS.
2. Create a dedicated, non-root deploy user (e.g. `deploy`) that is a member of the `docker` group (so it can run `docker`/`docker compose` without `sudo`).
3. Generate a **deploy key** dedicated to this repository (`ssh-keygen -t ed25519 -f ~/.ssh/iventure_deploy_key`, run as the `deploy` user) and add its public half as a **read-only Deploy Key** on the GitHub repository (Settings → Deploy keys). This key never leaves the VPS and is never a GitHub Actions secret — it is only used by the VPS itself to `git fetch`/`git checkout` this repository.
4. Clone the repository onto the VPS at whatever path you choose (this becomes `VPS_DEPLOY_PATH`, e.g. `/opt/iventure`), using the deploy key above:
   ```
   git clone git@github.com:<owner>/iventure-shared-equipment-booking.git /opt/iventure
   ```
5. Copy `.env.production.example` to `/opt/iventure/.env.production` and fill in real values (see the comments in that file). This file is git-ignored and stays on the VPS only — it is never committed, never uploaded by CI, and never appears in any GitHub secret.
6. Generate a separate SSH key pair for **GitHub Actions to reach the VPS** (distinct from the repo deploy key above): `ssh-keygen -t ed25519 -f ./actions_deploy_key` (run anywhere convenient, not necessarily on the VPS). Add the public half to the `deploy` user's `~/.ssh/authorized_keys` on the VPS. Add the private half as the `VPS_SSH_PRIVATE_KEY` GitHub secret (see §3).
7. Build the stack once by hand and bootstrap the database, to confirm everything works before the first automated deploy:
   ```
   cd /opt/iventure
   docker compose -f docker-compose.prod.yml --env-file .env.production build
   docker compose -f docker-compose.prod.yml --env-file .env.production run --rm backend npx prisma migrate deploy
   docker compose -f docker-compose.prod.yml --env-file .env.production up -d
   curl -f http://127.0.0.1:3000/health
   ```
8. Bootstrap the single SuperAdmin account (one-time; see `docs/requirements.md`, "SuperAdmin"):
   ```
   docker compose -f docker-compose.prod.yml --env-file .env.production exec backend node dist/scripts/seed-superadmin.js
   ```
   Re-running this later with the same `SUPERADMIN_EMAIL` is safe (idempotent — see `backend/src/scripts/seed-superadmin.ts`).
9. Point a reverse proxy already running on the VPS (Nginx, Caddy, etc. — managed outside this repo) at `127.0.0.1:3000` (backend) and `127.0.0.1:3001` (frontend), and obtain TLS certificates for your domain(s) (e.g. via Certbot/Let's Encrypt). This repo's Docker Compose stack deliberately does not publish these ports to `0.0.0.0` or terminate TLS itself — see `docs/architecture.md`.

## 3. Required GitHub Actions secrets

Set these under the repository's **Settings → Secrets and variables → Actions**. Nothing else is required — application configuration (database credentials, `JWT_SECRET`, the frontend's API base URL, SuperAdmin bootstrap credentials) intentionally lives only in the VPS's own `.env.production`, never here.

| Secret | Purpose |
|---|---|
| `VPS_HOST` | Hostname or IP address of the VPS. |
| `VPS_USER` | The non-root deploy user created in step 2 above. |
| `VPS_SSH_PRIVATE_KEY` | Private half of the Actions-to-VPS key pair from step 6. |
| `VPS_SSH_PORT` | SSH port, if not the default 22 (optional). |
| `VPS_DEPLOY_PATH` | Absolute path to the repo clone on the VPS (e.g. `/opt/iventure`). |

## 4. What the deploy workflow actually does

On every successful CI run on `main`, `.github/workflows/deploy.yml`:

1. Connects to the VPS over SSH using `VPS_SSH_PRIVATE_KEY`.
2. Runs `.github/scripts/deploy-remote.sh` on the VPS (piped over the SSH connection, not copied — see the workflow for why), which:
   - `git fetch`es and checks out the **exact commit SHA** that passed CI (not just "whatever `main` is now" — avoids a race if `main` moves again before the deploy finishes).
   - Builds the backend and frontend images (`docker compose build`).
   - Applies pending migrations against the **newly built** backend image via a one-off container (`docker compose run --rm backend npx prisma migrate deploy`), while the previous containers are still serving traffic.
   - Recreates the backend and frontend containers (`docker compose up -d`).
   - Polls `http://127.0.0.1:3000/health` for up to 60 seconds; fails the deployment (non-zero exit, workflow shows red) if it never returns 200, printing the backend's recent logs.
   - Checks `http://127.0.0.1:3001/` similarly as a frontend smoke test.
3. Any failure at any step — SSH connection, build, migration, or the health/smoke checks — fails the GitHub Actions job. There is no automatic rollback; a failed deploy leaves the previous containers running (they are only recreated in step 2's `up -d`, which itself only runs after a successful build and migration), and an operator resolves it manually (see §5).

## 5. Rolling back

There is no automated rollback in this phase (a single-VPS project of this scope does not warrant a blue/green or image-registry-based rollback pipeline — see `docs/decisions.md`). To roll back manually:

```
ssh <deploy-user>@<vps-host>
cd <VPS_DEPLOY_PATH>
git checkout <previous-good-sha>
docker compose -f docker-compose.prod.yml --env-file .env.production build
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
```

If the failed deploy included a migration that needs reversing, write and apply a new forward migration rather than attempting to un-apply the old one (standard Prisma practice — `prisma migrate deploy` only ever moves forward).

## 6. Running things manually

From `VPS_DEPLOY_PATH`, with `.env.production` present:

- Tail logs: `docker compose -f docker-compose.prod.yml --env-file .env.production logs -f backend` (or `frontend`, or `postgres`).
- One-off migration check: `docker compose -f docker-compose.prod.yml --env-file .env.production run --rm backend npx prisma migrate status`.
- Restart without rebuilding: `docker compose -f docker-compose.prod.yml --env-file .env.production restart backend frontend`.
