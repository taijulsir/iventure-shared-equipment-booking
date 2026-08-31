# Postman API Testing — iVenture Shared Equipment Booking

A complete, importable Postman collection and environment covering every
currently implemented backend endpoint (Health, Authentication, Equipment,
Reservations, and the Approval workflow), plus a Newman-based regression
suite you can run from the command line.

```
postman/
  collections/
    iventure-api.postman_collection.json
  environments/
    iventure-local.postman_environment.json
  README.md   <- you are here
```

## Prerequisites

- Node.js and npm (already required to run the backend)
- Docker (for PostgreSQL)
- Postman desktop app (optional — only needed if you want to run requests
  interactively rather than via Newman)

## 1. Start PostgreSQL

From the repository root:

```
docker compose up -d
```

Confirm it's healthy:

```
docker compose ps
```

## 2. Start the backend

```
cd backend
npm install
cp .env.example .env   # if you haven't already; adjust DATABASE_URL's port
                        # if 5432 was already taken locally — see backend/.env.example
npm run build
npm run start:prod
```

(`npm run start:dev` also works for interactive use.) The API listens on
`http://localhost:3000` by default (`PORT` in `backend/.env`).

## 3. Seed an Administrator account

Public registration **cannot** create an Administrator account — this is a
deliberate security decision (docs/decisions.md, "Administrator Account
Provisioning"), not a gap. Every Admin-only request in this collection
(Equipment writes, reservation approve/reject, "view all reservations")
requires a real Administrator account to already exist in the database.

Run this once per database:

```
cd backend
npm run seed:admin
```

This creates (or updates) exactly one Administrator account matching the
`adminEmail` / `adminPassword` values already committed in
`iventure-local.postman_environment.json` (`admin@iventure.local` /
`PostmanAdmin!2026` — placeholders, not real credentials). It's idempotent —
safe to run again any time (it upserts, not inserts).

If you want different admin credentials, override them and update the
Postman environment to match:

```
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='Something!Long' npm run seed:admin
```

## 4. Import into Postman (optional, for interactive use)

1. Postman → **Import** → select `postman/collections/iventure-api.postman_collection.json`.
2. Postman → **Import** → select `postman/environments/iventure-local.postman_environment.json`.
3. Select the **iVenture Local** environment from the environment dropdown (top right) before sending any request.
4. Run requests folder by folder, top to bottom (`1. Health` → `2. Authentication` → `3. Equipment` → `4. Reservations` → `5. Approval Workflow`) — later requests depend on variables captured earlier in the same run (see "How request chaining works" below).

## 5. Run the full suite with Newman

```
cd backend
npm run test:api
```

This runs:

```
newman run ../postman/collections/iventure-api.postman_collection.json \
  -e ../postman/environments/iventure-local.postman_environment.json
```

Expected output: **68 requests, 104 assertions, 0 failures** (assuming the
Admin account has been seeded — see step 3). The run is deterministic and
safe to repeat: every run generates its own timestamp-based `runId` and
registers fresh, uniquely-emailed test users, so back-to-back runs never
collide with each other's data.

## How authentication works (read this before editing the collection)

The API's real authentication mechanism is a JWT stored in an **HttpOnly
cookie** named `auth_token` (`docs/decisions.md`). There is **no**
`Authorization` header anywhere in this API, and this collection does not
invent one — every request relies on the cookie exactly as the real
frontend would.

This creates one real complication: Postman/Newman's built-in cookie jar
holds **one** value per cookie name per domain. This collection deliberately
logs in three different users (Employee A, Employee B, and an Administrator)
to test ownership and RBAC boundaries — if each login just overwrote the
same jar slot, later requests could only ever act as whichever user logged
in most recently.

The fix used throughout this collection:

1. Each **Login** request's Test script reads the cookie the server just set
   (`pm.cookies.get('auth_token')`) and saves it into its own environment
   variable (`employeeAToken`, `employeeBToken`, `adminToken`, ...).
2. Every subsequent request that must act **as a specific user** has a
   pre-request script that explicitly re-selects that user's token into the
   shared cookie jar right before sending:
   ```js
   pm.cookies.jar().set(pm.variables.get('baseUrl'), 'auth_token', pm.variables.get('employeeAToken'), function (err) { ... });
   ```
   This is Postman's own documented API for managing the cookie jar
   programmatically — it is not a workaround that weakens or bypasses the
   application's real cookie-based auth; it just lets one HTTP client
   simulate three separate browser sessions.
3. Requests that test **unauthenticated** access explicitly clear the jar
   first (`pm.cookies.jar().unset(...)`), and the one request that tests an
   **invalid token** explicitly sets a garbage value, so neither is
   accidentally still carrying a previous request's valid cookie.

## How request chaining works

A collection-level pre-request script generates a `runId` (a timestamp) the
first time any request runs, and derives unique test emails from it
(`postman.employee.a.<runId>@example.com`, etc.) — stored as environment
variables so every request in the same run references the same identities.
Test scripts on registration/login/creation requests capture the resulting
ids (`employeeAId`, `equipmentNoApprovalId`, `reservationPendingId`, ...)
into environment variables that later requests reference via `{{...}}` in
their URLs and bodies. Nothing needs to be copied by hand.

## Environment variables

| Variable | Set by | Purpose |
|---|---|---|
| `baseUrl` | committed default | `http://localhost:3000` |
| `employeePassword` | committed default | Shared placeholder password for every Employee this collection registers |
| `adminEmail` / `adminPassword` | committed default | Must match the seeded Administrator account (step 3) |
| `runId`, `employee[A/B/C]Email` | generated at runtime | Unique per run |
| `employee[A/B/C]Id`, `adminId` | captured from responses | User ids for assertions/chaining |
| `employee[A/B/C]Token`, `adminToken` | captured from Set-Cookie | Used to re-select a session (see above); stored as Postman `secret` type |
| `equipment*Id`, `reservation*Id` | captured from responses | Resource ids for chaining across requests |

None of these are real secrets. `employeePassword`/`adminPassword` are
obvious local-only placeholders, and the `*Token` values are short-lived
JWTs issued by your own local backend during the run, not production
credentials.

## Success and error coverage

Every endpoint has at least one saved example reflecting the real response
shape observed from this implementation (not fabricated fields). Error
cases are organized as separate, clearly-named requests (suffixed
`(Error Example)`), covering, where the API supports them:

- **400** — malformed input, blank/invalid fields, invalid UUID route
  params, invalid pagination, a client-supplied `role`/`status`/`id` field
- **401** — no cookie, invalid/garbage token
- **403** — RBAC violations (wrong role) and ownership violations (right
  role, wrong owner) — both are exercised, and are asserted as *distinct*
  from 401 in the same suite
- **404** — missing equipment, missing reservation
- **409** — reservation overlap conflicts, equipment deletion blocked by
  existing reservation history, invalid reservation state transitions
  (approving/rejecting/cancelling something already in a terminal or
  wrong state)

## RBAC and ownership coverage

Authorization is exercised directly against the real Equipment/Reservation
endpoints throughout `3. Equipment`, `4. Reservations`, and
`5. Approval Workflow` (each such request is named to say what it's
proving, e.g. *"Create Equipment - Employee Forbidden (Error Example)"*,
*"Get Reservation By Id - Another Employee's (Error Example)"*), rather than
being pulled into a separate synthetic folder. The backend does have a
small set of `/_authz-demo/*` endpoints, but those are explicitly
test/support scaffolding built to verify the RBAC/ownership mechanism
*before* the real Equipment/Reservation endpoints existed (see the code
comments in `backend/src/auth/testing/`) — they are not part of the
product's API surface, so this collection does not include them.

Covered explicitly:

- Employee: can read Equipment/own Reservations; **cannot** create/update/
  delete Equipment (403); **cannot** approve/reject reservations (403);
  **cannot** read or cancel another Employee's reservation (403, not 404 —
  the record exists, the caller just isn't allowed to see it)
- Administrator: can create/update/delete Equipment; can view reservations
  across every user; can approve/reject; **cannot** create or cancel a
  reservation (403 — not a capability the documented requirements grant
  Administrators); still fully subject to authentication (an unauthenticated
  request to an Admin-only route is 401, not 403)

## Reservation lifecycle coverage

- Create on equipment with `requiresApproval: false` → `CONFIRMED`
- Create on equipment with `requiresApproval: true` → `PENDING`
- `PENDING → CONFIRMED` via Administrator approve
- `PENDING → REJECTED` via Administrator reject
- `PENDING`/`CONFIRMED` → `CANCELLED` via the owning Employee, only while
  still upcoming
- Invalid transitions rejected with 409: approving/rejecting a reservation
  that isn't `PENDING`, cancelling one that's already `CANCELLED`
- Overlap protection: an overlapping active reservation is rejected (409);
  a boundary-touching reservation (ends exactly when another starts) is
  allowed; a `CANCELLED` or `REJECTED` reservation's slot can be re-booked;
  an approved (`CONFIRMED`) reservation still blocks new overlaps — proving
  approval doesn't weaken the database-level guarantee

## Known limitations

- **Full data cleanup is not possible, by design.** The API has no
  user-deletion endpoint and no reservation-deletion endpoint at all —
  reservations are permanent historical/audit records
  (`docs/decisions.md`). Equipment used in any reservation also cannot be
  deleted afterward (`ON DELETE RESTRICT` on the foreign key) — that 409 is
  exactly what `Equipment - Delete Conflict` in this collection verifies.
  Mitigation instead of cleanup: every run uses a fresh `runId`, so repeated
  Newman runs accumulate test rows but never collide with or corrupt a
  previous run's data. Expect the local database to slowly accumulate
  `postman.*`-prefixed users and `Postman *`-prefixed equipment/reservations
  over repeated runs; this is safe to periodically clear by hand in a local
  dev database if desired.
- **The Administrator-login request requires a one-time manual/scripted
  seeding step** (`npm run seed:admin`) — there is no way to fully automate
  this purely through HTTP requests, since the API deliberately has no
  endpoint that can create an Administrator (see above). If that step is
  skipped, "Login Admin" and every request after it that depends on an
  Admin session will fail with 401 — this is expected, not a collection bug.
- **CSRF token flows are out of scope for this collection.** The
  application's documented CSRF posture (`docs/decisions.md`) relies on the
  cookie's `SameSite` attribute for same-site deployments; Postman/Newman
  are not browsers and are not subject to `SameSite`/CORS enforcement in the
  first place, so there is nothing meaningful to test here at the API-client
  level.
- **Logout does not invalidate the token server-side** — this is a
  documented, intentional decision (no token blocklist). The "Logout" request
  verifies the cookie is cleared client-side (via `Set-Cookie`) and does not
  assert that the old token is subsequently rejected, because that would
  assert behavior the application does not implement.

## Regenerating the collection

The collection file is large (68 requests) and was generated from a small
Node script for consistency rather than hand-edited in the Postman JSON
format. If you need to make structural changes, editing the exported JSON
directly (via the Postman app, then re-exporting) is the simplest path for
small tweaks; for larger changes, ask for the generator script.
