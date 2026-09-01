# Technical Decisions

## 1. Architecture Style — Modular Monolith

### Context

The application has several distinct business domains, including authentication, users, equipment and reservations. However, the assessment is intentionally small and has an expected effort of approximately 4–6 hours.

### Options Considered

- Simple monolith without explicit module boundaries
- Modular monolith
- Microservices

### Decision

Use a modular monolith architecture.

The backend will remain a single deployable application while separating business domains into independent NestJS modules.

Initial modules:

- Auth
- Users
- Equipment
- Reservations

### Why

A modular monolith provides clear domain boundaries and maintainable code without introducing the operational complexity of a distributed system.

### Why Not Microservices

Microservices would introduce additional complexity such as:

- Service-to-service communication
- Distributed failure handling
- Multiple deployments
- Distributed debugging
- Service configuration
- Additional infrastructure

The current assessment does not require independent service scaling or distributed architecture.

Therefore, microservices would be unnecessary for the current scope.

---

## 2. Frontend — Next.js

### Context

The application requires a modern web frontend for employee reservations and administrator management.

### Options Considered

- React with Vite
- Next.js

### Decision

Use Next.js with React and TypeScript.

### Why

Next.js provides a structured React application environment with routing and application-level capabilities while keeping the frontend within the React ecosystem.

It also leaves room for future server-side capabilities if the application evolves.

### Why Not React + Vite

React with Vite would also be technically sufficient for this application.

The decision to use Next.js is based on its application-level structure and flexibility rather than because Vite would be unsuitable.

---

## 3. Backend — NestJS

### Context

The backend needs to handle:

- Authentication
- Authorization
- Server-side validation
- Equipment management
- Reservation management
- Reservation business rules

### Options Considered

- Express.js
- NestJS

### Decision

Use NestJS with TypeScript.

### Why

NestJS provides structured patterns for:

- Modules
- Controllers
- Providers
- Dependency injection
- Guards
- Pipes
- Exception handling

These patterns fit the application's domain-oriented backend structure.

### Why Not Express.js

Express.js is fully capable of implementing this application.

However, Express provides fewer architectural conventions out of the box. NestJS provides stronger structure for organizing multiple domains and cross-cutting concerns such as authentication, authorization and validation.

---

## 4. Database — PostgreSQL

### Context

The core domain contains relationships between users, equipment and reservations.

The application must also prevent overlapping reservations for the same equipment.

### Options Considered

- PostgreSQL
- MongoDB

### Decision

Use PostgreSQL as the persistent database.

### Why

The core entities are naturally relational:

```text
User
  |
  | creates
  v
Reservation
  |
  | belongs to
  v
Equipment
````

PostgreSQL provides:

* Foreign keys
* Constraints
* Transactions
* Indexes
* Strong relational consistency

These capabilities are useful for enforcing reservation-related business rules reliably.

### Why Not MongoDB

MongoDB could technically support the application.

However, the core domain is strongly relational and contains relationships and consistency requirements that fit naturally into a relational database model.

PostgreSQL is therefore the more appropriate choice for this application.

---

## 5. ORM — Prisma

### Context

The backend is implemented using TypeScript and requires database schema management and application-level database access.

### Options Considered

* Prisma
* TypeORM
* Raw SQL

### Decision

Use Prisma ORM with PostgreSQL.

### Why

Prisma provides:

* Type-safe database access
* TypeScript integration
* Schema-based data modeling
* Database migrations
* A developer-friendly database client

This allows the database layer to remain strongly typed and maintainable.

### Why Not TypeORM

TypeORM is also a valid option for NestJS and PostgreSQL.

Prisma was selected because its type-safe client and schema-driven workflow are well suited to the scope and implementation speed required for this assessment.

### Why Not Raw SQL

Raw SQL provides maximum control but would require more manual type mapping and database access code.

For this assessment, Prisma provides a better balance between control, safety and development speed.

---

## 6. Authentication Strategy

### Context

The system requires user registration and login with two roles:

* Employee
* Administrator

### Decision

Use credential-based authentication with hashed passwords and JWT-based authentication.

The JWT will be stored in an HTTP-only cookie.

### Password Storage

Passwords will never be stored in plaintext.

The flow will be:

```text
Plain Password
      |
      v
Password Hashing
      |
      v
Database
```

A suitable password hashing algorithm such as Argon2 or bcrypt will be used.

### Authentication Flow

```text
Login Request
     |
     v
Validate Credentials
     |
     v
Verify Password Hash
     |
     v
Generate JWT
     |
     v
Set HTTP-only Cookie
     |
     v
Authenticated Requests
```

### Why JWT

JWT provides a straightforward way to represent authenticated user identity in API requests.

It also fits the stateless backend architecture.

### Why HTTP-only Cookie

An HTTP-only cookie prevents client-side JavaScript from directly reading the authentication token.

This reduces the impact of some token-extraction scenarios involving client-side script execution.

Cookie-based authentication must still be combined with appropriate CSRF protection (see below).

### Cookie Configuration

The authentication cookie will be:

* `HttpOnly` — not readable by client-side JavaScript
* `Secure` in production — only sent over HTTPS
* Given a `SameSite` policy appropriate to the deployment topology

There is no single `SameSite` value that is correct for every deployment. If the frontend and backend are deployed same-site (e.g. same top-level domain, or reached through a shared reverse proxy), `SameSite=Lax` or `Strict` is appropriate. If they are deployed as genuinely different sites, `SameSite=None` combined with `Secure` is required for the cookie to be sent at all, which shifts more weight onto explicit CSRF protection.

### CORS

Because the frontend and backend are separate applications, CORS will be configured with:

* An explicit allow-listed frontend origin — never a wildcard origin
* `credentials: true`, since the cookie must be sent cross-origin

The exact origin value(s) are environment-specific (local development vs. deployed) and are not hardcoded here, since a production domain has not yet been established.

### CSRF Mitigation

CSRF is not left as an open question to resolve during implementation. The baseline mitigation is the cookie's `SameSite` attribute:

* If the deployment keeps frontend and backend same-site, `SameSite=Lax`/`Strict` alone provides meaningful CSRF protection for this application's request shape.
* If the deployment requires cross-site cookies (`SameSite=None`), an explicit CSRF token mechanism (e.g. a double-submit token validated on state-changing requests) will be added.

No general-purpose CSRF framework is introduced; the mechanism is scoped to what the actual deployment topology requires.

### JWT Lifecycle

* JWTs are issued with an explicit expiration at login.
* Logout clears the authentication cookie.
* No refresh-token rotation or server-side token revocation/blocklist infrastructure is planned for this assessment. This could be reconsidered if a real product requirement later demanded immediate revocation, but it is not required for the current scope.

### Other Security Considerations

Authentication implementation must also consider:

* Password hashing
* Input validation
* Authentication error handling

---

## 7. Authorization — Role-Based Access Control

### Context

The application has two roles:

* Employee
* Administrator

Authentication alone is not sufficient because different users have different permissions.

### Decision

Use role-based authorization enforced by the backend.

### Authentication vs Authorization

Authentication answers:

> Who is the user?

Authorization answers:

> What is the user allowed to do?

### Example

```text
Employee
  |
  +-- View equipment
  +-- Create reservation
  +-- View own reservations
  +-- Cancel own upcoming reservation

Administrator
  |
  +-- Manage equipment
  +-- View all reservations
  +-- Manage approval-required reservations
```

The backend will enforce these permissions rather than relying only on frontend UI visibility.

### Role-Based Access vs Resource Ownership

Role checks answer "what can this role do in general," not "does this specific resource belong to this user." Both checks are required and must not be confused:

* Role check — is the requester an Employee or Administrator?
* Ownership check — for Employee-scoped reservation actions (view own reservations, cancel own reservation), does the requested reservation belong to the requesting user?

A valid Employee session must never be sufficient, by itself, to view or cancel another employee's reservation. A reservation ID is not treated as a capability token; ownership is verified server-side on every request.

Administrators are not subject to this ownership restriction for the actions explicitly granted to them (viewing all reservations, managing approval-required reservations).

### Administrator Account Provisioning

Public registration creates Employee accounts only. The registration endpoint must not accept a client-controlled role field that could self-assign the Administrator role.

Administrator accounts are provisioned separately — for example, seeded directly in the database or created by an existing Administrator — outside the public registration flow. This avoids a straightforward privilege-escalation path where a user could grant themselves Administrator access at signup.

### SuperAdmin Role and User Management

A third role, SuperAdmin, sits above Administrator:

```text
SuperAdmin
  |
  +-- Everything an Administrator can do
  +-- List/view every user account
  +-- Promote an Employee to Administrator
  +-- Demote an Administrator to Employee
```

Exactly one SuperAdmin account is expected to exist system-wide. It is never created through public registration (the registration DTO has no role field at all) and never created through the user-management role-change endpoint (its DTO only accepts `EMPLOYEE`/`ADMIN` as a target role — `SUPERADMIN` is not a representable value there). The only way a SuperAdmin account comes to exist is the dedicated bootstrap script (`backend/src/scripts/seed-superadmin.ts`), which itself refuses to create a second one if a SuperAdmin with a different email already exists.

The hierarchy is additive, not a numeric-rank comparison in the authorization guard: existing Administrator-only routes (Equipment writes, reservation approve/reject) were extended to also accept SUPERADMIN. This was a deliberate choice over rewriting the role check as "rank >= required rank" — a rank-based check would also have let Administrators through Employee-only routes (reservation create/cancel), which is not a capability Administrators are meant to have (see above). Employee-only routes were left untouched.

Role changes are restricted to specific, validated transitions rather than accepting an arbitrary target role:

* Valid: Employee → Administrator, Administrator → Employee.
* Never valid: assigning SUPERADMIN to anyone; changing the SuperAdmin's own role, by itself or anyone else, through this endpoint; a user changing their own role.

Resource ownership (`OwnershipService`) is unaffected by this role — SuperAdmin is not added to any ownership-exemption list. Role authorization and resource ownership remain separate concepts, per "Role-Based Access vs Resource Ownership" above.

---

## 8. Reservation Overlap Protection

### Context

The assessment requires the system to prevent overlapping reservations for the same equipment.

### Options Considered

* Application-level conflict checking only
* Transaction and locking strategies
* PostgreSQL database-level constraint mechanisms

### Problem With Application-Only Validation

A simple application-level check could look like:

```text
Check existing reservations
        |
        v
If conflict -> reject
Otherwise -> create
```

However, concurrent requests can create a race condition:

```text
Request A -> Check -> Available
Request B -> Check -> Available

Request A -> Insert
Request B -> Insert

Result -> Conflicting reservations
```

Therefore, application-level validation alone may not be sufficient for strong concurrency protection.

### Decision

Use a two-layer approach:

1. **Application-level pre-check** — before creating a reservation, the service checks for conflicting PENDING/CONFIRMED reservations for the same equipment and returns a clear validation error if one exists. This covers the common case and gives users a good error message.
2. **Database-level guarantee** — a PostgreSQL `EXCLUDE` constraint, using the `btree_gist` extension, on the reservations table:

```text
EXCLUDE USING GIST (
  equipment_id WITH =,
  tsrange(start_time, end_time) WITH &&
)
WHERE (status IN ('PENDING', 'CONFIRMED'))
```

This constraint makes overlapping PENDING/CONFIRMED reservations for the same equipment impossible at the database level, independent of application-level races. REJECTED and CANCELLED reservations are excluded from the constraint via the `WHERE` clause, consistent with the Reservation Status Model's slot-blocking rule.

The exact SQL migration is an implementation detail and is not written here. Because Prisma's schema DSL cannot express `EXCLUDE` constraints, this will be added via a raw-SQL Prisma migration rather than the standard `schema.prisma` syntax.

A database-level exclusion violation (the rare case where a race condition slips past the application-level pre-check) will be caught and translated into the same HTTP 409 Conflict response used for an application-detected conflict.

### Why Not Locking or Queuing Alone

A `SELECT ... FOR UPDATE` row-lock strategy could also serialize reservation creation per equipment, but it requires every code path that creates a reservation to remember to acquire the lock correctly, and is easier to get wrong than a declarative database constraint. A queue-based serialization approach (e.g. via Redis/BullMQ) would solve the same problem but introduces infrastructure not otherwise required by this assessment (see Redis and BullMQ below). The `EXCLUDE` constraint achieves the same correctness guarantee declaratively, with no additional infrastructure.

### Overlap Rule

Two reservations overlap when:

```text
newStart < existingEnd
AND
newEnd > existingStart
```

Therefore:

```text
10:00 - 12:00
12:00 - 14:00
```

do not overlap.

Whereas:

```text
10:00 - 12:00
11:00 - 13:00
```

overlap.

---

## 9. Reservation Status Model

### Context

Some equipment requires administrator approval before a reservation is confirmed.

### Decision

Use the following reservation statuses:

* PENDING
* CONFIRMED
* REJECTED
* CANCELLED

### Workflow

For equipment that does not require approval:

```text
Reservation Request
        |
        v
   CONFIRMED
```

For equipment that requires approval:

```text
Reservation Request
        |
        v
     PENDING
      /    \
     /      \
Approve    Reject
   |          |
   v          v
CONFIRMED   REJECTED
```

An employee can cancel an upcoming reservation:

```text
PENDING / CONFIRMED
        |
        v
    CANCELLED
```

### Slot Blocking Rule

For conflict detection:

* PENDING reservations block the requested time slot.
* CONFIRMED reservations block the requested time slot.
* REJECTED reservations do not block the time slot.
* CANCELLED reservations do not block the time slot.

This prevents multiple users from holding the same equipment slot while an approval decision is pending.

---

## 10. Definition of Upcoming Reservation

### Context

Employees are required to cancel an upcoming reservation.

The assessment does not define the exact meaning of "upcoming", so this is a documented implementation assumption.

### Decision

A reservation is considered upcoming when:

```text
reservation.startTime > currentTime
```

An employee cannot cancel a reservation that has already started.

---

## 11. Reservation Timestamp Timezone

### Context

Reservation overlap detection and "upcoming" determination both depend on comparing timestamps consistently.

### Decision

Reservation timestamps (`start_time`, `end_time`, and comparisons against the current time) are stored and compared in UTC.

The frontend is responsible for presenting times in the user's local timezone; no multi-timezone business logic (e.g. per-equipment timezone, daylight-saving-aware scheduling) is implemented, as the assessment does not require it.

---

## 12. Redis and BullMQ

### Decision

Redis and BullMQ will not be included in the initial implementation.

### Why

The current assessment does not require:

* Distributed caching
* Background job processing
* Delayed jobs
* Asynchronous notification processing
* Queue-based workflows

The core application can operate using PostgreSQL and the NestJS backend without introducing additional infrastructure.

### Why Not Add Redis Proactively

Adding infrastructure without a demonstrated requirement increases:

* Deployment complexity
* Configuration complexity
* Operational overhead
* Debugging surface

If future requirements introduce caching, rate limiting or background processing, Redis can be added based on the actual use case.

---

## 13. WebSockets / Realtime Communication

### Decision

WebSockets will not be included in the initial implementation.

### Why

The assessment does not specify realtime communication requirements.

The core workflows can be implemented using standard REST APIs:

* Authentication
* Equipment browsing
* Reservation creation
* Reservation management
* Equipment management

### Future Use Case

WebSockets could be introduced later if the product requires:

* Realtime reservation status updates
* Live administrator dashboards
* Instant notifications
* Other realtime interactions

Until such a requirement exists, REST keeps the system simpler.

---

## 14. Scope and Over-Engineering

### Decision

The implementation will prioritize complete, sensible core functionality rather than unnecessary infrastructure or visual complexity.

The following will not be introduced unless a concrete requirement justifies them:

* Microservices
* Redis
* BullMQ
* WebSockets
* Kubernetes
* Elasticsearch
* Complex analytics infrastructure
* Login rate limiting / brute-force protection
* Other infrastructure unrelated to the core booking workflow

Login rate limiting is called out explicitly because it is a reasonable security feature to wonder about; it is out of scope for this assessment rather than an oversight, and can be added later if a real deployment required it.

### Rationale

The assessment explicitly states that a production-ready system is not expected and that a complete, sensible working solution should be prioritized over unnecessary features or excessive visual polish.

Therefore, technical complexity will be introduced only when it solves a real requirement.

---

## 15. Decision Review Principle

All architectural decisions should remain aligned with the actual assessment requirements.

The implementation should prefer:

1. Correctness
2. Security
3. Data consistency
4. Maintainability
5. Simplicity
6. Appropriate scalability

over unnecessary complexity.

Any future architectural change should be justified by a concrete requirement or discovered technical constraint.

---

## 16. List Endpoint Pagination and Filtering Consistency

### Context

Equipment listing (`GET /equipment`) already supported `search`/`page`/`limit`, returning `{ data, meta }`. Reservation listing (`GET /reservations`) predated that convention and returned a bare array with no filtering or pagination, which the frontend needed once it moved from static/placeholder screens to a real, filterable Admin reservations view.

### Decision

`GET /reservations` now accepts `status`, `equipmentId`, `page`, and `limit` query parameters (validated via a DTO, same as Equipment's `ListEquipmentDto`) and returns the same `{ data, meta }` envelope as `GET /equipment`, rather than inventing a second list-response shape.

`status`/`equipmentId` narrow the result set on top of the existing ownership scope (an Employee's own reservations, or every reservation for an Administrator/SuperAdmin) — they can never widen it. An Employee filtering by another user's data still only ever searches within their own reservations.

`GET /users` (SUPERADMIN-only) was deliberately left unpaginated: it is an internal administrative listing expected to stay small, not a public catalogue, and pagination/filtering was not required to make the existing User Management UI functional.

### Consequence

This is a breaking change to `GET /reservations`'s response shape (bare array -> `{ data, meta }`). There was no external consumer other than this project's own frontend and Postman collection, both updated in the same change; there is no versioned public API contract to preserve here.

### Rationale

One consistent pagination envelope across every list endpoint is easier for the frontend (and any future API consumer) to work with than one endpoint returning a bare array and another returning an envelope. `PaginationMeta`/`PaginatedResult<T>` were moved to a shared module (`backend/src/common/pagination.ts`) once a second module needed them, rather than duplicated per module or kept in Equipment's own `types.ts` for Reservations to reach into.

## 17. SuperAdmin Reservation Visibility

While integrating the Admin reservations view, `ReservationService` was found to still gate "view all reservations" and "view any reservation by id" on `Role.ADMIN` alone, from before the SuperAdmin role existed. A SuperAdmin session hitting `GET /reservations` saw only their own (typically empty) list instead of every reservation, unlike every other Administrator-level capability, which already followed the SUPERADMIN -> ADMIN -> EMPLOYEE hierarchy (see section 7, "SuperAdmin Role and User Management"). Both checks now also include `Role.SUPERADMIN`, consistent with the rest of the hierarchy. This does not change any Employee-facing behavior and does not touch reservation creation/cancellation, which remain Employee-only exactly as before.

---

## 18. Equipment Availability by Requested Time Window

### Context

`docs/requirements.md` documents equipment search as "availability is determined by the requested time window against existing reservations, not a static equipment flag" — but `GET /equipment` only ever did a text search over name/description; there was no way to ask "is this available for the time I actually want it."

### Decision

`GET /equipment` accepts an optional `startTime`/`endTime` pair (both required together — one without the other, or an inverted range, is a 400). When present, every item in the response is annotated with `available: boolean`; when absent, `available` is `null` (not computed, not a default `true`/`false`). This is never a stored column on Equipment — it's computed fresh on every request, against whichever exact window was asked about, which is the only way "availability" can mean anything for a shared resource with a booking calendar rather than a single on/off state.

The overlap check itself — `newStart < existingEnd AND newEnd > existingStart` against PENDING/CONFIRMED reservations — is not reimplemented for this. It was extracted from `ReservationService`'s existing conflict check into `backend/src/common/reservation-overlap.ts` (`overlappingReservationWhere`), a plain function (not a service, not a cross-module dependency) that both `ReservationService` and `EquipmentService` call against their own already-injected `PrismaService`. Equipment does not need to depend on the Reservation module (or vice versa) to share a WHERE-clause shape.

For a page of equipment, availability is computed with one batched query (`equipmentId: { in: [...] }`) rather than one query per item, avoiding an N+1 pattern for what is otherwise a page of up to 100 rows.

### Consequence

Every `GET /equipment` list item now carries an `available` field it didn't before. This is additive (existing clients ignoring the field are unaffected) and was reused by the frontend catalogue and, indirectly, motivated the `ids` filter in decision 19 below.

## 19. Equipment `ids` Filter

`GET /equipment` also accepts a repeated `ids` query parameter (`?ids=a&ids=b`, capped at 100 like `limit`), returning exactly that set — bypassing search and defaulting `limit` to the set's size rather than the usual page size, so the caller never has to separately compute a matching limit. This exists so a caller that already knows which specific equipment it needs (chiefly: resolving equipment names for a page of reservations, one id per reservation row) doesn't have to either fetch the entire catalogue with an arbitrary cap (silently wrong once the catalogue outgrows it) or make one request per id (N+1). It composes with `search` (both narrow the same query) but not meaningfully with pagination beyond the size-matching default described above.

## 20. Removal of `_authz-demo` Test Scaffolding

`AuthorizationDemoModule`/`AuthorizationDemoController` (`/_authz-demo/*`) existed only to exercise `RolesGuard`, `@Roles`, and `OwnershipService` against real HTTP requests before Equipment or Reservations existed for them to protect — its own code comments said as much from the start, along with "remove once a real ownership-checked route exists." That has been true since Reservations shipped; the module and its dedicated `test/authorization.e2e-spec.ts` have now been removed, along with the (never-populated) reference to it in the Postman collection/README.

Every scenario that suite covered has a real-route equivalent that already existed elsewhere before this removal: 401-before-403 and invalid-token handling (`auth.e2e-spec.ts`, and every other suite's unauthenticated-request cases), an Administrator-only route granting/denying by role (Equipment create, `equipment.e2e-spec.ts`), an Employee-only route doing the same (Reservation create, `reservation.e2e-spec.ts`), and ownership (an Employee reading their own vs. another's reservation, and an Administrator/SuperAdmin's documented exemption from it, all in `reservation.e2e-spec.ts`). Nothing was deleted without a like-for-like real-route test already covering it.

## 21. CI/CD Pipeline and VPS Deployment

### Context

The project had no automated CI or deployment path: tests, lint, and Postman regressions were only ever run by hand, and there was no Dockerfile, production Compose file, or documented deployment procedure. `docs/requirements.md`'s submission expectations prefer a deployed version, and the project already had a working `docker-compose.yml` (PostgreSQL only) and a hand-authored Postman/Newman suite to build on.

### Decision: GitHub Actions, two workflows

CI (`.github/workflows/ci.yml`) runs on pull requests into `development`/`main` and on pushes to either. It reuses the project's own scripts exactly as documented in each package's `package.json` (`lint`, `test`, `test:e2e`, `build`, `test:api`) rather than reimplementing any check inline in the workflow — the goal was automation of existing conventions, not a parallel set of CI-only checks.

Deploy (`.github/workflows/deploy.yml`) is a separate workflow triggered by `workflow_run` on CI's completion, filtered to `main` and `conclusion == 'success'`. This was chosen over a single combined workflow so the "CI → deploy, only on main, only if CI passed" dependency is structural (a second workflow that literally cannot start until the first reports success) rather than enforced by an `if:` condition inside one large workflow, which is easier to accidentally weaken later.

### Decision: build on the VPS over SSH, not a container registry

Deploying pushes no image to a registry (GHCR, Docker Hub, ...); instead, the deploy workflow SSHes into the VPS and has it `git fetch`/`checkout` the deployed commit and run `docker compose build` locally. For a single-VPS project of this scope, a registry adds a moving part (auth, storage, image pruning) without a benefit a single always-on host actually needs — image pull speed and multi-host distribution, the two things a registry is for, aren't relevant here. If the project ever needs to deploy to more than one host, revisit this.

### Decision: secrets stay off GitHub entirely where possible

GitHub Actions secrets are limited to what is needed to reach the VPS (`VPS_HOST`, `VPS_USER`, `VPS_SSH_PRIVATE_KEY`, `VPS_SSH_PORT`, `VPS_DEPLOY_PATH`). Every application secret — database credentials, `JWT_SECRET`, the frontend's build-time API base URL, the SuperAdmin bootstrap credentials — lives only in `.env.production` on the VPS itself, read locally by `docker compose` there. GitHub never creates, stores, or transmits that file. This was chosen deliberately over injecting application secrets as GitHub secrets and passing them over SSH: it minimizes what a compromised GitHub Actions run (or a leaked Actions secret) could expose, and it means rotating an application secret never requires touching GitHub at all. The VPS's own repository access, in turn, uses a separate, read-only Deploy Key that never leaves the VPS and is never a GitHub secret either — see `docs/deployment.md`, "One-time VPS setup".

### Decision: migrate-then-cutover, no automated rollback

`prisma migrate deploy` runs once via `docker compose run --rm backend ...` — a one-off container from the newly built image — before `docker compose up -d` recreates the running backend/frontend containers. This applies the migration while the previous containers are still serving traffic, then cuts over, rather than migrating inside the same container that's about to restart. There is no automated rollback: a failed health/smoke check fails the workflow loudly (see `docs/deployment.md`, "Rolling back" for the manual procedure) rather than attempting to automatically revert containers or migrations. Building that safely (especially un-applying a migration) is a meaningfully larger undertaking than this project's scope calls for; a clear failure an operator responds to was judged the better trade-off than a partially-automated rollback that could itself fail silently.

### Decision: Docker base images and `postinstall`

Both `backend/Dockerfile` and `frontend/Dockerfile` use `node:22-bookworm-slim` rather than an Alpine base. Two dependencies in this stack — `bcrypt` (backend, native bindings) and `@tailwindcss/postcss`'s Rust engine (frontend) — are most reliably prebuilt against glibc; Alpine's musl libc occasionally lacks a matching prebuild and silently falls back to a slower, less deterministic source compile. Debian-slim avoids that risk for a modest image-size cost, which matters more here than shaving the last few megabytes off a single-VPS deployment.

Separately, `backend/package.json` gained a `postinstall: prisma generate` script, which did not exist before. Its absence was a real gap once builds needed to happen non-interactively (Docker, CI) rather than by a developer who already knows to run `npx prisma generate` manually — without it, a clean `npm ci` leaves the generated client missing entirely.

### Consequence

A push to `main` that passes CI deploys itself, end-to-end, with a real health check gating success — with no GitHub secret ever holding a database password, JWT signing secret, or any other application credential.

---

## 22. Lightweight Backend Application Logging

### Context

Production troubleshooting and container operations on a VPS require visible, structured logs on `stdout`/`stderr` without introducing heavyweight external logging aggregators (such as Winston, Pino, ELK, or Grafana Loki) that exceed the scope of a single-VPS application.

### Decision

Use NestJS's built-in `Logger` across three coordinated layers:

1. **HTTP Request Logging Middleware (`LoggingMiddleware`)**:
   - Logs method, URL path, HTTP status code, and response duration in ms (e.g. `POST /reservations 201 - 24ms`).
   - Suppresses routine `/health` check polling to prevent log clutter.
   - Categorizes outputs by status (informational for 2xx/3xx, warning for 4xx, error for 5xx).

2. **Global Exception Filter (`AllExceptionsFilter`)**:
   - Catches unexpected unhandled server errors (5xx) and logs full error messages and stack traces to `stderr` with context (`ExceptionsHandler`).
   - Preserves standard NestJS HTTP error envelopes for `HttpException` without leaking internal stack traces to API clients.

3. **Domain & Security Event Logging**:
   - Authentication events: successful employee registration, successful user logins (with role), and failed login attempts (normalized email).
   - Privilege & Governance: SuperAdmin role updates and demotion attempts.
   - Booking lifecycle: reservation creation, approval, rejection, cancellation, and concurrency conflict warnings.

### Sensitive Data Protection Rules

Logs strictly exclude:
- Passwords and raw login credentials
- Password hashes
- JWT tokens and session cookies
- `Authorization` and `Cookie` headers
- `DATABASE_URL` and database passwords
- Full request bodies or personally identifiable bulk payloads

---

## 23. Login Rate Limiting Reversal and Trusted Proxy Configuration

### Context

Decision 14 ("Scope and Over-Engineering") explicitly named login rate limiting as out of scope: "it is out of scope for this assessment rather than an oversight, and can be added later if a real deployment required it." That condition has now been met — the application is deployed as a real, internet-facing production service (see README, "Live Deployment"; `docs/architecture.md`, "Deployment Architecture"), reachable by anyone, not just an assessment reviewer running it locally. An unthrottled `POST /auth/login` on a public URL is a real credential-stuffing/brute-force surface that did not exist while the project only ran locally.

### Decision

Reverse the exclusion in decision 14 for this one item only. Add `LoginThrottlerGuard`, an in-memory, IP-keyed sliding-window limiter (20 attempts / 60 seconds) on `POST /auth/login`. Every other item decision 14 excludes (Redis, BullMQ, WebSockets, microservices, Kubernetes, Elasticsearch, analytics infrastructure) remains excluded — this reversal is scoped to login rate limiting specifically, not a general reopening of that decision.

### Why in-memory / single-instance, not Redis

The production topology (decision 21; `docs/architecture.md`, "Production topology") is a single VPS running one backend container — there is no horizontal scaling, load balancer, or multi-instance deployment for this assessment's scope, so there is no second process for an in-memory Map to be inconsistent with. Introducing Redis solely to back a single process's rate-limit counters would add exactly the operational complexity (deployment, configuration, another container, another failure mode) that decision 12 already rejected for this project, without a concrete multi-instance requirement to justify it. If the deployment ever becomes multi-instance, this is the concrete trigger to revisit decision 12 and move the limiter's state to Redis — not before.

### Trusted reverse-proxy IP handling

A naive implementation keyed on a client-supplied `X-Forwarded-For` header is not a rate limiter at all — a client can reset its own bucket on every request simply by sending a different header value. Correct IP attribution requires knowing, structurally, how many reverse-proxy hops sit in front of the application:

* **Production** (`Internet -> Nginx -> Docker backend`, one hop): `backend/src/main.ts` calls `app.set('trust proxy', 1)`, but only when `NODE_ENV=production`. Express then resolves `request.ip` by trusting exactly the one hop it is directly connected to (the VPS's Nginx) and using the address that hop reports, never a client-supplied prefix ahead of it. This requires Nginx itself to report the real client address rather than passing through client input — `docs/deployment.md` (§2, step 9) now documents the required directive: `proxy_set_header X-Forwarded-For $remote_addr;` (overwrite, not the common append-with-`$proxy_add_x_forwarded_for` form), so the header Express sees is never attacker-influenced in the first place. The two are deliberately layered: Nginx sanitizing the header and Express trusting only one hop are each independently sufficient, so a mistake in either alone does not reopen the bypass.
* **Everywhere else** (local dev, CI, e2e tests): `trust proxy` is left at its default (`false`) because there genuinely is no reverse proxy in front of the app in these environments. Express then ignores `X-Forwarded-For` entirely and `request.ip` is the raw socket address of whoever actually connected — still not spoofable by a header.
* `LoginThrottlerGuard` itself never reads `X-Forwarded-For` (or any other header) directly; it only ever reads `request.ip`, delegating all proxy-trust logic to Express's own well-tested resolution rather than reimplementing it. This was a deliberate simplification over hand-parsing the header, precisely because a hand-rolled parse (taking the first comma-separated value, as an earlier version of this guard did) trusts client input unconditionally and is the bypass this decision exists to close.

### Why not the general RBAC/ownership/reservation surface

This reversal is scoped narrowly to `POST /auth/login`. It does not extend to registration, reservation endpoints, or any other route — none of those were flagged as needing it, and decision 14's general preference against unrequested infrastructure still applies everywhere else.