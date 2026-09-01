# Architecture

## 1. Architecture Style

The application will use a modular monolith architecture.

The system will have a Next.js frontend and a NestJS backend API. The backend will be organized into domain-oriented modules while remaining a single deployable application.

## 2. High-Level Architecture

```text
Next.js Frontend
       |
       | REST API
       v
NestJS Modular Monolith
       |
     Prisma
       |
       v
PostgreSQL
```

## 3. Frontend

Technology:

* Next.js
* React
* TypeScript

The frontend will provide the employee booking interface and administrator management interface.

## 4. Backend

Technology:

* NestJS
* TypeScript

The backend will expose REST APIs and contain the application's authentication, authorization, validation, and business logic.

Initial modules:

* Auth
* Users
* Equipment
* Reservations

## 5. Database

Technology:

* PostgreSQL
* Prisma ORM

The core domain consists of relational entities such as users, equipment, and reservations.

Reservation timestamps will be stored and compared in UTC. The frontend is responsible for presenting times in the user's local timezone where needed; no multi-timezone business logic is planned.

Prisma's schema DSL cannot express PostgreSQL `EXCLUDE` constraints directly. Where such a constraint is used (see Conflict Prevention), it will be added through a raw-SQL Prisma migration rather than the standard `schema.prisma` syntax.

## 6. Authentication and Authorization

Authentication will identify the current user via a JWT issued at login and stored in an HTTP-only cookie.

Public registration creates Employee accounts only, never assignable a different role through the registration payload. There are three roles, forming a hierarchy: SuperAdmin → Administrator → Employee (see Requirements, "SuperAdmin" and "Role Hierarchy").

* The single SuperAdmin account is provisioned by a dedicated bootstrap script run outside the application (never through an API endpoint).
* Administrator accounts are provisioned either the same way (seeded directly) or, after the SuperAdmin exists, by the SuperAdmin promoting an existing Employee through the user-management API.
* The role-hierarchy grant is additive at the route level (an Administrator-only route also admits SuperAdmin) rather than a general "higher role passes any lower role's check" rule — this keeps Employee-only routes (creating/cancelling a reservation) genuinely Employee-only, not just "not Administrator."

Authorization operates at two levels:

* Role-based access control (RBAC), restricting actions to the Employee, Administrator, or SuperAdmin role as appropriate — including a SUPERADMIN-only Users module (list users, view a user, change an Employee's/Administrator's role) that enforces the role-transition rules in Requirements ("Role Hierarchy") at the API layer, not just in the UI.
* Resource-ownership checks for reservation-specific actions: an Employee may only view or cancel reservations they created. A valid Employee session alone does not grant access to another employee's reservation.

RBAC and resource ownership remain two separate mechanisms: a role granting broader RBAC access (e.g. SuperAdmin) is never, by itself, also an ownership exemption — an exemption still has to be explicitly granted per action, as it already is for Administrators viewing/managing reservations.

The backend will enforce authorization rules rather than relying only on frontend visibility.

### Cross-Origin and Cookie Configuration

The frontend and backend are separate applications communicating over REST, so CORS will be configured explicitly:

* Only the known frontend origin(s) are allowed — never a wildcard origin when credentials are involved.
* Requests are made with credentials enabled so the authentication cookie is sent.

The authentication cookie will be `HttpOnly`, marked `Secure` in production, and given a `SameSite` policy suited to the deployment topology (same-site vs. cross-site) — see Decisions for detail.

### CSRF

CSRF is mitigated primarily through the cookie's `SameSite` attribute. If the eventual deployment requires the frontend and backend to run as genuinely different sites, an explicit CSRF token mechanism will be added rather than relying on `SameSite` alone. See Decisions for the concrete approach.

### JWT Lifecycle

JWTs carry an explicit expiration. Logout clears the authentication cookie. No token revocation infrastructure (e.g. a server-side blocklist) or refresh-token rotation is planned for this assessment.

## 7. Reservation Workflow

The reservation service will:

1. Validate reservation input.
2. Verify the equipment.
3. Validate the requested time range.
4. Check reservation conflicts.
5. Determine initial reservation status:
   - CONFIRMED for equipment that does not require approval.
   - PENDING for equipment that requires administrator approval.
6. Persist the reservation.

Approval-required equipment will use a pending workflow before confirmation.

## 8. Conflict Prevention

The system will prevent overlapping reservations for the same equipment using two layers:

1. An application-level pre-check before creating a reservation, returning a clear validation error for the common case.
2. A PostgreSQL `EXCLUDE` constraint (using the `btree_gist` extension) on the reservations table as the authoritative, database-level guarantee, so overlapping PENDING/CONFIRMED reservations for the same equipment remain impossible even under concurrent requests.

The full constraint design and rationale are documented in Decisions. The exact SQL migration is an implementation detail and is not written here.

The same overlap query backs a second, read-only use: `GET /equipment` accepts an optional requested time window and reports whether each item is available for it (Requirements, "View and search equipment"). This is computed against the reservations table on every request — never a stored field on Equipment — using the identical overlap rule reservation creation enforces, kept in one shared place rather than duplicated between the two.

## 9. Error Handling

The backend will use consistent HTTP error responses and centralized exception handling where appropriate.

Business-rule violations such as reservation conflicts will return appropriate HTTP errors.

A database-level conflict (an `EXCLUDE` constraint violation, for the rare case where a race condition slips past the application-level pre-check) will be caught and translated into the same HTTP 409 Conflict response used for an application-detected conflict, so the API's error behavior is consistent regardless of which layer caught it.

## 10. Architecture Rationale

A modular monolith was selected because the application has several distinct business domains but does not require the operational complexity of microservices.

The architecture keeps domain boundaries clear while remaining simple enough for the assessment's limited scope.

Infrastructure such as Redis, message queues, WebSockets, and microservices is intentionally excluded because it is not required by the current core requirements.

## 11. Deployment Architecture

### CI/CD

GitHub Actions runs two workflows:

* **CI** (`.github/workflows/ci.yml`) — on every pull request into `development` or `main`, and on every push to either branch: backend install/lint/unit-test/build, backend e2e tests and Prisma schema/migration checks against a real PostgreSQL service container, frontend install/lint/build, and the full Newman/Postman regression suite (`postman/`).
* **Deploy** (`.github/workflows/deploy.yml`) — triggers only after CI completes successfully on `main` (a `workflow_run` dependency, not a second independent trigger), so production is never deployed from a state CI hasn't already verified, and `development` is never deployed automatically.

Exact setup steps and required secrets are in `docs/deployment.md`.

### Production topology

Production is one VPS running the three services defined in `docker-compose.prod.yml` — PostgreSQL, the backend, and the frontend — each built from this repo's own `backend/Dockerfile` and `frontend/Dockerfile`. This is a second, production-oriented compose file rather than an extension of the root `docker-compose.yml`, which remains local-development-only (it runs PostgreSQL alone, for use with `npm run start:dev` / `next dev`).

The backend and frontend containers publish only to `127.0.0.1` on the VPS, never to a public interface. A reverse proxy already running on the VPS (Nginx, Caddy, or similar — outside this repo's scope, since it is host-level infrastructure rather than part of the application stack) is expected to terminate TLS and proxy public traffic to those loopback ports. This repo does not manage certificates or reverse-proxy configuration.

### Secrets

GitHub Actions holds only what is needed to reach the VPS over SSH (host, user, private key, deploy path — see `docs/deployment.md`). Every application secret — database credentials, `JWT_SECRET`, the frontend's build-time API base URL, the one-time SuperAdmin bootstrap credentials — lives only in a git-ignored `.env.production` file on the VPS itself (`.env.production.example` documents its shape). GitHub Actions never creates, reads, or transmits that file; the deploy workflow's remote script references it by path on the VPS, the same way an operator running the stack by hand would.

### Deployment sequence and migrations

The deploy workflow checks out the exact commit that passed CI on the VPS, builds new images, then runs `prisma migrate deploy` once via a one-off container (`docker compose run --rm backend ...`) against the newly built backend image — before recreating the running backend/frontend containers. This applies pending migrations while the previous containers are still serving traffic, then cuts over. A post-deploy check polls the backend's `GET /health` endpoint and the frontend's `/` route; the workflow fails (rather than reporting success) if either does not come back healthy.

### Graceful shutdown

`main.ts` calls `app.enableShutdownHooks()` so that a container-level SIGTERM (e.g. `docker compose up -d` recreating the container, or `docker compose stop`) runs NestJS's `OnModuleDestroy` hooks — notably `PrismaService` closing its database connection pool — instead of the process being killed before it can do so.

```