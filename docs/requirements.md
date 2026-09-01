# Requirements

## 1. Actors

### Employee

Employees can:

- Register and log in
- View and search equipment (availability is determined by the requested time window against existing reservations, not a static equipment flag)
- Create equipment reservations
- View their own reservations
- Cancel an upcoming reservation

### Administrator

Administrators can:

- Log in
- Add equipment
- Edit equipment
- View all reservations
- Manage reservations that require administrator approval (an implementation assumption — see Assumptions; the assessment specifies approval-required equipment but does not name the approving actor)

### SuperAdmin

A third actor, introduced beyond the original assessment scope as an implementation addition (see Assumptions) to answer a question the assessment leaves open: who provisions the first Administrator, and who can change a user's role afterward?

SuperAdmin can do everything an Administrator can, plus:

- View every user account (name, email, role, created date)
- Promote an Employee to Administrator
- Demote an Administrator to Employee

Exactly one SuperAdmin account exists system-wide. It is never created through public registration and never created through the role-management endpoint — the only way one comes to exist is a dedicated bootstrap script run outside the application (see Architecture, "Authentication and Authorization").

### Role Hierarchy

The three roles form a hierarchy: SuperAdmin → Administrator → Employee. Higher roles gain the capabilities of the roles below them for actions that make sense to extend (equipment management, reservation approval/rejection), but the hierarchy is not automatic or universal:

- SuperAdmin does not automatically gain Employee-only capabilities (creating or cancelling a reservation) — those remain Employee-only, exactly as they are not available to a plain Administrator either.
- SuperAdmin does not automatically own or bypass ownership checks on any resource through this hierarchy — role-based access and resource ownership remain separate concepts (see "Reservation Ownership and Access Control" below).
- A SuperAdmin can never be created, promoted to, or removed from via the role-management endpoint — assigning the SuperAdmin role is only ever possible through the bootstrap script above, and the sole existing SuperAdmin's role can never be changed through the normal user-management flow (not even by that SuperAdmin themself).

## 2. Core Business Rules
### Reservation Status

A reservation can have one of the following statuses:

- PENDING
- CONFIRMED
- REJECTED
- CANCELLED

Reservations in `PENDING` or `CONFIRMED` status block the equipment's time slot.

Reservations in `REJECTED` or `CANCELLED` status do not block the equipment's time slot.

### Upcoming Reservation

An upcoming reservation is a reservation whose start time is later than the current time.

Employees cannot cancel a reservation that has already started.

### Reservation Time Boundaries

Two reservations may share a boundary.

For example:

- Reservation A: 10:00–12:00
- Reservation B: 12:00–14:00

These reservations do not overlap.

### Reservation Overlap Rule

Two reservations overlap when:

`newStart < existingEnd AND newEnd > existingStart`

### Reservation Conflict Prevention

The system must prevent overlapping reservations for the same equipment.

### Approval Workflow

Some equipment requires administrator approval before a reservation is confirmed. This is an explicit assessment requirement.

Which actor performs the approval decision is not stated explicitly in the assessment. This document assumes an Administrator approves or rejects pending reservations (see Assumptions), consistent with the Administrator capability to manage approval-required reservations.

### Reservation Cancellation

Employees can cancel their own upcoming reservations.

### Reservation Ownership and Access Control

Employees may only view and cancel reservations they created. Employees cannot access another employee's reservations.

This must be enforced by the backend as a resource-ownership check, in addition to (not instead of) role-based access control.

Administrators (and SuperAdmin, per the role hierarchy above) are exempt from this ownership restriction for the reservation-management permissions explicitly granted to them: viewing all reservations and managing approval-required reservations. This exemption is scoped to those specific permissions, not a blanket bypass — see "Role Hierarchy" above.

## 3. Technical Requirements

The application must include:

- Frontend
- Backend/API
- Persistent database
- Authentication
- Server-side validation
- Basic error handling
- Git repository
- README with setup instructions, technology choices, and assumptions

## 4. Scope

The implementation should prioritize complete and sensible core functionality within the assessment's expected effort.

Features not required by the assessment will not be introduced unless they provide clear value to a stated requirement.

## 5. Assumptions

The following implementation assumptions will be documented separately where necessary:

- Definition of an "upcoming" reservation
- Reservation status model
- Exact administrator approval workflow, including which actor performs approval decisions
- Reservation time boundary behavior
- Administrator account provisioning
- Reservation timestamp timezone handling
- The SuperAdmin role, its bootstrap mechanism, and the role hierarchy/user-management model built on top of it (none of this is named by the assessment; it exists to answer "who provisions the first Administrator, and who can change roles afterward")

## 6. Submission Expectations

The assessment specifies the following submission expectations, in addition to the core application requirements:

- A deployed version is preferred; clear local setup instructions are acceptable if a live deployment is not provided.
- The README must disclose any AI-assisted development tools used during implementation.
- The developer must be able to explain and modify all submitted code in a short technical review.

```