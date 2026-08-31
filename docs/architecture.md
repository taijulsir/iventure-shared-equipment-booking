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

Public registration creates Employee accounts only. Administrator accounts are provisioned separately (for example, seeded directly in the database) and are never assignable through the public registration payload.

Authorization operates at two levels:

* Role-based access control (RBAC), restricting actions to the Employee or Administrator role as appropriate.
* Resource-ownership checks for reservation-specific actions: an Employee may only view or cancel reservations they created. A valid Employee session alone does not grant access to another employee's reservation.

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

## 9. Error Handling

The backend will use consistent HTTP error responses and centralized exception handling where appropriate.

Business-rule violations such as reservation conflicts will return appropriate HTTP errors.

A database-level conflict (an `EXCLUDE` constraint violation, for the rare case where a race condition slips past the application-level pre-check) will be caught and translated into the same HTTP 409 Conflict response used for an application-detected conflict, so the API's error behavior is consistent regardless of which layer caught it.

## 10. Architecture Rationale

A modular monolith was selected because the application has several distinct business domains but does not require the operational complexity of microservices.

The architecture keeps domain boundaries clear while remaining simple enough for the assessment's limited scope.

Infrastructure such as Redis, message queues, WebSockets, and microservices is intentionally excluded because it is not required by the current core requirements.

```