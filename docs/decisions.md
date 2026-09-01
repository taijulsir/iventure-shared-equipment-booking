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

````