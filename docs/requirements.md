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

Administrators are exempt from this ownership restriction for the reservation-management permissions explicitly granted to them: viewing all reservations and managing approval-required reservations.

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

## 6. Submission Expectations

The assessment specifies the following submission expectations, in addition to the core application requirements:

- A deployed version is preferred; clear local setup instructions are acceptable if a live deployment is not provided.
- The README must disclose any AI-assisted development tools used during implementation.
- The developer must be able to explain and modify all submitted code in a short technical review.

```